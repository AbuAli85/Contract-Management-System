'use client';

import { useEffect, useState } from 'react';
import { useRouter , useParams} from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ForcePasswordChange } from '@/components/auth/force-password-change';

export default function ChangePasswordPage() {
  const params = useParams();
  const locale = (params?.locale as string) || \'en\';
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [mustChange, setMustChange] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/${locale}/auth/login`);
        return;
      }

      setEmail(user.email || '');

      // Check if user must change password
      const mustChangePassword =
        user.user_metadata?.must_change_password === true;

      if (!mustChangePassword) {
        // Also check profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('must_change_password')
          .eq('id', user.id)
          .single();

        if (!profile?.must_change_password) {
          // No need to change password, redirect to dashboard
          router.push(`/${locale}/dashboard`);
          return;
        }
      }

      setMustChange(true);
      setLoading(false);
    };

    checkUser();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-white'></div>
      </div>
    );
  }

  if (!mustChange) {
    return null;
  }

  return <ForcePasswordChange userEmail={email} />;
}
