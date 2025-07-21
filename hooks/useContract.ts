import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ContractDetail, ActivityLog, Party } from '@/lib/types'

// Mock activity logs - replace with real data fetch later
const mockActivityLogs: ActivityLog[] = [
  {
    id: '1',
    action: 'created',
    description: 'Contract was created and initialized',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: '2',
    action: 'generated',
    description: 'Google document was generated successfully',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: '3',
    action: 'reviewed',
    description: 'Contract was reviewed by legal team',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: '4',
    action: 'sent',
    description: 'Contract was sent to parties for review',
    created_at: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: '5',
    action: 'downloaded',
    description: 'PDF document was downloaded',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  }
]

interface UseContractResult {
  contract: ContractDetail | null
  activityLogs: ActivityLog[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useContract(contractId: string): UseContractResult {
  const [contract, setContract] = useState<ContractDetail | null>(null)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // The function must always return a value of type UseContractResult
  // (fixes: "A function whose declared type is neither 'undefined', 'void', nor 'any' must return a value.")
  // We'll implement the refetch function and useEffect here

  const fetchContract = async () => {
    try {
      setLoading(true)
      setError(null)

      // Use the same query structure as use-contracts.ts
      let { data, error: fetchError } = await supabase
        .from("contracts")
        .select(
          `
          *,
          first_party:parties!contracts_first_party_id_fkey(id,name_en,name_ar,crn,type),
          second_party:parties!contracts_second_party_id_fkey(id,name_en,name_ar,crn,type),
          promoters(id,name_en,name_ar,id_card_number,id_card_url,passport_url,status)
        `,
        )
        .eq("id", contractId)
        .single()

      // If the new schema fails, try the old schema (employer_id, client_id)
      if (fetchError && fetchError.message.includes('foreign key')) {
        const { data: oldData, error: oldError } = await supabase
          .from("contracts")
          .select(
            `
            *,
            first_party:parties!contracts_employer_id_fkey(id,name_en,name_ar,crn,type),
            second_party:parties!contracts_client_id_fkey(id,name_en,name_ar,crn,type),
            promoters(id,name_en,name_ar,id_card_number,id_card_url,passport_url,status)
          `,
          )
          .eq("id", contractId)
          .single()

        if (oldError) {
          setError(oldError.message)
          setLoading(false)
          return
        }

        if (oldData) {
          // Defensive: ensure first_party and second_party are valid Party objects
          const fallbackParty: Party = {
            id: "",
            name_en: "",
            name_ar: "",
            crn: "",
            type: null
          };
          const validParty = (p: any): p is Party => !!p && typeof p === 'object' && 'id' in p && 'name_en' in p && 'name_ar' in p && 'crn' in p;
          const firstPartyOldValid: Party = validParty(oldData?.first_party) && typeof oldData.first_party.type !== 'undefined'
            ? { ...(typeof oldData.first_party === 'object' && oldData.first_party !== null ? oldData.first_party : fallbackParty), type: oldData.first_party.type ?? null }
            : fallbackParty;
          const secondPartyOldValid: Party = validParty(oldData?.second_party) && typeof oldData.second_party.type !== 'undefined'
            ? { ...(typeof oldData.second_party === 'object' && oldData.second_party !== null ? oldData.second_party : fallbackParty), type: oldData.second_party.type ?? null }
            : fallbackParty;
          // Defensive: promoters is always an array
          const promotersArr = Array.isArray(oldData.promoters)
            ? oldData.promoters
            : oldData.promoters
              ? [oldData.promoters]
              : [];
          const contractData: ContractDetail = {
            id: oldData?.id ?? '',
            created_at: oldData?.created_at ?? '',
            updated_at: oldData?.updated_at ?? null,
            contract_number: oldData?.contract_number ?? null,
            is_current: oldData?.is_current ?? null,
            pdf_url: oldData?.pdf_url ?? null,
            status: oldData?.status ?? '',
            first_party_id: oldData?.first_party_id ?? '',
            second_party_id: oldData?.second_party_id ?? '',
            promoter_id: oldData?.promoter_id ?? '',
            first_party: firstPartyOldValid,
            second_party: secondPartyOldValid,
            promoters: promotersArr,
            end_date: oldData?.end_date ?? null,
            currency: oldData?.currency ?? null,
            job_title: oldData?.job_title ?? null,
            work_location: oldData?.work_location ?? null,
          };
          setContract(contractData);
          setActivityLogs(mockActivityLogs);
          setLoading(false);
          return;
        }
      } else if (fetchError) {
        setError(fetchError.message)
        setLoading(false)
        return
      }
      if (data) {
        // Defensive: ensure first_party and second_party are valid Party objects
        const fallbackParty: Party = {
          id: "",
          name_en: "",
          name_ar: "",
          crn: "",
          type: null
        };
        const validParty = (p: any): p is Party => !!p && typeof p === 'object' && 'id' in p && 'name_en' in p && 'name_ar' in p && 'crn' in p;
        const firstPartyValid: Party = validParty(data.first_party) && typeof data.first_party.type !== 'undefined'
          ? { ...data.first_party, type: data.first_party.type ?? null }
          : fallbackParty;
        const secondPartyValid: Party = validParty(data.second_party) && typeof data.second_party.type !== 'undefined'
          ? { ...data.second_party, type: data.second_party.type ?? null }
          : fallbackParty;
        // Defensive: promoters is always an array
        const promotersArr = Array.isArray(data.promoters)
          ? data.promoters
          : data.promoters
            ? [data.promoters]
            : [];
        const contractData: ContractDetail = {
          ...data,
          first_party: firstPartyValid,
          second_party: secondPartyValid,
          promoters: promotersArr,
        };
        setContract(contractData);
      }
      setActivityLogs(mockActivityLogs)
      setLoading(false)
    } catch (err: any) {
      setError(err && typeof err === 'object' && 'message' in err ? (err.message as string) : "Unknown error")
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContract()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId])

  const refetch = () => {
    fetchContract()
  }

  return {
    contract,
    activityLogs,
    loading,
    error,
    refetch,
  }
}
