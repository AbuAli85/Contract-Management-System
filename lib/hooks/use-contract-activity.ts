// lib/hooks/use-contract-activity.ts
import { useState, useEffect } from 'react';

interface User {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role?: string;
}

interface AuditLog {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  user: User | null;
  metadata?: any;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  description: string;
  priority?: string;
  status: string;
  dueDate?: string;
  assignedTo?: string;
  createdBy?: string;
  timestamp: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  assignee?: string;
  dueDate?: string;
  completedDate?: string;
  createdAt: string;
}

interface ContractActivity {
  contract: {
    id: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
  activity: {
    addedBy: User | null;
    lastUpdatedBy: User | null;
    auditLogs: AuditLog[];
    notifications: Notification[];
    tasks: Task[];
  };
}

export function useContractActivity(contractId: string) {
  const [data, setData] = useState<ContractActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActivity() {
      if (!contractId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/contracts/${contractId}/activity`);

        if (!response.ok) {
          throw new Error(`Failed to fetch activity: ${response.statusText}`);
        }

        const activityData = await response.json();
        setData(activityData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch activity'
        );
      } finally {
        setLoading(false);
      }
    }

    fetchActivity();
  }, [contractId]);

  return {
    data,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      setError(null);
      // Re-trigger the effect
      setData(null);
    },
  };
}
