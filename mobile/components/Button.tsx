import React from 'react';
import { Pressable, Text, type PressableProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface ButtonProps extends Omit<PressableProps, 'style'> {
    variant?: 'primary' | 'secondary' | 'tertiary';
    children: React.ReactNode;
    disabled?: boolean;
    fullWidth?: boolean;
    className?: string;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    children,
    disabled = false,
    fullWidth = false,
    className = '',
    onPress,
    ...props
}) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withTiming(0.95, { duration: 150 });
    };

    const handlePressOut = () => {
        scale.value = withTiming(1, { duration: 150 });
    };

    // Base styles for all variants
    const baseClasses = `
    min-h-[44px] min-w-[44px] 
    rounded-full 
    items-center justify-center 
    px-6 py-3
    ${fullWidth ? 'w-full' : ''}
    ${disabled ? 'opacity-40' : ''}
    ${className}
  `.trim();

    // Render primary variant with gradient
    if (variant === 'primary') {
        return (
            <AnimatedPressable
                onPress={disabled ? undefined : onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled}
                style={animatedStyle}
                className={baseClasses}
                {...props}
            >
                <LinearGradient
                    colors={(['#006b2c', '#00873a'] as const)} // primary to primary-container
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }} // 135° angle
                    className="absolute inset-0 rounded-full"
                />
                <Text className="text-on-primary dark:text-on-primary-dark font-label font-semibold text-base z-10">
                    {children}
                </Text>
            </AnimatedPressable>
        );
    }

    // Render secondary variant
    if (variant === 'secondary') {
        return (
            <AnimatedPressable
                onPress={disabled ? undefined : onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled}
                style={animatedStyle}
                className={`${baseClasses} bg-surface-container dark:bg-surface-container-dark`}
                {...props}
            >
                <Text className="text-primary dark:text-primary-dark font-label font-semibold text-base">
                    {children}
                </Text>
            </AnimatedPressable>
        );
    }

    // Render tertiary variant
    return (
        <AnimatedPressable
            onPress={disabled ? undefined : onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            style={animatedStyle}
            className={`${baseClasses} bg-transparent`}
            {...props}
        >
            <Text className="text-primary dark:text-primary-dark font-label font-semibold text-base">
                {children}
            </Text>
        </AnimatedPressable>
    );
};
