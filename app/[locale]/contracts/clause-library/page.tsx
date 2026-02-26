import { ClauseLibraryManager } from '@/components/contracts/clause-library/clause-library-manager';

export const metadata = {
  title: 'Clause Library | SmartPRO',
  description: 'Manage reusable legal clauses for your contracts',
};

export default function ClauseLibraryPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <ClauseLibraryManager />
    </div>
  );
}
