module.exports = {
  apps: [
    {
      name: "collector1",
      script: "build/index.js",
      watch: false,
      autorestart: false,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        port: 5001,
      },
    },
    {
      name: "collector2",
      script: "build/index.js",
      watch: false,
      autorestart: false,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        port: 5002,
      },
    },
  ],
};
