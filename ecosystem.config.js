module.exports = {
  apps: [
    {
      name: "collector1",
      script: "build/index.js",
      watch: false,
      autorestart: false,
      instances: 1,
      exec_mode: "fork",
    },
    {
      name: "collector2",
      script: "build/index.js",
      watch: false,
      autorestart: false,
      instances: 1,
      exec_mode: "fork",
    },
  ],
};
