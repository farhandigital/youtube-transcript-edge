import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,       // generates a types entry point
      tsconfigPath: './tsconfig.json',
    }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',        // same as rollup's `input`
      name: 'YoutubeTranscriptPlus',
      fileName: 'youtube-transcript-plus',
      formats: ['es'],              // 'esm' in rollup = 'es' in vite
    },
    rollupOptions: {
      external: ['fs/promises', 'path'],  // carried over directly
    },
  },
});