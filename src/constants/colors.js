// ============================================
// 1. PRIMARY COLOR SYSTEM
// ============================================
export const primary = {
  // Core brand colors - Professional blue palette
  navy: '#1E293B',
  denim: '#2C3E66',
  cobalt: '#2C5282',
  ocean: '#3182CE',
  sky: '#63B3ED',
  
  // Supporting neutral palette
  slate: '#4A5568',
  gray: '#718096',
  mist: '#E2E8F0',
  white: '#FFFFFF',
  offWhite: '#F7FAFC'
};

// ============================================
// 2. SEMANTIC COLOR SYSTEM
// ============================================
export const semantic = {
  success: {
    primary: '#059669',
    light: '#D1FAE5',
    dark: '#065F46',
    accent: '#10B981'
  },
  warning: {
    primary: '#D97706',
    light: '#FEF3C7',
    dark: '#B45309',
    accent: '#F59E0B'
  },
  danger: {
    primary: '#DC2626',
    light: '#FEE2E2',
    dark: '#B91C1C',
    accent: '#EF4444'
  },
  info: {
    primary: '#3B82F6',
    light: '#DBEAFE',
    dark: '#1E40AF',
    accent: '#60A5FA'
  },
  neutral: {
    primary: '#6B7280',
    light: '#F3F4F6',
    dark: '#374151',
    accent: '#9CA3AF'
  }
};

// ============================================
// 3. CHART & DATA VISUALIZATION COLORS
// ============================================
export const chartColors = {
  shipment: {
    inTransit: semantic.info.primary,
    pending: semantic.warning.primary,
    delivered: semantic.success.primary,
    cancelled: semantic.danger.primary
  },
  truck: {
    onRoad: semantic.success.primary,
    available: semantic.info.primary,
    maintenance: semantic.warning.primary,
    inactive: semantic.neutral.primary,
    reserved: '#8B5CF6'
  },
   notification: {
    high: '#F97316',      // Orange for high severity
    medium: '#F59E0B',    // Yellow for medium severity  
    low: '#3B82F6',       // Blue for low severity
    critical: '#DC2626',  // Red for critical
    info: '#10B981'       // Green for info
  },
  device: {
    online: semantic.success.primary,
    offline: semantic.neutral.primary,
    lowBattery: semantic.warning.primary,
    charging: '#8B5CF6',
    error: semantic.danger.primary
  },
  performance: {
    high: '#10B981',
    medium: '#F59E0B',
    low: '#EF4444',
    target: '#3B82F6'
  }
};

// ============================================
// 4. STATUS BADGE STYLES (Tailwind classes)
// ============================================
export const statusBadges = {
  shipment: {
    in_transit: 'bg-blue-50 text-blue-700 border border-blue-200',
    pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    delivered: 'bg-green-50 text-green-700 border border-green-200',
    cancelled: 'bg-red-50 text-red-700 border border-red-200',
    on_hold: 'bg-gray-50 text-gray-700 border border-gray-200'
  },
  alert: {
    critical: 'bg-red-50 text-red-700 border border-red-200',
    high: 'bg-orange-50 text-orange-700 border border-orange-200',
    medium: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    low: 'bg-blue-50 text-blue-700 border border-blue-200',
    info: 'bg-green-50 text-green-700 border border-green-200'
  },
  truck: {
    on_road: 'bg-green-100 text-green-800 border border-green-200',
    available: 'bg-blue-100 text-blue-800 border border-blue-200',
    maintenance: 'bg-orange-100 text-orange-800 border border-orange-200',
    inactive: 'bg-gray-100 text-gray-800 border border-gray-200',
    reserved: 'bg-purple-100 text-purple-800 border border-purple-200'
  },
  driver: {
    active: 'bg-green-100 text-green-800 border border-green-200',
    on_break: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    off_duty: 'bg-gray-100 text-gray-800 border border-gray-200',
    unavailable: 'bg-red-100 text-red-800 border border-red-200'
  }
};

// ============================================
// 5. ACTION BUTTON GRADIENTS
// ============================================
export const actionGradients = {
  shipments: 'from-blue-600 to-blue-700',
  fleet: 'from-purple-600 to-purple-700',
  map: 'from-green-600 to-green-700',
  alerts: 'from-red-600 to-red-700',
  reports: 'from-indigo-600 to-indigo-700',
  settings: 'from-gray-600 to-gray-700',
  drivers: 'from-teal-600 to-teal-700',
  analytics: 'from-pink-600 to-pink-700'
};

