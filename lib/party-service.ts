import { getSupabaseClient } from "@/lib/supabase"
import type {
  Party,
  Contact,
  PartySearchParams,
  BulkPartyOperation,
  PartyExportParams,
} from "@/lib/schemas/party"

// Retry configuration
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
}

// Retry helper with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = RETRY_CONFIG.maxAttempts,
  baseDelay: number = RETRY_CONFIG.baseDelay,
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      // Don't retry on the last attempt
      if (attempt === maxAttempts) {
        throw lastError
      }

      // Check if error is retryable (network, timeout, etc.)
      const isRetryable = isRetryableError(error)
      if (!isRetryable) {
        throw lastError
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), RETRY_CONFIG.maxDelay)
      console.warn(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms due to:`, error)

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

// Check if error is retryable
function isRetryableError(error: any): boolean {
  if (!error) return false

  const message = error.message?.toLowerCase() || ""
  const code = error.code?.toString() || ""

  // Network errors
  if (message.includes("network") || message.includes("fetch") || message.includes("connection")) {
    return true
  }

  // Timeout errors
  if (message.includes("timeout") || message.includes("timed out")) {
    return true
  }

  // HTTP 5xx errors (server errors)
  if (code.startsWith("5")) {
    return true
  }

  // Supabase specific retryable errors
  if (code === "PGRST301" || code === "PGRST302") {
    // Rate limiting
    return true
  }

  return false
}

// Fetch parties with pagination and search
export async function fetchPartiesWithPagination(params: PartySearchParams): Promise<{
  data: Party[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}> {
  return withRetry(async () => {
    const supabase = getSupabaseClient()

    let query = supabase.from("parties").select("*", { count: "exact" })

    // Apply search filter
    if (params.searchText && params.searchText.trim()) {
      const { data: searchResults, error: searchError } = await supabase.rpc(
        "search_parties_with_contacts",
        {
          search_text: params.searchText.trim(),
        },
      )

      if (searchError) {
        throw new Error(`Error searching parties: ${searchError.message}`)
      }

      if (searchResults && searchResults.length > 0) {
        const partyIds = searchResults.map((r: any) => r.id)
        query = query.in("id", partyIds)
      } else {
        // No search results, return empty
        return {
          data: [],
          total: 0,
          page: params.page,
          limit: params.limit,
          hasNext: false,
          hasPrev: false,
        }
      }
    }

    // Apply type filter
    if (params.type && params.type !== "all") {
      query = query.eq("type", params.type)
    }

    // Apply status filter
    if (params.status && params.status !== "all") {
      query = query.eq("status", params.status)
    }

    // Apply pagination
    const offset = (params.page - 1) * params.limit
    query = query.order("created_at", { ascending: false }).range(offset, offset + params.limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Error fetching parties: ${error.message}`)
    }

    const total = count || 0
    const hasNext = offset + params.limit < total
    const hasPrev = params.page > 1

    return {
      data: data || [],
      total,
      page: params.page,
      limit: params.limit,
      hasNext,
      hasPrev,
    }
  })
}

// Search parties with fuzzy matching
export async function searchParties(searchText: string): Promise<Party[]> {
  return withRetry(async () => {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.rpc("search_parties_with_contacts", {
      search_text: searchText.trim(),
    })

    if (error) {
      throw new Error(`Error searching parties: ${error.message}`)
    }

    return data || []
  })
}

// Fetch party by ID with contacts
export async function fetchPartyWithContacts(
  partyId: string,
): Promise<Party & { contacts: Contact[] }> {
  return withRetry(async () => {
    const supabase = getSupabaseClient()

    // Fetch party
    const { data: party, error: partyError } = await supabase
      .from("parties")
      .select("*")
      .eq("id", partyId)
      .single()

    if (partyError) {
      throw new Error(`Error fetching party: ${partyError.message}`)
    }

    // Fetch contacts
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("*")
      .eq("party_id", partyId)
      .order("is_primary", { ascending: false })
      .order("name_en", { ascending: true })

    if (contactsError) {
      throw new Error(`Error fetching contacts: ${contactsError.message}`)
    }

    return {
      ...party,
      contacts: contacts || [],
    }
  })
}

