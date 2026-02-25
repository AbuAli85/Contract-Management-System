// Environment variable validation utility
export const validateEnvironment = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isBuildTime = typeof window === 'undefined';
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isBuildTime) {
      return { isValid: false, isBuildTime: true };
    }

    if (isDevelopment) {
      return { isValid: false, isDevelopment: true };
    }

    return { isValid: false, isProduction: true };
  }

  return { isValid: true };
};

export const getEnvironmentInfo = () => {
  const { isValid, isBuildTime, isDevelopment, isProduction } =
    validateEnvironment();

  return {
    isValid,
    isBuildTime: isBuildTime || false,
    isDevelopment: isDevelopment || false,
    isProduction: isProduction || false,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
};
