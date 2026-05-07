const KitchenMenu = require('../model/kitchenMenu.model');

const getAllKitchenMenu = async () => {
    const todayMenu = await KitchenMenu.find({});
    return todayMenu;
}
const getKitchenMenu = async (kitchenId) => {
    const todayMenu = await KitchenMenu.findOne({ kitchenId });
    return todayMenu ? todayMenu : {};
}
const getKitchMenuByClusterAndKitchenType = async (cluster, kitchenType) => {
    // Ensure inputs are arrays (wrap strings in arrays)
    const clusterArray = Array.isArray(cluster) ? cluster : [cluster];
    const kitchenTypeArray = Array.isArray(kitchenType) ? kitchenType : [kitchenType];

    try {
        // 
        const todayMenu = await KitchenMenu.findOne({
            clusters: { $in: clusterArray },
            kitchenType: { $in: kitchenTypeArray }
        });

        return todayMenu || [];
    } catch (err) {
        console.error("Error fetching kitchen menu:", err);
        return [];
    }
};

const getKitchenItemList = async (kitchenId) => {
    const result = await KitchenMenu.findOne({ kitchenId }, { itemList: 1 });
    return result ? result : [];
}
const getKitchenAddonList = async (kitchenId) => {
    const result = await KitchenMenu.findOne({ kitchenId }, { addOnsList: 1 });
    return result ? result : [];
}

const saveKitchenMenu = async (kitchenMenu) => {
    const savedKitchenMenu = await KitchenMenu.findOne({ kitchenId: kitchenMenu.kitchenId });

    if (savedKitchenMenu && savedKitchenMenu._id) {
        nKitchenMenu = {};
        nKitchenMenu.clusters = kitchenMenu.clusters || savedKitchenMenu.clusters;
        nKitchenMenu.itemList = kitchenMenu.itemList || savedKitchenMenu.itemList;
        nKitchenMenu.addOnsList = kitchenMenu.addOnsList || savedKitchenMenu.addOnsList;
        nKitchenMenu.kitchenSpeciality = kitchenMenu.kitchenSpeciality || savedKitchenMenu.kitchenSpeciality;
        nKitchenMenu.kitchenType = kitchenMenu.kitchenType || savedKitchenMenu.kitchenType;
        nKitchenMenu.kitchenMainSpeciality = kitchenMenu.kitchenMainSpeciality || savedKitchenMenu.kitchenMainSpeciality;
        if (kitchenMenu.geolocation) {
            let geolocation = kitchenMenu.geolocation;
            if (geolocation.lng && geolocation.lat) {
                nKitchenMenu.location = { type: 'Point', coordinates: [geolocation.lng, geolocation.lat] };
            } else {
                geolocation = JSON.parse(kitchenMenu.geolocation);
                if (geolocation.lng && geolocation.lat) {
                    nKitchenMenu.location = { type: 'Point', coordinates: [geolocation.lng, geolocation.lat] };
                }
            }
        }
        return await KitchenMenu.findOneAndUpdate({ _id: savedKitchenMenu._id },
            { $set: nKitchenMenu }, { new: true });
    } else {
        const nKitchenMenu = new KitchenMenu();
        nKitchenMenu.kitchenName = kitchenMenu.kitchenName;
        nKitchenMenu.kitchenId = kitchenMenu.kitchenId;
        nKitchenMenu.kitchenSpeciality = kitchenMenu.kitchenSpeciality;
        nKitchenMenu.kitchenType = kitchenMenu.kitchenType;
        nKitchenMenu.kitchenMainSpeciality = kitchenMenu.kitchenMainSpeciality;
        nKitchenMenu.kitchenOpened = kitchenMenu.kitchenOpened;
        nKitchenMenu.clusters = kitchenMenu.clusters;
        nKitchenMenu.itemList = kitchenMenu.itemList || [];
        nKitchenMenu.addOnsList = kitchenMenu.addOnsList || [];
        if (kitchenMenu.geolocation) {
            let geolocation = kitchenMenu.geolocation;
            if (geolocation.lng && geolocation.lat) {
                nKitchenMenu.location = { type: 'Point', coordinates: [geolocation.lng, geolocation.lat] };
            } else {
                geolocation = JSON.parse(kitchenMenu.geolocation);
                if (geolocation.lng && geolocation.lat) {
                    nKitchenMenu.location = { type: 'Point', coordinates: [geolocation.lng, geolocation.lat] };
                }
            }
        }
        const isInserted = await nKitchenMenu.save();
        return isInserted;
    }
}

