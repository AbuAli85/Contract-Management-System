import { redirect } from 'next/navigation';

// Redirect /contracts/new to the correct generate-contract route
export default function ContractsNewPage({
  params,
}: {
  params: { locale: string };
}) {
  // Redirect to the correct generate contract page
  redirect(`/${params.locale}/generate-contract`);
}
