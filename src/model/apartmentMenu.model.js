const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

// const pointSchema = new mongoose.Schema({
//   type: {
//     type: String,
//     enum: ['Point'],
//     required: true
//   },
//   coordinates: {
//     type: [Number],
//     required: true
//   }
// });

const apartmentMenuSchema = new Schema({
  kitchenName: { type: String, trim: true, required: true },
  kitchenId: { type: Schema.Types.ObjectId, required: true },
  kitchenOpened: Boolean,
  // clusters: [{ type: String }],
  // location: { type: pointSchema, index: '2dsphere' },
  menuCreatedOn: { type: Date, required: true },
  itemList: [{
    itemServingDate: { type: Date, required: true },
    itemName: { type: String, trim: true, index: true, required: true },
    imageUrl: String,
    itemRegion: String,
    aliasNames: String,
    itemFlavour: { type: String, enum: ['Sweet', 'Sour', 'Normal'] },
    itemType: { type: String, enum: ['Veg', 'NonVeg', 'Jain'] },
    itemServingType: { type: String, enum: ['perPerson', 'perUnit', 'perQuantity'] },
    itemPrice: { type: Number, required: true },
    itemDescription: String,
    spicyLevel: { type: Number, min: 0, max: 3 },
    servesTo: { type: Number, required: true }, // Total servings kitchen will prepare
    tasteOfRegion: String,
    quantityAvailable: { 
      type: Number, 
      required: true,
      default: function() { return this.servesTo - (this.quantityBooked || 0); }
    }, // Auto-calculated: servesTo - quantityBooked
    quantityBooked: { type: Number, required: true, default: 0 }, // How many are booked
    mealType: { type: String, enum: ['Breakfast', 'Lunch', 'HighTea', 'Dinner'] },
    servingQuantity: Number,
    servingQuantityUnit: String,
    searchCategory: String,
    groupCategory: String,
    itemQty: String,
    searchKeyword: String,
    preparationTime: Number,
    inflatePrice: Boolean,
    deliveryEnabled: { 
      type: Boolean, 
      default: true, // Default to enabled (available for delivery)
      required: true 
    }

  }],
  moq: Number,
  slabLimit1: Number,
  slabLimit2: Number,
  slabLimit3: Number,
  dateLimit1: Number,
  dateLimit2: Number,
  dateLimit3: Number,
  deliverySlab1: Number,
  deliverySlab2: Number,
  deliverySlab3: Number,
  packagingCharges: Number,
  platformCharges: Number,
  bulkInfo:{moq: Number},
  bulkItemList: [{
    imageUrl: String,
    itemName: { type: String, trim: true, index: true, required: true },
    itemPrice: Number,
    itemType: { type: String, enum: ['Veg', 'NonVeg', 'Jain'] },
    itemFlavour: { type: String, enum: ['Sweet', 'Sour', 'Normal'] },
    itemServingType: { type: String, enum: ['perPerson', 'perUnit', 'perQuantity'] },
    slab1Price: { type: Number, required: true },
    slab2Price: { type: Number, required: true },
    slab3Price: { type: Number, required: true },
    slab4Price: { type: Number, required: true },
    payAmtToKitchen: Number,
    packagingCost: Number,
    packagingDescription: String,
    itemDescription: String,
    group: String,
    mainMenuItemId: { type: Schema.Types.ObjectId }
}]
});

// Add pre-save middleware to auto-calculate quantityAvailable
apartmentMenuSchema.pre('save', function(next) {
  if (this.itemList && this.itemList.length > 0) {
    this.itemList.forEach(item => {
      if (item.servesTo !== undefined && item.quantityBooked !== undefined) {
        item.quantityAvailable = item.servesTo - item.quantityBooked;
      }
    });
  }
  next();
});

module.exports = remoteMongoDb.model('ApartmentMenu', apartmentMenuSchema);

// ************************************************************
// 1. Get Apartment Menu
// API: GET /apartmentMenu/:id/:clientDate

// Request:

// bash
// GET /apartmentMenu/507f1f77bcf86cd799439011/2024-01-15
// Headers: 
//   Authorization: Bearer <token>

