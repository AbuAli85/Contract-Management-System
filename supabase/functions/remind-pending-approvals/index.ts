// supabase/functions/remind-pending-approvals/index.ts
// Automated approval reminders and escalations for pending contracts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configuration
const REMINDER_THRESHOLD_HOURS = 48 // Send reminder after 48 hours
const ESCALATION_THRESHOLD_HOURS = 120 // Escalate after 5 days (120 hours)
const MAX_REMINDERS_PER_CONTRACT = 3 // Maximum reminders before escalation

interface PendingContract {
  id: string
  contract_number: string
  contract_type: string
  job_title: string
  created_at: string
  updated_at: string
  status: string
  reminder_count: number
  last_reminder_sent?: string
  assigned_reviewer?: string
  priority: 'low' | 'medium' | 'high'
}

interface ReminderResult {
  contractId: string
  contractNumber: string
  action: 'reminder_sent' | 'escalated' | 'skipped'
  reason?: string
  recipients: string[]
  emailSent: boolean
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  }

  try {
    console.log('🔄 Starting pending approval reminders check...')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get pending contracts that need attention
    const pendingContracts = await getPendingContracts(supabase)
    console.log(`📋 Found ${pendingContracts.length} pending contracts to process`)

    const results: ReminderResult[] = []

    // Process each pending contract
    for (const contract of pendingContracts) {
      const result = await processPendingContract(supabase, contract)
      results.push(result)
    }

    // Log activity
    await logReminderActivity(supabase, {
      totalProcessed: pendingContracts.length,
      remindersSent: results.filter(r => r.action === 'reminder_sent').length,
      escalationsSent: results.filter(r => r.action === 'escalated').length,
      skipped: results.filter(r => r.action === 'skipped').length,
      timestamp: new Date().toISOString()
    })

    const summary = {
      success: true,
      processed: pendingContracts.length,
      remindersSent: results.filter(r => r.action === 'reminder_sent').length,
      escalationsSent: results.filter(r => r.action === 'escalated').length,
      skipped: results.filter(r => r.action === 'skipped').length,
      results
    }

    console.log('✅ Reminder processing completed:', summary)

    return new Response(JSON.stringify(summary), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    console.error('❌ Reminder processing error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
})

async function getPendingContracts(supabase: any): Promise<PendingContract[]> {
  const cutoffTime = new Date()
  cutoffTime.setHours(cutoffTime.getHours() - REMINDER_THRESHOLD_HOURS)

  const { data: contracts, error } = await supabase
    .from('contracts')
    .select(`
      id,
      contract_number,
      contract_type,
      job_title,
      created_at,
      updated_at,
      status,
      reminder_count,
      last_reminder_sent,
      assigned_reviewer,
      priority
    `)
    .eq('status', 'pending_approval')
    .lt('updated_at', cutoffTime.toISOString())
    .order('updated_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch pending contracts: ${error.message}`)
  }

  return contracts || []
}

async function processPendingContract(
  supabase: any, 
  contract: PendingContract
): Promise<ReminderResult> {
  const now = new Date()
  const lastUpdate = new Date(contract.updated_at)
  const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60)
  const reminderCount = contract.reminder_count || 0

  // Check if contract should be escalated
  if (hoursSinceUpdate >= ESCALATION_THRESHOLD_HOURS || reminderCount >= MAX_REMINDERS_PER_CONTRACT) {
    return await escalateContract(supabase, contract)
  }

  // Check if reminder should be sent
  if (hoursSinceUpdate >= REMINDER_THRESHOLD_HOURS) {
    // Check if we've already sent a reminder recently
    if (contract.last_reminder_sent) {
      const lastReminder = new Date(contract.last_reminder_sent)
      const hoursSinceLastReminder = (now.getTime() - lastReminder.getTime()) / (1000 * 60 * 60)
      
      if (hoursSinceLastReminder < 24) {
        return {
          contractId: contract.id,
          contractNumber: contract.contract_number,
          action: 'skipped',
          reason: 'Reminder sent recently',
          recipients: [],
          emailSent: false
        }
      }
    }

    return await sendReminder(supabase, contract)
  }

  return {
    contractId: contract.id,
    contractNumber: contract.contract_number,
    action: 'skipped',
    reason: 'Not yet due for reminder',
    recipients: [],
    emailSent: false
  }
}

