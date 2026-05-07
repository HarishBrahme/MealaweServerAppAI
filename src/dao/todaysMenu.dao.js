const TodaysMenu = require('../model/todaysMenu.model');
const { getTodayStartTime } = require('../util/date-util');

const getAllKitchenTodaysMenu = async () => {
    const todayMenu = await TodaysMenu.find({}, { kitchenId: 1 });
    return todayMenu;
}

const getTodaysMenu = async (kitchenId, clientDayStartTime) => {
    let today = getTodayStartTime();
    const todayMenu = await TodaysMenu.findOne({ kitchenId, menuCreatedOn: { $gte: today } });
    return todayMenu ? todayMenu : {};
}
const saveTodaysMenu = async (todaysMenu) => {
    const savedMenu = await TodaysMenu.findOne({ kitchenId: todaysMenu.kitchenId });
    if (savedMenu && savedMenu._id) {
        nMenu = {};
        nMenu.menuCreatedOn = new Date(todaysMenu.menuCreatedOn);
        nMenu.itemList = todaysMenu.itemList;
        nMenu.kitchenSpeciality = todaysMenu.kitchenSpeciality || savedMenu.kitchenSpeciality;
        nMenu.kitchenMainSpeciality = todaysMenu.kitchenMainSpeciality || savedMenu.kitchenMainSpeciality;
        nMenu.kitchenOpened = todaysMenu.kitchenOpened;
        nMenu.clusters = todaysMenu.clusters || savedMenu.clusters;
        if (todaysMenu.geolocation) {
            let geolocation = todaysMenu.geolocation;
            if (geolocation.lng && geolocation.lat) {
                nMenu.location = { type: 'Point', coordinates: [geolocation.lng, geolocation.lat] };
            } else {
                geolocation = JSON.parse(todaysMenu.geolocation);
                if (geolocation.lng && geolocation.lat) {
                    nMenu.location = { type: 'Point', coordinates: [geolocation.lng, geolocation.lat] };
                }
            }
        }
        const update = await TodaysMenu.findOneAndUpdate({ _id: savedMenu._id }, { $set: nMenu }, { new: true });
        return update;
    } else {
        const nTodaysMenu = new TodaysMenu();
        nTodaysMenu.kitchenName = todaysMenu.kitchenName;
        nTodaysMenu.kitchenId = todaysMenu.kitchenId;
        nTodaysMenu.kitchenSpeciality = todaysMenu.kitchenSpeciality;
        nTodaysMenu.kitchenMainSpeciality = todaysMenu.kitchenMainSpeciality;
        nTodaysMenu.kitchenOpened = todaysMenu.kitchenOpened;
        nTodaysMenu.clusters = todaysMenu.clusters;
        nTodaysMenu.menuCreatedOn = new Date(todaysMenu.menuCreatedOn);
        nTodaysMenu.itemList = todaysMenu.itemList;
        if (todaysMenu.geolocation) {
            let geolocation = todaysMenu.geolocation;
            if (geolocation.lng && geolocation.lat) {
                nTodaysMenu.location = { type: 'Point', coordinates: [geolocation.lng, geolocation.lat] };
            } else {
                geolocation = JSON.parse(todaysMenu.geolocation);
                if (geolocation.lng && geolocation.lat) {
                    nTodaysMenu.location = { type: 'Point', coordinates: [geolocation.lng, geolocation.lat] };
                }
            }
        }
        const isInserted = await nTodaysMenu.save();
        return isInserted;
    }

}
const updateTodaysMenu = async (kitchenId, updateTodaysMenu) => {
    const todayMenu = await TodaysMenu.findOne({ kitchenId });
    if (todayMenu && todayMenu._id) {
        todayMenu.clusters = updateTodaysMenu.clusters || todayMenu.clusters;
        todayMenu.itemList = updateTodaysMenu.itemList || todayMenu.itemList;
        todayMenu.kitchenSpeciality = updateTodaysMenu.kitchenSpeciality || todayMenu.kitchenSpeciality;
        todayMenu.kitchenMainSpeciality = updateTodaysMenu.kitchenMainSpeciality || todayMenu.kitchenMainSpeciality;
        todayMenu.kitchenOpened = updateTodaysMenu.kitchenOpened || todayMenu.kitchenOpened;
        if (updateTodaysMenu.geolocation) {
            let geolocation = updateTodaysMenu.geolocation;
            if (geolocation.lng && geolocation.lat) {
                todayMenu.location = { type: 'Point', coordinates: [geolocation.lng, geolocation.lat] };
            } else {
                geolocation = JSON.parse(updateTodaysMenu.geolocation);
                if (geolocation.lng && geolocation.lat) {
                    todayMenu.location = { type: 'Point', coordinates: [geolocation.lng, geolocation.lat] };
                }
            }
        }
        const update = await TodaysMenu.findOneAndUpdate({ _id: todayMenu._id }, { $set: todayMenu }, { new: true });
        return update;
    }
    else {
        // console.log('todayMenu not found ', todayMenu)
        return todayMenu;
    }
}

