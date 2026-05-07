const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
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


const oyoHotels = new Schema({
  hotelName: String,
  address: {
    address: String,
    location: String,
    landmark: String,
    pincode: Number
  },
  imageUrl: String,
  geolocation: { lat: Number, lng: Number },
  location: { type: pointSchema, index: '2dsphere' },
  cordinates: [{ lat: Number, lng: Number }],
  totalRooms: Number,
  roomsInfo: [{ roomNo: String }],
  startTime: String,
  endTime: String,
  kitchenInfo: {
    kitchenId: { type: Schema.Types.ObjectId, required: true },
    kitchenName: String,
    kitchenPhoneNo: String,
    kitchenAddress: {
      address1: String,
      address2: String,
      landmark: String,
    },
    kitchenGeolocation: { lat: Number, lng: Number },
  }
}, {
  timestamps: true
});

module.exports = remoteMongoDb.model('OyoHotels', oyoHotels);
