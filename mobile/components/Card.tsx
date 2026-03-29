import React from 'react';
import { View, Pressable, type PressableProps } from 'react-native';

export interface CardProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  onPress,
  className = '',
  ...props
}) => {
  // Padding variants
  const paddingClasses = {
    sm: 'p-4',   // 16px
    md: 'p-6',   // 24px
    lg: 'p-8',   // 32px
  };

  // Variant styles
  const variantClasses = {
    default: 'bg-surface-container-lowest dark:bg-surface-container-lowest-dark',
    elevated: 'bg-surface-container-low dark:bg-surface-container-low-dark shadow-sm',
    outlined: 'bg-transparent border border-outline-variant dark:border-outline-variant-dark',
  };

  // Base classes for all cards
  const baseClasses = `
    rounded-lg
    ${paddingClasses[padding]}
    ${variantClasses[variant]}
    ${className}
  `.trim();

  // If onPress is provided, render as Pressable
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={baseClasses}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  // Otherwise, render as View
  return (
    <View className={baseClasses}>
      {children}
    </View>
  );
};
