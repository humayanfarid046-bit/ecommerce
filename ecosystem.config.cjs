/**
 * PM2 — run full stack on one VPS after `npm run build` in web/
 *   npm i -g pm2
 *   cd "E COMMERC" && pm2 start ecosystem.config.cjs
 *   pm2 save && pm2 startup
 */
module.exports = {
  apps: [
    {
      name: "ecom-web",
      cwd: "./web",
      script: "npm",
      args: "run start",
      env: { NODE_ENV: "production" },
    },
    {
      name: "ecom-api",
      cwd: "./server",
      script: "src/index.js",
      interpreter: "node",
      env: { NODE_ENV: "production", PORT: "4000" },
    },
  ],
};
