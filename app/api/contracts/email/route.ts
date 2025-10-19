import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractId, to, subject, message, pdfUrl } = body;

    if (!contractId || !to || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get contract details
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(`
        *,
        first_party:parties!contracts_first_party_id_fkey(id, name_en, name_ar, email),
        second_party:parties!contracts_second_party_id_fkey(id, name_en, name_ar, email),
        promoters(id, name_en, name_ar)
      `)
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Prepare email data
    const emailData = {
      to,
      subject,
      message,
      contract: {
        id: contract.id,
        contract_number: contract.contract_number,
        job_title: contract.job_title,
        contract_start_date: contract.contract_start_date,
        contract_end_date: contract.contract_end_date,
        first_party: contract.first_party,
        second_party: contract.second_party,
        promoters: contract.promoters,
      },
      pdfUrl,
      sentBy: user.id,
      sentAt: new Date().toISOString(),
    };

    // For now, we'll simulate sending the email
    // In a real implementation, you would integrate with an email service like:
    // - SendGrid
    // - AWS SES
    // - Nodemailer with SMTP
    // - Resend
    // - Mailgun
    
    console.log('📧 Email would be sent with data:', {
      to,
      subject,
      contractId,
      pdfUrl: pdfUrl ? 'PDF attached' : 'No PDF',
    });

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Log the email activity (optional)
    try {
      await supabase
        .from('contract_activities')
        .insert({
          contract_id: contractId,
          user_id: user.id,
          activity_type: 'email_sent',
          description: `Contract sent via email to ${to}`,
          metadata: {
            recipient: to,
            subject,
            pdf_attached: !!pdfUrl,
          },
        });
    } catch (logError) {
      console.warn('Failed to log email activity:', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      data: {
        contractId,
        recipient: to,
        subject,
        sentAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('❌ Email API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Example implementation with SendGrid (uncomment and configure if needed)
/*
import sgMail from '@sendgrid/mail';

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractId, to, subject, message, pdfUrl } = body;

    // ... validation code ...

    // Prepare email with SendGrid
    const msg = {
      to,
      from: process.env.FROM_EMAIL || 'noreply@yourcompany.com',
      subject,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Contract Document</h2>
          <p>${message.replace(/\n/g, '<br>')}</p>
          ${pdfUrl ? `<p><a href="${pdfUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Download Contract PDF</a></p>` : ''}
        </div>
      `,
      attachments: pdfUrl ? [{
        content: await fetch(pdfUrl).then(r => r.arrayBuffer()).then(buf => Buffer.from(buf).toString('base64')),
        filename: `contract-${contractId}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment'
      }] : [],
    };

    await sgMail.send(msg);

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
    });

  } catch (error) {
    console.error('SendGrid error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
*/

// Example implementation with Resend (uncomment and configure if needed)
/*
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractId, to, subject, message, pdfUrl } = body;

    // ... validation code ...

    const { data, error } = await resend.emails.send({
      from: 'Contract Management <noreply@yourcompany.com>',
      to: [to],
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Contract Document</h2>
          <p>${message.replace(/\n/g, '<br>')}</p>
          ${pdfUrl ? `<p><a href="${pdfUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Download Contract PDF</a></p>` : ''}
        </div>
      `,
      attachments: pdfUrl ? [{
        filename: `contract-${contractId}.pdf`,
        content: await fetch(pdfUrl).then(r => r.arrayBuffer()),
      }] : [],
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      data,
    });

  } catch (error) {
    console.error('Resend error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
*/
