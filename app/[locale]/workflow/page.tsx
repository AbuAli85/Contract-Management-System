'use client';

import { ComprehensiveWorkflowSystem } from '@/components/workflow/comprehensive-workflow-system';
import { useEnhancedRBAC } from '@/components/auth/enhanced-rbac-provider';
import { useAuth } from '@/app/providers';

export default function WorkflowPage() {
  const { user } = useAuth();
  const { userRole, isLoading } = useEnhancedRBAC();

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-2xl font-semibold text-gray-900 mb-2'>
            Access Denied
          </h2>
          <p className='text-gray-600'>
            Please log in to access workflow management.
          </p>
        </div>
      </div>
    );
  }

  // Determine user role based on userRole from RBAC context
  const role = userRole === 'provider' ? 'provider' : 'client';

  return (
    <div className='min-h-screen bg-gray-50'>
      <ComprehensiveWorkflowSystem
        userRole={role}
        userId={user?.id || ''}
      />
    </div>
  );
}