const updateKitchenMenu = async (kitchenId, updateKitchenMenu) => {
    const todayMenu = await KitchenMenu.findOne({ kitchenId });
    if (todayMenu && todayMenu._id) {
        todayMenu.clusters = updateKitchenMenu.clusters || todayMenu.clusters;
        todayMenu.itemList = updateKitchenMenu.itemList || todayMenu.itemList;
        todayMenu.addOnsList = updateKitchenMenu.addOnsList || todayMenu.addOnsList;
        todayMenu.kitchenSpeciality = updateKitchenMenu.kitchenSpeciality || todayMenu.kitchenSpeciality;
        todayMenu.kitchenType = updateKitchenMenu.kitchenType || todayMenu.kitchenType;
        todayMenu.kitchenMainSpeciality = updateKitchenMenu.kitchenMainSpeciality || todayMenu.kitchenMainSpeciality;
        if (updateKitchenMenu.geolocation) {
            let geolocation = updateKitchenMenu.geolocation;
            if (geolocation.lng && geolocation.lat) {
                todayMenu.location = { type: 'Point', coordinates: [geolocation.lng, geolocation.lat] };
            } else {
                geolocation = JSON.parse(updateKitchenMenu.geolocation);
                if (geolocation.lng && geolocation.lat) {
                    todayMenu.location = { type: 'Point', coordinates: [geolocation.lng, geolocation.lat] };
                }
            }

        }
        const update = await KitchenMenu.findOneAndUpdate({ _id: todayMenu._id }, { $set: todayMenu }, { new: true });
        return update;
    }
    else {
        // console.log('kitchenMenu not found ', todayMenu);
        return todayMenu;
    }
}
const updateAddonAvailability = async (id, addOnId, available) => {
    return await KitchenMenu.findOneAndUpdate(
        { _id: id, 'addOnsList._id': addOnId },
        { $set: { 'addOnsList.$.addOnAvailable': available } }
    );
}
const updateItemAvailability = async (id, itemId, available) => {
    return await KitchenMenu.findOneAndUpdate(
        { _id: id, 'itemList._id': itemId },
        { $set: { 'itemList.$.itemAvailable': available } }
    );
}
const updateItemServeDaily = async (id, itemId, available) => {
    return await KitchenMenu.findOneAndUpdate(
        { _id: id, 'itemList._id': itemId },
        { $set: { 'itemList.$.serveDaily': available } }
    );
}

const updateKitchenInfo = async (kitchen) => {
    KitchenInfo = {};
    KitchenInfo.kitchenName = kitchen.kitchenName;
    KitchenInfo.kitchenSpeciality = kitchen.kitchenSpeciality;
    KitchenInfo.kitchenType = kitchen.kitchenType;
    KitchenInfo.kitchenOpened = kitchen.kitchenOpened;
    KitchenInfo.clusters = kitchen.clusters;
    await KitchenMenu.findOneAndUpdate(
        { kitchenId: kitchen._id },
        { $set: KitchenInfo }
    );
}