// ************************************************************

// 2. Save Apartment Menu
// API: POST /saveApartmentMenu

// Request Body:
// {
//   "kitchenName": "Sunrise Apartment Kitchen",
//   "kitchenId": "507f1f77bcf86cd799439011",
//   "kitchenOpened": true,
//   "clusters": ["Downtown", "Premium"],
//   "menuCreatedOn": "2024-01-15T00:00:00.000Z",
//   "geolocation": {
//     "lng": 72.8777,
//     "lat": 19.0760
//   },
//   "itemList": [
//     {
//       "itemServingDate": "2024-01-15T12:00:00.000Z",
//       "itemName": "Butter Chicken",
//       "imageUrl": "https://example.com/butter-chicken.jpg",
//       "itemRegion": "North Indian",
//       "aliasNames": "Murgh Makhani",
//       "itemFlavour": "Normal",
//       "itemType": "NonVeg",
//       "itemServingType": "perPerson",
//       "itemPrice": 250,
//       "itemDescription": "Creamy butter chicken with mild spices",
//       "spicyLevel": 2,
//       "servesTo": 1,
//       "tasteOfRegion": "Punjabi",
//       "quantityAvailable": 20,
//       "quantityBooked": 0,
//       "mealType": "Lunch",
//       "servingQuantity": 1,
//       "servingQuantityUnit": "plate",
//       "searchCategory": "Main Course",
//       "groupCategory": "Curry",
//       "searchKeyword": "chicken curry main course",
//       "preparationTime": 30,
//       "inflatePrice": false
//     },
//     {
//       "itemServingDate": "2024-01-15T20:00:00.000Z",
//       "itemName": "Paneer Tikka",
//       "imageUrl": "https://example.com/paneer-tikka.jpg",
//       "itemRegion": "North Indian",
//       "aliasNames": "Cottage Cheese Grill",
//       "itemFlavour": "Normal",
//       "itemType": "Veg",
//       "itemServingType": "perUnit",
//       "itemPrice": 180,
//       "itemDescription": "Grilled cottage cheese with spices",
//       "spicyLevel": 1,
//       "servesTo": 1,
//       "tasteOfRegion": "Mughlai",
//       "quantityAvailable": 15,
//       "quantityBooked": 0,
//       "mealType": "Dinner",
//       "servingQuantity": 6,
//       "servingQuantityUnit": "pieces",
//       "searchCategory": "Starter",
//       "groupCategory": "Appetizer",
//       "searchKeyword": "paneer starter veg",
//       "preparationTime": 25,
//       "inflatePrice": false
//     }
//   ]
// }
// ************************************************************

// 3. Update Apartment Menu
// API: POST /updateApartmentMenu/:id

// Request Body:

// json
// {
//   "kitchenOpened": false,
//   "clusters": ["Downtown", "Premium", "Luxury"],
//   "geolocation": {
//     "lng": 72.8780,
//     "lat": 19.0765
//   },
//   "itemList": [
//     {
//       "itemServingDate": "2024-01-15T12:00:00.000Z",
//       "itemName": "Butter Chicken",
//       "itemPrice": 270,
//       "quantityAvailable": 15,
//       "quantityBooked": 3,
//       "spicyLevel": 3
//     }
//   ]
// }

// ************************************************************

// 4. Update Quantity Available
// API: POST /updateQuantityAvailable/:id

// Request Body:

// json
// [
//   {
//     "itemName": "Butter Chicken",
//     "count": 2
//   },
//   {
//     "itemName": "Paneer Tikka",
//     "count": 3
//   }
// ]


// ************************************************************

// 5. Validate Apartment Food Order
// API: POST /validateApartmentFoodOrder/:clientDayStartTime

// Request Body:

// json
// {
//   "kitchenId": "507f1f77bcf86cd799439011",
//   "itemList": [
//     {
//       "itemName": "Butter Chicken",
//       "count": 2
//     },
//     {
//       "itemName": "Paneer Tikka",
//       "count": 1
//     }
//   ],
//   "addOns": [
//     {
//       "addOnName": "Garlic Naan",
//       "count": 2
//     }
//   ]
// }

// ************************************************************