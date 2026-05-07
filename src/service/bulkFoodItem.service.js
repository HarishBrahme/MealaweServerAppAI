const dao = require('../dao/bulkFoodItem.dao');
const { syncBulkMenu } = require('./bulkMenu.service');

const saveBulkFoodItem = async (foodItemObj, imageName) => {
    const savedItem = await dao.saveBulkFoodItem(foodItemObj, imageName);
    return savedItem;
};

const getAllBulkFooditems = async () => {
    const savedItem = await dao.getAllBulkFooditems();
    return savedItem;
};

const updateBulkfoodItem = async (id, foodItemObj, imageName) => {
    const savedItem = await dao.updateBulkfoodItem(id, foodItemObj, imageName);
    //sync
    // console.log('//sync')
    syncBulkMenu(savedItem);
    return savedItem;
};

const deleteBulkFoodItem = async (id) => {
    const deletedItem = await dao.deleteBulkFoodItem(id);
    return deletedItem;
};

module.exports = {
    saveBulkFoodItem,
    updateBulkfoodItem,
    getAllBulkFooditems,
    deleteBulkFoodItem
}