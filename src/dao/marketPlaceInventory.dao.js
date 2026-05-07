const MarketPlaceInventory = require('../model/marketPlaceInventory.model');

const saveMarketPlaceInventory = async (marketPlaceInventory) => {
    const nMarketPlaceInventory = new MarketPlaceInventory();
    nMarketPlaceInventory.inventoryName = marketPlaceInventory.inventoryName;
    nMarketPlaceInventory.pocName = marketPlaceInventory.pocName;
    nMarketPlaceInventory.pocPhNo = marketPlaceInventory.pocPhNo;
    nMarketPlaceInventory.address = marketPlaceInventory.address;
    nMarketPlaceInventory.geolocation = marketPlaceInventory.geolocation;
    nMarketPlaceInventory.itemList = [];
    const isInserted = await nMarketPlaceInventory.save();
    return isInserted;
}

const getMarketPlaceInventory = async () => {
    const list = await MarketPlaceInventory.find({});
    return list;
};
const getMarketPlaceInventoryById = async (id) => {
    const inventory = await MarketPlaceInventory.findOne({ _id: id });
    return inventory;
};

const updateMarketPlaceInventory = async (id, marketPlaceInventory) => {
    const inventory = await MarketPlaceInventory.findOne({ _id: id });
    if (inventory) {
        const nMarketPlaceInventory = {};
        nMarketPlaceInventory.inventoryName = marketPlaceInventory.inventoryName || inventory.inventoryName;
        nMarketPlaceInventory.pocName = marketPlaceInventory.pocName || inventory.pocName;
        nMarketPlaceInventory.pocPhNo = marketPlaceInventory.pocPhNo || inventory.pocPhNo;
        nMarketPlaceInventory.address = marketPlaceInventory.address || inventory.address;
        nMarketPlaceInventory.geolocation = marketPlaceInventory.geolocation || inventory.geolocation;
        nMarketPlaceInventory.itemList = marketPlaceInventory.itemList || inventory.itemList;
        const update = await MarketPlaceInventory.findOneAndUpdate({ _id: id }, { $set: nMarketPlaceInventory }, { new: true });
        return update;
    } else {
        return inventory;
    }
}

const deleteMarketPlaceInventory = async (id) => {
    const deleted = await MarketPlaceInventory.findByIdAndRemove({ _id: id });
    return deleted;
};

const getMarketPlaceInventoryByItemId = async (itemId) => {
    //const condition = {'itemList.itemId':itemId}    
    const condition = {};
    const inventoryList = await MarketPlaceInventory.find(condition);
    return inventoryList;
};

module.exports = {
    saveMarketPlaceInventory,
    getMarketPlaceInventory,
    getMarketPlaceInventoryById,
    updateMarketPlaceInventory,
    deleteMarketPlaceInventory,
    getMarketPlaceInventoryByItemId
}