// ============================================
// BRAND COLORS — single source of truth
// ============================================
const BRAND = {
  orange:    '#F29F67',
  navy:      '#1E1E2C',
  gold:      '#E0B50F',
  teal:      '#34B1AA',
  blue:      '#3B8FF3',
  // Neutrals (not brand, but required for UI)
  gray:      '#9CA3AF',
  lightGray: '#F3F4F6',
  white:     '#FFFFFF',
  offWhite:  '#F7FAFC',
};

// ============================================
// 1. PRIMARY COLOR SYSTEM
// ============================================
export const primary = {
  navy:     BRAND.navy,
  teal:     BRAND.teal,
  blue:     BRAND.blue,
  gold:     BRAND.gold,
  orange:   BRAND.orange,
  gray:     BRAND.gray,
  white:    BRAND.white,
  offWhite: BRAND.offWhite,
};

// ============================================
// 2. SEMANTIC COLOR SYSTEM
// ============================================
export const semantic = {
  success: {
    primary: BRAND.teal,
    light:   '#E8F8F7',
    dark:    '#1A6B67',
    accent:  BRAND.teal,
  },
  warning: {
    primary: BRAND.gold,
    light:   '#FBF5D0',
    dark:    '#A07D09',
    accent:  BRAND.gold,
  },
  danger: {
    primary: BRAND.orange,
    light:   '#FEF0E7',
    dark:    '#C06A35',
    accent:  BRAND.orange,
  },
  info: {
    primary: BRAND.blue,
    light:   '#E6F0FD',
    dark:    '#1A5BB5',
    accent:  BRAND.blue,
  },
  neutral: {
    primary: BRAND.gray,
    light:   BRAND.lightGray,
    dark:    '#374151',
    accent:  BRAND.gray,
  },
};

// ============================================
// 3. CHART & DATA VISUALIZATION COLORS
// ============================================
export const chartColors = {
  shipment: {
    inTransit: BRAND.blue,
    pending:   BRAND.gold,
    delivered: BRAND.teal,
    cancelled: BRAND.orange,
  },
  truck: {
    onRoad:      BRAND.teal,
    available:   BRAND.blue,
    maintenance: BRAND.orange,
    inactive:    BRAND.gray,
    reserved:    BRAND.gold,
  },
  notification: {
    high:     BRAND.orange,
    medium:   BRAND.gold,
    low:      BRAND.blue,
    critical: BRAND.orange,
    info:     BRAND.teal,
  },
  device: {
    online:     BRAND.teal,
    offline:    BRAND.gray,
    lowBattery: BRAND.gold,
    charging:   BRAND.blue,
    error:      BRAND.orange,
  },
  performance: {
    high:   BRAND.teal,
    medium: BRAND.gold,
    low:    BRAND.orange,
    target: BRAND.blue,
  },
};

