/**
 * Approval Workflow Service
 * Enhanced multi-step approval workflows with routing
 */

import { createClient } from '@/lib/supabase/server';
import { auditLogger } from '@/lib/security/audit-logger';

export interface ApprovalWorkflow {
  id: string;
  name: string;
  description?: string;
  contract_type?: string;
  conditions?: any;
  steps: ApprovalStep[];
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovalStep {
  step: number;
  name: string;
  role?: string;
  approver_id?: string;
  required: boolean;
  parallel?: boolean;
  conditions?: any;
}

export interface ContractApproval {
  id: string;
  contract_id: string;
  workflow_id?: string;
  step_number: number;
  step_name: string;
  approver_id?: string;
  approver_role?: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped' | 'delegated';
  comments?: string;
  approved_at?: string;
  deadline?: string;
  reminder_sent_at?: string;
  delegated_to?: string;
  delegated_at?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export class ApprovalWorkflowService {
  /**
   * Get all active workflows
   */
  static async getActiveWorkflows(): Promise<ApprovalWorkflow[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('approval_workflows')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching workflows:', error);
      throw new Error('Failed to fetch approval workflows');
    }

    return data || [];
  }

  /**
   * Get workflow by contract type
   */
  static async getWorkflowByType(contractType: string): Promise<ApprovalWorkflow | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('approval_workflows')
      .select('*')
      .eq('contract_type', contractType)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching workflow:', error);
      return null;
    }

