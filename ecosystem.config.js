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
        HTTPS_PROXY: "http://43.157.119.236:19596",
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
        HTTPS_PROXY: "http://43.133.45.244:18560",
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
        HTTPS_PROXY: "http://43.157.119.236:19739",
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
        HTTPS_PROXY: "170.106.117.131:19035",
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
        HTTPS_PROXY: "http://43.157.119.236:19737",
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
        HTTPS_PROXY: "http://43.157.119.236:19740",
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
        HTTPS_PROXY: "http://43.130.35.101:19249",
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
        HTTPS_PROXY: "http://43.133.45.244:19827",
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
        HTTPS_PROXY: "http://43.157.119.236:19738",
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
        HTTPS_PROXY: "http://43.157.121.234:19959",
      },
    },
  ],
};