// ============================================
// 4. STATUS BADGE STYLES
// Color logic:
//   teal   → success states  (completed, delivered, active, available)
//   blue   → in-progress     (in transit, in progress, busy, charging)
//   yellow → pending states  (pending, assigned, on break, low battery)
//   orange → warning/error   (cancelled, maintenance, unavailable, error)
//   gray   → inactive states (inactive, off duty, offline, on hold)
// ============================================
export const statusBadges = {
  shipment: {
    in_transit:  'bg-blue-50 text-blue-700 border border-blue-200',
    in_progress: 'bg-blue-50 text-blue-700 border border-blue-200',
    pending:     'bg-yellow-50 text-yellow-700 border border-yellow-200',
    assigned:    'bg-yellow-50 text-yellow-700 border border-yellow-200',
    delivered:   'bg-teal-50 text-teal-700 border border-teal-200',
    completed:   'bg-teal-50 text-teal-700 border border-teal-200',
    cancelled:   'bg-orange-50 text-orange-700 border border-orange-200',
    on_hold:     'bg-gray-50 text-gray-600 border border-gray-200',
  },
  alert: {
    critical: 'bg-orange-50 text-orange-700 border border-orange-200',
    high:     'bg-orange-50 text-orange-700 border border-orange-200',
    medium:   'bg-yellow-50 text-yellow-700 border border-yellow-200',
    low:      'bg-blue-50 text-blue-700 border border-blue-200',
    info:     'bg-teal-50 text-teal-700 border border-teal-200',
  },
  truck: {
    on_road:     'bg-teal-50 text-teal-700 border border-teal-200',
    in_mission:  'bg-teal-50 text-teal-700 border border-teal-200',
    available:   'bg-blue-50 text-blue-700 border border-blue-200',
    maintenance: 'bg-orange-50 text-orange-700 border border-orange-200',
    inactive:    'bg-gray-50 text-gray-600 border border-gray-200',
    reserved:    'bg-yellow-50 text-yellow-700 border border-yellow-200',
  },
  driver: {
    active:      'bg-teal-50 text-teal-700 border border-teal-200',
    available:   'bg-teal-50 text-teal-700 border border-teal-200',
    busy:        'bg-blue-50 text-blue-700 border border-blue-200',
    on_break:    'bg-yellow-50 text-yellow-700 border border-yellow-200',
    off_duty:    'bg-gray-50 text-gray-600 border border-gray-200',
    offline:     'bg-gray-50 text-gray-600 border border-gray-200',
    unavailable: 'bg-orange-50 text-orange-700 border border-orange-200',
  },
  device: {
    active:     'bg-teal-50 text-teal-700 border border-teal-200',
    inactive:   'bg-gray-50 text-gray-600 border border-gray-200',
    lowBattery: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    charging:   'bg-blue-50 text-blue-700 border border-blue-200',
    error:      'bg-orange-50 text-orange-700 border border-orange-200',
  },
};

// ============================================
// 5. ACTION BUTTON GRADIENTS
// ============================================
export const actionGradients = {
  shipments: 'from-blue-400 to-blue-500',
  fleet:     'from-teal-400 to-teal-500',
  map:       'from-teal-500 to-teal-600',
  alerts:    'from-orange-300 to-orange-400',
  reports:   'from-blue-500 to-blue-600',
  settings:  'from-gray-500 to-gray-600',
  drivers:   'from-teal-400 to-teal-500',
  analytics: 'from-yellow-400 to-yellow-500',
};

// ============================================
// 6. ICON COLOR MAPPINGS
// ============================================
export const iconColors = {
  background: {
    orange: 'bg-orange-100',
    navy:   'bg-gray-100',
    gold:   'bg-yellow-100',
    teal:   'bg-teal-100',
    blue:   'bg-blue-100',
    // Semantic aliases → nearest brand
    green:  'bg-teal-100',
    yellow: 'bg-yellow-100',
    red:    'bg-orange-100',
    gray:   'bg-gray-100',
    // Legacy aliases
    purple: 'bg-blue-100',
    indigo: 'bg-blue-100',
    pink:   'bg-orange-100',
  },
  text: {
    orange: 'text-orange-500',
    navy:   'text-gray-800',
    gold:   'text-yellow-600',
    teal:   'text-teal-600',
    blue:   'text-blue-500',
    // Semantic aliases → nearest brand
    green:  'text-teal-600',
    yellow: 'text-yellow-600',
    red:    'text-orange-500',
    gray:   'text-gray-500',
    // Legacy aliases
    purple: 'text-blue-500',
    indigo: 'text-blue-500',
    pink:   'text-orange-500',
  },
};

// ============================================
// 7. MAP MARKER COLORS
// ============================================
export const mapMarkers = {
  on_road:     BRAND.teal,
  in_mission:  BRAND.teal,
  available:   BRAND.blue,
  maintenance: BRAND.gold,
  inactive:    BRAND.gray,
  emergency:   BRAND.orange,
  stopped:     BRAND.gray,
  speeding:    BRAND.orange,
};

// ============================================
// 8. STAT CARD COLOR MAPPINGS
// ============================================
export const statCardColors = {
  inTransit:            'blue',
  inProgress:           'blue',
  delivered:            'teal',
  completed:            'teal',
  pending:              'gold',
  cancelled:            'orange',
  availableTrucks:      'teal',
  onRoadTrucks:         'blue',
  fleetUtilization:     'blue',
  liveTelemetry:        'blue',
  maintenanceDue:       'orange',
  fuelEfficiency:       'teal',
  activeDrivers:        'teal',
  onBreakDrivers:       'gold',
  totalDrivers:         'navy',
  onTimeDelivery:       'teal',
  customerSatisfaction: 'teal',
  costPerMile:          'orange',
  revenue:              'teal',
  activeAlerts:         'orange',
  criticalAlerts:       'orange',
  trucksInMaintenance:  'orange',
  totalShipments:       'blue',
  todaysDeliveries:     'teal',
};