const updateKitchenInfo = async (kitchen) => {
    const KitchenInfo = {};
    KitchenInfo.kitchenName = kitchen.kitchenName;
    KitchenInfo.kitchenSpeciality = kitchen.kitchenSpeciality;
    KitchenInfo.kitchenOpened = kitchen.kitchenOpened;
    KitchenInfo.clusters = kitchen.clusters;
    if (kitchen.geolocation) {
        let geolocation = kitchen.geolocation;
        if (geolocation.lng && geolocation.lat) {
            KitchenInfo.location = { type: 'Point', coordinates: [geolocation.lng, geolocation.lat] };
        } else {
            geolocation = JSON.parse(kitchen.geolocation);
            if (geolocation.lng && geolocation.lat) {
                KitchenInfo.location = { type: 'Point', coordinates: [geolocation.lng, geolocation.lat] };
            }
        }
    }
    await TodaysMenu.findOneAndUpdate(
        { kitchenId: kitchen._id },
        { $set: KitchenInfo }
    );
}

const updateQuantityAvailable = async (kitchenId, itemList) => {
    const todayMenu = await TodaysMenu.findOne({ kitchenId });
    if (todayMenu && todayMenu._id) {
        const updatedItemList = [...todayMenu.itemList].map(item => {
            itemList.forEach(element => {
                if (element.itemName === item.itemName) {
                    item.quantityAvailable -= element.count;
                    item.quantityBooked -= element.count;
                    item.quantityAvailable = item.quantityAvailable >= 0 ? item.quantityAvailable : 0;
                    item.quantityBooked = item.quantityBooked >= 0 ? item.quantityBooked : 0;
                }
            });
            return item;
        });
        todayMenu.itemList = updatedItemList;
        const update = await TodaysMenu.findOneAndUpdate({ _id: todayMenu._id }, { $set: todayMenu }, { new: true });
        return update;
    } else {
        // console.log('todayMenu not found ', todayMenu)
        return todayMenu;
    }
}
const searchTodaysMenu = async (text, clientDate, clusterList) => {
    const regexText = new RegExp(text, 'i');
    // console.log('regex ', regexText);
    let today = getTodayStartTime();
    return await TodaysMenu.aggregate([
        {
            $match: {
                clusters: { $in: [...clusterList] },
                kitchenOpened: true,
                menuCreatedOn: { $gte: today },
                $or: [
                    { kitchenSpeciality: regexText },
                    { kitchenName: regexText },
                    { 'itemList.itemName': regexText },
                    { 'itemList.aliasNames': regexText },
                    { 'itemList.itemRegion': regexText },
                    { 'itemList.mealType': regexText }
                ]
            }
        },
        { $unwind: "$itemList" },
        {
            $match: {
                $or: [
                    { kitchenSpeciality: regexText },
                    { kitchenName: regexText },
                    { 'itemList.itemName': regexText },
                    { 'itemList.aliasNames': regexText },
                    { 'itemList.itemRegion': regexText },
                    { 'itemList.mealType': regexText }
                ]
            }
        },
        {
            $group: {
                "_id": "$_id",
                "kitchenName": { $first: "$kitchenName" },
                "kitchenId": { $first: "$kitchenId" },
                "kitchenOpened": { $first: "$kitchenOpened" },
                "itemList": { $push: "$itemList" }
            }
        }
    ]);
}
const searchCategoryTodaysMenu = async (text, clientDate, clusterList) => {
    const regexText = new RegExp(text, 'i');
    // console.log('regex ', regexText);
    let today = getTodayStartTime();
    return await TodaysMenu.aggregate([
        {
            $match: {
                clusters: { $in: [...clusterList] },
                kitchenOpened: true,
                menuCreatedOn: { $gte: today },
                $or: [
                    { 'itemList.itemName': regexText },
                    { 'itemList.searchCategory': regexText },
                    { 'itemList.searchKeyword': regexText }]
            }
        },
        { $unwind: "$itemList" },
        {
            $match: {
                $or: [
                    { 'itemList.itemName': regexText },
                    { 'itemList.searchCategory': regexText },
                    { 'itemList.searchKeyword': regexText }]
            }
        },
        {
            $group: {
                "_id": "$_id",
                "kitchenName": { $first: "$kitchenName" },
                "kitchenId": { $first: "$kitchenId" },
                "kitchenOpened": { $first: "$kitchenOpened" },
                "itemList": { $push: "$itemList" }
            }
        }
    ]);
}
const updateQuantityBooked = async (kitchenId, itemList, decreaseCount) => {
    const todayMenu = await TodaysMenu.findOne({ kitchenId });
    if (todayMenu && todayMenu._id) {
        const updatedItemList = [...todayMenu.itemList].map(item => {
            itemList.forEach(element => {
                if (element.itemName === item.itemName) {
                    if (!item.quantityBooked) {
                        item.quantityBooked = 0;
                    }
                    if (decreaseCount) {
                        item.quantityBooked -= element.count;
                    } else {
                        item.quantityBooked += element.count;
                    }
                    item.quantityBooked = item.quantityBooked >= 0 ? item.quantityBooked : 0;
                }
            });
            return item;
        });
        todayMenu.itemList = updatedItemList;
        const update = await TodaysMenu.findOneAndUpdate({ _id: todayMenu._id }, { $set: todayMenu }, { new: true });
        return update;
    } else {
        // console.log('todayMenu not found ', todayMenu)
        return todayMenu;
    }
}
const searchNearCategoryTodaysMenu = async (text, clientDate, clusterList, pageNumber, lng, lat) => {
    const regexText = new RegExp(text, 'i');
    const limit = 40;
    let today = getTodayStartTime();
    return await TodaysMenu.aggregate([
        {
            $geoNear: {
                near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
                distanceField: "distance",
                spherical: true
            }
        },
        {
            $match: {
                clusters: { $in: [...clusterList] },
                kitchenOpened: true,
                menuCreatedOn: { $gte: today },
                $or: [
                    { 'itemList.itemName': regexText },
                    { 'itemList.itemType': regexText },
                    { 'itemList.searchCategory': regexText },
                    { 'itemList.searchKeyword': regexText }]
            }
        },
        { $unwind: "$itemList" },
        {
            $match: {
                $or: [
                    { 'itemList.itemName': regexText },
                    { 'itemList.itemType': regexText },
                    { 'itemList.searchCategory': regexText },
                    { 'itemList.searchKeyword': regexText }]
            }
        },
        {
            $group: {
                "_id": "$_id",
                "kitchenName": { $first: "$kitchenName" },
                "kitchenId": { $first: "$kitchenId" },
                "kitchenOpened": { $first: "$kitchenOpened" },
                "distance": { $first: "$distance" },
                "itemList": { $push: "$itemList" }
            }
        }
    ])
        .skip((pageNumber - 1) * limit)
        .limit(limit * 1)
        .exec();
}

