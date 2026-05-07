const FoodItem = require('../model/bulkFoodItem.model');

const saveBulkFoodItem = async (foodItem, imageName) => {
    const nFoodItem = new FoodItem();
    nFoodItem.imageUrl = imageName;
    nFoodItem.itemName = foodItem.itemName;
    nFoodItem.itemType = foodItem.itemType;
    nFoodItem.itemFlavour = foodItem.itemFlavour;
    nFoodItem.itemServingType = foodItem.itemServingType;
    nFoodItem.slab1Price = foodItem.slab1Price;
    nFoodItem.slab2Price = foodItem.slab2Price;
    nFoodItem.slab3Price = foodItem.slab3Price;
    nFoodItem.slab4Price = foodItem.slab4Price;
    nFoodItem.payAmtToKitchen = foodItem.payAmtToKitchen;
    nFoodItem.itemDescription = foodItem.itemDescription;
    nFoodItem.packagingCost = foodItem.packagingCost;
    nFoodItem.packagingDescription = foodItem.packagingDescription;
    const isInserted = await nFoodItem.save();
    return isInserted;
};

const getAllBulkFooditems = async () => {
    const foodItems = await FoodItem.find({});
    return foodItems;
};

const deleteBulkFoodItem = async (id) => {
    const item = await FoodItem.findOneAndDelete({ _id: id });
    return item;
};

const updateBulkfoodItem = async (id, foodItem, imageName) => {
    const nFoodItem = {};
    if (imageName) {
        nFoodItem.imageUrl = imageName;
    }
    nFoodItem.itemName = foodItem.itemName;
    nFoodItem.itemType = foodItem.itemType;
    nFoodItem.itemFlavour = foodItem.itemFlavour;
    nFoodItem.itemServingType = foodItem.itemServingType;
    nFoodItem.slab1Price = foodItem.slab1Price;
    nFoodItem.slab2Price = foodItem.slab2Price;
    nFoodItem.slab3Price = foodItem.slab3Price;
    nFoodItem.slab4Price = foodItem.slab4Price;
    nFoodItem.itemDescription = foodItem.itemDescription;
    nFoodItem.payAmtToKitchen = foodItem.payAmtToKitchen;
    nFoodItem.packagingCost = foodItem.packagingCost;
    nFoodItem.packagingDescription = foodItem.packagingDescription;
    const isInserted = await FoodItem.findOneAndUpdate({ _id: id }, { $set: nFoodItem }, { new: true });
    return isInserted;
};

const getAllBulkFooditemsImages = async () => {
    const imageUrlList = await FoodItem.find({}, { imageUrl: 1 });
    return imageUrlList;
};

module.exports = {
    saveBulkFoodItem,
    updateBulkfoodItem,
    getAllBulkFooditems,
    deleteBulkFoodItem,
    getAllBulkFooditemsImages
}