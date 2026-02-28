import { GetServerSideProps } from 'next';
import { getRedirectLocale } from '@/lib/locale-constants';

/**
 * Legacy /not-authorized — redirects to app route (Phase 3 cutover).
 * Uses 307 Temporary during burn-in.
 */
export const getServerSideProps: GetServerSideProps = async (context) => {
  const locale = getRedirectLocale(context.req);
  return {
    redirect: {
      destination: `/${locale}/auth/unauthorized`,
      permanent: false, // 307 Temporary
    },
  };
};

export default function NotAuthorizedRedirect() {
  return null;
}
