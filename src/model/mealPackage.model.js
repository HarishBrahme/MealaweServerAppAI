const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const mealPackage = new Schema({
    imageUrl: String,
    packageName: String,
    packagePrice: Number,
    packageCategory: String,
    packageSubCategory: String,
    packageType: { type: String, enum: ['Veg', 'NonVeg'] },
    days: Number,
    payToKitchenPerMeal: Number,
    payToKitchenPerMeal2: Number,
    vegMealDescription: String,
    nonVegMealDescription: String,
    deliveryOnWeekends: Boolean,
    discount: Number,
    packageInfo: String,
    priority: Number,
    clusters: [{ type: String }],
    offerText: String,
    offerColor: String,
    multiDateAllowed: Boolean,
    isBreakFast: Boolean,
    isBestSeller:Boolean,
    searchCategory: String,
    addonsList: [{
        addonName: String,
        extraPrice: Number,
        payKitchenExtraPerMeal: Number,
        day: Number,
        dayText: String,
        dayCount: Number,
        addOnType: { type: String, enum: ['Veg', 'NonVeg', 'Sweet', 'NA'] },
        addonIconType: String,
        daily: Boolean,
        hidetoKitchen: Boolean
    }],
    menuList: [{
        day: String,
        dayText: String,
        description: String,
        menuType: { type: String, enum: ['Veg', 'NonVeg'] }
    }],
    isActive: Boolean
});

module.exports = remoteMongoDb.model('MealPackage', mealPackage);