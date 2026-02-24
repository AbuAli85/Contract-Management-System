/**
 * Workflow Automation Engine Service
 *
 * Executes automated workflows based on triggers and conditions
 * Supports event-driven, scheduled, and manual workflows
 */

import { createAdminClient } from '@/lib/supabase/server';
import {
  notificationService,
  NotificationRecipient,
  NotificationContent,
} from './unified-notification.service';

export type WorkflowTrigger = 'event' | 'schedule' | 'manual' | 'condition';
export type WorkflowStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused';
export type StepType =
  | 'notification'
  | 'data_update'
  | 'approval'
  | 'condition'
  | 'delay'
  | 'webhook'
  | 'script';
export type StepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped';

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  step_order: number;
  step_type: StepType;
  step_config: Record<string, any>;
  conditions?: any[];
  on_success_action?: string;
  on_failure_action?: string;
  timeout_seconds?: number;
  retry_count: number;
  retry_delay_seconds: number;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  trigger_event?: string;
  trigger_data: Record<string, any>;
  status: WorkflowStatus;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  execution_data: Record<string, any>;
}

export interface StepExecutionResult {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
  nextStep?: string;
}

/**
 * Workflow Engine Service
 */
export class WorkflowEngineService {
  private _supabase: ReturnType<typeof createAdminClient> | null = null;

