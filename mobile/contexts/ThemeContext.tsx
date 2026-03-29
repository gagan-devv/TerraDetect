import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useThemeStore } from "../store/themeStore";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";

type ThemeMode = "light" | "dark";

// Color tokens extracted from tailwind.config.js
interface ColorTokens {
  primary: string;
  primaryContainer: string;
  onPrimary: string;
  onPrimaryContainer: string;
  primaryFixed: string;
  primaryFixedDim: string;
  secondary: string;
  secondaryContainer: string;
  onSecondary: string;
  onSecondaryContainer: string;
  secondaryFixed: string;
  secondaryFixedDim: string;
  tertiary: string;
  tertiaryContainer: string;
  onTertiary: string;
  onTertiaryContainer: string;
  tertiaryFixed: string;
  tertiaryFixedDim: string;
  error: string;
  errorContainer: string;
  onError: string;
  onErrorContainer: string;
  success: string;
  successContainer: string;
  onSuccess: string;
  onSuccessContainer: string;
  warning: string;
  warningContainer: string;
  onWarning: string;
  onWarningContainer: string;
  info: string;
  infoContainer: string;
  onInfo: string;
  onInfoContainer: string;
  surface: string;
  surfaceDim: string;
  surfaceBright: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  surfaceVariant: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  scrim: string;
  shadow: string;
}

interface ThemeContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  isLoading: boolean;
  colors: ColorTokens;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { mode, toggleMode, initializeTheme } = useThemeStore();
  const [isLoading, setIsLoading] = useState(true);
  const { setColorScheme } = useNativeWindColorScheme();

  // Animated value for smooth transitions (0 = light, 1 = dark)
  const themeProgress = useSharedValue(0);

  // Initialize theme on mount
  useEffect(() => {
    const initialize = async () => {
      await initializeTheme();
      setIsLoading(false);
    };
    initialize();
  }, []);

  // Update NativeWind color scheme when theme changes
  useEffect(() => {
    setColorScheme(mode);
  }, [mode, setColorScheme]);

  // Animate theme transitions with 300ms duration
  useEffect(() => {
    themeProgress.value = withTiming(mode === "dark" ? 1 : 0, {
      duration: 300,
    });
  }, [mode]);

  // Animated style for smooth color transitions
  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        themeProgress.value,
        [0, 1],
        ["#f8f9fa", "#0c1324"] // surface colors from design system
      ),
    };
  });

  // Extract color tokens based on current theme
  const colors = useMemo<ColorTokens>(() => {
    if (mode === "dark") {
      return {
        primary: "#62df7d",
        primaryContainer: "#1ca64d",
        onPrimary: "#003916",
        onPrimaryContainer: "#a8f5b8",
        primaryFixed: "#a8f5b8",
        primaryFixedDim: "#62df7d",
        secondary: "#7bd0ff",
        secondaryContainer: "#004c6e",
        onSecondary: "#003549",
        onSecondaryContainer: "#c8e6ff",
        secondaryFixed: "#c8e6ff",
        secondaryFixedDim: "#7bd0ff",
        tertiary: "#ffb95f",
        tertiaryContainer: "#5f3d00",
        onTertiary: "#452b00",
        onTertiaryContainer: "#ffddb8",
        tertiaryFixed: "#ffddb8",
        tertiaryFixedDim: "#ffb95f",
        error: "#ffb4ab",
        errorContainer: "#93000a",
        onError: "#690005",
        onErrorContainer: "#ffdad6",
        success: "#62df7d",
        successContainer: "#1ca64d",
        onSuccess: "#003916",
        onSuccessContainer: "#a8f5b8",
        warning: "#ffb95f",
        warningContainer: "#5f3d00",
        onWarning: "#452b00",
        onWarningContainer: "#ffddb8",
        info: "#7bd0ff",
        infoContainer: "#004c6e",
        onInfo: "#003549",
        onInfoContainer: "#c8e6ff",
        surface: "#0c1324",
        surfaceDim: "#0c1324",
        surfaceBright: "#33394c",
        surfaceContainerLowest: "#070d1f",
        surfaceContainerLow: "#191f31",
        surfaceContainer: "#1d2333",
        surfaceContainerHigh: "#272d3e",
        surfaceContainerHighest: "#323849",
        surfaceVariant: "#414946",
        onSurface: "#e1e2e3",
        onSurfaceVariant: "#bdcaba",
        outline: "#8b938a",
        outlineVariant: "#414946",
        inverseSurface: "#e1e2e3",
        inverseOnSurface: "#2e3132",
        inversePrimary: "#006b2c",
        scrim: "#000000",
        shadow: "#000000",
      };
    } else {
      return {
        primary: "#006b2c",
        primaryContainer: "#00873a",
        onPrimary: "#ffffff",
        onPrimaryContainer: "#f7fff2",
        primaryFixed: "#a8f5b8",
        primaryFixedDim: "#62df7d",
        secondary: "#006398",
        secondaryContainer: "#c8e6ff",
        onSecondary: "#ffffff",
        onSecondaryContainer: "#001e30",
        secondaryFixed: "#c8e6ff",
        secondaryFixedDim: "#7bd0ff",
        tertiary: "#825100",
        tertiaryContainer: "#ffddb8",
        onTertiary: "#ffffff",
        onTertiaryContainer: "#2a1700",
        tertiaryFixed: "#ffddb8",
        tertiaryFixedDim: "#ffb95f",
        error: "#ba1a1a",
        errorContainer: "#ffdad6",
        onError: "#ffffff",
        onErrorContainer: "#410002",
        success: "#006b2c",
        successContainer: "#a8f5b8",
        onSuccess: "#ffffff",
        onSuccessContainer: "#003916",
        warning: "#825100",
        warningContainer: "#ffddb8",
        onWarning: "#ffffff",
        onWarningContainer: "#2a1700",
        info: "#006398",
        infoContainer: "#c8e6ff",
        onInfo: "#ffffff",
        onInfoContainer: "#001e30",
        surface: "#f8f9fa",
        surfaceDim: "#d9dadc",
        surfaceBright: "#f8f9fa",
        surfaceContainerLowest: "#ffffff",
        surfaceContainerLow: "#f2f3f5",
        surfaceContainer: "#ecedee",
        surfaceContainerHigh: "#e6e7e9",
        surfaceContainerHighest: "#e1e2e3",
        surfaceVariant: "#dde4dd",
        onSurface: "#191c1d",
        onSurfaceVariant: "#414946",
        outline: "#717970",
        outlineVariant: "#c1c9c0",
        inverseSurface: "#2e3132",
        inverseOnSurface: "#f0f1f2",
        inversePrimary: "#62df7d",
        scrim: "#000000",
        shadow: "#000000",
      };
    }
  }, [mode]);

  const contextValue: ThemeContextValue = {
    theme: mode,
    toggleTheme: toggleMode,
    isLoading,
    colors,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        {children}
      </Animated.View>
    </ThemeContext.Provider>
  );
}
