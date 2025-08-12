import { ProviderProfile } from '@/components/marketplace/provider-profile';

interface ProviderPageProps {
  params: {
    id: string;
  };
}

export default function ProviderPage({ params }: ProviderPageProps) {
  return <ProviderProfile providerId={params.id} />;
}
