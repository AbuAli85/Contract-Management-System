import type { Metadata } from 'next';
import { TrackingDashboard } from '@/components/advanced/tracking-dashboard';

export const metadata: Metadata = {
  title: 'Tracking Dashboard | Contract Management System',
  description: 'Real-time project and delivery tracking system',
};

export default function TrackingPage() {
  return <TrackingDashboard />;
}