// ============================================
// 6. ICON COLOR MAPPINGS
// ============================================
export const iconColors = {
  background: {
    blue: 'bg-blue-100',
    purple: 'bg-purple-100',
    green: 'bg-green-100',
    red: 'bg-red-100',
    yellow: 'bg-yellow-100',
    orange: 'bg-orange-100',
    indigo: 'bg-indigo-100',
    teal: 'bg-teal-100',
    pink: 'bg-pink-100',
    gray: 'bg-gray-100'
  },
  text: {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    orange: 'text-orange-600',
    indigo: 'text-indigo-600',
    teal: 'text-teal-600',
    pink: 'text-pink-600',
    gray: 'text-gray-600'
  }
};

// ============================================
// 7. MAP MARKER COLORS
// ============================================
export const mapMarkers = {
  on_road: '#10B981',
  available: '#3B82F6',
  maintenance: '#F59E0B',
  inactive: '#9CA3AF',
  emergency: '#EF4444',
  stopped: '#6B7280',
  speeding: '#F97316'
};

// ============================================
// 8. STAT CARD COLOR MAPPINGS
// ============================================
export const statCardColors = {
  inTransit: 'blue',
  delivered: 'green',
  pending: 'yellow',
  cancelled: 'red',
  availableTrucks: 'green',
  onRoadTrucks: 'blue',
  fleetUtilization: 'purple',
  liveTelemetry: 'indigo',
  maintenanceDue: 'orange',
  fuelEfficiency: 'teal',
  activeDrivers: 'green',
  onBreakDrivers: 'yellow',
  totalDrivers: 'purple',
  onTimeDelivery: 'green',
  customerSatisfaction: 'teal',
  costPerMile: 'orange',
  revenue: 'emerald',
  activeAlerts: 'red',
  criticalAlerts: 'red',
  trucksInMaintenance: 'orange',
  totalShipments: 'purple',
  todaysDeliveries: 'green'
};

// ============================================
// 9. BACKGROUND & SURFACE COLORS
// ============================================
export const surfaces = {
  page: primary.offWhite,
  card: primary.white,
  cardHover: '#F9FAFB',
  modal: primary.white,
  dropdown: primary.white,
  sidebar: primary.navy,
  header: primary.white,
  footer: primary.white,
  dark: {
    page: '#0F172A',
    card: '#1E293B',
    sidebar: '#0F172A',
    header: '#1E293B'
  }
};

// ============================================
// 10. TEXT COLORS
// ============================================
export const textColors = {
  primary: primary.navy,
  secondary: primary.slate,
  tertiary: primary.gray,
  disabled: '#CBD5E0',
  success: semantic.success.primary,
  warning: semantic.warning.primary,
  danger: semantic.danger.primary,
  info: semantic.info.primary,
  light: {
    primary: '#F7FAFC',
    secondary: '#E2E8F0',
    tertiary: '#CBD5E0'
  }
};

// ============================================
// 11. BORDER COLORS
// ============================================
export const borders = {
  light: '#E2E8F0',
  medium: '#CBD5E0',
  dark: '#A0AEC0',
  focus: semantic.info.primary,
  error: semantic.danger.primary,
  success: semantic.success.primary
};

// ============================================
// 12. HELPER FUNCTIONS
// ============================================

// Get status badge with optional size variant
export const getStatusBadge = (status, type = 'shipment', size = 'md') => {
  const baseClass = statusBadges[type]?.[status] || 'bg-gray-100 text-gray-700 border border-gray-200';
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base'
  };
  return `${baseClass} rounded-full font-medium ${sizeClasses[size]}`;
};