// ============================================
// 9. BACKGROUND & SURFACE COLORS
// ============================================
export const surfaces = {
  page:      BRAND.offWhite,
  card:      BRAND.white,
  cardHover: BRAND.lightGray,
  modal:     BRAND.white,
  dropdown:  BRAND.white,
  sidebar:   BRAND.navy,
  header:    BRAND.white,
  footer:    BRAND.white,
  dark: {
    page:    '#0F0F18',
    card:    BRAND.navy,
    sidebar: '#0F0F18',
    header:  BRAND.navy,
  },
};

// ============================================
// 10. TEXT COLORS
// ============================================
export const textColors = {
  primary:   BRAND.navy,
  secondary: '#4A5568',
  tertiary:  BRAND.gray,
  disabled:  '#CBD5E0',
  success:   BRAND.teal,
  warning:   BRAND.gold,
  danger:    BRAND.orange,
  info:      BRAND.blue,
  light: {
    primary:   BRAND.white,
    secondary: '#E2E8F0',
    tertiary:  '#CBD5E0',
  },
};

// ============================================
// 11. BORDER COLORS
// ============================================
export const borders = {
  light:   '#E2E8F0',
  medium:  '#CBD5E0',
  dark:    '#A0AEC0',
  focus:   BRAND.blue,
  error:   BRAND.orange,
  success: BRAND.teal,
  warning: BRAND.gold,
};

// ============================================
// 12. HELPER FUNCTIONS
// ============================================

export const getStatusBadge = (status, type = 'shipment', size = 'md') => {
  const baseClass = statusBadges[type]?.[status] || 'bg-gray-50 text-gray-600 border border-gray-200';
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base',
  };
  return `${baseClass} rounded-full font-medium ${sizeClasses[size]}`;
};

