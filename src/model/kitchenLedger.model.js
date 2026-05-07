const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const kitchenLedger = new Schema({    
    status: {type: String, enum:['New','InProgress', 'Closed'], required: true},
    remark: String,    
    createdOn: Date,
    transferOn: Date, 
    totalItemAmount: { type: Number, required: true },
    kitchenCommissionPercentage: Number,
    kitchenCommissionAmount: Number,
    kitchenLedgerAmt: { type: Number, required: true },
    orderNo: { type: String, required: true, unique: true },
    kitchenName: String,
    kitchenPhoneNo: String,
    kitchenEmail: String,
    kitchenUniqueId: String,
    kitchenId: {type: Schema.Types.ObjectId},
    orderType: {type: String, enum:['advance', 'daily', 'allDay', 'subscription', 'oyo', 'bulk','bulkMeals', 'individualMeals', 'bulkSnacks', 'individualSnacks', 'predefinedSnackbox', 'customSnackbox','apartment_today','apartment_advance','apartmentBulk' ], required: true},
    updateHistory: [{
        currentStatus: String,
        updatedOn: Date,
        updateRemark: String,
        updatedBy: String,
        updateByType: String
    }]
});

module.exports = remoteMongoDb.model('KitchenLedger', kitchenLedger);