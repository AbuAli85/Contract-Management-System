// Session timeout configuration
export const SESSION_CONFIG = {
  // Default timeout settings
  DEFAULT_TIMEOUT_MINUTES: 5,
  DEFAULT_WARNING_MINUTES: 1,

  // Different timeout settings for different user roles
  ROLE_TIMEOUTS: {
    admin: {
      timeoutMinutes: 10,
      warningMinutes: 2,
    },
    manager: {
      timeoutMinutes: 8,
      warningMinutes: 2,
    },
    user: {
      timeoutMinutes: 5,
      warningMinutes: 1,
    },
    guest: {
      timeoutMinutes: 3,
      warningMinutes: 1,
    },
  },

  // Activity events to monitor
  ACTIVITY_EVENTS: [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click',
    'focus',
    'input',
    'change',
  ],

  // Pages where session timeout should be disabled
  DISABLED_PAGES: ['/login', '/signup', '/forgot-password', '/reset-password'],

  // Warning message templates
  MESSAGES: {
    warning: (minutes: number) =>
      `Your session will expire in ${minutes} minute${minutes > 1 ? 's' : ''}. Click anywhere to extend your session.`,
    expired: 'You have been automatically logged out due to inactivity.',
    extended: 'Your session has been extended.',
  },
};

// Get timeout settings based on user role
export function getTimeoutSettings(userRole?: string) {
  const role = userRole || 'user';
  return (
    SESSION_CONFIG.ROLE_TIMEOUTS[
      role as keyof typeof SESSION_CONFIG.ROLE_TIMEOUTS
    ] || SESSION_CONFIG.ROLE_TIMEOUTS.user
  );
}

// Check if session timeout should be enabled for current page
export function shouldEnableSessionTimeout(pathname: string): boolean {
  return !SESSION_CONFIG.DISABLED_PAGES.some(page => pathname.includes(page));
}