export const getStatusText = (status) => {
  const texts = {
    in_transit:  'In Transit',
    in_progress: 'In Progress',
    pending:     'Pending',
    assigned:    'Assigned',
    delivered:   'Delivered',
    completed:   'Completed',
    cancelled:   'Cancelled',
    on_hold:     'On Hold',
    on_road:     'On Road',
    in_mission:  'In Mission',
    available:   'Available',
    maintenance: 'Maintenance',
    inactive:    'Inactive',
    reserved:    'Reserved',
    active:      'Active',
    busy:        'Busy',
    on_break:    'On Break',
    off_duty:    'Off Duty',
    offline:     'Offline',
    unavailable: 'Unavailable',
  };
  return texts[status] || status?.replace(/_/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
};

export const getAlertBadge = (severity) => {
  const badges = {
    critical: 'bg-orange-50 text-orange-700 border border-orange-200',
    high:     'bg-orange-50 text-orange-700 border border-orange-200',
    medium:   'bg-yellow-50 text-yellow-700 border border-yellow-200',
    low:      'bg-blue-50 text-blue-700 border border-blue-200',
    info:     'bg-teal-50 text-teal-700 border border-teal-200',
  };
  return badges[severity] || 'bg-gray-50 text-gray-600 border border-gray-200';
};

export const getMarkerColor = (status) => mapMarkers[status] || mapMarkers.inactive;

export const getStatCardColor = (statKey, priority = 'normal') => {
  if (priority === 'high')    return 'orange';
  if (priority === 'warning') return 'gold';
  if (priority === 'success') return 'teal';
  return statCardColors[statKey] || 'blue';
};

export const getIconColors = (color) => ({
  bg:   iconColors.background[color] || 'bg-gray-100',
  text: iconColors.text[color]       || 'text-gray-500',
});

export const getActionGradient = (action) => actionGradients[action] || 'from-gray-500 to-gray-600';

export const getChartColor = (category, status) =>
  chartColors[category]?.[status] || BRAND.blue;

export const isAccessible = (hexColor) => {
  const rgb = parseInt(hexColor.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8)  & 0xff;
  const b = (rgb >> 0)  & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? 'light' : 'dark';
};

// ============================================
// 13. BACKWARD COMPATIBILITY EXPORTS
// ============================================

export const COLORS = {
  PRIMARY: {
    BLUE:       BRAND.blue,
    GREEN:      BRAND.teal,
    ORANGE:     BRAND.orange,
    RED:        BRAND.orange,   // no red in brand palette
    PURPLE:     BRAND.blue,     // no purple in brand palette
    INDIGO:     BRAND.blue,     // no indigo in brand palette
    YELLOW:     BRAND.gold,
    LIGHT_BLUE: BRAND.blue,
  },
  SEMANTIC: {
    SUCCESS: BRAND.teal,
    WARNING: BRAND.gold,
    ERROR:   BRAND.orange,
    INFO:    BRAND.blue,
    NEUTRAL: BRAND.gray,
  },
  chart: {
    shipment: chartColors.shipment,
    truck:    chartColors.truck,
    alert:    chartColors.notification,
    device:   chartColors.device,
  },
};

export const iconTextColors = {
  orange: 'text-orange-500',
  navy:   'text-gray-800',
  gold:   'text-yellow-600',
  teal:   'text-teal-600',
  blue:   'text-blue-500',
  green:  'text-teal-600',
  yellow: 'text-yellow-600',
  red:    'text-orange-500',
  gray:   'text-gray-500',
  // Legacy aliases
  purple: 'text-blue-500',
  indigo: 'text-blue-500',
  pink:   'text-orange-500',
};

export const statusColors = {
  shipment: {
    in_transit:  'bg-blue-100 text-blue-800',
    in_progress: 'bg-blue-100 text-blue-800',
    pending:     'bg-yellow-100 text-yellow-800',
    assigned:    'bg-yellow-100 text-yellow-800',
    delivered:   'bg-teal-100 text-teal-800',
    completed:   'bg-teal-100 text-teal-800',
    cancelled:   'bg-orange-100 text-orange-800',
    on_hold:     'bg-gray-100 text-gray-700',
  },
  alert: {
    critical: 'bg-orange-100 text-orange-800',
    high:     'bg-orange-100 text-orange-800',
    medium:   'bg-yellow-100 text-yellow-800',
    low:      'bg-blue-100 text-blue-800',
    info:     'bg-teal-100 text-teal-800',
  },
  truck: {
    on_road:     BRAND.teal,
    in_mission:  BRAND.teal,
    available:   BRAND.blue,
    maintenance: BRAND.orange,
    inactive:    BRAND.gray,
    reserved:    BRAND.gold,
  },
};

export const actionGradientsLegacy = {
  shipments: 'from-blue-400 to-blue-500',
  fleet:     'from-teal-400 to-teal-500',
  map:       'from-teal-400 to-teal-500',
  alerts:    'from-orange-300 to-orange-400',
};

export const getStatusBadgeLegacy = (status, type = 'shipment') => {
  const legacyColors = {
    shipment: {
      in_transit:  'bg-blue-100 text-blue-800',
      in_progress: 'bg-blue-100 text-blue-800',
      pending:     'bg-yellow-100 text-yellow-800',
      assigned:    'bg-yellow-100 text-yellow-800',
      delivered:   'bg-teal-100 text-teal-800',
      completed:   'bg-teal-100 text-teal-800',
      cancelled:   'bg-orange-100 text-orange-800',
    },
    alert: {
      critical: 'bg-orange-100 text-orange-800',
      high:     'bg-orange-100 text-orange-800',
      medium:   'bg-yellow-100 text-yellow-800',
      low:      'bg-blue-100 text-blue-800',
    },
  };
  return legacyColors[type]?.[status] || 'bg-gray-100 text-gray-700';
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
  getStatusBadge,
  getStatusText,
  getAlertBadge,
  getMarkerColor,
  getStatCardColor,
  getIconColors,
  getActionGradient,
  getChartColor,
  isAccessible,
  getStatusBadgeLegacy,
  actionGradientsLegacy,
};