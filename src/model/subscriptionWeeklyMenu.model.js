const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn } = require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();


const MenuItemSchema = new Schema({
    day: String,
    lunch: {
        description: String
    },
    dinner: {
        description: String
    },
    breakfast: {
        description: String
    },
    type: String,
    sequence: Number
}, { _id: false });

const SubscriptionWeeklyMenu = new Schema({
    packageCategory: String,
    clusterIds: [{ type: String }],
    weekMenuList: [
        {
            weekNumber: Number,
            isSelected: Boolean,
            selectedMenuType: {
                type: String,
                enum: ['veg', 'nonveg']
            },
            vegMenuList: [MenuItemSchema],
            nonvegMenuList: [MenuItemSchema]
        }
    ]
})


module.exports = remoteMongoDb.model('subscriptionWeeklyMenu', SubscriptionWeeklyMenu)