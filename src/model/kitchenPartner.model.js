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


const kitchenPartner = new Schema({
  kitchenPartnerName: { type: String, required: true, index: true },
  kitchenName: { type: String, trim: true, index: true, required: true, unique: true },
  loginId: { type: String, required: true },
  imageUrl: String,
  address: {
    address1: String,
    address2: String,
    landmark: String,
  },
  geolocation: { lat: Number, lng: Number },
  location: { type: pointSchema, index: '2dsphere' },
  phoneNo: { type: String, unique: true, required: true },
  mapTelNo:{type: String },
  email: { type: String, unique: true },
  speciality: String,
  mainSpeciality: String,
  mealType: [{ type: String, enum: ['Veg', 'NonVeg', 'Jain'] }],
  kitchenOpened: Boolean,
  preparationTime: Number,
  mealTiming: [
    {
      mealType: { type: String, enum: ['Breakfast', 'Lunch', 'HighTea', 'Dinner'] },
      acceptOrderFrom: { type: Date },
      acceptOrderTill: { type: Date },
    }],
  clusters: [{ type: String }],
  rating: Number,
  profileApproval: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended'] },
  kitchenApprovedOn: Date,
  referralCode: String,
  installReferrer: String,
  localArea: String,
  compliance: {
    fssaiImageUrl: String,
    fssai: String,
    fssaiExpiryDate: Date,
    adhaarFrontImageUrl: String,
    adhaarBackImageUrl: String,
    adhaar: String,
    comment: String,
    gstNumber: String,
    agreementPdfUrl: String, 
    kitchenImageUrl: String      
  },
  discountOffer: {
    discountType: { type: String, enum: ['percentage', 'flat'] },
    maxLimit: Number,
    minAmount: Number,
    discountValue: Number,
    startDate: Date,
    expiryDate: Date
  },
  subscriptionAllowed: Boolean,
  subscriptionDiscount: [{
    discountType: { type: String, enum: ['percentage', 'flat'] },
    days: Number,
    discountValue: Number
  }],
  subscriptionTiming: [{
    mealType: { type: String, enum: ['Breakfast', 'Lunch', 'Dinner'] },
    slot: String,
    deliveryReadyBy: { type: Date }
  }],
  kitchenType: [{ type: String, enum: ['B2C', 'B2B', 'Subscription', 'Oyo', 'Tier2', 'Apartment','ApartmentBulk'] }],
  deliveryByMealaweBoy: Boolean,
  skipWalletPayment: Boolean,
   // New apartment info field
  // apartmentInfo: apartmentInfoSchema
  apartmentInfo: {
    apartmentId: { type: Schema.Types.ObjectId, ref: 'Apartments' },
    apartmentName: String
  }
});

module.exports = remoteMongoDb.model('KitchenPartner', kitchenPartner);