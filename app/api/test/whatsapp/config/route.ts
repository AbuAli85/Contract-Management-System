/**
 * GET /api/test/whatsapp/config - Check WhatsApp configuration details
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const config = {
    accountSid: process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing',
    authToken: process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing',
    whatsappFrom: process.env.TWILIO_WHATSAPP_FROM 
      ? `✅ Set: ${process.env.TWILIO_WHATSAPP_FROM}` 
      : '❌ Missing',
    templateSid: process.env.TWILIO_WHATSAPP_TEMPLATE_SID 
      ? `✅ Set (Optional)` 
      : '⚠️ Not Set (Optional)',
    businessName: process.env.WHATSAPP_BUSINESS_NAME 
      ? `✅ Set: ${process.env.WHATSAPP_BUSINESS_NAME}` 
      : '⚠️ Not Set (Default: SmartPRO)',
  };

  const isConfigured = !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM
  );

  // Validate format
  const formatValid = process.env.TWILIO_WHATSAPP_FROM?.startsWith('whatsapp:');
  const formatError = process.env.TWILIO_WHATSAPP_FROM && !formatValid
    ? '⚠️ Format should be: whatsapp:+14155238886'
    : null;

  return NextResponse.json({
    configured: isConfigured && formatValid,
    config,
    formatError,
    instructions: !isConfigured
      ? 'Please configure WhatsApp in your .env file. See docs/FIX_WHATSAPP_CHANNEL_ERROR.md for details.'
      : !formatValid
        ? 'TWILIO_WHATSAPP_FROM format is incorrect. Should be: whatsapp:+14155238886'
        : 'WhatsApp is configured. Use POST /api/test/whatsapp to send a test message.',
  });
}