// Create or update party
export async function saveParty(partyData: Partial<Party>): Promise<Party> {
  return withRetry(async () => {
    const supabase = getSupabaseClient()

    if (partyData.id) {
      // Update existing party
      const { data, error } = await supabase
        .from("parties")
        .update(partyData)
        .eq("id", partyData.id)
        .select()
        .single()

      if (error) {
        throw new Error(`Error updating party: ${error.message}`)
      }

      return data
    } else {
      // Create new party
      const { data, error } = await supabase.from("parties").insert(partyData).select().single()

      if (error) {
        throw new Error(`Error creating party: ${error.message}`)
      }

      return data
    }
  })
}

// Create or update contact
export async function saveContact(contactData: Partial<Contact>): Promise<Contact> {
  return withRetry(async () => {
    const supabase = getSupabaseClient()

    if (contactData.id) {
      // Update existing contact
      const { data, error } = await supabase
        .from("contacts")
        .update(contactData)
        .eq("id", contactData.id)
        .select()
        .single()

      if (error) {
        throw new Error(`Error updating contact: ${error.message}`)
      }

      return data
    } else {
      // Create new contact
      const { data, error } = await supabase.from("contacts").insert(contactData).select().single()

      if (error) {
        throw new Error(`Error creating contact: ${error.message}`)
      }

      return data
    }
  })
}

// Delete party (will cascade delete contacts)
export async function deleteParty(partyId: string): Promise<void> {
  return withRetry(async () => {
    const supabase = getSupabaseClient()

    const { error } = await supabase.from("parties").delete().eq("id", partyId)

    if (error) {
      throw new Error(`Error deleting party: ${error.message}`)
    }
  })
}

// Bulk delete parties
export async function bulkDeleteParties(
  partyIds: string[],
  userId: string,
): Promise<{
  success: boolean
  deleted: number
  errors: string[]
  total: number
}> {
  return withRetry(async () => {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.functions.invoke("delete-parties", {
      body: {
        partyIds,
        userId,
      },
    })

    if (error) {
      throw new Error(`Error deleting parties: ${error.message}`)
    }

    return data
  })
}

