// Design system constants
export const DESIGN_SYSTEM = {
  COLORS: {
    PRIMARY_BLUE: '#2563eb',
    PRIMARY_BLUE_LIGHT: '#3b82f6',
    PRIMARY_BLUE_DARK: '#1e40af',
    SUCCESS_GREEN: '#10b981',
    WARNING_AMBER: '#f59e0b',
    ERROR_RED: '#ef4444',
    GRAY_50: '#f9fafb',
    GRAY_100: '#f3f4f6',
    GRAY_200: '#e5e7eb',
    GRAY_300: '#d1d5db',
    GRAY_500: '#6b7280',
    GRAY_700: '#374151',
    GRAY_900: '#111827',
    WHITE: '#ffffff',
  },
  TYPOGRAPHY: {
    DISPLAY: 'display',
    HEADING_1: 'heading-1',
    HEADING_2: 'heading-2',
    BODY_LARGE: 'body-large',
    BODY: 'body',
    SMALL: 'small',
  },
  SPACING: {
    SECTION: '24px',
    COMPACT: '12px',
    STANDARD: '16px',
    SPACIOUS: '24px',
  },
  ANIMATION: {
    MICRO: '150ms',
    PANEL: '200ms',
    PAGE: '300ms',
  },
} as const;

// App constants
export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  APP: {
    HOME: '/app/home',
    DASHBOARD: '/app/dashboard',
    CLIENTS: '/app/clients',
    JOBS: '/app/jobs',
    ABOUT: '/app/about',
    PAYMENT: '/app/payment',
    CONTACT: '/app/contact',
    ACCOUNT: '/app/account',
  },
} as const;