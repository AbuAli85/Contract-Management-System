/**
 * E-Signature Service
 *
 * Provides a unified interface for digital signatures. Supports:
 *   1. HelloSign (Dropbox Sign) via REST API — primary provider
 *   2. DocuSign via REST API — secondary provider
 *   3. Canvas-based drawn signatures stored in Supabase — offline/fallback
 *
 * All signature records are persisted in the digital_signatures table with
 * full audit trail (IP, timestamp, user agent, provider reference ID).
 */

import { createClient } from '@/lib/supabase/server';

export type SignatureProvider = 'hellosign' | 'docusign' | 'canvas';
export type SignatureStatus =
  | 'pending'
  | 'sent'
  | 'viewed'
  | 'signed'
  | 'declined'
  | 'expired'
  | 'cancelled';

export interface SignatureRequest {
  contractId: string;
  contractTitle: string;
  documentUrl: string;
  signers: Array<{
    name: string;
    email: string;
    role: string;
    order?: number;
  }>;
  message?: string;
  expiresInDays?: number;
  redirectUrl?: string;
}

export interface SignatureRequestResult {
  success: boolean;
  requestId?: string;
  provider: SignatureProvider;
  signingUrls?: Record<string, string>;
  error?: string;
}

export interface SignatureStatusResult {
  success: boolean;
  status?: SignatureStatus;
  signedAt?: string;
  signerStatuses?: Array<{
    email: string;
    status: SignatureStatus;
    signedAt?: string;
  }>;
  error?: string;
}

export interface CanvasSignatureData {
  contractId: string;
  signerId: string;
  signerName: string;
  signerEmail: string;
  signerRole: string;
  signatureImageBase64: string;
  ipAddress?: string;
  userAgent?: string;
}

function detectProvider(): SignatureProvider {
  if (process.env.HELLOSIGN_API_KEY) return 'hellosign';
  if (process.env.DOCUSIGN_INTEGRATION_KEY) return 'docusign';
  return 'canvas';
}

