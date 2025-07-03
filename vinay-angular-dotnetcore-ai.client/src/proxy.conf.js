const { env } = require('process');

const target = env.ASPNETCORE_HTTPS_PORT ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}` :
  env.ASPNETCORE_URLS ? env.ASPNETCORE_URLS.split(';')[0] : 'https://localhost:7145';

const PROXY_CONFIG = [
  //{
  //  context: [
  //    "/api",
  //    "/upload",
  //    "/weatherforecast"
  //  ],
  //  target,
  //  secure: false,
  //  changeOrigin: true,
  //  logLevel: "debug"
  //}
  {
    "/api/**": {
      "target": 'https://localhost:7145',
      "secure": false,
      "changeOrigin": true,
      "logLevel": "debug",
      "pathRewrite": {
        "^/api": ""
      }
    }
  }
]

module.exports = PROXY_CONFIG;
