const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const geoFencing = new Schema({
    clusterId: String,
    clusterName: String,
    clusterCoordinates: [{lat: Number, lng: Number}],
    active: Boolean,
    clusterConfigName: String,
});

module.exports = remoteMongoDb.model('GeoFencing', geoFencing);