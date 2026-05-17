import React from 'react';
import { semantic } from '../../constants/colors'; 

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue', 
  subtitle, 
  trend, 
  alert,
  onClick,
  loading = false,
  suffix = '',
  prefix = ''
}) => {
  // Map your Tailwind color names to brand colors (using semantic light backgrounds)
  const brandMap = {
    // Legacy names mapped to your brand
    pink:    { bg: semantic.info.light,     icon: semantic.info.primary },     // blue brand
    purple:  { bg: semantic.info.light,     icon: semantic.info.primary },     // blue brand
    red:     { bg: semantic.danger.light,   icon: semantic.danger.primary },   // orange brand
    green:   { bg: semantic.success.light,  icon: semantic.success.primary },  // teal brand
    yellow:  { bg: semantic.warning.light,  icon: semantic.warning.primary },  // gold brand
    blue:    { bg: semantic.info.light,     icon: semantic.info.primary },     // blue brand
    indigo:  { bg: semantic.info.light,     icon: semantic.info.primary },     // blue brand
    orange:  { bg: semantic.danger.light,   icon: semantic.danger.primary },   // orange brand
    teal:    { bg: semantic.success.light,  icon: semantic.success.primary },  // teal brand
    gold:    { bg: semantic.warning.light,  icon: semantic.warning.primary },  // gold brand
    navy:    { bg: '#E2E8F0',               icon: '#1E1E2C' },                  // fallback for navy
  };

  const selected = brandMap[color] || brandMap.blue;

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

  const formattedValue = `${prefix}${value}${suffix}`;

  // Loading skeleton (unchanged)
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
        bg-white rounded-2xl shadow-md p-6 
        transition-all duration-300 hover:shadow-xl hover:-translate-y-1 
        border border-gray-200
        ${alert ? 'ring-2 ring-red-400/60' : ''}
        ${onClick ? 'cursor-pointer active:scale-95' : ''}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {/* Icon circle – uses your brand colors */}
          <div 
            className="p-3 rounded-xl shadow-sm" 
            style={{ backgroundColor: selected.bg }}
          >
            <Icon className="h-6 w-6" style={{ color: selected.icon }} />
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