// Get status text with proper formatting
export const getStatusText = (status) => {
  const texts = {
    'in_transit': 'In Transit',
    'pending': 'Pending',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
    'on_hold': 'On Hold',
    'on_road': 'On Road',
    'available': 'Available',
    'maintenance': 'Maintenance',
    'inactive': 'Inactive',
    'reserved': 'Reserved',
    'active': 'Active',
    'on_break': 'On Break',
    'off_duty': 'Off Duty',
    'unavailable': 'Unavailable'
  };
  return texts[status] || status?.replace(/_/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
};

// Get alert badge with severity level
export const getAlertBadge = (severity) => {
  const badges = {
    critical: 'bg-red-50 text-red-700 border border-red-200',
    high: 'bg-orange-50 text-orange-700 border border-orange-200',
    medium: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    low: 'bg-blue-50 text-blue-700 border border-blue-200',
    info: 'bg-green-50 text-green-700 border border-green-200'
  };
  return badges[severity] || 'bg-gray-50 text-gray-700 border border-gray-200';
};

// Get marker color for map
export const getMarkerColor = (status) => {
  return mapMarkers[status] || mapMarkers.inactive;
};

// Get stat card color
export const getStatCardColor = (statKey, priority = 'normal') => {
  const baseColor = statCardColors[statKey] || 'blue';
  
  if (priority === 'high') return 'red';
  if (priority === 'warning') return 'yellow';
  if (priority === 'success') return 'green';
  
  return baseColor;
};

// Get icon background and text colors
export const getIconColors = (color) => {
  return {
    bg: iconColors.background[color] || 'bg-gray-100',
    text: iconColors.text[color] || 'text-gray-600'
  };
};

// Get gradient for actions
export const getActionGradient = (action) => {
  return actionGradients[action] || 'from-gray-600 to-gray-700';
};

// Get chart color by category and status
export const getChartColor = (category, status) => {
  if (chartColors[category] && chartColors[category][status]) {
    return chartColors[category][status];
  }
  return semantic.info.primary;
};

// Color contrast checker helper
export const isAccessible = (hexColor) => {
  const rgb = parseInt(hexColor.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? 'light' : 'dark';
};

// ============================================
// 13. BACKWARD COMPATIBILITY EXPORTS
// ============================================

// For backward compatibility with existing code that expects COLORS export
export const COLORS = {
  PRIMARY: {
    BLUE: semantic.info.primary,
    GREEN: semantic.success.primary,
    ORANGE: semantic.warning.primary,
    RED: semantic.danger.primary,
    PURPLE: '#8B5CF6',
    INDIGO: '#6366F1',
    YELLOW: '#F59E0B',
    LIGHT_BLUE: '#82C3D9'
  },
  SEMANTIC: {
    SUCCESS: semantic.success.primary,
    WARNING: semantic.warning.primary,
    ERROR: semantic.danger.primary,
    INFO: semantic.info.primary,
    NEUTRAL: semantic.neutral.primary
  },
  chart: {
    shipment: chartColors.shipment,
    truck: chartColors.truck,
    alert: chartColors.alert,
    device: chartColors.device
  }
};

// Backward compatibility for iconTextColors
export const iconTextColors = {
  blue: 'text-blue-500',
  purple: 'text-purple-500',
  green: 'text-green-500',
  red: 'text-red-500',
  yellow: 'text-yellow-500',
  orange: 'text-orange-500',
  indigo: 'text-indigo-500',
  teal: 'text-teal-500',
  pink: 'text-pink-500',
  gray: 'text-gray-500'
};

// Backward compatibility for statusColors
export const statusColors = {
  shipment: {
    in_transit: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  },
  alert: {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800'
  },
  truck: {
    on_road: 'bg-green-500',
    available: 'bg-blue-500',
    maintenance: 'bg-orange-500',
    inactive: 'bg-gray-500'
  }
};

// Backward compatibility for actionGradientsLegacy
export const actionGradientsLegacy = {
  shipments: 'from-blue-500 to-blue-600',
  fleet: 'from-purple-500 to-purple-600',
  map: 'from-green-500 to-green-600',
  alerts: 'from-red-500 to-red-600'
};

// Legacy getStatusBadge for backward compatibility
export const getStatusBadgeLegacy = (status, type = 'shipment') => {
  const legacyColors = {
    shipment: {
      in_transit: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    },
    alert: {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800'
    }
  };
  return legacyColors[type]?.[status] || 'bg-gray-100 text-gray-800';
};

// ============================================
// 14. DEFAULT EXPORT
// ============================================
export default {
  primary,
  semantic,
  chartColors,
  statusBadges,
  actionGradients,
  iconColors,
  iconTextColors,
  statusColors,
  mapMarkers,
  statCardColors,
  surfaces,
  textColors,
  borders,
  COLORS,
  // Helper functions
  getStatusBadge,
  getStatusText,
  getAlertBadge,
  getMarkerColor,
  getStatCardColor,
  getIconColors,
  getActionGradient,
  getChartColor,
  isAccessible,
  // Legacy helpers
  getStatusBadgeLegacy,
  actionGradientsLegacy
};
