'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, FileText, Settings, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const STEPS = [
  { id: 1, title: 'Company Profile', icon: Building2, desc: 'Set up your company information' },
  { id: 2, title: 'Team Setup', icon: Users, desc: 'Invite your first team members' },
  { id: 3, title: 'Configure Modules', icon: Settings, desc: 'Choose which modules to activate' },
  { id: 4, title: 'Ready!', icon: CheckCircle, desc: 'Your platform is ready to use' },
];

const MODULES = [
  { id: 'hr', label: 'HR Management', desc: 'Employees, attendance, payroll, leave' },
  { id: 'crm', label: 'CRM', desc: 'Contacts, deals, pipeline' },
  { id: 'contracts', label: 'Contracts', desc: 'Contract generation and management' },
  { id: 'analytics', label: 'Analytics', desc: 'Reports and dashboards' },
  { id: 'tasks', label: 'Tasks & Targets', desc: 'Task management and KPIs' },
  { id: 'compliance', label: 'Compliance', desc: 'Work permits and regulatory docs' },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [company, setCompany] = useState({ name: '', name_ar: '', cr_number: '', industry: '', city: 'Muscat', country: 'Oman' });
  const [inviteEmails, setInviteEmails] = useState('');
  const [activeModules, setActiveModules] = useState<string[]>(['hr', 'contracts', 'analytics']);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  function toggleModule(id: string) {
    setActiveModules(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  }

  async function completeOnboarding() {
    setSaving(true);
    try {
      if (company.name) {
        await supabase.from('companies').upsert({ ...company, status: 'active' });
      }
      toast({ title: 'Welcome to SmartPRO!', description: 'Your platform is ready.' });
      router.push('/dashboard');
    } catch (e) {
      toast({ title: 'Error completing setup', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`flex items-center justify-center h-9 w-9 rounded-full text-sm font-semibold transition-all ${step >= s.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-400 border-2 border-gray-200'}`}>
                {step > s.id ? <CheckCircle className="h-5 w-5" /> : s.id}
              </div>
              {i < STEPS.length - 1 && <div className={`h-0.5 w-12 transition-all ${step > s.id ? 'bg-blue-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-3">
              {(() => { const S = STEPS[step-1]; return <div className="h-16 w-16 rounded-2xl bg-blue-100 flex items-center justify-center"><S.icon className="h-8 w-8 text-blue-600" /></div>; })()}
            </div>
            <CardTitle className="text-2xl">{STEPS[step-1].title}</CardTitle>
            <CardDescription>{STEPS[step-1].desc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <>
                <Input placeholder="Company name (English) *" value={company.name} onChange={e => setCompany(p => ({...p, name: e.target.value}))} />
                <Input placeholder="اسم الشركة (Arabic)" value={company.name_ar} onChange={e => setCompany(p => ({...p, name_ar: e.target.value}))} dir="rtl" />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="CR Number" value={company.cr_number} onChange={e => setCompany(p => ({...p, cr_number: e.target.value}))} />
                  <Input placeholder="Industry" value={company.industry} onChange={e => setCompany(p => ({...p, industry: e.target.value}))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="City" value={company.city} onChange={e => setCompany(p => ({...p, city: e.target.value}))} />
                  <Input placeholder="Country" value={company.country} onChange={e => setCompany(p => ({...p, country: e.target.value}))} />
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <p className="text-sm text-gray-600">Enter email addresses to invite (one per line). They'll receive an invitation to join your workspace.</p>
                <textarea className="w-full border rounded-lg p-3 text-sm h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="colleague@company.com&#10;manager@company.com" value={inviteEmails} onChange={e => setInviteEmails(e.target.value)} />
                <p className="text-xs text-gray-400">You can always invite more people later from Settings → Users</p>
              </>
            )}
            {step === 3 && (
              <div className="grid grid-cols-2 gap-3">
                {MODULES.map(m => (
                  <div key={m.id} onClick={() => toggleModule(m.id)} className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${activeModules.includes(m.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{m.label}</span>
                      {activeModules.includes(m.id) && <CheckCircle className="h-4 w-4 text-blue-600" />}
                    </div>
                    <p className="text-xs text-gray-500">{m.desc}</p>
                  </div>
                ))}
              </div>
            )}
            {step === 4 && (
              <div className="text-center py-4">
                <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <p className="text-gray-600 mb-4">Your SmartPRO Enterprise Platform is configured and ready. You have activated:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {activeModules.map(m => <Badge key={m} className="bg-blue-100 text-blue-800">{MODULES.find(mod => mod.id === m)?.label}</Badge>)}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              {step > 1 && <Button variant="outline" onClick={() => setStep(s => s-1)} className="gap-2"><ArrowLeft className="h-4 w-4" />Back</Button>}
              {step < 4 ? (
                <Button onClick={() => setStep(s => s+1)} disabled={step === 1 && !company.name} className="flex-1 gap-2">
                  Continue<ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={completeOnboarding} disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 gap-2">
                  {saving ? 'Setting up...' : 'Launch Platform'}<ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
