const dao = require('../dao/foodItem.dao');
const { syncKitchenMenuItem, saveKitchenSpecialMenu, deleteKitchenSpecialMenu } = require('./kitchenMenu.service');

const saveNewFoodItem = async (foodItemObj, imageName) => {
    const savedItem = await dao.saveNewFoodItem(foodItemObj, imageName);
    if (savedItem && savedItem.isSpecialMenu) {
        saveKitchenSpecialMenu(savedItem);
    }
    return savedItem;
};

const getFoodItemList = async (query, text) => {
    const foodItemList = await dao.getFoodItemList(query, text);
    return foodItemList;
};

const deleteFoodItemList = async (ids) => {
    return dao.deleteFoodItemList(ids);
}


const getFoodItem = async (id) => {
    return dao.getFooditem(id)
}
const getAllFoodItems = async () => {
    return dao.getAllFoodItems()
}

const deleteFooditem = async (id) => {
    const deletedItem = await dao.deleteFooditem(id);
    if (deletedItem && deletedItem.isSpecialMenu) {
        deleteKitchenSpecialMenu(deletedItem);
    }
    return deletedItem;
}

const updateFoodItem = async (id, foodItemObj, imageName) => {
    const updatefooditem = await dao.updateFoodItem(id, foodItemObj, imageName);
    syncKitchenMenuItem(updatefooditem);
    if (updatefooditem && updatefooditem.isSpecialMenu) {
        saveKitchenSpecialMenu(updatefooditem);
    }
    return updatefooditem;
}

const getSpecialItems = async () => {
    return dao.getSpecialItems();
}

const getSubscriptionItemList = async () => {
    return dao.getSubscriptionItemList()
}

module.exports = {
    saveNewFoodItem,
    getFoodItemList,
    deleteFoodItemList,
    getFoodItem,
    getAllFoodItems,
    deleteFooditem,
    updateFoodItem,
    getSpecialItems,
    getSubscriptionItemList
}