async function sendReminder(supabase: any, contract: PendingContract): Promise<ReminderResult> {
  try {
    // Get contract details with parties and promoter
    const { data: contractDetails, error } = await supabase
      .from('contracts')
      .select(`
        *,
        first_party:parties!first_party_id(name_en, contact_email, contact_person),
        second_party:parties!second_party_id(name_en, contact_email, contact_person),
        promoters(name_en, email)
      `)
      .eq('id', contract.id)
      .single()

    if (error || !contractDetails) {
      throw new Error(`Failed to fetch contract details: ${error?.message}`)
    }

    // Determine recipients
    const recipients = getReminderRecipients(contractDetails, contract.assigned_reviewer)
    
    if (recipients.length === 0) {
      return {
        contractId: contract.id,
        contractNumber: contract.contract_number,
        action: 'skipped',
        reason: 'No valid recipients found',
        recipients: [],
        emailSent: false
      }
    }

    // Send reminder email
    const emailSent = await sendReminderEmail(contractDetails, recipients, contract.reminder_count || 0)

    // Update contract with reminder information
    await supabase
      .from('contracts')
      .update({
        reminder_count: (contract.reminder_count || 0) + 1,
        last_reminder_sent: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', contract.id)

    // Log reminder activity
    await logContractActivity(supabase, {
      contractId: contract.id,
      action: 'reminder_sent',
      details: {
        recipients,
        reminderCount: (contract.reminder_count || 0) + 1,
        emailSent
      }
    })

    return {
      contractId: contract.id,
      contractNumber: contract.contract_number,
      action: 'reminder_sent',
      recipients,
      emailSent
    }

  } catch (error) {
    console.error(`❌ Failed to send reminder for contract ${contract.id}:`, error)
    
    return {
      contractId: contract.id,
      contractNumber: contract.contract_number,
      action: 'skipped',
      reason: `Failed to send reminder: ${error.message}`,
      recipients: [],
      emailSent: false
    }
  }
}

async function escalateContract(supabase: any, contract: PendingContract): Promise<ReminderResult> {
  try {
    // Get admin users for escalation
    const { data: admins, error } = await supabase
      .from('users')
      .select('email, name')
      .eq('role', 'admin')
      .eq('is_active', true)

    if (error || !admins || admins.length === 0) {
      throw new Error('No admin users found for escalation')
    }

    const adminEmails = admins.map(admin => admin.email).filter(Boolean)

    // Send escalation email
    const emailSent = await sendEscalationEmail(contract, adminEmails)

    // Update contract status
    await supabase
      .from('contracts')
      .update({
        status: 'escalated',
        escalated_at: new Date().toISOString(),
        escalated_to: adminEmails.join(', '),
        updated_at: new Date().toISOString()
      })
      .eq('id', contract.id)

    // Log escalation activity
    await logContractActivity(supabase, {
      contractId: contract.id,
      action: 'escalated',
      details: {
        escalatedTo: adminEmails,
        reason: 'Exceeded reminder threshold',
        emailSent
      }
    })

    return {
      contractId: contract.id,
      contractNumber: contract.contract_number,
      action: 'escalated',
      recipients: adminEmails,
      emailSent
    }

  } catch (error) {
    console.error(`❌ Failed to escalate contract ${contract.id}:`, error)
    
    return {
      contractId: contract.id,
      contractNumber: contract.contract_number,
      action: 'skipped',
      reason: `Failed to escalate: ${error.message}`,
      recipients: [],
      emailSent: false
    }
  }
}

function getReminderRecipients(contractDetails: any, assignedReviewer?: string): string[] {
  const recipients = new Set<string>()

  // Add assigned reviewer if specified
  if (assignedReviewer) {
    recipients.add(assignedReviewer)
  }

  // Add party contact emails
  if (contractDetails.first_party?.contact_email) {
    recipients.add(contractDetails.first_party.contact_email)
  }
  if (contractDetails.second_party?.contact_email) {
    recipients.add(contractDetails.second_party.contact_email)
  }

  // Add promoter email
  if (contractDetails.promoters?.email) {
    recipients.add(contractDetails.promoters.email)
  }

  // Add contract email if different
  if (contractDetails.email && !recipients.has(contractDetails.email)) {
    recipients.add(contractDetails.email)
  }

  return Array.from(recipients).filter(email => email && email.includes('@'))
}

async function sendReminderEmail(contractDetails: any, recipients: string[], reminderCount: number): Promise<boolean> {
  try {
    const subject = `Contract Approval Reminder - ${contractDetails.contract_number}`
    const body = generateReminderEmailBody(contractDetails, reminderCount)

    // Send email using your email service
    // This is a placeholder - replace with your actual email service
    const emailServiceUrl = Deno.env.get('EMAIL_SERVICE_URL')
    if (emailServiceUrl) {
      const response = await fetch(emailServiceUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipients,
          subject,
          body,
          template: 'contract_reminder'
        })
      })

      return response.ok
    }

    // Fallback: log email details
    console.log('📧 Reminder email would be sent:', {
      to: recipients,
      subject,
      contractNumber: contractDetails.contract_number,
      reminderCount
    })

    return true

  } catch (error) {
    console.error('Failed to send reminder email:', error)
    return false
  }
}

