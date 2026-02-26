import { PipelineBoard } from '@/components/crm/pipeline-board';

export const metadata = {
  title: 'Sales Pipeline | SmartPRO CRM',
  description: 'Track deals and manage your sales pipeline',
};

export default function PipelinePage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-full">
      <PipelineBoard />
    </div>
  );
}
