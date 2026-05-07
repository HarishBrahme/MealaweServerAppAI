const cluster = require("cluster");
const os = require("os");
const clusterWorkerSize = os.cpus().length;
if (cluster.isMaster) {
  require('dotenv-flow').config();
}
console.log('remoteMongoDb remoteDocumentDb ###0');
const dbConfig = require('./src/config/dbConfig');
dbConfig.connectDB();

const http = require("http");
const express = require('express');
const { connectRedis } = require('./src/config/redis.config');
const redisClient = connectRedis();
const compression = require('compression');
const responseTime = require('response-time');
const routeConfig = require('./src/config/routeConfig');
const { croneJobs } = require('./src/util/crone-job.util');
const { serverLog } = require("./src/util/firebasedb-util");
const { configureSMTP } = require("./src/config/smtp.config");

croneJobs();
configureSMTP();

const PORT = process.env.PORT || 5000;
console.log('environment ', process.env.PRODUCTION, process.env.STAGING, process.pid);
if (process.env.npm_config_autoscale) {
  // npm run start --autoscale=1
  console.log('inside autoscaling instance ')
}
let startServer = () => {
  const app = express();
  app.use(compression());
  app.use(responseTime());
  const server = http.createServer(app);
  const wsInstance = require("express-ws")(app, server);
  routeConfig(app, redisClient, wsInstance);

  server.listen(PORT, (err) => {
    if (err) {
      console.log(err);
    } else {
      serverLog(`Server is listening on port ${PORT} and process ${process.pid}. Started at ${new Date()}`);
      console.log(`Server is listening on port ${PORT} and process ${process.pid}. Started at ${new Date()}`)
    }
  });
}
// startServer();
if ((process.env.PRODUCTION === 'true' || process.env.STAGING === 'true') && clusterWorkerSize > 1) {
  console.log('starting cluster on ', process.env.NODE_ENV);
  if (cluster.isMaster) {
    console.log('cluster Worker Size ', clusterWorkerSize)
    for (let i = 0; i < clusterWorkerSize; i++) {
      console.log('Forking cluster ', i)
      cluster.fork();
    }
    cluster.on("exit", function (worker) {
      console.log("Worker", worker.id, " has exitted.")
    });
    cluster.on("disconnect", function (worker) {
      console.log("Worker", worker.id, " has disconnected.")
    });
  } else {
    console.log('starting worker server ', process.pid);
    startServer();
  }
} else {
  console.log('starting one server ');
  startServer();
}