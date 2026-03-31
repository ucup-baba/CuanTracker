import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icon.svg'],
            manifest: {
                name: 'CuanTracker',
                short_name: 'CuanTracker',
                description: 'Aplikasi pencatatan keuangan pribadi & asrama bergaya neo-brutalism.',
                theme_color: '#fef08a',
                background_color: '#fce7f3',
                display: 'standalone',
                orientation: 'portrait',
                icons: [
                    {
                        src: 'icon.svg',
                        sizes: '192x192 512x512',
                        type: 'image/svg+xml',
                        purpose: 'any maskable'
                    }
                ]
            }
        })
    ],
})
