const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

mongoose.set('useCreateIndex', true);
let remoteMongoDb;
let remoteDocumentDb;
function connectDB() {
  try {
    let url = process.env.MONGO_DB;
    remoteMongoDb = mongoose.createConnection(url, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true });
    remoteMongoDb.on('error', console.error.bind(console, 'connection error:'));
    remoteMongoDb.once('open', function () {
      console.log('connected to mongoDB ');
    });
  } catch (err) {
    console.log('MongoDB connection failed::', err);
  }

  try {
    let url = process.env.DOCUMENT_DB;
    let connectionObj = {};
    if (process.env.PRODUCTION === 'true') {
      const pemfile = path.resolve(__dirname, '../../global-bundle-prod.pem');
      console.log('pemfile', pemfile);
      const keyPairile = path.join(__dirname, '../../documentDBProdKeyPair.pem');
      console.log('keyPairile', keyPairile);
      url = url + '?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false';
      connectionObj = {
        sslValidate: true,
        sslCA: fs.readFileSync(pemfile),
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    } else if (process.env.STAGING === 'true') {
      const pemfile = path.resolve(__dirname, '../../global-bundle.pem');
      console.log('pemfile', pemfile);
      const keyPairile = path.join(__dirname, '../../documentdbKeyPair.pem');
      console.log('keyPairile', keyPairile);
      url = url + '?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false';
      connectionObj = {
        sslValidate: true,
        sslCA: fs.readFileSync(pemfile),
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    } else {
      url = url + '?ssl=true&sslValidate=false&directConnection=true';
      connectionObj = {
        sslValidate: false
      }
    }
    console.log('remoteDocumentDb url, connectionObj', url, connectionObj)
    remoteDocumentDb = mongoose.createConnection(url, connectionObj);
    remoteDocumentDb.on('error', function (error) {
      console.log('failed to remoteDocumentDb ', error);
    });
    remoteDocumentDb.once('open', function () {
      console.log('connected to remoteDocumentDb ');
    });
  } catch (err) {
    console.log('remoteDocumentDb connection failed::', err);
  }
  console.log('remoteMongoDb remoteDocumentDb ###2');
  return { remoteMongoDb, remoteDocumentDb }
}

const getDBconn = () => {
  return { remoteMongoDb, remoteDocumentDb };
}

module.exports = { connectDB, getDBconn }
