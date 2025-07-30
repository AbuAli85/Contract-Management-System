import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface DeletePartiesRequest {
  partyIds: string[]
  userId: string
}

interface DeletePartiesResponse {
  success: boolean
  deleted: number
  errors: string[]
  total: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the request body
    const { partyIds, userId }: DeletePartiesRequest = await req.json()

    if (!partyIds || !Array.isArray(partyIds) || partyIds.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid party IDs provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const result: DeletePartiesResponse = {
      success: false,
      deleted: 0,
      errors: [],
      total: partyIds.length,
    }

    // Verify that all parties exist and user has permission to delete them
    const { data: existingParties, error: fetchError } = await supabase
      .from("parties")
      .select("id, name_en, name_ar")
      .in("id", partyIds)

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: "Failed to verify parties", details: fetchError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    if (!existingParties || existingParties.length !== partyIds.length) {
      const foundIds = existingParties?.map((p) => p.id) || []
      const missingIds = partyIds.filter((id) => !foundIds.includes(id))
      result.errors.push(`Parties not found: ${missingIds.join(", ")}`)
      return new Response(JSON.stringify(result), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Check for active contracts before deletion
    const { data: activeContracts, error: contractsError } = await supabase
      .from("contracts")
      .select("id, contract_number, first_party_id, second_party_id")
      .or(`first_party_id.in.(${partyIds.join(",")}),second_party_id.in.(${partyIds.join(",")})`)
      .eq("status", "active")

    if (contractsError) {
      return new Response(
        JSON.stringify({ error: "Failed to check contracts", details: contractsError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    if (activeContracts && activeContracts.length > 0) {
      const partyIdsWithContracts = [
        ...new Set([
          ...activeContracts.map((c) => c.first_party_id),
          ...activeContracts.map((c) => c.second_party_id),
        ]),
      ]

      result.errors.push(
        `Cannot delete parties with active contracts: ${partyIdsWithContracts.join(", ")}`,
      )
      return new Response(JSON.stringify(result), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Delete parties (contacts will be cascade deleted due to foreign key constraint)
    const { error: deleteError } = await supabase.from("parties").delete().in("id", partyIds)

    if (deleteError) {
      return new Response(
        JSON.stringify({ error: "Failed to delete parties", details: deleteError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    // Log the bulk deletion activity
    await supabase.from("system_activity_log").insert({
      action: "bulk_delete_parties",
      user_id: userId,
      details: {
        deleted_party_ids: partyIds,
        deleted_party_names: existingParties.map((p) => p.name_en),
        total_deleted: partyIds.length,
      },
      created_at: new Date().toISOString(),
    })

    result.success = true
    result.deleted = partyIds.length

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error in delete-parties:", error)

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  }
})
