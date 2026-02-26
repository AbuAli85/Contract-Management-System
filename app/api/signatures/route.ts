/**
 * Digital Signatures API
 * GET  /api/signatures?contract_id=xxx  — get signatures for a contract
 * POST /api/signatures                  — send a signature request or save drawn signature
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRBAC } from "@/lib/rbac/guard";
import { sendSignatureRequest, saveDrawnSignature } from "@/lib/services/e-signature-service";

export const GET = withRBAC("contracts:read:own", async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get("contract_id");

    const { data, error } = await supabase
      .from("digital_signatures")
      .select("*")
      .eq("contract_id", contractId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ signatures: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
});

export const POST = withRBAC("contracts:write:own", async (request: NextRequest) => {
  try {
    const body = await request.json();

    if (body.action === "save_drawn") {
      const result = await saveDrawnSignature({
        contractId: body.contract_id,
        signerId: body.signer_id,
        signerName: body.signer_name,
        signerEmail: body.signer_email,
        signerRole: body.signer_role ?? "signer",
        signatureImageBase64: body.signature_image_base64,
        ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
        userAgent: request.headers.get("user-agent") ?? undefined,
      });
      return NextResponse.json({ signature: result }, { status: 201 });
    }

    const result = await sendSignatureRequest({
      contractId: body.contract_id,
      contractTitle: body.contract_title,
      documentUrl: body.document_url,
      signers: body.signers,
      message: body.message,
      expiresInDays: body.expires_in_days ?? 30,
      redirectUrl: body.redirect_url,
    });

    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
});
