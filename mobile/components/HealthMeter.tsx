import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface HealthMeterProps {
    value: number; // Current value (e.g., 0-14 for pH scale)
    min: number; // Minimum value
    max: number; // Maximum value
    optimal: [number, number]; // Optimal range [min, max]
    label: string; // Label for the meter
    className?: string;
}

export const HealthMeter: React.FC<HealthMeterProps> = ({
    value,
    min,
    max,
    optimal,
    label,
    className = '',
}) => {
    // Calculate percentage position for the current value indicator
    const valuePercentage = ((value - min) / (max - min)) * 100;

    // Gradient colors: error → tertiary_fixed_dim → primary → error
    // Using color values from the design system
    const gradientColors = ['#ba1a1a', '#ffb95f', '#006b2c', '#ba1a1a'] as const;

    const gradientLocations = [0, 0.3, 0.7, 1] as const;

    return (
        <View className={`w-full ${className}`}>
            {/* Current value indicator positioned above bar */}
            <View
                className="absolute -top-6 z-10"
                style={{ left: `${Math.min(Math.max(valuePercentage, 0), 100)}%`, transform: [{ translateX: -12 }] }}
            >
                <View className="bg-on-surface dark:bg-on-surface-dark rounded-full px-2 py-1">
                    <Text className="text-surface dark:text-surface-dark font-label text-xs font-semibold">
                        {value.toFixed(1)}
                    </Text>
                </View>
                {/* Arrow pointing down */}
                <View
                    className="w-0 h-0 self-center"
                    style={{
                        borderLeftWidth: 4,
                        borderRightWidth: 4,
                        borderTopWidth: 4,
                        borderLeftColor: 'transparent',
                        borderRightColor: 'transparent',
                        borderTopColor: '#191c1d', // on-surface light
                    }}
                />
            </View>

            {/* Gradient bar */}
            <View className="h-8 rounded-full overflow-hidden">
                <LinearGradient
                    colors={gradientColors}
                    locations={gradientLocations}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="h-full w-full"
                />
            </View>

            {/* Labels positioned below bar */}
            <View className="flex-row justify-between mt-2">
                <Text className="text-on-surface-variant dark:text-on-surface-variant-dark font-label text-xs">
                    {min}
                </Text>
                <Text className="text-on-surface-variant dark:text-on-surface-variant-dark font-label text-xs">
                    {label}
                </Text>
                <Text className="text-on-surface-variant dark:text-on-surface-variant-dark font-label text-xs">
                    {max}
                </Text>
            </View>

            {/* Optimal range indicator */}
            <View className="mt-1">
                <Text className="text-on-surface-variant dark:text-on-surface-variant-dark font-label text-xs text-center">
                    Optimal: {optimal[0]}-{optimal[1]}
                </Text>
            </View>
        </View>
    );
};
