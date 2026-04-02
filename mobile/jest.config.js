/**
 * Mobile-local Jest config — uses jest-expo and local setup
 */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/../tests/**/*.test.(ts|tsx|js|jsx)'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|expo|nativewind|@react-navigation)/)'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
};
/**
 * Mobile-local Jest config — uses jest-expo so preset resolves from mobile/node_modules
 */
module.exports = {
  rootDir: '.',
  preset: 'jest-expo',
  testMatch: ['<rootDir>/../tests/mobile/**/*.test.(ts|tsx|js|jsx)'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|expo|nativewind|@react-navigation)/)'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
module.exports = {
  preset: "jest-expo",
  testEnvironment: "node",
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  transformIgnorePatterns: [
    "node_modules/(?!(react-native|@react-native|@react-navigation|nativewind)/)",
  ],
};
