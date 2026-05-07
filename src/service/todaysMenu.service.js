const todaysMenuDao = require('../dao/todaysMenu.dao');
const kitchenMenuDao = require('../dao/kitchenMenu.dao');

const getTodaysMenu = async (kitchenId, clientDate) => {
    return todaysMenuDao.getTodaysMenu(kitchenId, clientDate);
};

const saveTodaysMenu = async (todaysMenu) => {
    return todaysMenuDao.saveTodaysMenu(todaysMenu);
};
const updateTodaysMenu = async (kitchenId, updateTodaysMenu) => {
    return todaysMenuDao.updateTodaysMenu(kitchenId, updateTodaysMenu);
};
const updateKitchenInfo = async (kitchen) => {
    try {
        todaysMenuDao.updateKitchenInfo(kitchen);
    } catch (error) {
        // console.log('KitchenMenu.service updateKitchenInfo ==> ',error);
    }

};
const searchTodaysMenu = async (text) => {
    return await todaysMenuDao.searchTodaysMenu(text)
}
const updateQuantityAvailable = async (kitchenId, itemList) => {
    return await todaysMenuDao.updateQuantityAvailable(kitchenId, itemList);
}
const updateQuantityBooked = async (kitchenId, itemList, decreaseCount) => {
    try {
        return await todaysMenuDao.updateQuantityBooked(kitchenId, itemList, decreaseCount);
    } catch (e) {
        // console.log('Error while updating booked quantity ',e)
    }
}
const validateDailyFoodOrder = async (foodOrder, clientDayStartTime) => {
    let orderObj = { validOrder: false, msg: 'Order details are invalid, kindly clear the cart and try again' };
    if (foodOrder.kitchenId) {
        const itemList = foodOrder.itemList;
        const addOnsList = foodOrder.addOns;
        const todaysMenu = await todaysMenuDao.getTodaysMenu(foodOrder.kitchenId, clientDayStartTime);
        const kitchenMenu = await kitchenMenuDao.getKitchenMenu(foodOrder.kitchenId);
        orderObj.msg = 'Kitchen is not available any more, kindly order using some other kitchen';

        if (todaysMenu && todaysMenu._id && todaysMenu.kitchenOpened &&
            kitchenMenu && kitchenMenu._id && kitchenMenu.kitchenOpened) {
            let availableCount = 0;
            let availableAddonCount = 0;
            [...todaysMenu.itemList].forEach(item => {
                itemList.forEach(element => {
                    if (element.itemName === item.itemName) {
                        if (!item.quantityBooked) {
                            item.quantityBooked = 0;
                        }
                        const availableQantity = item.quantityAvailable - item.quantityBooked;
                        if (availableQantity > 0 && availableQantity >= element.count) {
                            availableCount++
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
            // console.log('validateDailyFoodOrder ',availableCount,itemList.length, availableAddonCount,addOnsList.length);
            if (availableCount === itemList.length && availableAddonCount === addOnsList.length) {
                orderObj.validOrder = true;
                orderObj.msg = 'valid order';
            }

        }
    }
    return orderObj;
};

module.exports = {
    getTodaysMenu,
    saveTodaysMenu,
    updateTodaysMenu,
    updateKitchenInfo,
    searchTodaysMenu,
    updateQuantityAvailable,
    updateQuantityBooked,
    validateDailyFoodOrder
}