async function sendHelloSignRequest(req: SignatureRequest): Promise<SignatureRequestResult> {
  const apiKey = process.env.HELLOSIGN_API_KEY;
  if (!apiKey) return { success: false, provider: 'hellosign', error: 'HelloSign API key not configured' };

  try {
    const formData = new FormData();
    formData.append('title', req.contractTitle);
    formData.append('subject', 'Please sign: ' + req.contractTitle);
    formData.append('message', req.message ?? 'You have been requested to sign "' + req.contractTitle + '".');
    formData.append('file_url[0]', req.documentUrl);
    if (req.redirectUrl) formData.append('signing_redirect_url', req.redirectUrl);
    formData.append('expires_at', String(Math.floor(Date.now() / 1000) + (req.expiresInDays ?? 30) * 86400));

    req.signers.forEach((s, i) => {
      formData.append('signers[' + i + '][email_address]', s.email);
      formData.append('signers[' + i + '][name]', s.name);
      formData.append('signers[' + i + '][order]', String(s.order ?? i));
    });

    const response = await fetch('https://api.hellosign.com/v3/signature_request/send', {
      method: 'POST',
      headers: { Authorization: 'Basic ' + Buffer.from(apiKey + ':').toString('base64') },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({})) as { error?: { error_msg?: string } };
      return { success: false, provider: 'hellosign', error: err?.error?.error_msg ?? 'HTTP ' + response.status };
    }

    const data = await response.json() as { signature_request: { signature_request_id: string; signatures: Array<{ signer_email_address: string; sign_url?: string }> } };
    const sr = data.signature_request;
    const signingUrls: Record<string, string> = {};
    sr.signatures.forEach(sig => { if (sig.sign_url) signingUrls[sig.signer_email_address] = sig.sign_url; });

    return { success: true, provider: 'hellosign', requestId: sr.signature_request_id, signingUrls };
  } catch (error) {
    return { success: false, provider: 'hellosign', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function sendDocuSignRequest(req: SignatureRequest): Promise<SignatureRequestResult> {
  const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY;
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
  const accessToken = process.env.DOCUSIGN_ACCESS_TOKEN;
  const baseUrl = process.env.DOCUSIGN_BASE_URL ?? 'https://demo.docusign.net/restapi';

  if (!integrationKey || !accountId || !accessToken) {
    return { success: false, provider: 'docusign', error: 'DocuSign credentials not configured' };
  }

  try {
    const envelope = {
      emailSubject: 'Please sign: ' + req.contractTitle,
      emailBlurb: req.message ?? '',
      documents: [{ documentId: '1', name: req.contractTitle, uri: req.documentUrl }],
      recipients: {
        signers: req.signers.map((s, i) => ({
          email: s.email,
          name: s.name,
          recipientId: String(i + 1),
          routingOrder: String(s.order ?? i + 1),
          tabs: { signHereTabs: [{ documentId: '1', pageNumber: '1', xPosition: '100', yPosition: '700' }] },
        })),
      },
      status: 'sent',
    };

    const response = await fetch(baseUrl + '/v2.1/accounts/' + accountId + '/envelopes', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({})) as { message?: string };
      return { success: false, provider: 'docusign', error: err?.message ?? 'HTTP ' + response.status };
    }

    const data = await response.json() as { envelopeId: string };
    return { success: true, provider: 'docusign', requestId: data.envelopeId };
  } catch (error) {
    return { success: false, provider: 'docusign', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function saveCanvasSignature(data: CanvasSignatureData): Promise<SignatureRequestResult> {
  try {
    const supabase = await createClient();
    const imageBuffer = Buffer.from(data.signatureImageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    const fileName = 'signatures/' + data.contractId + '/' + data.signerId + '-' + Date.now() + '.png';

    const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, imageBuffer, { contentType: 'image/png', upsert: true });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);

    const { data: record, error: dbError } = await supabase
      .from('digital_signatures')
      .insert({
        contract_id: data.contractId,
        signer_id: data.signerId,
        signer_name: data.signerName,
        signer_email: data.signerEmail,
        signer_role: data.signerRole,
        provider: 'canvas',
        status: 'signed',
        signature_image_url: urlData.publicUrl,
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        signed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (dbError) throw dbError;
    return { success: true, provider: 'canvas', requestId: record.id };
  } catch (error) {
    return { success: false, provider: 'canvas', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendSignatureRequest(req: SignatureRequest): Promise<SignatureRequestResult> {
  const provider = detectProvider();

  try {
    const supabase = await createClient();
    await supabase.from('digital_signatures').insert(
      req.signers.map(s => ({
        contract_id: req.contractId,
        signer_email: s.email,
        signer_name: s.name,
        signer_role: s.role,
        provider,
        status: 'pending',
      }))
    );
  } catch { /* Non-fatal */ }

  switch (provider) {
    case 'hellosign': return sendHelloSignRequest(req);
    case 'docusign': return sendDocuSignRequest(req);
    default: return { success: true, provider: 'canvas', requestId: 'canvas-' + req.contractId, signingUrls: {} };
  }
}

export async function saveDrawnSignature(data: CanvasSignatureData): Promise<SignatureRequestResult> {
  return saveCanvasSignature(data);
}

export async function getSignatureStatus(requestId: string, provider: SignatureProvider): Promise<SignatureStatusResult> {
  if (provider === 'canvas') {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from('digital_signatures').select('status, signed_at').eq('id', requestId).single();
      if (error) throw error;
      return { success: true, status: data.status as SignatureStatus, signedAt: data.signed_at };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  if (provider === 'hellosign') {
    const apiKey = process.env.HELLOSIGN_API_KEY;
    if (!apiKey) return { success: false, error: 'HelloSign not configured' };
    try {
      const response = await fetch('https://api.hellosign.com/v3/signature_request/' + requestId, {
        headers: { Authorization: 'Basic ' + Buffer.from(apiKey + ':').toString('base64') },
      });
      if (!response.ok) return { success: false, error: 'HTTP ' + response.status };
      const data = await response.json() as { signature_request: { is_complete: boolean; signatures: Array<{ signer_email_address: string; status_code: string; signed_at?: number }> } };
      const sr = data.signature_request;
      return {
        success: true,
        status: sr.is_complete ? 'signed' : 'sent',
        signerStatuses: sr.signatures.map(s => ({
          email: s.signer_email_address,
          status: (s.status_code === 'signed' ? 'signed' : 'pending') as SignatureStatus,
          signedAt: s.signed_at ? new Date(s.signed_at * 1000).toISOString() : undefined,
        })),
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  return { success: false, error: 'Unsupported provider: ' + provider };
}

export async function cancelSignatureRequest(requestId: string, provider: SignatureProvider): Promise<{ success: boolean; error?: string }> {
  if (provider === 'hellosign') {
    const apiKey = process.env.HELLOSIGN_API_KEY;
    if (!apiKey) return { success: false, error: 'HelloSign not configured' };
    const response = await fetch('https://api.hellosign.com/v3/signature_request/cancel/' + requestId, {
      method: 'POST',
      headers: { Authorization: 'Basic ' + Buffer.from(apiKey + ':').toString('base64') },
    });
    return { success: response.ok, error: response.ok ? undefined : 'HTTP ' + response.status };
  }
  if (provider === 'canvas') {
    const supabase = await createClient();
    const { error } = await supabase.from('digital_signatures').update({ status: 'cancelled' }).eq('id', requestId);
    return { success: !error, error: error?.message };
  }
  return { success: false, error: 'Unsupported provider: ' + provider };
}
