import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { differenceInDays } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notifications = []
    const now = new Date()

    // Get pending contract approvals
    const { data: pendingContracts } = await supabase
      .from('contracts')
      .select(`
        id,
        contract_number,
        created_at,
        parties!inner(name_en, name_ar)
      `)
      .eq('status', 'pending')

    pendingContracts?.forEach(contract => {
      const daysPending = differenceInDays(now, new Date(contract.created_at))
      notifications.push({
        id: `pending-${contract.id}`,
        type: 'warning',
        priority: daysPending > 3 ? 'high' : 'medium',
        title: 'Contract Approval Pending',
        message: `Contract ${contract.contract_number || contract.id} has been pending for ${daysPending} days`,
        timestamp: contract.created_at,
        action: {
          label: 'Review Contract',
          url: `/contracts/${contract.id}`
        },
        entity: contract.parties?.[0]?.name_en || contract.parties?.[0]?.name_ar
      })
    })

    // Get expiring ID documents (next 30 days)
    const { data: expiringIds } = await supabase
      .from('promoters')
      .select('id, name_en, name_ar, id_expiry_date')
      .not('id_expiry_date', 'is', null)
      .lte('id_expiry_date', new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString())

    expiringIds?.forEach(promoter => {
      const daysUntilExpiry = differenceInDays(new Date(promoter.id_expiry_date), now)
      notifications.push({
        id: `id-expiry-${promoter.id}`,
        type: daysUntilExpiry <= 7 ? 'error' : 'warning',
        priority: daysUntilExpiry <= 7 ? 'high' : 'medium',
        title: 'ID Document Expiring',
        message: `${promoter.name_en || promoter.name_ar}'s ID expires in ${daysUntilExpiry} days`,
        timestamp: promoter.id_expiry_date,
        action: {
          label: 'Update Document',
          url: `/manage-promoters/${promoter.id}/edit`
        },
        entity: promoter.name_en || promoter.name_ar
      })
    })

    // Get expiring passport documents (next 90 days)
    const { data: expiringPassports } = await supabase
      .from('promoters')
      .select('id, name_en, name_ar, passport_expiry_date')
      .not('passport_expiry_date', 'is', null)
      .lte('passport_expiry_date', new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString())

    expiringPassports?.forEach(promoter => {
      const daysUntilExpiry = differenceInDays(new Date(promoter.passport_expiry_date), now)
      notifications.push({
        id: `passport-expiry-${promoter.id}`,
        type: daysUntilExpiry <= 30 ? 'error' : 'warning',
        priority: daysUntilExpiry <= 30 ? 'high' : 'medium',
        title: 'Passport Expiring',
        message: `${promoter.name_en || promoter.name_ar}'s passport expires in ${daysUntilExpiry} days`,
        timestamp: promoter.passport_expiry_date,
        action: {
          label: 'Update Document',
          url: `/manage-promoters/${promoter.id}/edit`
        },
        entity: promoter.name_en || promoter.name_ar
      })
    })

    // Get contracts nearing completion (if applicable)
    const { data: nearingCompletion } = await supabase
      .from('contracts')
      .select(`
        id,
        contract_number,
        end_date,
        parties!inner(name_en, name_ar)
      `)
      .eq('status', 'active')
      .not('end_date', 'is', null)
      .lte('end_date', new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString())

    nearingCompletion?.forEach(contract => {
      const daysUntilEnd = differenceInDays(new Date(contract.end_date), now)
      notifications.push({
        id: `contract-ending-${contract.id}`,
        type: 'info',
        priority: daysUntilEnd <= 7 ? 'high' : 'medium',
        title: 'Contract Ending Soon',
        message: `Contract ${contract.contract_number || contract.id} ends in ${daysUntilEnd} days`,
        timestamp: contract.end_date,
        action: {
          label: 'View Contract',
          url: `/contracts/${contract.id}`
        },
        entity: contract.parties?.[0]?.name_en || contract.parties?.[0]?.name_ar
      })
    })

    // Sort by priority and timestamp
    notifications.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
      if (priorityDiff !== 0) return priorityDiff
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Notifications error:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}
