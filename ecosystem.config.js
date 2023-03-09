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
        PROXY_URL: "http://43.133.45.244:19886",
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
        PROXY_URL: "http://43.157.121.234:19790",
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
        PROXY_URL: "http://43.157.121.234:19791",
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
        PROXY_URL: "http://43.157.119.236:19557",
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
        PROXY_URL: "http://43.130.35.101:19612",
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
        PROXY_URL: "http://170.106.117.131:19362",
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
        PROXY_URL: "http://43.157.119.236:19556",
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
        PROXY_URL: "http://43.130.35.101:19613",
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
        PROXY_URL: "http://170.106.117.131:19363",
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
        PROXY_URL: "http://43.133.45.244:19885",
      },
    },
    // {
    //   name: "collector1",
    //   script: "build/index.js",
    //   watch: false,
    //   autorestart: false,
    //   instances: 1,
    //   exec_mode: "fork",
    //   env: {
    //     NODE_ENV: "production",
    //     PORT: 5011,
    //     // PROXY_URL: "http://43.157.119.236:19596",
    //   },
    // },
    // {
    //   name: "collector2",
    //   script: "build/index.js",
    //   watch: false,
    //   autorestart: false,
    //   instances: 1,
    //   exec_mode: "fork",
    //   env: {
    //     NODE_ENV: "production",
    //     PORT: 5012,
    //     // PROXY_URL: "http://43.133.45.244:18560",
    //   },
    // },
    // {
    //   name: "collector3",
    //   script: "build/index.js",
    //   watch: false,
    //   autorestart: false,
    //   instances: 1,
    //   exec_mode: "fork",
    //   env: {
    //     NODE_ENV: "production",
    //     PORT: 5013,
    //     // PROXY_URL: "http://43.157.119.236:19739",
    //   },
    // },
    // {
    //   name: "collector4",
    //   script: "build/index.js",
    //   watch: false,
    //   autorestart: false,
    //   instances: 1,
    //   exec_mode: "fork",
    //   env: {
    //     NODE_ENV: "production",
    //     PORT: 5014,
    //     // PROXY_URL: "170.106.117.131:19035",
    //   },
    // },
    // {
    //   name: "collector5",
    //   script: "build/index.js",
    //   watch: false,
    //   autorestart: false,
    //   instances: 1,
    //   exec_mode: "fork",
    //   env: {
    //     NODE_ENV: "production",
    //     PORT: 5015,
    //     // PROXY_URL: "http://43.157.119.236:19737",
    //   },
    // },
    // {
    //   name: "collector6",
    //   script: "build/index.js",
    //   watch: false,
    //   autorestart: false,
    //   instances: 1,
    //   exec_mode: "fork",
    //   env: {
    //     NODE_ENV: "production",
    //     PORT: 5016,
    //     // PROXY_URL: "http://43.157.119.236:19740",
    //   },
    // },
    // {
    //   name: "collector7",
    //   script: "build/index.js",
    //   watch: false,
    //   autorestart: false,
    //   instances: 1,
    //   exec_mode: "fork",
    //   env: {
    //     NODE_ENV: "production",
    //     PORT: 5017,
    //     // PROXY_URL: "http://43.130.35.101:19249",
    //   },
    // },
    // {
    //   name: "collector8",
    //   script: "build/index.js",
    //   watch: false,
    //   autorestart: false,
    //   instances: 1,
    //   exec_mode: "fork",
    //   env: {
    //     NODE_ENV: "production",
    //     PORT: 5018,
    //     // PROXY_URL: "http://43.133.45.244:19827",
    //   },
    // },
    // {
    //   name: "collector9",
    //   script: "build/index.js",
    //   watch: false,
    //   autorestart: false,
    //   instances: 1,
    //   exec_mode: "fork",
    //   env: {
    //     NODE_ENV: "production",
    //     PORT: 5019,
    //     // PROXY_URL: "http://43.157.119.236:19738",
    //   },
    // },
    // {
    //   name: "collector10",
    //   script: "build/index.js",
    //   watch: false,
    //   autorestart: false,
    //   instances: 1,
    //   exec_mode: "fork",
    //   env: {
    //     NODE_ENV: "production",
    //     PORT: 5020,
    //     // PROXY_URL: "http://43.157.121.234:19959",
    //   },
    // },
  ],
};
