import { redirect } from 'next/navigation';

interface PromoterManagementProps {
  params: Promise<{ locale: string }>;
}

export default async function PromoterManagement({
  params,
}: PromoterManagementProps) {
  const { locale } = await params;
  redirect(`/${locale}/promoters`);
}

export const dynamic = 'force-dynamic';
