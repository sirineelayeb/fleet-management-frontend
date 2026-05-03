// frontend/src/components/Cards/StatCard.jsx
import React from 'react';

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'pink', 
  subtitle, 
  trend, 
  alert,
  onClick,
  loading = false,
  suffix = '',
  prefix = ''
}) => {
  // Color configurations
  const colorConfig = {
    pink: {
      bg: 'bg-gradient-to-br from-pink-100 to-pink-200',
      text: 'text-pink-700',
      ring: 'ring-pink-400/60'
    },
    green: {
      bg: 'bg-gradient-to-br from-emerald-100 to-emerald-200',
      text: 'text-emerald-700',
      ring: 'ring-emerald-400/60'
    },
    yellow: {
      bg: 'bg-gradient-to-br from-amber-100 to-orange-200',
      text: 'text-orange-700',
      ring: 'ring-orange-400/60'
    },
    red: {
      bg: 'bg-gradient-to-br from-rose-100 to-red-200',
      text: 'text-red-700',
      ring: 'ring-red-400/60'
    },
    purple: {
      bg: 'bg-gradient-to-br from-violet-100 to-purple-200',
      text: 'text-purple-700',
      ring: 'ring-purple-400/60'
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-100 to-blue-200',
      text: 'text-blue-700',
      ring: 'ring-blue-400/60'
    },
    indigo: {
      bg: 'bg-gradient-to-br from-indigo-100 to-indigo-200',
      text: 'text-indigo-700',
      ring: 'ring-indigo-400/60'
    },
  };

  const selectedColor = colorConfig[color] || colorConfig.pink;

  // Format trend display
  const getTrendIcon = () => {
    if (!trend) return null;
    const isPositive = trend.startsWith('+');
    return isPositive ? '↑' : '↓';
  };

  const getTrendColor = () => {
    if (!trend) return '';
    return trend.startsWith('+') 
      ? 'bg-green-100 text-green-600' 
      : 'bg-red-100 text-red-600';
  };

  // Format value with prefix/suffix
  const formattedValue = `${prefix}${value}${suffix}`;

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md p-6 border border-gray-100 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-gray-200 h-12 w-12" />
            <div className="ml-4">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        bg-white/80 backdrop-blur-md rounded-2xl shadow-md p-6 
        transition-all duration-300 hover:shadow-xl hover:-translate-y-1 
        border border-gray-100
        ${alert ? `ring-2 ${selectedColor.ring}` : ''}
        ${onClick ? 'cursor-pointer active:scale-95' : ''}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className="flex items-center justify-between">
        
        {/* Left Section */}
        <div className="flex items-center">
          <div className={`p-3 rounded-xl shadow-sm ${selectedColor.bg}`}>
            <Icon className={`h-6 w-6 ${selectedColor.text}`} />
          </div>

          <div className="ml-4">
            <p className="text-sm text-gray-500 font-medium tracking-wide">
              {title}
            </p>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-bold text-gray-900">
                {formattedValue}
              </p>
              {trend && (
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${getTrendColor()}`}>
                  {getTrendIcon()} {trend.replace(/[+-]/, '')}
                </span>
              )}
            </div>

            {subtitle && (
              <p className="text-xs text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Optional Alert Badge */}
        {alert && (
          <div className="absolute -top-2 -right-2">
            <div className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
              !
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;