// Custom Jest transform that replaces import.meta.env references before ts-jest sees them.
// Needed for Vite-specific source files used in a Jest/CommonJS test environment.
// Must be .cjs because package.json has "type": "module".
const { TsJestTransformer } = require('ts-jest');

const tsJestTransformer = new TsJestTransformer({
  tsconfig: {
    jsx: 'react-jsx',
    esModuleInterop: true,
    moduleResolution: 'node',
    module: 'CommonJS',
    allowSyntheticDefaultImports: true,
    target: 'ES2022',
    lib: ['ES2022', 'DOM', 'DOM.Iterable'],
    strict: true,
    types: ['jest', '@testing-library/jest-dom'],
  },
  isolatedModules: true,
  diagnostics: false,
});

module.exports = {
  process(sourceText, sourcePath, options) {
    // Replace import.meta.env.SOME_VAR with process.env.SOME_VAR before TS compilation
    const replaced = sourceText.replace(
      /import\.meta\.env\.(\w+)/g,
      (_match, key) => `(process.env.${key})`,
    );
    return tsJestTransformer.process(replaced, sourcePath, options);
  },
};