const searchKitchenMenu = async (text, clusterList) => {
    const regexText = new RegExp(text, 'i');
    return await KitchenMenu.aggregate([
        {
            $match: {
                clusters: { $in: [...clusterList] },
                kitchenOpened: true,
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
                'itemList.itemAvailable': true,
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

const searchCategoryKitchenMenu = async (text, clusterList) => {
    const regexText = new RegExp(text, 'i');
    return await KitchenMenu.aggregate([
        {
            $match: {
                clusters: { $in: [...clusterList] },
                kitchenOpened: true,
                $or: [
                    { 'itemList.itemName': regexText },
                    { 'itemList.searchCategory': regexText },
                    { 'itemList.searchKeyword': regexText }]
            }
        },
        { $unwind: "$itemList" },
        {
            $match: {
                'itemList.itemAvailable': true,
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
    ])
}

const syncKitchenMenuItem = async (foodItem) => {
    const itemSetter = {};
    const menuSetter = {};
    if (foodItem.itemName) {
        itemSetter['itemList.$.itemName'] = foodItem.itemName;
        menuSetter['addOnsList.$.itemName'] = foodItem.itemName;
    }
    if (foodItem.imageUrl) {
        itemSetter['itemList.$.imageUrl'] = foodItem.imageUrl;
        menuSetter['addOnsList.$.imageUrl'] = foodItem.imageUrl;
    }
    if (foodItem.searchCategory) {
        itemSetter['itemList.$.searchCategory'] = foodItem.searchCategory;
        menuSetter['addOnsList.$.searchCategory'] = foodItem.searchCategory;
    }
    if (foodItem.groupCategory) {
        itemSetter['itemList.$.groupCategory'] = foodItem.groupCategory;
        menuSetter['addOnsList.$.groupCategory'] = foodItem.groupCategory;
    }
    if (foodItem.searchKeyword) {
        itemSetter['itemList.$.searchKeyword'] = foodItem.searchKeyword;
        menuSetter['addOnsList.$.searchKeyword'] = foodItem.searchKeyword;
    }
    if (foodItem.maxItemPrice) {
        itemSetter['itemList.$.maxItemPrice'] = foodItem.maxItemPrice;
        menuSetter['addOnsList.$.maxItemPrice'] = foodItem.maxItemPrice;
    }
    if (foodItem.deliveryDate) {
        itemSetter['itemList.$.deliveryDate'] = foodItem.deliveryDate;
        menuSetter['addOnsList.$.deliveryDate'] = foodItem.deliveryDate;
    }
    if (foodItem.specialQuantityAvailable) {
        itemSetter['itemList.$.specialQuantityAvailable'] = foodItem.specialQuantityAvailable;
        menuSetter['addOnsList.$.specialQuantityAvailable'] = foodItem.specialQuantityAvailable;
    }
    if (foodItem.showInAdvance) {
        itemSetter['itemList.$.showInAdvance'] = foodItem.showInAdvance;
        menuSetter['addOnsList.$.showInAdvance'] = foodItem.showInAdvance;
    } else {
        itemSetter['itemList.$.showInAdvance'] = false;
        menuSetter['addOnsList.$.showInAdvance'] = false;
    }
    if (foodItem.showInAllDay) {
        itemSetter['itemList.$.showInAllDay'] = foodItem.showInAllDay;
        menuSetter['addOnsList.$.showInAllDay'] = foodItem.showInAllDay;
    } else {
        itemSetter['itemList.$.showInAllDay'] = false;
        menuSetter['addOnsList.$.showInAllDay'] = false;
    }
    if (foodItem.itemIsBreakfast) {
        itemSetter['itemList.$.itemIsBreakfast'] = foodItem.itemIsBreakfast;
        menuSetter['addOnsList.$.itemIsBreakfast'] = foodItem.itemIsBreakfast;
    } else {
        itemSetter['itemList.$.itemIsBreakfast'] = false;
        menuSetter['addOnsList.$.itemIsBreakfast'] = false;
    }
    if (foodItem.itemIsCombo) {
        itemSetter['itemList.$.itemIsCombo'] = foodItem.itemIsCombo;
    } else {
        itemSetter['itemList.$.itemIsCombo'] = false;
    }
    // ADD THIS SECTION for itemIsApartment
    if (foodItem.itemIsApartment) {
        itemSetter['itemList.$.itemIsApartment'] = foodItem.itemIsApartment;
    } else {
        itemSetter['itemList.$.itemIsApartment'] = false;
    }
    if (foodItem.isSpecialMenu) {
        itemSetter['itemList.$.itemPrice'] = foodItem.itemPrice;
    }
    if (foodItem.preparationTime) {
        itemSetter['itemList.$.preparationTime'] = foodItem.preparationTime;
        menuSetter['addOnsList.$.preparationTime'] = foodItem.preparationTime;
    }
    if (foodItem.inflatePrice) {
        itemSetter['itemList.$.inflatePrice'] = foodItem.inflatePrice;
    } else {
        itemSetter['itemList.$.inflatePrice'] = false;
    }
    await KitchenMenu.updateMany(
        { 'itemList.mainMenuItemId': foodItem._id },
        { $set: itemSetter }
    );
    await KitchenMenu.updateMany(
        { 'addOnsList.mainMenuAddonId': foodItem._id },
        { $set: menuSetter }
    );
}

const searchNearCategoryKitchenMenu = async (text, clusterList, pageNumber, lng, lat) => {
    const regexText = new RegExp(text, 'i');
    const limit = 40;
    return await KitchenMenu.aggregate([
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
                'itemList.itemAvailable': true,
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

const searchNearKitchenMenu = async (text, clusterList, pageNumber, lng, lat) => {
    const regexText = new RegExp(text, 'i');
    const limit = 40;
    return await KitchenMenu.aggregate([
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
                'itemList.itemAvailable': true,
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

const searchNearAlldayMeal = async (clusterList, pageNumber, lng, lat) => {
    const limit = 40;
    return await KitchenMenu.find({
        clusters: { $in: [...clusterList] },
        kitchenOpened: true,
        location: { $near: { $geometry: { type: "Point", coordinates: [lng, lat] } } },
        $or: [{ 'itemList.serveDaily': true }]
    }, { kitchenId: 1 })
        .skip((pageNumber - 1) * limit)
        .limit(limit * 1)
        .exec();
};
const searchNearSpecialMeal = async (clusterList, pageNumber, lng, lat) => {
    const limit = 40;
    return await KitchenMenu.find({
        clusters: { $in: [...clusterList] },
        kitchenOpened: true,
        location: { $near: { $geometry: { type: "Point", coordinates: [lng, lat] } } },
        $or: [{ 'itemList.isSpecialMenu': true }]
    }, { kitchenId: 1 })
        .skip((pageNumber - 1) * limit)
        .limit(limit * 1)
        .exec();
};

const saveKitchenSpecialMenu = async (fooditem) => {
    try {
        const allKitchensMenu = await getAllKitchenMenu();
        // console.log(allKitchensMenu.length);
        const promiseArr = [];
        allKitchensMenu.forEach(async (kitchenMenu) => {
            let itemList = kitchenMenu.itemList;
            let specialItemPresent = false;
            itemList.forEach(menu => {
                if (menu.itemName === fooditem.itemName && menu.isSpecialMenu) {
                    specialItemPresent = true;
                }
            });
            if (!specialItemPresent) {
                itemList.push({
                    itemName: fooditem.itemName,
                    imageUrl: fooditem.imageUrl,
                    itemRegion: fooditem.itemRegion,
                    aliasNames: fooditem.aliasNames,
                    itemFlavour: fooditem.itemFlavour,
                    itemType: fooditem.itemType,
                    itemPrice: fooditem.itemPrice,
                    maxItemPrice: fooditem.maxItemPrice,
                    itemDescription: fooditem.itemDescription,
                    itemServingType: fooditem.itemServingType,
                    mainMenuItemId: fooditem._id,
                    searchCategory: fooditem.searchCategory,
                    groupCategory: fooditem.groupCategory,
                    searchKeyword: fooditem.searchKeyword,
                    spicyLevel: 1,
                    servesTo: 1,
                    itemAvailable: true,
                    serveDaily: false,
                    itemIsBreakfast: false,
                    isSpecialMenu: fooditem.isSpecialMenu,
                    deliveryDate: fooditem.deliveryDate,
                    specialQuantityAvailable: fooditem.specialQuantityAvailable,
                    showInAdvance: fooditem.showInAdvance,
                    showInAllDay: fooditem.showInAllDay,
                    preparationTime: fooditem.preparationTime,
                    inflatePrice: fooditem.inflatePrice
                });
                promiseArr.push(updateKitchenMenu(kitchenMenu.kitchenId, { itemList }));
            }

        });
        return await Promise.all(promiseArr);
    } catch (error) {
        // console.log('error while updateKitchenMenuLocation', error)
    }
}

const deleteKitchenSpecialMenu = async (fooditem) => {
    try {
        const allKitchensMenu = await getAllKitchenMenu();
        // console.log(allKitchensMenu.length);
        const promiseArr = [];
        allKitchensMenu.forEach(async (kitchenMenu) => {
            let itemList = kitchenMenu.itemList.filter(menu => {
                if (menu.itemName === fooditem.itemName && menu.isSpecialMenu) {
                    return false
                } else {
                    return true;
                }
            });
            promiseArr.push(updateKitchenMenu(kitchenMenu.kitchenId, { itemList }));
        });
        return await Promise.all(promiseArr);
    } catch (error) {
        // console.log('error while deleteKitchenSpecialMenu', error)
    }
}

const setInflateFlagKitchenMenu = async () => {
    try {
        const allKitchensMenu = await getAllKitchenMenu();
        // console.log(allKitchensMenu.length);
        const promiseArr = [];
        allKitchensMenu.forEach(async (kitchenMenu) => {
            let itemList = kitchenMenu.itemList.filter(menu => {
                menu.inflatePrice = true;
                return true;
            });
            let addOnsList = kitchenMenu.addOnsList.filter(menu => {
                menu.inflatePrice = true;
                return true;
            });
            promiseArr.push(updateKitchenMenu(kitchenMenu.kitchenId, { itemList, addOnsList }));
        });
        return await Promise.all(promiseArr);
    } catch (error) {
        // console.log('error while setInflateFlagKitchenMenu', error);
    }
}

const setPreparationTimeKitchen = async () => {
    try {
        const allKitchensMenu = await getAllKitchenMenu();
        // console.log(allKitchensMenu.length);
        const promiseArr = [];
        allKitchensMenu.forEach(async (kitchenMenu) => {
            let itemList = kitchenMenu.itemList.filter(menu => {
                menu.preparationTime = 40;
                return true;
            });
            let addOnsList = kitchenMenu.addOnsList.filter(menu => {
                menu.preparationTime = 40;
                return true;
            });
            promiseArr.push(updateKitchenMenu(kitchenMenu.kitchenId, { itemList, addOnsList }));
        });
        return await Promise.all(promiseArr);
    } catch (error) {
        // console.log('error while setPreparationTimeKitchen', error);
    }
}

module.exports = {
    getAllKitchenMenu,
    getKitchenMenu,
    saveKitchenMenu,
    updateKitchenMenu,
    updateKitchenInfo,
    searchKitchenMenu,
    updateAddonAvailability,
    updateItemAvailability,
    getKitchenItemList,
    getKitchenAddonList,
    syncKitchenMenuItem,
    searchCategoryKitchenMenu,
    searchNearCategoryKitchenMenu,
    searchNearKitchenMenu,
    updateItemServeDaily,
    searchNearAlldayMeal,
    saveKitchenSpecialMenu,
    deleteKitchenSpecialMenu,
    searchNearSpecialMeal,
    setInflateFlagKitchenMenu,
    setPreparationTimeKitchen,
    getKitchMenuByClusterAndKitchenType
}