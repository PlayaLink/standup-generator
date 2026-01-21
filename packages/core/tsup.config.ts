import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'jira/index': 'src/jira/index.ts',
    'claude/index': 'src/claude/index.ts',
    'db/index': 'src/db/index.ts',
    encryption: 'src/encryption.ts',
    'prompts/index': 'src/prompts/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
});