const searchNearTodaysMenu = async (text, clientDate, clusterList, pageNumber, lng, lat) => {
    const regexText = new RegExp(text, 'i');
    let today = getTodayStartTime();
    const limit = 40;
    return await TodaysMenu.aggregate([
        {
            $geoNear: {
                near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
                distanceField: "distance",
                spherical: true
            }
        },
        {
            $match: {
                clusters: { $in: [...clusterList] },
                kitchenOpened: true,
                menuCreatedOn: { $gte: today },
                $or: [
                    { kitchenSpeciality: regexText },
                    { kitchenName: regexText },
                    { 'itemList.itemName': regexText },
                    { 'itemList.aliasNames': regexText },
                    { 'itemList.itemRegion': regexText },
                    { 'itemList.mealType': regexText }
                ]
            }
        },
        { $unwind: "$itemList" },
        {
            $match: {
                $or: [
                    { kitchenSpeciality: regexText },
                    { kitchenName: regexText },
                    { 'itemList.itemName': regexText },
                    { 'itemList.aliasNames': regexText },
                    { 'itemList.itemRegion': regexText },
                    { 'itemList.mealType': regexText }
                ]
            }
        },
        {
            $group: {
                "_id": "$_id",
                "kitchenName": { $first: "$kitchenName" },
                "kitchenId": { $first: "$kitchenId" },
                "distance": { $first: "$distance" },
                "kitchenOpened": { $first: "$kitchenOpened" },
                "itemList": { $push: "$itemList" }
            }
        }
    ])
        .skip((pageNumber - 1) * limit)
        .limit(limit * 1)
        .exec();
}

const searchNearTodaysMeal = async (text, clientDate, clusterList, pageNumber, lng, lat) => {
    const regexText = new RegExp(text, 'i');
    const today = getTodayStartTime();
    const limit = 40;
    return await TodaysMenu.find({
        clusters: { $in: [...clusterList] },
        kitchenOpened: true,
        menuCreatedOn: { $gte: today },
        location: { $near: { $geometry: { type: "Point", coordinates: [lng, lat] } } },
        $or: [{ 'itemList.mealType': regexText }]
    }, { kitchenId: 1 })
        .skip((pageNumber - 1) * limit)
        .limit(limit * 1)
        .exec();
};

module.exports = {
    getAllKitchenTodaysMenu,
    getTodaysMenu,
    saveTodaysMenu,
    updateKitchenInfo,
    updateTodaysMenu,
    searchTodaysMenu,
    updateQuantityAvailable,
    updateQuantityBooked,
    searchCategoryTodaysMenu,
    searchNearCategoryTodaysMenu,
    searchNearTodaysMenu,
    searchNearTodaysMeal
}