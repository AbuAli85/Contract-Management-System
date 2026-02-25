import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: any) {
            try {
              cookiesToSet.forEach(({ name, value, ...options }: any) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Ignore set errors in server components
            }
          },
        } as any,
      }
    );

    const { data, error } = await supabase
      .from('promoter_skills')
      .select('*')
      .eq('promoter_id', id);

    if (error) {
      return NextResponse.json({ skills: [] }, { status: 200 });
    }

    return NextResponse.json({ skills: data || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ skills: [] }, { status: 200 });
  }
}
