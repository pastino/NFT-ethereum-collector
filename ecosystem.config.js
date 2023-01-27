module.exports = {
  apps: [
    {
      name: "app",
      script: "src/index.ts",
      autorestart: true,
      exec_mode: "fork",
      watch: true,
    },
  ],
};
