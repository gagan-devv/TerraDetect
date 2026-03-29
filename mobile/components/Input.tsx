import React from 'react';
import { View, Text, TextInput, type TextInputProps, type KeyboardTypeOptions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedView = Animated.createAnimatedComponent(View);

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  keyboardType = 'default',
  className = '',
  ...props
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleFocus = () => {
    scale.value = withTiming(1.01, { duration: 200 });
  };

  const handleBlur = () => {
    scale.value = withTiming(1, { duration: 200 });
  };

  return (
    <View className={`w-full ${className}`}>
      {/* Label positioned 8px above input */}
      {label && (
        <Text className="text-on-surface-variant dark:text-on-surface-variant-dark font-label text-sm mb-2">
          {label}
        </Text>
      )}

      {/* Input container with focus animation */}
      <AnimatedView
        style={animatedStyle}
        className={`
          ${error ? 'bg-error-container dark:bg-error-container-dark' : 'bg-surface-container-high dark:bg-surface-container-high-dark'}
          rounded-full
          px-6 py-4
        `.trim()}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor="#717970" // outline color
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          className={`
            font-body text-base
            ${error ? 'text-on-error-container dark:text-on-error-container-dark' : 'text-on-surface dark:text-on-surface-dark'}
            min-h-[24px]
          `.trim()}
          {...props}
        />
      </AnimatedView>

      {/* Error message */}
      {error && (
        <Text className="text-error dark:text-error-dark font-label text-xs mt-1 ml-6">
          {error}
        </Text>
      )}
    </View>
  );
};
