import React from 'react';
import { View, Text } from 'react-native';

export interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  trend?: string; // e.g., "+2.1%" or "-1.5%"
  color: 'orange' | 'blue' | 'green' | 'purple' | 'amber';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  color,
  className = '',
}) => {
  // Map color variants to background tints
  const colorStyles = {
    orange: 'bg-orange-50/80 dark:bg-orange-900/30',
    blue: 'bg-blue-50/80 dark:bg-blue-900/30',
    green: 'bg-green-50/80 dark:bg-green-900/30',
    purple: 'bg-purple-50/80 dark:bg-purple-900/30',
    amber: 'bg-amber-50/80 dark:bg-amber-900/30',
  };

  // Map color variants to icon container colors
  const iconContainerStyles = {
    orange: 'bg-orange-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
  };

  return (
    <View
      className={`
        ${colorStyles[color]}
        rounded-lg
        p-4
        min-w-[140px]
        ${className}
      `.trim()}
    >
      {/* Icon in white rounded container */}
      <View
        className={`
          ${iconContainerStyles[color]}
          w-10 h-10
          rounded-full
          items-center justify-center
          mb-3
        `.trim()}
      >
        <Text className="text-white text-xl">
          {icon}
        </Text>
      </View>

      {/* Value with Manrope font */}
      <Text
        className={`
          text-on-surface dark:text-on-surface-dark
          font-headline
          text-3xl
          font-black
          mb-1
        `.trim()}
      >
        {value}
      </Text>

      {/* Label - uppercase, tracking-wider */}
      <Text
        className={`
          text-on-surface-variant dark:text-on-surface-variant-dark
          font-label
          text-[11px]
          uppercase
          tracking-wider
          mb-1
        `.trim()}
      >
        {label}
      </Text>

      {/* Optional trend indicator */}
      {trend && (
        <Text
          className={`
            font-label
            text-xs
            font-semibold
            ${trend.startsWith('+') ? 'text-success dark:text-success-dark' : 'text-error dark:text-error-dark'}
          `.trim()}
        >
          {trend}
        </Text>
      )}
    </View>
  );
};