async function sendEscalationEmail(contract: PendingContract, adminEmails: string[]): Promise<boolean> {
  try {
    const subject = `URGENT: Contract Escalation - ${contract.contract_number}`
    const body = generateEscalationEmailBody(contract)

    // Send email using your email service
    const emailServiceUrl = Deno.env.get('EMAIL_SERVICE_URL')
    if (emailServiceUrl) {
      const response = await fetch(emailServiceUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: adminEmails,
          subject,
          body,
          template: 'contract_escalation',
          priority: 'high'
        })
      })

      return response.ok
    }

    // Fallback: log email details
    console.log('🚨 Escalation email would be sent:', {
      to: adminEmails,
      subject,
      contractNumber: contract.contract_number
    })

    return true

  } catch (error) {
    console.error('Failed to send escalation email:', error)
    return false
  }
}

function generateReminderEmailBody(contractDetails: any, reminderCount: number): string {
  const daysSinceCreation = Math.floor(
    (new Date().getTime() - new Date(contractDetails.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  return `
Dear Contract Stakeholder,

This is a reminder that contract ${contractDetails.contract_number} is still pending approval.

Contract Details:
- Contract Number: ${contractDetails.contract_number}
- Job Title: ${contractDetails.job_title}
- Contract Type: ${contractDetails.contract_type}
- Created: ${new Date(contractDetails.created_at).toLocaleDateString()}
- Days Pending: ${daysSinceCreation}

This is reminder #${reminderCount + 1} for this contract.

Please review and approve this contract as soon as possible to avoid delays.

If you have any questions, please contact the contract administrator.

Best regards,
Contract Management System
  `.trim()
}

function generateEscalationEmailBody(contract: PendingContract): string {
  const daysSinceCreation = Math.floor(
    (new Date().getTime() - new Date(contract.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  return `
URGENT: Contract Approval Required

Contract ${contract.contract_number} has been escalated for immediate attention.

Contract Details:
- Contract Number: ${contract.contract_number}
- Job Title: ${contract.job_title}
- Contract Type: ${contract.contract_type}
- Created: ${new Date(contract.created_at).toLocaleDateString()}
- Days Pending: ${daysSinceCreation}
- Reminders Sent: ${contract.reminder_count || 0}

This contract has exceeded the normal approval timeline and requires immediate administrative review.

Please take action on this contract as soon as possible.

Best regards,
Contract Management System
  `.trim()
}

async function logReminderActivity(supabase: any, data: any): Promise<void> {
  try {
    await supabase
      .from('system_activity_log')
      .insert({
        action: 'reminder_processing',
        details: data,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Failed to log reminder activity:', error)
  }
}

async function logContractActivity(supabase: any, data: any): Promise<void> {
  try {
    await supabase
      .from('contract_activity_log')
      .insert({
        contract_id: data.contractId,
        action: data.action,
        details: data.details,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Failed to log contract activity:', error)
  }
}