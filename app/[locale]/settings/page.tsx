import { Metadata } from 'next';
import { SettingsView } from '@/components/settings-view';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Application settings and configuration',
};

export default function SettingsPage() {
  return <SettingsView />;
}
