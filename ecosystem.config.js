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
        PORT: 5001,
        PROXY_HOST: "13.95.173.197",
        PROXY_PORT: 80,
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
        PORT: 5002,

        PROXY_HOST: "117.74.65.215",
        PROXY_PORT: 10443,
      },
    },
    {
      name: "collector3",
      script: "build/index.js",
      watch: false,
      autorestart: false,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 5003,

        PROXY_HOST: "117.74.65.215",
        PROXY_PORT: 7890,
      },
    },
    {
      name: "collector4",
      script: "build/index.js",
      watch: false,
      autorestart: false,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 5004,
        PROXY_HOST: "135.181.15.198",
        PROXY_HOST: "117.74.65.215",
        PROXY_PORT: 8888,
      },
    },
    {
      name: "collector5",
      script: "build/index.js",
      watch: false,
      autorestart: false,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 5005,
        PROXY_HOST: "117.74.65.215",
        PROXY_PORT: 8081,
      },
    },
    {
      name: "collector6",
      script: "build/index.js",
      watch: false,
      autorestart: false,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 5006,
        PROXY_HOST: "104.43.230.151",
        PROXY_PORT: 3128,
      },
    },
    {
      name: "collector7",
      script: "build/index.js",
      watch: false,
      autorestart: false,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 5007,
        PROXY_HOST: "117.74.65.215",
        PROXY_PORT: 84,
      },
    },
    {
      name: "collector8",
      script: "build/index.js",
      watch: false,
      autorestart: false,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 5008,
        PROXY_HOST: "117.74.65.215",
        PROXY_PORT: 8082,
      },
    },
    {
      name: "collector9",
      script: "build/index.js",
      watch: false,
      autorestart: false,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 5009,
        PROXY_HOST: "117.74.65.215",
        PROXY_PORT: 8282,
      },
    },
    {
      name: "collector10",
      script: "build/index.js",
      watch: false,
      autorestart: false,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 5010,
        PROXY_HOST: "117.74.65.215",
        PROXY_PORT: 87,
      },
    },
  ],
};
