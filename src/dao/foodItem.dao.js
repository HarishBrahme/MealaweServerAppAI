const FoodItem = require('../model/foodItem.model');
const { deleteImage } = require('../service/images.service');

const saveNewFoodItem = async (foodItem, imageName) => {
    const nFoodItem = new FoodItem();
    nFoodItem.itemName = foodItem.itemName;
    nFoodItem.aliasNames = foodItem.aliasNames;
    nFoodItem.imageUrl = imageName;
    nFoodItem.itemRegion = foodItem.itemRegion;
    nFoodItem.itemType = foodItem.itemType;
    nFoodItem.itemFlavour = foodItem.itemFlavour;
    nFoodItem.itemServingType = foodItem.itemServingType;
    nFoodItem.isAddon = (foodItem.isAddon === 'true');
    nFoodItem.itemPrice = foodItem.itemPrice;
    nFoodItem.maxItemPrice = foodItem.maxItemPrice;
    nFoodItem.itemDescription = foodItem.itemDescription;
    nFoodItem.searchCategory = foodItem.searchCategory;
    nFoodItem.groupCategory = foodItem.groupCategory;
    nFoodItem.searchKeyword = foodItem.searchKeyword;
    nFoodItem.preparationTime = foodItem.preparationTime;
    nFoodItem.isSpecialMenu = (foodItem.isSpecialMenu === 'true');
    nFoodItem.itemIsBreakfast = (foodItem.itemIsBreakfast === 'true');
    nFoodItem.itemIsCombo = (foodItem.itemIsCombo === 'true');
    nFoodItem.inflatePrice = (foodItem.inflatePrice === 'true');
    if (nFoodItem.isSpecialMenu) {
        nFoodItem.deliveryDate = foodItem.deliveryDate;
        nFoodItem.specialQuantityAvailable = foodItem.specialQuantityAvailable;
        nFoodItem.showInAdvance = (foodItem.showInAdvance === 'true');
        nFoodItem.showInAllDay = (foodItem.showInAllDay === 'true');
    } else {
        nFoodItem.specialQuantityAvailable = 0;
        nFoodItem.showInAdvance = false;
        nFoodItem.showInAllDay = false;
    }



    const isInserted = await nFoodItem.save();
    return isInserted;
};



const updateFoodItem = async (id, foodItem, imageName) => {
    const item = await FoodItem.findOne({ _id: id });
    if (item && item._id) {
        // console.log('item found for edit', item);
        const nFoodItem = {};
        nFoodItem.itemName = foodItem.itemName || item.itemName
        nFoodItem.aliasNames = foodItem.aliasNames || item.aliasNames;
        nFoodItem.imageUrl = imageName ? imageName : item.imageUrl
        nFoodItem.itemRegion = foodItem.itemRegion || item.itemRegion;
        nFoodItem.itemType = foodItem.itemType || item.itemType;
        nFoodItem.itemFlavour = foodItem.itemFlavour || item.itemFlavour;
        nFoodItem.itemServingType = foodItem.itemServingType || item.itemServingType;
        nFoodItem.isAddon = (foodItem.isAddon === 'true');
        nFoodItem.itemPrice = foodItem.itemPrice || item.itemPrice;
        nFoodItem.maxItemPrice = foodItem.maxItemPrice || item.maxItemPrice;
        nFoodItem.itemDescription = foodItem.itemDescription || item.itemDescription;
        nFoodItem.searchCategory = foodItem.searchCategory || item.searchCategory;
        nFoodItem.groupCategory = foodItem.groupCategory || item.groupCategory;
        nFoodItem.searchKeyword = foodItem.searchKeyword || item.searchKeyword;
        nFoodItem.preparationTime = foodItem.preparationTime || item.preparationTime;
        nFoodItem.itemIsBreakfast = (foodItem.itemIsBreakfast === 'true');
        nFoodItem.itemIsCombo = (foodItem.itemIsCombo === 'true');
        nFoodItem.isSpecialMenu = (foodItem.isSpecialMenu === 'true');
        nFoodItem.inflatePrice = (foodItem.inflatePrice === 'true');
        if (nFoodItem.isSpecialMenu) {
            nFoodItem.deliveryDate = foodItem.deliveryDate || item.deliveryDate;
            nFoodItem.specialQuantityAvailable = foodItem.specialQuantityAvailable || item.specialQuantityAvailable;
            nFoodItem.showInAdvance = (foodItem.showInAdvance === 'true');
            nFoodItem.showInAllDay = (foodItem.showInAllDay === 'true');
        }
        const update = await FoodItem.findOneAndUpdate({ _id: id }, { $set: nFoodItem }, { new: true });
        if (imageName && item.imageUrl) {
            deleteImage(item.imageUrl);
        }
        return update;
    }
    else {
        // console.log('item not found ', item)
        return item;
    }
}
const getFoodItemList = async (query, text) => {
    // console.log(query, text);
    const foodItemList = await FoodItem.find({ [query]: { $eq: text } });
    return foodItemList;
};
const searchFoodItem = async (text) => {
    const regexText = new RegExp(text, 'i');
    // console.log('regex ', regexText)
    return await FoodItem.find().where('itemRegion').regex(regexText);
};

const deleteFoodItemList = async (ids) => {

    const deletefoodlistitem = await FoodItem.deleteMany(
        {
            _id: {
                $in: [
                    ...ids
                ]
            }
        })
    return deletefoodlistitem;
}

const getFooditem = async (id) => {
    const getfooditem = await FoodItem.findById(id);
    return getfooditem;
}
const getAllFoodItems = async () => {
    const allFoodItems = await FoodItem.find({});
    return allFoodItems;
}
const deleteFooditem = async (id) => {
    const deletefooditem = await FoodItem.findByIdAndRemove(id);
    return deletefooditem;
}
const lookupFooditem = async () => {
    const lookupFooditem = await FoodItem.find({}, { itemName: 1, aliasNames: 1, _id: 0 });
    const finalResult = [];
    lookupFooditem.forEach(ele => {
        finalResult.push(ele.itemName);
        if (ele.aliasNames) {
            finalResult.push(...(ele.aliasNames.split(', ')));
        }
    });
    return finalResult;
}

const getSpecialItems = async () => {
    const list = await FoodItem.find({ isSpecialMenu: true });
    return list;
}

const setInflateFlag = async () => {
    const list = await FoodItem.updateMany({}, { $set: { inflatePrice: true } });
    return list;
}

const setPreparationTime = async () => {
    const list = await FoodItem.updateMany({}, { $set: { preparationTime: 40 } });
    return list;
}

const getSubscriptionItemList = async () => {
    const list = await FoodItem.find({ itemIsCombo: true });
    return list;
}

const getAllFoodItemsImageList = async () => {
    const list = await FoodItem.find({}, { imageUrl: 1 });
    return list;
}

module.exports = {
    saveNewFoodItem,
    getFoodItemList,
    searchFoodItem,
    getFooditem,
    getAllFoodItems,
    deleteFoodItemList,
    deleteFooditem,
    updateFoodItem,
    lookupFooditem,
    getSpecialItems,
    setInflateFlag,
    setPreparationTime,
    getSubscriptionItemList,
    getAllFoodItemsImageList
};
