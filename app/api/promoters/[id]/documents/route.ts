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
      .from('promoter_documents')
      .select('*')
      .eq('promoter_id', id);

    if (error) {
      console.error('Error fetching documents:', error);
      return NextResponse.json({ documents: [] }, { status: 200 });
    }

    return NextResponse.json({ documents: data || [] }, { status: 200 });
  } catch (error) {
    console.error('Documents API error:', error);
    return NextResponse.json({ documents: [] }, { status: 200 });
  }
}
