// Jest setup for mobile tests
require('@testing-library/jest-native/extend-expect');

// Silence native animated helper warnings
try {
  jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
} catch (e) {}

// Basic mocks for common native modules used in tests
try {
  jest.mock('expo-constants', () => ({
    manifest: {},
  }));
} catch (e) {}
// Basic Jest setup for React Native testing
require('@testing-library/jest-native/extend-expect');

// Silence the warning: Animated: `useNativeDriver` is not supported
try {
  jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
} catch (e) {
  // ignore when not running in jest environment during other tooling
}

// Mock react-native-reanimated if present (common in RN projects)
try {
  jest.mock('react-native-reanimated', () => {
    const Reanimated = require('react-native-reanimated/mock');
    // Reanimated mock may not include all exports; ensure defaults
    Reanimated.default = Reanimated;
    return Reanimated;
  });
} catch (e) {
  // no-op
}
