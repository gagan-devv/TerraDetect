import React from 'react';
import { View, Text } from 'react-native';

export interface SensorChipProps {
  label: string;
  type: 'soil' | 'weather' | 'nutrient';
  value: string;
  icon?: string;
  className?: string;
}

export const SensorChip: React.FC<SensorChipProps> = ({
  label,
  type,
  value,
  icon,
  className = '',
}) => {
  // Map type to background and text colors
  const typeStyles = {
    weather: {
      bg: 'bg-secondary-container dark:bg-secondary-container-dark',
      text: 'text-on-secondary-container dark:text-on-secondary-container-dark',
    },
    soil: {
      bg: 'bg-tertiary-container dark:bg-tertiary-container-dark',
      text: 'text-on-tertiary-container dark:text-on-tertiary-container-dark',
    },
    nutrient: {
      bg: 'bg-primary-container dark:bg-primary-container-dark',
      text: 'text-on-primary-container dark:text-on-primary-container-dark',
    },
  };

  const styles = typeStyles[type];

  return (
    <View
      className={`
        ${styles.bg}
        rounded-sm
        px-3 py-1.5
        flex-row items-center
        ${className}
      `.trim()}
    >
      {icon && (
        <Text className={`${styles.text} text-xs mr-1`}>
          {icon}
        </Text>
      )}
      <Text className={`${styles.text} font-label text-xs font-medium`}>
        {label}: {value}
      </Text>
    </View>
  );
};
