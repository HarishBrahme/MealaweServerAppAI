const MarketPlaceItem = require('../model/marketPlaceItem.model');
const { deleteImage } = require('../service/images.service');

const parseJSON = (data) => {
    if (!data) return [];
    try {
        return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (err) {
        console.error('JSON parse error:', err);
        return [];
    }
};

const getAllMarketPlaceItem = async () => {
    return await MarketPlaceItem.find();
};

const getMarketPlaceItemById = async (id) => {
    return await MarketPlaceItem.findById(id);
};

const getMarketPlaceItemByPathName = async (pathName) => {
    return await MarketPlaceItem.findOne({ pathName });
};

const saveMarketPlaceItem = async (marketPlaceItem, files = []) => {
    try {
        const imageUrls = files.map(f => f.filename);

        const nMarketPlaceItem = new MarketPlaceItem({
            itemName: marketPlaceItem.itemName,
            pathName: marketPlaceItem.pathName,
            imageUrls,
            itemDescription: marketPlaceItem.itemDescription,
            subHeader: marketPlaceItem.subHeader,
            itemServingUnit: marketPlaceItem.itemServingUnit,
            searchCategory: marketPlaceItem.searchCategory,
            groupCategory: marketPlaceItem.groupCategory || undefined,
            groupCategoryId: marketPlaceItem.groupCategoryId || undefined,
            isAvailable: marketPlaceItem.isAvailable === 'true',
            isBestSeller: marketPlaceItem.isBestSeller === 'true',
            itemIsCombo: marketPlaceItem.itemIsCombo === 'true',
            optionInfo: parseJSON(marketPlaceItem.optionInfo),
            inventoryInfo: parseJSON(marketPlaceItem.inventoryInfo),
            ingredients: parseJSON(marketPlaceItem.ingredients),
            benefits: parseJSON(marketPlaceItem.benefits),
            usage: parseJSON(marketPlaceItem.usage),
            storageInfo: parseJSON(marketPlaceItem.storageInfo),
            itemLabels: parseJSON(marketPlaceItem.itemLabels) || { name: '', backGroundColor: '', textColor: '' },
            searchKeywords: parseJSON(marketPlaceItem.searchKeywords) || '',
            comboGroupCategoryList: marketPlaceItem.itemIsCombo ? parseJSON(marketPlaceItem.comboGroupCategoryList) : []
        });
        const saved = await nMarketPlaceItem.save();
        return saved;
    } catch (err) {
        console.error(err);
        throw err;
    }
};

const updateMarketPlaceItem = async (id, marketPlaceItem) => {
    const savedMarketPlaceItem = await MarketPlaceItem.findById(id);
    if (!savedMarketPlaceItem) throw new Error('Item not found');

    const updatedData = {
        itemName: marketPlaceItem.itemName || savedMarketPlaceItem.itemName,
        pathName: marketPlaceItem.pathName || savedMarketPlaceItem.pathName,
        itemDescription: marketPlaceItem.itemDescription || savedMarketPlaceItem.itemDescription,
        subHeader: marketPlaceItem.subHeader || savedMarketPlaceItem.subHeader,
        itemServingUnit: marketPlaceItem.itemServingUnit || savedMarketPlaceItem.itemServingUnit,
        searchCategory: marketPlaceItem.searchCategory || savedMarketPlaceItem.searchCategory,
        groupCategory: marketPlaceItem.groupCategory || savedMarketPlaceItem.groupCategory,
        groupCategoryId: marketPlaceItem.groupCategoryId || savedMarketPlaceItem.groupCategoryId,
        isAvailable: marketPlaceItem.isAvailable === 'true' ?? savedMarketPlaceItem.isAvailable,
        isBestSeller: marketPlaceItem.isBestSeller === 'true' ?? savedMarketPlaceItem.isBestSeller,
        itemIsCombo: marketPlaceItem.itemIsCombo === 'true' ?? savedMarketPlaceItem.itemIsCombo,
        optionInfo: parseJSON(marketPlaceItem.optionInfo) || savedMarketPlaceItem.optionInfo,
        inventoryInfo: parseJSON(marketPlaceItem.inventoryInfo) || savedMarketPlaceItem.inventoryInfo,
        ingredients: parseJSON(marketPlaceItem.ingredients) || savedMarketPlaceItem.ingredients,
        benefits: parseJSON(marketPlaceItem.benefits) || savedMarketPlaceItem.benefits,
        usage: parseJSON(marketPlaceItem.usage) || savedMarketPlaceItem.usage,
        storageInfo: parseJSON(marketPlaceItem.storageInfo) || savedMarketPlaceItem.storageInfo,
        itemLabel: marketPlaceItem.itemLabel ? (typeof marketPlaceItem.itemLabel === 'string' ? JSON.parse(marketPlaceItem.itemLabel) : marketPlaceItem.itemLabel) : savedMarketPlaceItem.itemLabel,
        searchKeywords: marketPlaceItem.searchKeywords || savedMarketPlaceItem.searchKeywords,
        comboGroupCategoryList: marketPlaceItem.itemIsCombo === 'true' ? (parseJSON(marketPlaceItem.comboGroupCategoryList) && parseJSON(marketPlaceItem.comboGroupCategoryList).length ? parseJSON(marketPlaceItem.comboGroupCategoryList) : savedMarketPlaceItem.comboGroupCategoryList || []) : []
    };
    return await MarketPlaceItem.findByIdAndUpdate(id, updatedData, { new: true });
};

const updateMarketPlaceItemImage = async (id, filename, index) => {
    const item = await MarketPlaceItem.findById(id);
    if (!item) throw new Error('Marketplace item not found');

    const images = item.imageUrls || [];
    const oldImage = images[index];
    if (index < images.length) {
        images[index] = filename;
        if (oldImage) deleteImage(oldImage);
    } else {
        images.push(filename);
    }

    item.imageUrls = images;
    return await item.save();
};

const deleteMarketPlaceItemImage = async (id, imageUrl) => {
    const item = await MarketPlaceItem.findById(id);
    if (!item) throw new Error('Item not found');

    const index = item.imageUrls.indexOf(imageUrl);
    if (index > -1) {
        item.imageUrls.splice(index, 1);
        deleteImage(imageUrl);
        return await item.save();
    }
    return item;
};

const deleteMarketPlaceItem = async (id) => {
    return await MarketPlaceItem.findByIdAndDelete(id);
};

const getMarketPlaceCategoryItem = async (category) => {
    if (category === "Combo") {
        return await MarketPlaceItem.find({ itemIsCombo: true });
    }
    const regex = new RegExp(category, 'i');
    return await MarketPlaceItem.find({ searchCategory: regex });
};

const getBestsellorItemlist = async () => {
    return await MarketPlaceItem.find({ isBestSeller: true });
};

const getComboItemList = async () => {
    return await MarketPlaceItem.find({ itemIsCombo: true });
};

const searchMarketPlaceItems = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim() === '') {
        return { items: [], keywords: [] };
    }
    const regex = new RegExp(searchTerm, 'i');
    const items = await MarketPlaceItem.find({
        $or: [
            { itemName: regex },
            { searchCategory: regex },
            { groupCategory: regex },
            { searchKeywords: regex },
            { 'comboGroupCategoryList.category': regex },
            { 'comboGroupCategoryList.groupCategoryList.groupCategory': regex }
        ]
    }).lean();
    const formattedItems = items.map(item => {
        let keywordsArray = [];
        if (item.searchKeywords) {
            if (Array.isArray(item.searchKeywords)) {
                keywordsArray = item.searchKeywords;
            } else {
                keywordsArray = item.searchKeywords.split(',').map(k => k.trim());
            }
        }
        return { ...item, searchKeywords: keywordsArray };
    });
    const allKeywords = formattedItems.flatMap(item => item.searchKeywords);
    const uniqueKeywords = [...new Set(allKeywords)];

    return {
        items: formattedItems,
        keywords: uniqueKeywords
    };
};

module.exports = {
    getAllMarketPlaceItem,
    getMarketPlaceItemById,
    getMarketPlaceItemByPathName,
    saveMarketPlaceItem,
    updateMarketPlaceItem,
    deleteMarketPlaceItem,
    updateMarketPlaceItemImage,
    deleteMarketPlaceItemImage,
    getMarketPlaceCategoryItem,
    getBestsellorItemlist,
    searchMarketPlaceItems,
    getComboItemList
};