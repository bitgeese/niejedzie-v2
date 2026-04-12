module.exports = {
  apps: [{
    name: "niejedzie",
    script: "npm",
    args: "start",
    cwd: "/opt/niejedzie/niejedzie-v2",
    instances: 1,
    autorestart: true,
    env: {
      NODE_ENV: "production",
      PORT: "3000",
      DATABASE_PATH: "/opt/niejedzie/niejedzie-v2/niejedzie.db",
    },
  }],
};
