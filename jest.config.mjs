export default {
  testEnvironment: 'node',
  transform: {}, // sin Babel
  moduleFileExtensions: ['js', 'mjs', 'json'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  testMatch: ['**/tests/**/*.test.mjs'],
  verbose: true
};