// Export parties to CSV
export async function exportPartiesToCSV(
  partyIds?: string[],
  includeContacts: boolean = true,
): Promise<string> {
  return withRetry(async () => {
    const supabase = getSupabaseClient()

    let query = supabase.from("parties").select("*")

    if (partyIds && partyIds.length > 0) {
      query = query.in("id", partyIds)
    }

    const { data: parties, error } = await query.order("name_en", { ascending: true })

    if (error) {
      throw new Error(`Error fetching parties for export: ${error.message}`)
    }

    if (!parties || parties.length === 0) {
      return "No parties found to export"
    }

    // Fetch contacts if requested
    let contacts: Contact[] = []
    if (includeContacts) {
      const partyIds = parties.map((p) => p.id)
      const { data: contactsData, error: contactsError } = await supabase
        .from("contacts")
        .select("*")
        .in("party_id", partyIds)

      if (contactsError) {
        console.warn("Error fetching contacts for export:", contactsError.message)
      } else {
        contacts = contactsData || []
      }
    }

    // Convert to CSV
    const csvHeaders = [
      "Party ID",
      "English Name",
      "Arabic Name",
      "CRN",
      "Type",
      "Status",
      "Contact Person",
      "Contact Email",
      "Contact Phone",
      "English Address",
      "Arabic Address",
      "Tax Number",
      "License Number",
      "CR Expiry Date",
      "License Expiry Date",
      "Notes",
      "Created At",
    ]

    if (includeContacts) {
      csvHeaders.push(
        "Contact ID",
        "Contact English Name",
        "Contact Arabic Name",
        "Contact Email",
        "Contact Phone",
        "Contact Mobile",
        "Contact Position",
        "Contact Department",
        "Is Primary Contact",
        "Contact Notes",
      )
    }

    let csvContent = csvHeaders.join(",") + "\n"

    parties.forEach((party) => {
      const partyRow = [
        party.id,
        `"${party.name_en || ""}"`,
        `"${party.name_ar || ""}"`,
        party.crn || "",
        party.type || "",
        party.status || "",
        `"${party.contact_person || ""}"`,
        party.contact_email || "",
        party.contact_phone || "",
        `"${party.address_en || ""}"`,
        `"${party.address_ar || ""}"`,
        party.tax_number || "",
        party.license_number || "",
        party.cr_expiry_date || "",
        party.license_expiry_date || "",
        `"${party.notes || ""}"`,
        party.created_at || "",
      ]

      if (includeContacts) {
        const partyContacts = contacts.filter((c) => c.party_id === party.id)

        if (partyContacts.length > 0) {
          partyContacts.forEach((contact) => {
            const contactRow = [
              contact.id,
              `"${contact.name_en || ""}"`,
              `"${contact.name_ar || ""}"`,
              contact.email || "",
              contact.phone || "",
              contact.mobile || "",
              `"${contact.position || ""}"`,
              `"${contact.department || ""}"`,
              contact.is_primary ? "Yes" : "No",
              `"${contact.notes || ""}"`,
            ]
            csvContent += [...partyRow, ...contactRow].join(",") + "\n"
          })
        } else {
          // Add empty contact fields
          const emptyContactRow = Array(10).fill("")
          csvContent += [...partyRow, ...emptyContactRow].join(",") + "\n"
        }
      } else {
        csvContent += partyRow.join(",") + "\n"
      }
    })

    return csvContent
  })
}

// Get party statistics
export async function getPartyStatistics(): Promise<{
  total: number
  active: number
  inactive: number
  suspended: number
  employers: number
  clients: number
  generic: number
  expiring_documents: number
  expired_documents: number
}> {
  return withRetry(async () => {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.rpc("get_party_statistics")

    if (error) {
      throw new Error(`Error fetching party statistics: ${error.message}`)
    }

    return (
      data || {
        total: 0,
        active: 0,
        inactive: 0,
        suspended: 0,
        employers: 0,
        clients: 0,
        generic: 0,
        expiring_documents: 0,
        expired_documents: 0,
      }
    )
  })
}

// Get parties with expiring documents
export async function getPartiesWithExpiringDocuments(
  daysThreshold: number = 30,
): Promise<Party[]> {
  return withRetry(async () => {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from("parties")
      .select("*")
      .or(
        `cr_expiry_date.lte.${new Date(Date.now() + daysThreshold * 24 * 60 * 60 * 1000).toISOString()},license_expiry_date.lte.${new Date(Date.now() + daysThreshold * 24 * 60 * 60 * 1000).toISOString()}`,
      )
      .order("cr_expiry_date", { ascending: true })

    if (error) {
      throw new Error(`Error fetching parties with expiring documents: ${error.message}`)
    }

    return data || []
  })
}

// Update party status
export async function updatePartyStatus(partyId: string, status: string): Promise<void> {
  return withRetry(async () => {
    const supabase = getSupabaseClient()

    const { error } = await supabase.from("parties").update({ status }).eq("id", partyId)

    if (error) {
      throw new Error(`Error updating party status: ${error.message}`)
    }
  })
}

// Bulk update party statuses
export async function bulkUpdatePartyStatus(partyIds: string[], status: string): Promise<void> {
  return withRetry(async () => {
    const supabase = getSupabaseClient()

    const { error } = await supabase.from("parties").update({ status }).in("id", partyIds)

    if (error) {
      throw new Error(`Error bulk updating party statuses: ${error.message}`)
    }
  })
}
