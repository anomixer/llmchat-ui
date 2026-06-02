import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd())
    const allowedFromEnv = env.VITE_ALLOWED_HOSTS
        ? env.VITE_ALLOWED_HOSTS.split(',').map(h => h.trim()).filter(Boolean)
        : []

    const allowedHosts = [
        'localhost',
        '127.0.0.1',
        ...allowedFromEnv
    ]

    return {
        base: './',
        plugins: [react()],
        server: {
            host: true,
            port: 3000,
            open: true,
            allowedHosts
        },
        build: {
            outDir: 'dist',
            sourcemap: true,
            chunkSizeWarningLimit: 1500,
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (id.includes('node_modules')) {
                            if (
                                id.includes('react-markdown') || 
                                id.includes('remark') || 
                                id.includes('unist') || 
                                id.includes('vfile') || 
                                id.includes('micromark') || 
                                id.includes('mdast') || 
                                id.includes('parse5') || 
                                id.includes('hast')
                            ) {
                                return 'markdown'
                            }
                            if (
                                id.includes('react-syntax-highlighter') || 
                                id.includes('prismjs') || 
                                id.includes('lowlight') || 
                                id.includes('highlight.js')
                            ) {
                                return 'syntax-highlighter'
                            }
                            return 'vendor'
                        }
                    }
                }
            }
        },
        resolve: {
            alias: {
                '@': '/src',
                '@/components': '/src/components',
                '@/utils': '/src/utils'
            }
        }
    }
})
