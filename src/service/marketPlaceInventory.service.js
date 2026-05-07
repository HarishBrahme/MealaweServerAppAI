const dao = require('../dao/marketPlaceInventory.dao');
const { saveInventoryItemHistory } = require('./marketPlaceInventoryItemHistory.service');

const saveMarketPlaceInventory = async (marketPlaceInventory) => {
    return dao.saveMarketPlaceInventory(marketPlaceInventory,);
};

const getMarketPlaceInventory = async () => {
    const list = await dao.getMarketPlaceInventory();
    return list;
};
const getMarketPlaceInventoryById = async (id) => {
    const inventory = await dao.getMarketPlaceInventoryById(id);
    return inventory;
};

const updateMarketPlaceInventory = async (id, marketPlaceInventory) => {
    const updatedInventory = await dao.updateMarketPlaceInventory(id, marketPlaceInventory);
    return updatedInventory;
}

const deleteMarketPlaceInventory = async (id) => {
    const inventory = await dao.deleteMarketPlaceInventory(id);
    return inventory;
};

const getMarketPlaceInventoryByItemId = async (id) => {
    const inventory = await dao.getMarketPlaceInventoryByItemId(id);
    return inventory;
};

const updateInventoryItemLimit = async (id, itemInfo) => {
    const inventory = await dao.getMarketPlaceInventoryById(id);
    if (inventory) {
        const itemList = inventory.itemList;
        let previousQuantity = 0;
        let transactionQuantity = 0;
        let finalQuantity = 0
        itemList.forEach(item => {
            if (item.itemId == itemInfo.itemId && item.itemServingUnit == itemInfo.itemServingUnit) {
                previousQuantity = item.availableQuantity;
                transactionQuantity = itemInfo.itemServingValue * itemInfo.count;
                item.availableQuantity -= transactionQuantity;
                finalQuantity = item.availableQuantity;
            }
        });
        const updatedInventory = await updateMarketPlaceInventory(id, { itemList });
        const transactionObj = {
            inventoryId: updatedInventory._id,
            inventoryName: updatedInventory.inventoryName,
            itemId: itemInfo.itemId,
            itemName: itemInfo.itemName,
            itemServingUnit: itemInfo.itemServingUnit,
            previousQuantity: previousQuantity,
            transactionQuantity: transactionQuantity,
            finalQuantity: finalQuantity,
            transactionType: 'REMOVE',
            orderNo: itemInfo.orderNo,
        };
        saveInventoryItemHistory(transactionObj);
        return updatedInventory;
    }
    return inventory;
};


module.exports = {
    saveMarketPlaceInventory,
    getMarketPlaceInventory,
    getMarketPlaceInventoryById,
    updateMarketPlaceInventory,
    deleteMarketPlaceInventory,
    getMarketPlaceInventoryByItemId,
    updateInventoryItemLimit
}