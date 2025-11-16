import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className='flex h-[calc(100vh-150px)] items-center justify-center'>
      <Loader2 className='h-12 w-12 animate-spin text-primary' />
      <p className='ml-4 text-lg'>Loading verification tool...</p>
    </div>
  );
}









