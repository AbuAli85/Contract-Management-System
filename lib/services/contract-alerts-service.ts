/**
 * Contract Alerts Service
 * Automated alerts for expiry, renewal, and other contract events
 */

import { createClient } from '@/lib/supabase/server';
import { auditLogger } from '@/lib/security/audit-logger';

export interface ContractAlert {
  id: string;
  contract_id: string;
  alert_type: 'expiry' | 'renewal' | 'milestone' | 'payment_due' | 'obligation_due' | 'approval_needed';
  title: string;
  message?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  trigger_date: string;
  status: 'pending' | 'sent' | 'acknowledged' | 'dismissed';
  recipients?: string[];
  sent_at?: string;
  acknowledged_by?: string[];
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  alert_type: string;
  enabled: boolean;
  channels: ('email' | 'in_app' | 'sms')[];
  advance_days: number;
  created_at: string;
  updated_at: string;
}

export class ContractAlertsService {
  /**
   * Create alert
   */
  static async createAlert(
    alert: Partial<ContractAlert>,
    userId?: string
  ): Promise<ContractAlert> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('contract_alerts')
      .insert(alert)
      .select()
      .single();

    if (error) {
      console.error('Error creating alert:', error);
      throw new Error('Failed to create alert');
    }

    if (userId) {
      await auditLogger.logDataChange({
        event_type: 'alert.created',
        user_id: userId,
        resource_type: 'contract_alert',
        resource_id: data.id,
        new_values: data,
      });
    }

