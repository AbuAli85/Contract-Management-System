import { GetServerSideProps } from 'next';

/**
 * Legacy /admin — redirects to app route (Phase 3 cutover).
 * Uses 307 Temporary during burn-in.
 */
export const getServerSideProps: GetServerSideProps = async (context) => {
  const locale = context.req.headers['accept-language']?.includes('ar') ? 'ar' : 'en';
  return {
    redirect: {
      destination: `/${locale}/admin`,
      permanent: false, // 307 Temporary
    },
  };
};

export default function AdminRedirect() {
  return null;
}
