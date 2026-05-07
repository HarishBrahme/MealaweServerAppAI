const kitchenMenuDao = require('../dao/kitchenMenu.dao');

const getKitchenMenu = async (kitchenId) => {
    return kitchenMenuDao.getKitchenMenu(kitchenId);
};
const getKitchMenuByClusterAndKitchenType = async (cluster, kitchenType) => {
    return kitchenMenuDao.getKitchMenuByClusterAndKitchenType(cluster, kitchenType);
}

const saveKitchenMenu = async (kitchenMenu) => {
    return kitchenMenuDao.saveKitchenMenu(kitchenMenu);
};
const updateKitchenMenu = async (kitchenId, updateKitchenMenu) => {
    return kitchenMenuDao.updateKitchenMenu(kitchenId, updateKitchenMenu);
};
const updateKitchenInfo = async (kitchen) => {
    try {
        kitchenMenuDao.updateKitchenInfo(kitchen);
    } catch (error) {
        // console.log('KitchenMenu.service updateKitchenInfo ==> ',error);
    }

};
const updateAddonAvailability = async (id, aid, available) => {
    return kitchenMenuDao.updateAddonAvailability(id, aid, available);
};
const updateItemAvailability = async (id, itemId, available) => {
    return kitchenMenuDao.updateItemAvailability(id, itemId, available);
};
const updateItemServeDaily = async (id, itemId, available) => {
    return kitchenMenuDao.updateItemServeDaily(id, itemId, available);
};
const searchKitchenMenu = async (text) => {
    return await kitchenMenuDao.searchKitchenMenu(text)
};
const getKitchenItemList = async (kitchenId) => {
    return await kitchenMenuDao.getKitchenItemList(kitchenId);
}
const getKitchenAddonList = async (kitchenId) => {
    return await kitchenMenuDao.getKitchenAddonList(kitchenId);
}
const validateAdvanceFoodOrder = async (foodOrder) => {
    let orderObj = { validOrder: false, msg: 'Order details are invalid, kindly clear the cart and try again' };
    if (foodOrder.kitchenId) {
        const itemList = foodOrder.itemList;
        const addOnsList = foodOrder.addOns;
        const kitchenMenu = await kitchenMenuDao.getKitchenMenu(foodOrder.kitchenId);
        orderObj.msg = 'Kitchen is not available any more, kindly order using some other kitchen';
        // console.log('validateAdvanceFoodOrder ',);
        if (kitchenMenu && kitchenMenu._id && kitchenMenu.kitchenOpened) {
            // console.log('validating daily order ',);
            let availableItemCount = 0;
            let availableAddonCount = 0;
            [...kitchenMenu.itemList].forEach(item => {
                itemList.forEach(element => {
                    if (element.itemName === item.itemName) {
                        if (item.itemAvailable) {
                            availableItemCount++
                        }
                    }
                });
            });
            [...kitchenMenu.addOnsList].forEach(addOn => {
                addOnsList.forEach(element => {
                    if (element.addOnName === addOn.addOnName) {
                        if (addOn.addOnAvailable) {
                            availableAddonCount++
                        }
                    }
                });
            });
            orderObj.msg = 'Few of the Items or addons in the cart are not available any more';
            if (availableItemCount === itemList.length && availableAddonCount === addOnsList.length) {
                orderObj.validOrder = true;
                orderObj.msg = 'valid order';
            }
        }
    }
    return orderObj;
};

const syncKitchenMenuItem = async (foodItem) => {
    try {
        await kitchenMenuDao.syncKitchenMenuItem(foodItem);
    } catch (error) {
        // console.log('syncKitchenMenuItem service error ',error)
    }
}

const saveKitchenSpecialMenu = async (foodItem) => {
    try {
        await kitchenMenuDao.saveKitchenSpecialMenu(foodItem);
    } catch (error) {
        // console.log('saveKitchenSpecialMenu service error ',error)
    }
}

const deleteKitchenSpecialMenu = async (foodItem) => {
    try {
        await kitchenMenuDao.deleteKitchenSpecialMenu(foodItem);
    } catch (error) {
        // console.log('deleteKitchenSpecialMenu service error ',error)
    }
}

module.exports = {
    getKitchenMenu,
    saveKitchenMenu,
    updateKitchenMenu,
    updateKitchenInfo,
    searchKitchenMenu,
    updateAddonAvailability,
    updateItemAvailability,
    getKitchenItemList,
    getKitchenAddonList,
    validateAdvanceFoodOrder,
    syncKitchenMenuItem,
    updateItemServeDaily,
    saveKitchenSpecialMenu,
    deleteKitchenSpecialMenu,
    getKitchMenuByClusterAndKitchenType
}