    return data;
  }

  /**
   * Get alerts for contract
   */
  static async getContractAlerts(contractId: string): Promise<ContractAlert[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('contract_alerts')
      .select('*')
      .eq('contract_id', contractId)
      .order('trigger_date', { ascending: true });

    if (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get pending alerts
   */
  static async getPendingAlerts(): Promise<ContractAlert[]> {
    const supabase = await createClient();
    
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('contract_alerts')
      .select('*, contract:contract_id(*)')
      .eq('status', 'pending')
      .lte('trigger_date', now);

    if (error) {
      console.error('Error fetching pending alerts:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get alerts for user
   */
  static async getUserAlerts(userId: string, limit: number = 50): Promise<ContractAlert[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('contract_alerts')
      .select('*, contract:contract_id(id, title, type)')
      .contains('recipients', [userId])
      .neq('status', 'dismissed')
      .order('trigger_date', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching user alerts:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Acknowledge alert
   */
  static async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const supabase = await createClient();
    
    const { data: alert } = await supabase
      .from('contract_alerts')
      .select('acknowledged_by')
      .eq('id', alertId)
      .single();

    const acknowledgedBy = alert?.acknowledged_by || [];
    if (!acknowledgedBy.includes(userId)) {
      acknowledgedBy.push(userId);
    }

    await supabase
      .from('contract_alerts')
      .update({
        status: 'acknowledged',
        acknowledged_by: acknowledgedBy,
      })
      .eq('id', alertId);
  }

  /**
   * Dismiss alert
   */
  static async dismissAlert(alertId: string, userId: string): Promise<void> {
    const supabase = await createClient();
    
    await supabase
      .from('contract_alerts')
      .update({ status: 'dismissed' })
      .eq('id', alertId);

    await auditLogger.logDataChange({
      event_type: 'alert.dismissed',
      user_id: userId,
      resource_type: 'contract_alert',
      resource_id: alertId,
    });
  }

  /**
   * Generate expiry alerts
   * Should be run daily via cron job
   */
  static async generateExpiryAlerts(): Promise<number> {
    const supabase = await createClient();
    
    // Get notification settings to determine advance days
    const advanceDays = [7, 14, 30, 60, 90]; // Default alert days
    let alertsCreated = 0;

    for (const days of advanceDays) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      const targetDateStr = targetDate.toISOString().split('T')[0];

      // Find contracts expiring on target date
      const { data: contracts } = await supabase
        .from('contracts')
        .select('*')
        .gte('end_date', targetDateStr)
        .lt('end_date', targetDateStr + 'T23:59:59')
        .in('status', ['active', 'signed']);

      if (!contracts || contracts.length === 0) continue;

      for (const contract of contracts) {
        // Check if alert already exists
        const { data: existingAlert } = await supabase
          .from('contract_alerts')
          .select('id')
          .eq('contract_id', contract.id)
          .eq('alert_type', 'expiry')
          .gte('trigger_date', new Date().toISOString())
          .single();

        if (existingAlert) continue;

        // Get stakeholders (created_by, parties)
        const recipients = [contract.created_by];

        // Create expiry alert
        await this.createAlert({
          contract_id: contract.id,
          alert_type: 'expiry',
          title: `Contract Expiring in ${days} Days`,
          message: `Contract "${contract.title}" will expire on ${new Date(contract.end_date).toLocaleDateString()}`,
          severity: days <= 7 ? 'critical' : days <= 30 ? 'high' : 'medium',
          trigger_date: new Date().toISOString(),
          recipients,
          metadata: {
            days_until_expiry: days,
            contract_value: contract.value,
            contract_type: contract.type,
          },
        });

        alertsCreated++;
      }
    }

    return alertsCreated;
  }

  /**
   * Generate renewal alerts
   */
  static async generateRenewalAlerts(): Promise<number> {
    const supabase = await createClient();
    let alertsCreated = 0;

    // Find contracts eligible for renewal (expiring in 60-90 days)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 60);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 90);

    const { data: contracts } = await supabase
      .from('contracts')
      .select('*')
      .gte('end_date', startDate.toISOString())
      .lte('end_date', endDate.toISOString())
      .in('status', ['active', 'signed']);

    if (!contracts || contracts.length === 0) return 0;

    for (const contract of contracts) {
      // Check if renewal alert already exists
      const { data: existingAlert } = await supabase
        .from('contract_alerts')
        .select('id')
        .eq('contract_id', contract.id)
        .eq('alert_type', 'renewal')
        .gte('trigger_date', new Date().toISOString())
        .single();

      if (existingAlert) continue;

      const recipients = [contract.created_by];

      await this.createAlert({
        contract_id: contract.id,
        alert_type: 'renewal',
        title: 'Contract Renewal Available',
        message: `Contract "${contract.title}" is eligible for renewal. Would you like to initiate the renewal process?`,
        severity: 'medium',
        trigger_date: new Date().toISOString(),
        recipients,
        metadata: {
          expiry_date: contract.end_date,
          contract_value: contract.value,
        },
      });

      alertsCreated++;
    }

    return alertsCreated;
  }

  /**
   * Generate obligation due alerts
   */
  static async generateObligationAlerts(): Promise<number> {
    const supabase = await createClient();
    let alertsCreated = 0;

    const alertDays = [1, 3, 7]; // Alert 1, 3, 7 days before due

    for (const days of alertDays) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      const targetDateStr = targetDate.toISOString().split('T')[0];

      // Find obligations due on target date
      const { data: obligations } = await supabase
        .from('contract_obligations')
        .select('*, contract:contract_id(title, created_by)')
        .gte('due_date', targetDateStr)
        .lt('due_date', targetDateStr + 'T23:59:59')
        .in('status', ['pending', 'in_progress']);

      if (!obligations || obligations.length === 0) continue;

      for (const obligation of obligations) {
        // Check if alert already exists
        const { data: existingAlert } = await supabase
          .from('contract_alerts')
          .select('id')
          .eq('contract_id', obligation.contract_id)
          .eq('alert_type', 'obligation_due')
          .eq('metadata->>obligation_id', obligation.id)
          .gte('trigger_date', new Date().toISOString())
          .single();

        if (existingAlert) continue;

        const recipients = [
          obligation.assigned_to,
          obligation.contract.created_by,
        ].filter(Boolean);

        await this.createAlert({
          contract_id: obligation.contract_id,
          alert_type: 'obligation_due',
          title: `Obligation Due in ${days} ${days === 1 ? 'Day' : 'Days'}`,
          message: `"${obligation.title}" for contract "${obligation.contract.title}" is due on ${new Date(obligation.due_date).toLocaleDateString()}`,
          severity: days === 1 ? 'high' : 'medium',
          trigger_date: new Date().toISOString(),
          recipients,
          metadata: {
            obligation_id: obligation.id,
            obligation_type: obligation.obligation_type,
            days_until_due: days,
          },
        });

        alertsCreated++;
      }
    }

    return alertsCreated;
  }

  /**
   * Process and send pending alerts
   */
  static async processPendingAlerts(): Promise<number> {
    const alerts = await this.getPendingAlerts();
    let sentCount = 0;

    for (const alert of alerts) {
      try {
        await this.sendAlert(alert);
        sentCount++;

        // Update alert status
        const supabase = await createClient();
        await supabase
          .from('contract_alerts')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', alert.id);
      } catch (error) {
        console.error(`Failed to send alert ${alert.id}:`, error);
      }
    }

    return sentCount;
  }

  /**
   * Send alert to recipients
   */
  private static async sendAlert(alert: ContractAlert): Promise<void> {
    const supabase = await createClient();
    
    if (!alert.recipients || alert.recipients.length === 0) return;

    // Get user notification settings
    for (const userId of alert.recipients) {
      const { data: settings } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .eq('alert_type', alert.alert_type)
        .single();

      // Default to in-app if no settings found
      const channels = settings?.channels || ['in_app'];
      const enabled = settings?.enabled !== false;

      if (!enabled) continue;

      // Send in-app notification
      if (channels.includes('in_app')) {
        await supabase.from('notifications').insert({
          user_id: userId,
          title: alert.title,
          message: alert.message,
          type: alert.alert_type,
          severity: alert.severity,
          link: `/contracts/${alert.contract_id}`,
          metadata: alert.metadata,
        });
      }

      // Send email notification
      if (channels.includes('email')) {
        await this.sendEmailAlert(userId, alert);
      }

      // Send SMS (if configured)
      if (channels.includes('sms')) {
        await this.sendSMSAlert(userId, alert);
      }
    }
  }

  /**
   * Send email alert
   */
  private static async sendEmailAlert(userId: string, alert: ContractAlert): Promise<void> {
    try {
      await fetch('/api/email/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          alert,
        }),
      });
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  /**
   * Send SMS alert
   */
  private static async sendSMSAlert(userId: string, alert: ContractAlert): Promise<void> {
    // Implement SMS sending logic (Twilio, etc.)
    console.log('SMS alert not implemented yet:', userId, alert);
  }

  /**
   * Get/update notification settings
   */
  static async getNotificationSettings(userId: string): Promise<NotificationSettings[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching notification settings:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Update notification settings
   */
  static async updateNotificationSettings(
    userId: string,
    alertType: string,
    settings: Partial<NotificationSettings>
  ): Promise<void> {
    const supabase = await createClient();
    
    await supabase
      .from('notification_settings')
      .upsert({
        user_id: userId,
        alert_type: alertType,
        ...settings,
      });
  }

  /**
   * Get alert statistics
   */
  static async getAlertStatistics(startDate?: string, endDate?: string): Promise<{
    total_alerts: number;
    by_type: Record<string, number>;
    by_severity: Record<string, number>;
    sent: number;
    pending: number;
    acknowledged: number;
  }> {
    const supabase = await createClient();
    
    let query = supabase.from('contract_alerts').select('*');

    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data: alerts } = await query;

    if (!alerts || alerts.length === 0) {
      return {
        total_alerts: 0,
        by_type: {},
        by_severity: {},
        sent: 0,
        pending: 0,
        acknowledged: 0,
      };
    }

    const by_type: Record<string, number> = {};
    const by_severity: Record<string, number> = {};

    alerts.forEach(alert => {
      by_type[alert.alert_type] = (by_type[alert.alert_type] || 0) + 1;
      by_severity[alert.severity] = (by_severity[alert.severity] || 0) + 1;
    });

    return {
      total_alerts: alerts.length,
      by_type,
      by_severity,
      sent: alerts.filter(a => a.status === 'sent').length,
      pending: alerts.filter(a => a.status === 'pending').length,
      acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    };
  }

  /**
   * Master alert generation function (run daily via cron)
   */
  static async generateAllAlerts(): Promise<{
    expiry_alerts: number;
    renewal_alerts: number;
    obligation_alerts: number;
    total: number;
  }> {
    const expiry_alerts = await this.generateExpiryAlerts();
    const renewal_alerts = await this.generateRenewalAlerts();
    const obligation_alerts = await this.generateObligationAlerts();

    return {
      expiry_alerts,
      renewal_alerts,
      obligation_alerts,
      total: expiry_alerts + renewal_alerts + obligation_alerts,
    };
  }
}

