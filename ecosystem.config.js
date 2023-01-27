module.exports = {
  apps: [
    {
      name: "app",
      script: "build/index.js",
      watch: false,
      autorestart: false,
      instances: 1,
      exec_mode: "fork",
    },
  ],
};
