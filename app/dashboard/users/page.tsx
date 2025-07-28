import { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load the main component
const NewUsersPage = lazy(() => import('./NewUsersPage'));

// Loading fallback
function UsersPageLoading() {
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions.
          </p>
        </div>
      </div>
      <div className="border rounded-lg bg-card text-card-foreground shadow-sm">
        <div className="p-6 pt-6">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin mr-2" /> Loading user management...
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<UsersPageLoading />}>
      <NewUsersPage />
    </Suspense>
  );
} 
