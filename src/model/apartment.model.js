const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn } = require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true
  },
  coordinates: {
    type: [Number],
    required: true
  }
});

const apartments = new Schema({
  apartmentName: String,
  address: {
    address: String,
    location: String,
    landmark: String,
    pincode: Number
  },
  imageUrl: String,
  geolocation: { lat: Number, lng: Number },
  location: { type: pointSchema, index: '2dsphere' },
  coordinates: [{ lat: Number, lng: Number }],
  isActive: { 
    type: Boolean, 
    default: true 
  }

}, {
  timestamps: true
});

module.exports = remoteMongoDb.model('Apartments', apartments);