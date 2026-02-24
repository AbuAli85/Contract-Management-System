import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ensureUserProfile } from '@/lib/ensure-user-profile';
import { NextRequest } from 'next/server';

// Handle OAuth callback (GET request)
export async function GET(request: NextRequest) {
  const { searchParams, _origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/en/dashboard';

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        try {
          await ensureUserProfile(user);
        } catch (error) {
          console.error(`[AuthCallback] Failed to ensure user profile:`, error);
        }
      }
      const forwardedHost = request.headers.get('x-forwarded-host');
      const forwardedProto = request.headers.get('x-forwarded-proto');
      const host = forwardedHost || request.headers.get('host');
      const protocol =
        forwardedProto || (host?.includes('localhost') ? 'http' : 'https');
      const baseUrl = `${protocol}://${host}`;

      return Response.redirect(`${baseUrl}${next}`);
    }
  }

  // Return the user to an error page with instructions
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const host = forwardedHost || request.headers.get('host');
  const protocol =
    forwardedProto || (host?.includes('localhost') ? 'http' : 'https');
  const baseUrl = `${protocol}://${host}`;

  return Response.redirect(`${baseUrl}/en/auth/login?error=auth_failed`);
}

// Legacy POST method for backward compatibility
export async function POST(_req: Request) {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    try {
      await ensureUserProfile(user);
    } catch (error) {
      // Log the error but don't block the user flow
      console.error(
        `[AuthCallback] Failed to ensure user profile, but continuing:`,
        error
      );
    }
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/dashboard', // Redirect to a protected route
    },
  });
}