    return data;
  }

  /**
   * Create workflow
   */
  static async createWorkflow(
    workflow: Partial<ApprovalWorkflow>,
    userId: string
  ): Promise<ApprovalWorkflow> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('approval_workflows')
      .insert({
        ...workflow,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating workflow:', error);
      throw new Error('Failed to create workflow');
    }

    await auditLogger.logDataChange({
      event_type: 'workflow.created',
      user_id: userId,
      resource_type: 'approval_workflow',
      resource_id: data.id,
      new_values: data,
    });

    return data;
  }

  /**
   * Update workflow
   */
  static async updateWorkflow(
    workflowId: string,
    updates: Partial<ApprovalWorkflow>,
    userId: string
  ): Promise<ApprovalWorkflow> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('approval_workflows')
      .update(updates)
      .eq('id', workflowId)
      .select()
      .single();

    if (error) {
      console.error('Error updating workflow:', error);
      throw new Error('Failed to update workflow');
    }

    await auditLogger.logDataChange({
      event_type: 'workflow.updated',
      user_id: userId,
      resource_type: 'approval_workflow',
      resource_id: workflowId,
      new_values: data,
    });

    return data;
  }

  /**
   * Initiate approval process for contract
   */
  static async initiateApproval(
    contractId: string,
    workflowId: string,
    userId: string
  ): Promise<ContractApproval[]> {
    const supabase = await createClient();
    
    // Get workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('approval_workflows')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (workflowError || !workflow) {
      throw new Error('Workflow not found');
    }

    const steps = workflow.steps as ApprovalStep[];
    const approvals: any[] = [];

    // Create approval records for each step
    for (const step of steps) {
      approvals.push({
        contract_id: contractId,
        workflow_id: workflowId,
        step_number: step.step,
        step_name: step.name,
        approver_role: step.role,
        status: 'pending',
        deadline: this.calculateDeadline(7), // 7 days default
      });
    }

    const { data, error } = await supabase
      .from('contract_approvals')
      .insert(approvals)
      .select();

    if (error) {
      console.error('Error creating approvals:', error);
      throw new Error('Failed to initiate approval process');
    }

    // Update contract status
    await supabase
      .from('contracts')
      .update({ status: 'pending_approval' })
      .eq('id', contractId);

    // Send notifications to first step approvers
    await this.notifyApprovers(contractId, 1);

    await auditLogger.logDataChange({
      event_type: 'approval.initiated',
      user_id: userId,
      resource_type: 'contract',
      resource_id: contractId,
      new_values: { workflow_id: workflowId, steps: data.length },
    });

    return data;
  }

  /**
   * Approve step
   */
  static async approveStep(
    approvalId: string,
    userId: string,
    comments?: string
  ): Promise<void> {
    const supabase = await createClient();
    
    // Get approval record
    const { data: approval, error: fetchError } = await supabase
      .from('contract_approvals')
      .select('*')
      .eq('id', approvalId)
      .single();

    if (fetchError || !approval) {
      throw new Error('Approval not found');
    }

    // Check if user is authorized
    if (approval.approver_id && approval.approver_id !== userId) {
      throw new Error('Not authorized to approve this step');
    }

    // Update approval status
    const { error: updateError } = await supabase
      .from('contract_approvals')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        comments,
      })
      .eq('id', approvalId);

    if (updateError) {
      throw new Error('Failed to approve step');
    }

    // Check if all steps in this level are approved
    const { data: levelApprovals } = await supabase
      .from('contract_approvals')
      .select('*')
      .eq('contract_id', approval.contract_id)
      .eq('step_number', approval.step_number);

    const allApproved = levelApprovals?.every(a => a.status === 'approved');

    if (allApproved) {
      // Move to next step
      await this.notifyApprovers(approval.contract_id, approval.step_number + 1);

      // Check if this was the last step
      const { data: remainingApprovals } = await supabase
        .from('contract_approvals')
        .select('*')
        .eq('contract_id', approval.contract_id)
        .eq('status', 'pending');

      if (!remainingApprovals || remainingApprovals.length === 0) {
        // All approvals complete
        await supabase
          .from('contracts')
          .update({ status: 'approved' })
          .eq('id', approval.contract_id);

        await auditLogger.logDataChange({
          event_type: 'contract.approved',
          user_id: userId,
          resource_type: 'contract',
          resource_id: approval.contract_id,
        });
      }
    }

    await auditLogger.logDataChange({
      event_type: 'approval.step_approved',
      user_id: userId,
      resource_type: 'contract_approval',
      resource_id: approvalId,
      new_values: { comments },
    });
  }

  /**
   * Reject step
   */
  static async rejectStep(
    approvalId: string,
    userId: string,
    reason: string
  ): Promise<void> {
    const supabase = await createClient();
    
    const { data: approval, error: fetchError } = await supabase
      .from('contract_approvals')
      .select('*')
      .eq('id', approvalId)
      .single();

    if (fetchError || !approval) {
      throw new Error('Approval not found');
    }

    // Update approval status
    await supabase
      .from('contract_approvals')
      .update({
        status: 'rejected',
        comments: reason,
        approved_at: new Date().toISOString(),
      })
      .eq('id', approvalId);

    // Update contract status
    await supabase
      .from('contracts')
      .update({ status: 'rejected' })
      .eq('id', approval.contract_id);

    // Notify contract creator
    await this.notifyRejection(approval.contract_id, reason);

    await auditLogger.logDataChange({
      event_type: 'approval.step_rejected',
      user_id: userId,
      resource_type: 'contract_approval',
      resource_id: approvalId,
      new_values: { reason },
    });
  }

  /**
   * Delegate approval
   */
  static async delegateApproval(
    approvalId: string,
    fromUserId: string,
    toUserId: string,
    reason?: string
  ): Promise<void> {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('contract_approvals')
      .update({
        status: 'delegated',
        delegated_to: toUserId,
        delegated_at: new Date().toISOString(),
        comments: reason,
      })
      .eq('id', approvalId);

    if (error) {
      throw new Error('Failed to delegate approval');
    }

    // Notify delegated user
    await this.notifyDelegation(approvalId, toUserId);

    await auditLogger.logDataChange({
      event_type: 'approval.delegated',
      user_id: fromUserId,
      resource_type: 'contract_approval',
      resource_id: approvalId,
      new_values: { delegated_to: toUserId, reason },
    });
  }

  /**
   * Get approvals for contract
   */
  static async getContractApprovals(contractId: string): Promise<ContractApproval[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('contract_approvals')
      .select(`
        *,
        approver:approver_id (
          id,
          full_name,
          email,
          avatar_url
        ),
        delegated_user:delegated_to (
          id,
          full_name,
          email
        )
      `)
      .eq('contract_id', contractId)
      .order('step_number');

    if (error) {
      console.error('Error fetching approvals:', error);
      throw new Error('Failed to fetch approvals');
    }

    return data || [];
  }

  /**
   * Get pending approvals for user
   */
  static async getPendingApprovals(userId: string): Promise<ContractApproval[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('contract_approvals')
      .select(`
        *,
        contract:contract_id (
          id,
          title,
          type,
          value,
          currency
        )
      `)
      .or(`approver_id.eq.${userId},delegated_to.eq.${userId}`)
      .eq('status', 'pending')
      .order('deadline');

    if (error) {
      console.error('Error fetching pending approvals:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Calculate deadline
   */
  private static calculateDeadline(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString();
  }

  /**
   * Notify approvers
   */
  private static async notifyApprovers(
    contractId: string,
    stepNumber: number
  ): Promise<void> {
    const supabase = await createClient();
    
    const { data: approvals } = await supabase
      .from('contract_approvals')
      .select('*, contract:contract_id(title)')
      .eq('contract_id', contractId)
      .eq('step_number', stepNumber)
      .eq('status', 'pending');

    if (!approvals || approvals.length === 0) return;

    // Send notifications
    for (const approval of approvals) {
      if (approval.approver_id) {
        await supabase.from('notifications').insert({
          user_id: approval.approver_id,
          title: 'Approval Required',
          message: `Contract "${approval.contract.title}" requires your approval`,
          type: 'approval_request',
          link: `/contracts/${contractId}?approval=${approval.id}`,
          metadata: {
            contract_id: contractId,
            approval_id: approval.id,
            step: stepNumber,
          },
        });
      }
    }
  }

  /**
   * Notify rejection
   */
  private static async notifyRejection(
    contractId: string,
    reason: string
  ): Promise<void> {
    const supabase = await createClient();
    
    const { data: contract } = await supabase
      .from('contracts')
      .select('created_by, title')
      .eq('id', contractId)
      .single();

    if (contract && contract.created_by) {
      await supabase.from('notifications').insert({
        user_id: contract.created_by,
        title: 'Contract Rejected',
        message: `Your contract "${contract.title}" was rejected: ${reason}`,
        type: 'contract_rejected',
        link: `/contracts/${contractId}`,
      });
    }
  }

  /**
   * Notify delegation
   */
  private static async notifyDelegation(
    approvalId: string,
    toUserId: string
  ): Promise<void> {
    const supabase = await createClient();
    
    const { data: approval } = await supabase
      .from('contract_approvals')
      .select('*, contract:contract_id(title)')
      .eq('id', approvalId)
      .single();

    if (approval) {
      await supabase.from('notifications').insert({
        user_id: toUserId,
        title: 'Approval Delegated to You',
        message: `You have been delegated to approve contract "${approval.contract.title}"`,
        type: 'approval_delegated',
        link: `/contracts/${approval.contract_id}?approval=${approvalId}`,
      });
    }
  }

  /**
   * Send reminders for overdue approvals
   */
  static async sendOverdueReminders(): Promise<void> {
    const supabase = await createClient();
    
    const now = new Date().toISOString();
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    const { data: overdueApprovals } = await supabase
      .from('contract_approvals')
      .select('*, contract:contract_id(title)')
      .eq('status', 'pending')
      .lt('deadline', now)
      .or(`reminder_sent_at.is.null,reminder_sent_at.lt.${threeDaysAgo}`);

    if (!overdueApprovals) return;

    for (const approval of overdueApprovals) {
      if (approval.approver_id) {
        // Send reminder notification
        await supabase.from('notifications').insert({
          user_id: approval.approver_id,
          title: 'Overdue Approval',
          message: `Contract "${approval.contract.title}" approval is overdue`,
          type: 'approval_overdue',
          link: `/contracts/${approval.contract_id}?approval=${approval.id}`,
        });

        // Update reminder sent timestamp
        await supabase
          .from('contract_approvals')
          .update({ reminder_sent_at: now })
          .eq('id', approval.id);
      }
    }
  }

  /**
   * Get approval statistics
   */
  static async getApprovalStats(startDate?: string, endDate?: string): Promise<{
    total_approvals: number;
    approved: number;
    rejected: number;
    pending: number;
    avg_approval_time_hours: number;
    overdue_count: number;
  }> {
    const supabase = await createClient();
    
    let query = supabase.from('contract_approvals').select('*');

    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data: approvals } = await query;

    if (!approvals || approvals.length === 0) {
      return {
        total_approvals: 0,
        approved: 0,
        rejected: 0,
        pending: 0,
        avg_approval_time_hours: 0,
        overdue_count: 0,
      };
    }

    const approved = approvals.filter(a => a.status === 'approved');
    const rejected = approvals.filter(a => a.status === 'rejected');
    const pending = approvals.filter(a => a.status === 'pending');
    const now = new Date();
    const overdue = pending.filter(a => a.deadline && new Date(a.deadline) < now);

    // Calculate average approval time
    const approvalTimes = approved
      .filter(a => a.approved_at)
      .map(a => {
        const created = new Date(a.created_at).getTime();
        const approved = new Date(a.approved_at!).getTime();
        return (approved - created) / (1000 * 60 * 60); // hours
      });

    const avg_approval_time_hours = approvalTimes.length > 0
      ? approvalTimes.reduce((sum, time) => sum + time, 0) / approvalTimes.length
      : 0;

    return {
      total_approvals: approvals.length,
      approved: approved.length,
      rejected: rejected.length,
      pending: pending.length,
      avg_approval_time_hours: Math.round(avg_approval_time_hours * 10) / 10,
      overdue_count: overdue.length,
    };
  }
}

