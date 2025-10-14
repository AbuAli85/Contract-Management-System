import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle, Mail, Phone, BookOpen } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Help & Support | Promoter Management System',
  description: 'Get help and support for the Promoter Management System',
};

export default function HelpPage({ params }: { params: { locale: string } }) {
  const { locale } = params;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {locale === 'ar' ? 'المساعدة والدعم' : 'Help & Support'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {locale === 'ar'
            ? 'احصل على المساعدة والدعم لنظام إدارة المروجين'
            : 'Get help and support for the Promoter Management System'}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              {locale === 'ar' ? 'البدء السريع' : 'Quick Start'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h3 className="font-semibold mb-2">
                {locale === 'ar' ? 'إدارة المروجين' : 'Managing Promoters'}
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {locale === 'ar' ? 'عرض جميع المروجين' : 'View all promoters'}</li>
                <li>• {locale === 'ar' ? 'إضافة مروج جديد' : 'Add new promoter'}</li>
                <li>• {locale === 'ar' ? 'تتبع انتهاء المستندات' : 'Track document expiry'}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                {locale === 'ar' ? 'إدارة العقود' : 'Managing Contracts'}
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {locale === 'ar' ? 'إنشاء عقد جديد' : 'Generate new contract'}</li>
                <li>• {locale === 'ar' ? 'الموافقة على العقود' : 'Approve contracts'}</li>
                <li>• {locale === 'ar' ? 'تنزيل PDF' : 'Download PDF'}</li>
              </ul>
            </div>
            <Link href={`/${locale}/dashboard`}>
              <Button variant="outline" className="w-full mt-4">
                {locale === 'ar' ? 'العودة إلى لوحة التحكم' : 'Back to Dashboard'}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="mr-2 h-5 w-5" />
              {locale === 'ar' ? 'اتصل بنا' : 'Contact Us'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">
                {locale === 'ar' ? 'البريد الإلكتروني' : 'Email Support'}
              </h3>
              <p className="text-sm text-muted-foreground">
                support@thesmartpro.io
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">
                {locale === 'ar' ? 'الهاتف' : 'Phone Support'}
              </h3>
              <p className="text-sm text-muted-foreground">
                +968 95 153 930
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">
                {locale === 'ar' ? 'ساعات العمل' : 'Business Hours'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {locale === 'ar'
                  ? 'الأحد - الخميس: 8:00 صباحاً - 5:00 مساءً'
                  : 'Sunday - Thursday: 8:00 AM - 5:00 PM'}
              </p>
            </div>
            <Button className="w-full" asChild>
              <a href="mailto:support@thesmartpro.io">
                <Mail className="mr-2 h-4 w-4" />
                {locale === 'ar' ? 'أرسل رسالة' : 'Send Email'}
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {locale === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">
              {locale === 'ar'
                ? 'كيف أضيف مروج جديد؟'
                : 'How do I add a new promoter?'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {locale === 'ar'
                ? 'انتقل إلى "إدارة المروجين" واضغط على زر "إضافة مروج جديد".'
                : 'Go to "Manage Promoters" and click the "Add New Promoter" button.'}
            </p>
          </div>
          <div>
            <h3 className="font-semibold">
              {locale === 'ar'
                ? 'كيف أنشئ عقد جديد؟'
                : 'How do I generate a new contract?'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {locale === 'ar'
                ? 'انتقل إلى "إنشاء عقد" من القائمة الجانبية واملأ النموذج المطلوب.'
                : 'Navigate to "Generate Contract" from the sidebar and fill out the required form.'}
            </p>
          </div>
          <div>
            <h3 className="font-semibold">
              {locale === 'ar'
                ? 'كيف أوافق على العقود؟'
                : 'How do I approve contracts?'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {locale === 'ar'
                ? 'انتقل إلى "العقود المعلقة" واضغط على زر "موافقة" للعقد المطلوب.'
                : 'Go to "Pending Contracts" and click the "Approve" button for the desired contract.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

