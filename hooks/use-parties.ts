import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client" // Your Supabase client instance
import type { Party } from "@/lib/types" // Use the custom Party interface
import { devLog } from "@/lib/dev-log"

const fetchParties = async (partyType?: "Employer" | "Client"): Promise<Party[]> => {
  const supabaseClient = createClient()
  let query = supabaseClient
    .from("parties")
    .select(
      `
      id, name_en, name_ar, crn, type, role, cr_expiry,
      contact_person, contact_email, contact_phone, address_en,
      tax_number, license_number, license_expiry, status, notes
    `,
    )
    .order("name_en", { ascending: true })

  if (partyType) {
    query = query.eq("type", partyType)
  }

  const { data, error } = await query

  if (error) {
    devLog("Error fetching parties:", error)
    throw new Error(error.message) // React Query will handle this error
  }
  return data || []
}

export const useParties = (partyType?: "Employer" | "Client") => {
  return useQuery<Party[], Error>({
    queryKey: ["parties", partyType || "all"], // Unique query key based on type
    queryFn: () => fetchParties(partyType),
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
  })
}
