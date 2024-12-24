import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
export default defineConfig({
    plugins: [ react() ],
    build: {
        rollupOptions: {
            input: {
                main: fileURLToPath(new URL('./index.html', import.meta.url)),
                content: fileURLToPath(new URL("./src/content.ts", import.meta.url)),
            },
            output: {
                entryFileNames: '[name].js',
                assetFileNames: 'assets/[name].[ext]',
            },
        }
    }
})
