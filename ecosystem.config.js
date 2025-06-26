module.exports = {
  apps: [
    {
      name: "reading-champ",
      script: "node_modules/.bin/next",
      args: "start -p 8443",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "2G",
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
      script: "./scripts/medal-cron.ts",
      interpreter: "tsx",
      cron_restart: "0 0 * * *", // Daily at midnight
      autorestart: false, // Don't restart after it completes
      watch: false,
      env: {
        NODE_ENV: "production",
      },
      error_file: "logs/cron-error.log",
      out_file: "logs/cron-out.log",
      log_file: "logs/cron-combined.log",
      time: true,
    },
  ],
};
