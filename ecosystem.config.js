module.exports = {
  apps: [
    {
      name: "ischool-frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: "max", // Utilizes all available vCPUs
      exec_mode: "cluster",
      max_memory_restart: "600M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/pm2-frontend-err.log",
      out_file: "./logs/pm2-frontend-out.log",
      merge_logs: true,
      time: true,
    },
    {
      name: "ischool-backend-queue",
      script: "php",
      args: "backend/artisan queue:work --tries=3 --timeout=90 --sleep=3",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "256M",
      error_file: "./logs/pm2-queue-err.log",
      out_file: "./logs/pm2-queue-out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
