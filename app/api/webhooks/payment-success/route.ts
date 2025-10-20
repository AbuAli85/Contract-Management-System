// app/api/webhooks/payment-success/route.ts - Payment success webhook handler
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { headers } from 'next/headers';
import {
  verifyStripeSignature,
  isWebhookReplay,
} from '@/lib/auth/webhook-security';

// Create Supabase client with service role for webhook operations
function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key for full access
    {
      cookies: {
        get() {
          return undefined;
        },
        set() {},
        remove() {},
      },
    }
  );
}

const paymentSuccessSchema = z.object({
  booking_id: z.string().uuid(),
  payment_amount: z.number().positive(),
  payment_method: z.string(),
  payment_reference: z.string().optional(),
  payment_gateway: z.string().optional(),
  currency: z.string().default('OMR'),
  // Webhook verification
  webhook_signature: z.string().optional(),
  webhook_timestamp: z.number().optional(),
});

export async function POST(req: Request) {
  try {
    const supabase = createServiceClient();
    const headersList = headers();

    // Get raw body for signature verification
    const rawBody = await req.text();
    let payload;

    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      console.error('Invalid JSON payload:', error);
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
      });
    }

    const body = paymentSuccessSchema.parse(payload);

    // SECURITY FIX: Implement actual webhook signature verification
    const signature =
      headersList.get('stripe-signature') ||
      headersList.get('x-webhook-signature');
    const webhookSecret =
      process.env.STRIPE_WEBHOOK_SECRET || process.env.PAYMENT_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      console.error('Missing webhook signature or secret');
      return new Response(
        JSON.stringify({ error: 'Missing signature or secret' }),
        { status: 401 }
      );
    }

    // Verify signature
    const isValidSignature = verifyStripeSignature(
      rawBody,
      signature,
      webhookSecret
    );
    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
      });
    }

    // Check for replay attacks
    if (isWebhookReplay(signature)) {
      console.error('Webhook replay detected');
      return new Response(
        JSON.stringify({ error: 'Webhook replay detected' }),
        { status: 409 }
      );
    }

    console.log('✅ Webhook signature verified successfully');

    console.log('Processing payment success webhook:', {
      booking_id: body.booking_id,
      amount: body.payment_amount,
      method: body.payment_method,
    });

    // Check if booking exists
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(
        `
        *,
        service:services(
          provider_id,
          title,
          currency
        )
      `
      )
      .eq('id', body.booking_id)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', body.booking_id);
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404,
      });
    }

    // Check if invoice exists, create if it doesn't
    let { data: invoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('booking_id', body.booking_id)
      .single();

    if (!invoice) {
      console.log('Creating invoice for booking:', body.booking_id);

      // Generate invoice number
      const { data: lastInvoice } = await supabase
        .from('invoices')
        .select('invoice_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const nextNumber = lastInvoice?.invoice_number
        ? parseInt(lastInvoice.invoice_number.replace('INV', '')) + 1
        : 1;

      const invoiceNumber = `INV${nextNumber.toString().padStart(6, '0')}`;

      // Get client details
      const { data: client } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', booking.client_id)
        .single();

      // Create invoice
      const { data: newInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          booking_id: body.booking_id,
          invoice_number: invoiceNumber,
          subtotal: booking.quoted_price,
          vat_rate: 5.0, // Default VAT rate
          currency: body.currency || booking.service.currency || 'OMR',
          client_name: client?.full_name || 'N/A',
          client_email: client?.email || 'N/A',
          client_phone: client?.phone || '',
          provider_id: booking.service.provider_id,
          description: `Service: ${booking.service.title}`,
          status: 'pending',
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
        })
        .select()
        .single();

      if (invoiceError) {
        console.error('Invoice creation error:', invoiceError);
        return new Response(
          JSON.stringify({ error: 'Failed to create invoice' }),
          { status: 500 }
        );
      }

      invoice = newInvoice;
    }

    // Create or update payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .upsert(
        {
          booking_id: body.booking_id,
          invoice_id: invoice.id,
          amount: body.payment_amount,
          currency: body.currency,
          payment_method: body.payment_method,
          payment_reference: body.payment_reference || `PAY_${Date.now()}`,
          payment_gateway: body.payment_gateway || 'webhook',
          status: 'completed',
          processed_at: new Date().toISOString(),
        },
        {
          onConflict: 'booking_id,payment_reference',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (paymentError) {
      console.error('Payment creation error:', paymentError);
      return new Response(
        JSON.stringify({ error: 'Failed to record payment' }),
        { status: 500 }
      );
    }

    // Update invoice status to paid
    const { error: invoiceUpdateError } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        payment_method: body.payment_method,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.id);

    if (invoiceUpdateError) {
      console.error('Invoice update error:', invoiceUpdateError);
    }

    // Update booking status to completed
    const { error: bookingUpdateError } = await supabase
      .from('bookings')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.booking_id);

    if (bookingUpdateError) {
      console.error('Booking update error:', bookingUpdateError);
    }

    // Update tracking status if exists
    const { error: trackingUpdateError } = await supabase
      .from('trackings')
      .update({
        status: 'completed',
        notes: `Payment received via ${body.payment_method} - service completed`,
        updated_at: new Date().toISOString(),
      })
      .eq('booking_id', body.booking_id);

    if (trackingUpdateError) {
      console.log('Tracking update error (non-critical):', trackingUpdateError);
    }

    // Log the successful payment processing
    console.log('Payment processed successfully:', {
      booking_id: body.booking_id,
      invoice_id: invoice.id,
      payment_id: payment.id,
      amount: body.payment_amount,
      method: body.payment_method,
    });

    // Trigger notifications (this will be handled by the database triggers)
    // The invoice update trigger will automatically send webhooks to Make.com

    return Response.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        booking_id: body.booking_id,
        invoice_id: invoice.id,
        payment_id: payment.id,
        invoice_status: 'paid',
        booking_status: 'completed',
        amount_paid: body.payment_amount,
      },
    });
  } catch (error) {
    console.error('Payment webhook error:', error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Invalid payload',
          details: error.errors,
        }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    );
  }
}

// GET endpoint for webhook verification (some payment providers require this)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const challenge = searchParams.get('hub.challenge');
  const verify_token = searchParams.get('hub.verify_token');

  // Verify token if provided
  if (verify_token && verify_token !== process.env.WEBHOOK_VERIFY_TOKEN) {
    return new Response('Forbidden', { status: 403 });
  }

  // Return challenge for webhook verification
  if (challenge) {
    return new Response(challenge, { status: 200 });
  }

  return Response.json({
    status: 'active',
    endpoint: 'payment-success-webhook',
    timestamp: new Date().toISOString(),
  });
}