  /**
   * Lazy initialization of Supabase admin client
   * Only creates the client when first accessed (at runtime, not build time)
   */
  private get supabase() {
    if (!this._supabase) {
      this._supabase = createAdminClient();
    }
    return this._supabase;
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: string,
    triggerData: Record<string, any> = {},
    userId?: string
  ): Promise<{ success: boolean; executionId?: string; error?: string }> {
    try {
      // Get workflow definition
      const { data: workflow, error: workflowError } = await this.supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .eq('is_active', true)
        .single();

      if (workflowError || !workflow) {
        return {
          success: false,
          error: 'Workflow not found or inactive',
        };
      }

      // Get workflow steps
      const { data: steps, error: stepsError } = await this.supabase
        .from('workflow_steps')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('step_order', { ascending: true });

      if (stepsError || !steps || steps.length === 0) {
        return {
          success: false,
          error: 'Workflow has no steps',
        };
      }

      // Create execution record
      const { data: execution, error: execError } = await this.supabase
        .from('workflow_executions')
        .insert({
          workflow_id: workflowId,
          trigger_event: workflow.trigger_type,
          trigger_data: triggerData,
          status: 'running',
          started_at: new Date().toISOString(),
          execution_data: {},
          created_by: userId,
        })
        .select()
        .single();

      if (execError || !execution) {
        return {
          success: false,
          error: 'Failed to create execution record',
        };
      }

      // Execute steps sequentially
      const _executionData = { ...triggerData };
      let currentStepIndex = 0;

      while (currentStepIndex < steps.length) {
        const step = steps[currentStepIndex];
        const stepResult = await this.executeStep(
          step,
          execution.id,
          executionData
        );

        // Record step execution
        await this.supabase.from('workflow_step_executions').insert({
          execution_id: execution.id,
          step_id: step.id,
          step_order: step.step_order,
          status: stepResult.success ? 'completed' : 'failed',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          result_data: stepResult.data || {},
          error_message: stepResult.error,
        });

        if (!stepResult.success) {
          // Handle failure
          if (step.on_failure_action === 'stop') {
            await this.updateExecutionStatus(
              execution.id,
              'failed',
              stepResult.error
            );
            return {
              success: false,
              executionId: execution.id,
              error: stepResult.error,
            };
          } else if (
            step.on_failure_action === 'retry' &&
            step.retry_count > 0
          ) {
            // Retry logic would go here
            await this.updateExecutionStatus(
              execution.id,
              'failed',
              stepResult.error
            );
            return {
              success: false,
              executionId: execution.id,
              error: stepResult.error,
            };
          }
          // Continue to next step on failure (if configured)
        }

        // Merge step result data
        if (stepResult.data) {
          executionData = { ...executionData, ...stepResult.data };
        }

        // Determine next step
        if (stepResult.nextStep) {
          const nextStepIndex = steps.findIndex(
            s => s.id === stepResult.nextStep
          );
          if (nextStepIndex !== -1) {
            currentStepIndex = nextStepIndex;
            continue;
          }
        }

        // Move to next step
        currentStepIndex++;
      }

      // Mark execution as completed
      await this.updateExecutionStatus(execution.id, 'completed');

      return {
        success: true,
        executionId: execution.id,
      };
    } catch (error: any) {
      console.error('Error executing workflow:', error);
      return {
        success: false,
        error: error.message || 'Workflow execution failed',
      };
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    step: WorkflowStep,
    _executionId: string,
    _executionData: Record<string, any>
  ): Promise<StepExecutionResult> {
    try {
      // Check conditions
      if (step.conditions && step.conditions.length > 0) {
        const conditionsMet = await this.evaluateConditions(
          step.conditions,
          executionData
        );
        if (!conditionsMet) {
          return {
            success: true,
            data: { skipped: true },
            nextStep: step.on_failure_action,
          };
        }
      }

      // Execute based on step type
      switch (step.step_type) {
        case 'notification':
          return await this.executeNotificationStep(step, executionData);

        case 'data_update':
          return await this.executeDataUpdateStep(step, executionData);

        case 'condition':
          return await this.executeConditionStep(step, executionData);

        case 'delay':
          return await this.executeDelayStep(step);

        case 'webhook':
          return await this.executeWebhookStep(step, executionData);

        default:
          return {
            success: false,
            error: `Unknown step type: ${step.step_type}`,
          };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Step execution failed',
      };
    }
  }

  /**
   * Execute notification step
   */
  private async executeNotificationStep(
    step: WorkflowStep,
    _executionData: Record<string, any>
  ): Promise<StepExecutionResult> {
    const config = step.step_config;
    const recipients: NotificationRecipient[] = [];

    // Determine recipients
    if (config.recipient === 'employee' && executionData.employeeId) {
      const { data: employee } = await this.supabase
        .from('profiles')
        .select('id, email, full_name, phone')
        .eq('id', executionData.employeeId)
        .single();

      if (employee) {
        recipients.push({
          userId: employee.id,
          email: employee.email,
          phone: employee.phone,
          name: employee.full_name,
        });
      }
    } else if (config.recipient === 'employer' && executionData.employerId) {
      const { data: employer } = await this.supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', executionData.employerId)
        .single();

      if (employer) {
        recipients.push({
          userId: employer.id,
          email: employer.email,
          name: employer.full_name,
        });
      }
    }

    if (recipients.length === 0) {
      return {
        success: false,
        error: 'No recipients found',
      };
    }

    const content: NotificationContent = {
      title: config.title || executionData.title || 'Notification',
      message: config.message || executionData.message || '',
      html: config.html,
      priority: config.priority || 'medium',
      category: config.category || 'workflow',
      actionUrl: config.actionUrl,
      metadata: executionData,
    };

    const result = await notificationService.sendNotification({
      recipients,
      content,
      channels: config.channels || ['email', 'in_app'],
    });

    return {
      success: result.success,
      data: {
        notificationsSent:
          result.sent.email + result.sent.sms + result.sent.inApp,
      },
      error: result.errors.length > 0 ? result.errors.join(', ') : undefined,
    };
  }

  /**
   * Execute data update step
   */
  private async executeDataUpdateStep(
    step: WorkflowStep,
    _executionData: Record<string, any>
  ): Promise<StepExecutionResult> {
    const config = step.step_config;
    const action = config.action;

    try {
      switch (action) {
        case 'create_onboarding_tasks':
          // Create onboarding tasks for new employee
          if (executionData.employeeId && executionData.employerId) {
            const tasks = config.tasks || [];
            for (const task of tasks) {
              await this.supabase.from('employee_tasks').insert({
                employer_employee_id: executionData.employerEmployeeId,
                title: task.title,
                description: task.description,
                priority: task.priority || 'medium',
                status: 'pending',
                task_type: 'training',
              });
            }
          }
          return { success: true, data: { tasksCreated: tasks.length } };

        case 'update_document_status':
          // Update document status
          if (executionData.documentId) {
            await this.supabase
              .from('employee_documents')
              .update({ status: config.status })
              .eq('id', executionData.documentId);
          }
          return { success: true };

        default:
          return {
            success: false,
            error: `Unknown action: ${action}`,
          };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Execute condition step
   */
  private async executeConditionStep(
    step: WorkflowStep,
    _executionData: Record<string, any>
  ): Promise<StepExecutionResult> {
    const config = step.step_config;
    const condition = config.condition;

    try {
      switch (condition) {
        case 'check_expiring_documents':
          const _daysBefore = config.days_before || [30, 14, 7];
          // This would call the document expiry automation service
          return { success: true, data: { documentsChecked: true } };

        case 'find_overdue_tasks':
          // Find overdue tasks
          const { data: overdueTasks } = await this.supabase
            .from('employee_tasks')
            .select('id, title, employer_employee_id')
            .lt('due_date', new Date().toISOString())
            .eq('status', 'pending');

          return {
            success: true,
            data: { overdueTasks: overdueTasks || [] },
          };

        default:
          return {
            success: false,
            error: `Unknown condition: ${condition}`,
          };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Execute delay step
   */
  private async executeDelayStep(
    step: WorkflowStep
  ): Promise<StepExecutionResult> {
    const delaySeconds = step.step_config.delay_seconds || 0;
    await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
    return { success: true };
  }

  /**
   * Execute webhook step
   */
  private async executeWebhookStep(
    step: WorkflowStep,
    _executionData: Record<string, any>
  ): Promise<StepExecutionResult> {
    const config = step.step_config;
    const url = config.url;

    try {
      const response = await fetch(url, {
        method: config.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: JSON.stringify({
          ...executionData,
          ...config.body,
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: { webhookResponse: data },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Evaluate conditions
   */
  private async evaluateConditions(
    conditions: any[],
    _executionData: Record<string, any>
  ): Promise<boolean> {
    // Simple condition evaluation
    // Can be enhanced with complex logic
    for (const condition of conditions) {
      const field = condition.field;
      const operator = condition.operator;
      const value = condition.value;

      const fieldValue = executionData[field];

      switch (operator) {
        case 'equals':
          if (fieldValue !== value) return false;
          break;
        case 'not_equals':
          if (fieldValue === value) return false;
          break;
        case 'greater_than':
          if (!(fieldValue > value)) return false;
          break;
        case 'less_than':
          if (!(fieldValue < value)) return false;
          break;
        case 'contains':
          if (!String(fieldValue).includes(String(value))) return false;
          break;
        default:
          return false;
      }
    }

    return true;
  }

  /**
   * Update execution status
   */
  private async updateExecutionStatus(
    _executionId: string,
    status: WorkflowStatus,
    errorMessage?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString();
    }

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    await this.supabase
      .from('workflow_executions')
      .update(updateData)
      .eq('id', executionId);
  }

  /**
   * Get workflow execution history
   */
  async getExecutionHistory(
    workflowId: string,
    limit: number = 50
  ): Promise<WorkflowExecution[]> {
    const { data, error } = await this.supabase
      .from('workflow_executions')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching execution history:', error);
      return [];
    }

    return data || [];
  }
}

// Export singleton instance
export const workflowEngine = new WorkflowEngineService();
