// Party details page to fix 404s for /[locale]/manage-parties/[id]
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, Phone, Users, Building2, FileText, MapPin } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PartyDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;

  if (!id || typeof id !== 'string') {
    return notFound();
  }

  try {
    const supabase = await createClient();

    // Fetch party
    const { data: party, error } = await supabase
      .from('parties')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !party) {
      return notFound();
    }

    // Fetch recent contracts where this party is involved
    const { data: contracts } = await supabase
      .from('contracts')
      .select(
        'id, contract_number, status, created_at, first_party_id, second_party_id'
      )
      .or(`first_party_id.eq.${id},second_party_id.eq.${id}`)
      .order('created_at', { ascending: false })
      .limit(10);

    return (
      <div className='min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:py-12'>
        <div className='mx-auto max-w-5xl space-y-6'>
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle className='flex items-center gap-2'>
                  <Building2 className='h-5 w-5' />
                  {party.name_en}
                </CardTitle>
                <Badge variant='outline'>{party.type ?? 'Unknown'}</Badge>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='text-sm text-muted-foreground' dir='rtl'>
                {party.name_ar}
              </div>
              <Separator />
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <div className='flex items-center gap-2 text-sm'>
                    <Users className='h-4 w-4' />
                    <span>CRN: {party.crn || 'N/A'}</span>
                  </div>
                  <div className='flex items-center gap-2 text-sm'>
                    <FileText className='h-4 w-4' />
                    <span>Tax Number: {party.tax_number || 'N/A'}</span>
                  </div>
                  <div className='flex items-center gap-2 text-sm'>
                    <FileText className='h-4 w-4' />
                    <span>License Number: {party.license_number || 'N/A'}</span>
                  </div>
                </div>
                <div className='space-y-2'>
                  {party.contact_email && (
                    <div className='flex items-center gap-2 text-sm'>
                      <Mail className='h-4 w-4' />
                      <span>{party.contact_email}</span>
                    </div>
                  )}
                  {party.contact_phone && (
                    <div className='flex items-center gap-2 text-sm'>
                      <Phone className='h-4 w-4' />
                      <span>{party.contact_phone}</span>
                    </div>
                  )}
                  {party.address_en && (
                    <div className='flex items-start gap-2 text-sm'>
                      <MapPin className='mt-0.5 h-4 w-4' />
                      <span>{party.address_en}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {(contracts?.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Contracts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2 text-sm'>
                  {contracts!.map(c => (
                    <div
                      key={c.id}
                      className='flex items-center justify-between rounded border p-2'
                    >
                      <div>
                        <div className='font-medium'>
                          {c.contract_number ?? c.id}
                        </div>
                        <div className='text-muted-foreground text-xs'>
                          Status: {c.status ?? 'unknown'}
                        </div>
                      </div>
                      <Badge variant='secondary'>Contract</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  } catch {
    return notFound();
  }
}
