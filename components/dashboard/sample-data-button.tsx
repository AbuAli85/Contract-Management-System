'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';

export function SampleDataButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateSampleData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/simple-seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          `✅ Sample contract created! Schema: ${result.schema_used}`,
          {
            description: `Created contract for ${result.contract?.job_title || 'position'}`,
          }
        );

        // Refresh the page to show new data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error('Failed to create sample contract', {
          description: result.error || 'Unknown error occurred',
        });
      }
    } catch (error) {
      toast.error('Failed to create sample contract', {
        description: error instanceof Error ? error.message : 'Network error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCreateSampleData}
      disabled={isLoading}
      className='bg-blue-600 hover:bg-blue-700 text-white'
    >
      {isLoading ? (
        <>
          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          Creating...
        </>
      ) : (
        <>
          <Plus className='mr-2 h-4 w-4' />
          Add Sample Contract
        </>
      )}
    </Button>
  );
}
