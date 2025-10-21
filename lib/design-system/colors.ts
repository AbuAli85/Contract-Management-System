/**
 * Semantic Color System
 * 
 * Provides consistent, meaningful colors across the application.
 * Each color has a specific semantic meaning to improve usability.
 */

export const SEMANTIC_COLORS = {
  // Critical/Error States - Use for errors, expired items, critical alerts
  critical: {
    background: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: 'text-red-600',
    badge: 'bg-red-100 text-red-800',
    button: 'bg-red-600 hover:bg-red-700 text-white',
    outline: 'border-red-200 text-red-700 hover:bg-red-50'
  },
  
  // Warning/Attention States - Use for items expiring soon, attention needed
  warning: {
    background: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-800',
    button: 'bg-amber-600 hover:bg-amber-700 text-white',
    outline: 'border-amber-200 text-amber-700 hover:bg-amber-50'
  },
  
  // Success/Active States - Use for valid items, active status, success
  success: {
    background: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    icon: 'text-green-600',
    badge: 'bg-green-100 text-green-800',
    button: 'bg-green-600 hover:bg-green-700 text-white',
    outline: 'border-green-200 text-green-700 hover:bg-green-50'
  },
  
  // Information/Primary Actions - Use for info, primary actions, navigation
  info: {
    background: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-800',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    outline: 'border-blue-200 text-blue-700 hover:bg-blue-50'
  },
  
  // Neutral/Inactive States - Use for inactive, disabled, neutral info
  neutral: {
    background: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
    icon: 'text-gray-600',
    badge: 'bg-gray-100 text-gray-800',
    button: 'bg-gray-600 hover:bg-gray-700 text-white',
    outline: 'border-gray-200 text-gray-700 hover:bg-gray-50'
  }
} as const;

export type SemanticColor = keyof typeof SEMANTIC_COLORS;

/**
 * Status-specific color mappings
 * Maps application statuses to semantic colors
 */
export const STATUS_COLORS = {
  // Document statuses
  document: {
    valid: 'success',
    expiring: 'warning', 
    expired: 'critical',
    missing: 'neutral'
  },
  
  // Overall statuses
  overall: {
    active: 'success',
    warning: 'warning',
    critical: 'critical', 
    inactive: 'neutral'
  },
  
  // Notification types
  notification: {
    error: 'critical',
    warning: 'warning',
    success: 'success',
    info: 'info',
    neutral: 'neutral'
  },
  
  // Action types
  action: {
    primary: 'info',
    success: 'success',
    warning: 'warning',
    danger: 'critical',
    neutral: 'neutral'
  }
} as const;

/**
 * Get semantic color for a specific status
 */
export function getStatusColor(
  category: keyof typeof STATUS_COLORS,
  status: string
): SemanticColor {
  const categoryColors = STATUS_COLORS[category];
  return (categoryColors as any)[status] || 'neutral';
}

/**
 * Get full color object for a semantic color
 */
export function getColorObject(color: SemanticColor) {
  return SEMANTIC_COLORS[color];
}

/**
 * Get color classes for a specific element type
 */
export function getColorClasses(
  color: SemanticColor,
  element: 'badge' | 'button' | 'outline' | 'background' | 'text' | 'icon' | 'border'
) {
  return SEMANTIC_COLORS[color][element];
}
