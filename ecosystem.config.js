module.exports = {
  apps: [
    {
      name: "reading-champ",
      script: "node_modules/.bin/next",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "2G",
      min_uptime: "10s",
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
      },
      error_file: "logs/app-error.log",
      out_file: "logs/app-out.log",
      log_file: "logs/app-combined.log",
      time: true,
    },
    {
      name: "medal-cron",
      script: "npx",
      args: "tsx scripts/cron-wrapper.ts",
      cron_restart: "0 * * * *", // Every hour - wrapper checks if it's midnight KST
      autorestart: false, // Don't restart after it completes
      instances: 1,
      exec_mode: "fork",
      watch: false,
      cwd: "/home/champ/learn-english", // Set working directory explicitly
      env: {
        NODE_ENV: "production",
      },
      error_file: "logs/cron-error.log",
      out_file: "logs/cron-out.log",
      log_file: "logs/cron-combined.log",
      time: true,
    },
    {
      name: "subscription-cron",
      script: "npx",
      args: "tsx scripts/subscription-cron-wrapper.ts",
      cron_restart: "30 * * * *", // Every hour at 30 minutes - wrapper checks if it's 00:30 KST
      autorestart: false, // Don't restart after it completes
      instances: 1,
      exec_mode: "fork",
      watch: false,
      cwd: "/home/champ/learn-english", // Set working directory explicitly
      env: {
        NODE_ENV: "production",
      },
      error_file: "logs/subscription-cron-error.log",
      out_file: "logs/subscription-cron-out.log",
      log_file: "logs/subscription-cron-combined.log",
      time: true,
    },
  ],
};
