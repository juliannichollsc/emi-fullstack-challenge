import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  transform: {
    '^.+/httpClient\\.ts$': '<rootDir>/src/__mocks__/viteEnvTransformer.cjs',
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          moduleResolution: 'node',
          module: 'CommonJS',
          allowSyntheticDefaultImports: true,
          strict: true,
          target: 'ES2022',
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
          baseUrl: '.',
          paths: {
            '@/*': ['src/*'],
            '@app/*': ['src/app/*'],
            '@features/*': ['src/features/*'],
            '@shared/*': ['src/shared/*'],
            '@pages/*': ['src/pages/*'],
          },
          types: ['jest', '@testing-library/jest-dom'],
        },
        diagnostics: false,
        isolatedModules: true,
      },
    ],
  },
  moduleNameMapper: {
    // Specific mocks must come before the generic alias mappers
    '^gsap$': '<rootDir>/src/__mocks__/gsap.ts',
    '^gsap/(.*)$': '<rootDir>/src/__mocks__/gsap.ts',
    '^@gsap/react$': '<rootDir>/src/__mocks__/@gsap/react.ts',
    '^@shared/utils/httpClient$': '<rootDir>/src/shared/utils/__mocks__/httpClient.ts',
    // Generic alias mappers
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@pages/(.*)$': '<rootDir>/src/pages/$1',
    '\\.(css|less|scss|svg)$': 'identity-obj-proxy',
  },
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)'],
  collectCoverageFrom: [
    'src/features/**/*.{ts,tsx}',
    '!src/**/index.ts',
    '!src/**/types.ts',
    '!src/**/*.types.ts',
  ],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  },
};

export default config;
