const bulkMenuSchema = require('../model/bulkMenu.model');
const { ObjectId } = require('mongoose').Types;

const bulkMenuAdd = async (menu) => {
    // console.log(menu)
    const nBulkMenu = new bulkMenuSchema();
    nBulkMenu.bulkCategory = menu.bulkCategory;
    nBulkMenu.moq = menu.moq;
    nBulkMenu.slabLimit1 = menu.slabLimit1;
    nBulkMenu.slabLimit2 = menu.slabLimit2;
    nBulkMenu.slabLimit3 = menu.slabLimit3;
    nBulkMenu.dateLimit1 = menu.dateLimit1;
    nBulkMenu.dateLimit2 = menu.dateLimit2;
    nBulkMenu.dateLimit3 = menu.dateLimit3;
    nBulkMenu.deliverySlab1 = menu.deliverySlab1;
    nBulkMenu.deliverySlab2 = menu.deliverySlab2;
    nBulkMenu.deliverySlab3 = menu.deliverySlab3;
    nBulkMenu.packagingCharges = menu.packagingCharges;
    nBulkMenu.platformCharges = menu.platformCharges;
    nBulkMenu.itemList = menu.itemList;
    const isInserted = await nBulkMenu.save();
    return isInserted;
};

const updateBulkMenu = async (menu, id) => {
    const savedMenu = await bulkMenuSchema.findOne({ bulkCategory: menu.bulkCategory })
    if (savedMenu && savedMenu._id) {
        const nBulkMenu = {};
        // nBulkMenu.bulkCategory = menu.bulkCategory;
        nBulkMenu.moq = menu.moq;
        nBulkMenu.slabLimit1 = menu.slabLimit1;
        nBulkMenu.slabLimit2 = menu.slabLimit2;
        nBulkMenu.slabLimit3 = menu.slabLimit3;
        nBulkMenu.dateLimit1 = menu.dateLimit1;
        nBulkMenu.dateLimit2 = menu.dateLimit2;
        nBulkMenu.dateLimit3 = menu.dateLimit3;
        nBulkMenu.deliverySlab1 = menu.deliverySlab1;
        nBulkMenu.deliverySlab2 = menu.deliverySlab2;
        nBulkMenu.deliverySlab3 = menu.deliverySlab3;
        nBulkMenu.packagingCharges = menu.packagingCharges;
        nBulkMenu.platformCharges = menu.platformCharges;
        nBulkMenu.itemList = menu.itemList;
        const isInserted = await bulkMenuSchema.findOneAndUpdate({ bulkCategory: menu.bulkCategory }, { $set: nBulkMenu }, { new: true });
        return isInserted;
    }
    else {
        const nBulkMenu = new bulkMenuSchema();
        nBulkMenu.bulkCategory = menu.bulkCategory;
        nBulkMenu.moq = menu.moq;
        nBulkMenu.slabLimit1 = menu.slabLimit1;
        nBulkMenu.slabLimit2 = menu.slabLimit2;
        nBulkMenu.slabLimit3 = menu.slabLimit3;
        nBulkMenu.dateLimit1 = menu.dateLimit1;
        nBulkMenu.dateLimit2 = menu.dateLimit2;
        nBulkMenu.dateLimit3 = menu.dateLimit3;
        nBulkMenu.deliverySlab1 = menu.deliverySlab1;
        nBulkMenu.deliverySlab2 = menu.deliverySlab2;
        nBulkMenu.deliverySlab3 = menu.deliverySlab3;
        nBulkMenu.packagingCharges = menu.packagingCharges;
        nBulkMenu.platformCharges = menu.platformCharges;
        nBulkMenu.itemList = menu.itemList;
        const isInserted = await nBulkMenu.save();
        return isInserted;
    }
}

const fetchBulkMenu = async (category) => {
    const isInserted = await bulkMenuSchema.findOne({ bulkCategory: category });
    if (isInserted && Array.isArray(isInserted.itemList)) {
        isInserted.itemList.sort((a, b) => {
            return new ObjectId(b._id).getTimestamp() - new ObjectId(a._id).getTimestamp();
        });
    }
    return isInserted ? isInserted : {};
};

const getAllBulkMenu = async () => {
    const list = await bulkMenuSchema.find({});
    return list;
};

const syncBulkMenu = async (foodItem) => {
    const itemSetter = {};
    if (foodItem.imageUrl) {
        itemSetter['itemList.$.imageUrl'] = foodItem.imageUrl;
    }
    if (foodItem.itemName) {
        itemSetter['itemList.$.itemName'] = foodItem.itemName;
    }
    if (foodItem.itemDescription) {
        itemSetter['itemList.$.itemDescription'] = foodItem.itemDescription;
    }
    if (foodItem.itemDescription) {
        itemSetter['itemList.$.itemDescription'] = foodItem.itemDescription;
    }
    await bulkMenuSchema.updateMany(
        { 'itemList.mainMenuItemId': foodItem._id },
        { $set: itemSetter }
    );
}

const getAllBulkMenuImageList = async () => {
    const list = await bulkMenuSchema.find({}, { imageUrl: 1 });
    return list;
};

module.exports = {
    bulkMenuAdd,
    fetchBulkMenu,
    updateBulkMenu,
    syncBulkMenu,
    getAllBulkMenu,
    getAllBulkMenuImageList
}