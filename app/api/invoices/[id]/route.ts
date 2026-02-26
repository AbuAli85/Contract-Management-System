// app/api/invoices/[id]/route.ts - Individual invoice operations
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { canAccessInvoice, canModifyInvoice } from '@/lib/acl';

// Create Supabase client helper
function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

const updateInvoiceSchema = z.object({
  status: z
    .enum(['draft', 'pending', 'paid', 'overdue', 'cancelled'])
    .optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  due_date: z.string().optional(), // ISO date string
  payment_method: z.string().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const invoiceId = params.id;

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 404,
      });
    }

    // Get invoice with related data
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(
        `
        *,
        booking:bookings(*),
        provider:profiles!invoices_provider_id_fkey(
          id, full_name, email, company_name, phone
        ),
        payments(
          id, amount, currency, payment_method, payment_reference,
          payment_gateway, status, processed_at, created_at
        )
      `
      )
      .eq('id', invoiceId)
      .single();

    if (error || !invoice) {
      return new Response(JSON.stringify({ error: 'Invoice not found' }), {
        status: 404,
      });
    }

    // Check access permissions
    if (!canAccessInvoice(invoice, user.id, profile.role)) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
      });
    }

    // Calculate totals
    const calculatedTotals = {
      vat_amount: (invoice.subtotal * invoice.vat_rate) / 100,
      total_amount:
        invoice.subtotal + (invoice.subtotal * invoice.vat_rate) / 100,
      total_paid:
        invoice.payments?.reduce(
          (sum: number, payment: any) =>
            payment.status === 'completed' ? sum + payment.amount : sum,
          0
        ) || 0,
    };

    const invoiceWithTotals = {
      ...invoice,
      ...calculatedTotals,
      balance_due: calculatedTotals.total_amount - calculatedTotals.total_paid,
    };

    return Response.json({ data: invoiceWithTotals });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const invoiceId = params.id;
    const payload = await req.json();
    const body = updateInvoiceSchema.parse(payload);

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 404,
      });
    }

    // Get current invoice
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select(
        `
        *,
        booking:bookings(client_id)
      `
      )
      .eq('id', invoiceId)
      .single();

    if (fetchError || !invoice) {
      return new Response(JSON.stringify({ error: 'Invoice not found' }), {
        status: 404,
      });
    }

    // Check modification permissions
    if (!canModifyInvoice(invoice, user.id, profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.status !== undefined) {
      updateData.status = body.status;

      // If marking as paid, set paid_at timestamp
      if (body.status === 'paid' && invoice.status !== 'paid') {
        updateData.paid_at = new Date().toISOString();
      }

      // If changing from paid to another status, clear paid_at
      if (body.status !== 'paid' && invoice.status === 'paid') {
        updateData.paid_at = null;
      }
    }

    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.due_date !== undefined) updateData.due_date = body.due_date;
    if (body.payment_method !== undefined)
      updateData.payment_method = body.payment_method;

    // Update invoice
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId)
      .select(
        `
        *,
        booking:bookings(*),
        provider:profiles!invoices_provider_id_fkey(full_name, email, company_name),
        payments(id, amount, status, payment_method, processed_at)
      `
      )
      .single();

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 400,
      });
    }

    // If invoice is marked as paid, update booking status
    if (body.status === 'paid' && invoice.status !== 'paid') {
      await supabase
        .from('bookings')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoice.booking_id);

      // Update tracking status if exists
      await supabase
        .from('trackings')
        .update({
          status: 'completed',
          notes: 'Payment received - service completed',
          updated_at: new Date().toISOString(),
        })
        .eq('booking_id', invoice.booking_id);
    }

    return Response.json({
      success: true,
      data: updatedInvoice,
      message: 'Invoice updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: error.errors }),
        { status: 400 }
      );
    }
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const invoiceId = params.id;

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 404,
      });
    }

    // Only admins and managers can delete invoices
    if (!['admin', 'manager'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403 }
      );
    }

    // Get invoice to check if it exists and has payments
    const { data: invoice } = await supabase
      .from('invoices')
      .select(
        `
        *,
        payments(id, status)
      `
      )
      .eq('id', invoiceId)
      .single();

    if (!invoice) {
      return new Response(JSON.stringify({ error: 'Invoice not found' }), {
        status: 404,
      });
    }

    // Don't allow deletion if invoice has completed payments
    const hasCompletedPayments = invoice.payments?.some(
      (p: any) => p.status === 'completed'
    );
    if (hasCompletedPayments) {
      return new Response(
        JSON.stringify({
          error: 'Cannot delete invoice with completed payments',
        }),
        { status: 400 }
      );
    }

    // Delete invoice (payments will be deleted via cascade)
    const { error: deleteError } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 400,
      });
    }

    return Response.json({
      success: true,
      message: 'Invoice deleted successfully',
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}
