const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const utmEventSchema = new Schema({
  utm_source: String,
  utm_medium: String,
  utm_campaign: String,
  utm_term: String,
  platformName: { type: String },
  userId: Schema.Types.ObjectId,
  userName: String,
  userPhoneNumber: String,
  userEmail: String,
  activity: String,
  pincode: String,
  clusterId: String,
  clusterName: String,
  createdAt: Date
});

module.exports = remoteMongoDb.model('UtmEvent', utmEventSchema);
