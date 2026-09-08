import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * 条件注入插件 —— 根据环境变量有条件地注入第三方脚本
 */
function conditionalScripts(env) {
  return {
    name: 'conditional-scripts',
    transformIndexHtml(html) {
      const cfToken = env.VITE_CF_ANALYTICS_TOKEN || '';

      html = html.replace(
        '<!-- __CF_ANALYTICS_SCRIPT__ -->',
        cfToken
          ? `<script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "${cfToken}"}'><\/script>`
          : ''
      );

      html = html.replace(/%VITE_FOOTER_AUTHOR%/g, env.VITE_FOOTER_AUTHOR || 'MonitorFlare');
      html = html.replace(/%VITE_FOOTER_URL%/g, env.VITE_FOOTER_URL || '#');

      return html;
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      vue(),
      conditionalScripts(env),
      env.VITE_MOCK_API === '1' && {
        name: 'dev-mock-api',
        configureServer(server) {
          const mkDaily = (bad) => { const a=[]; const now=Date.now(); for(let i=89;i>=0;i--){ const d=new Date(now-i*86400000).toISOString().slice(0,10); let up=48; if(bad&&(i===12||i===13)) up=20; else if(bad&&i===3) up=44; else if(i%17===0) up=47; a.push({date:d,up,total:48}); } return a; };
          const lat = () => Array.from({length:24}, () => 60 + Math.round(Math.random()*90));
          const monitors = [
            { id:1, name:'API Gateway', type:'http', url:'https://api.example.com', status:'UP', paused:0, latency:82, uptime_30d:99.987, uptime_24h:100, tags:'Core', daily_stats:mkDaily(false), recent_latencies:lat(), cert_expiry:new Date(Date.now()+62*864e5).toISOString() },
            { id:2, name:'Web App', type:'http', url:'https://app.example.com', status:'UP', paused:0, latency:120, uptime_30d:99.942, uptime_24h:99.9, tags:'Core', daily_stats:mkDaily(false), recent_latencies:lat() },
            { id:3, name:'Database Primary', type:'port', url:'db.example.com:5432', status:'DEGRADED', paused:0, latency:340, uptime_30d:98.71, uptime_24h:96.2, tags:'Infra', daily_stats:mkDaily(true), recent_latencies:lat() },
            { id:4, name:'CDN Edge', type:'http', url:'https://cdn.example.com', status:'DOWN', paused:0, latency:null, uptime_30d:94.10, uptime_24h:88.0, tags:'Infra', daily_stats:mkDaily(true), recent_latencies:lat() },
            { id:5, name:'Cron Worker', type:'http', url:'https://cron.example.com', status:'UP', paused:1, latency:null, uptime_30d:null, tags:'Jobs', daily_stats:mkDaily(false) },
          ];
          const json = (res, body) => { res.setHeader('Content-Type','application/json'); res.end(JSON.stringify(body)); };
          server.middlewares.use((req, res, next) => {
            if (req.url.includes('/monitors/public/details')) return json(res, { monitors });
            if (req.url.includes('/incidents')) return json(res, [{ id:1, severity:'warning', title:'Investigating elevated DB latency', description:'Looking into slow queries on the primary database. Failover is on standby.', created_at:new Date(Date.now()-5*60000).toISOString() }]);
            if (req.url.endsWith('/api/settings') || req.url.endsWith('/settings')) return json(res, { site_title:'MonitorFlare', site_description:'System status & uptime' });
            next();
          });
        },
      },
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg'],
        manifest: {
          name: 'MonitorFlare',
          short_name: 'MonitorFlare',
          description: 'Realtime monitoring & status page',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          start_url: '/',
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          navigateFallback: '/index.html',
          runtimeCaching: [
            {
              // 状态页公开数据:离线可看最近快照
              urlPattern: ({ url }) => url.pathname.startsWith('/api/status') || url.pathname.startsWith('/monitors/public'),
              handler: 'NetworkFirst',
              options: { cacheName: 'monitorflare-status', expiration: { maxEntries: 10, maxAgeSeconds: 24 * 3600 } },
            },
          ],
        },
      }),
    ],

    build: {
      rollupOptions: {
        input: './index.html',
      },
    },

    server: {
      proxy: {
        '/api': {
          target: env.VITE_WORKER_URL || 'http://127.0.0.1:8787',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
});
