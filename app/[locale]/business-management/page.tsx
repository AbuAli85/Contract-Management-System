'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, FileText, BarChart3, Settings, Zap, Shield, Globe, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const MODULES = [
  { title: 'Human Resources', desc: 'Employees, payroll, attendance, leave, performance', icon: Users, href: '/hr', color: 'bg-blue-50 text-blue-600', badge: 'Core' },
  { title: 'CRM', desc: 'Clients, contacts, deals, pipeline management', icon: Building2, href: '/crm', color: 'bg-green-50 text-green-600', badge: 'Core' },
  { title: 'Contracts', desc: 'Contract generation, approval, and lifecycle', icon: FileText, href: '/contracts', color: 'bg-purple-50 text-purple-600', badge: 'Core' },
  { title: 'Analytics & Reports', desc: 'Dashboards, KPIs, custom reports, exports', icon: BarChart3, href: '/analytics', color: 'bg-orange-50 text-orange-600', badge: 'Core' },
  { title: 'Workflow Automation', desc: 'Smart triggers, automated actions, integrations', icon: Zap, href: '/workflow', color: 'bg-yellow-50 text-yellow-600', badge: 'Smart' },
  { title: 'Compliance', desc: 'Work permits, regulatory documents, renewals', icon: Shield, href: '/compliance', color: 'bg-red-50 text-red-600', badge: 'Regulatory' },
  { title: 'Companies', desc: 'Multi-company management and registration', icon: Globe, href: '/companies', color: 'bg-teal-50 text-teal-600', badge: 'Admin' },
  { title: 'Platform Settings', desc: 'Users, roles, permissions, system configuration', icon: Settings, href: '/settings', color: 'bg-gray-50 text-gray-600', badge: 'Admin' },
];

export default function BusinessManagementPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">Business Management</h1>
        <p className="text-gray-500 mt-2">Your complete enterprise operations hub — manage every aspect of your business from one place</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {MODULES.map(m => (
          <Link key={m.title} href={m.href}>
            <Card className="h-full hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-blue-200">
              <CardContent className="pt-6 pb-4">
                <div className={`inline-flex p-3 rounded-xl ${m.color} mb-4 group-hover:scale-110 transition-transform`}>
                  <m.icon className="h-6 w-6" />
                </div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{m.title}</h3>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors mt-0.5" />
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{m.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
