const { getAllBulkFooditemsImages } = require("../dao/bulkFoodItem.dao");
const { getAllBulkMenuImageList } = require("../dao/bulkMenu.dao");
const { getAllFoodItemsImageList } = require("../dao/foodItem.dao");
const { getKitchenPartenrImageList } = require("../dao/kitchenPartner.dao");
const { getMealPackageImageList } = require("../dao/mealPackage.dao");


const getAllImageDownLoadList = async () => {
    try {
        const promiseArr = [
            //bulkfoodItem
            //bulkMenu
            //foodAddOn
            //foodItem
            //kitchenPartner
            //mealPackage            
            getAllBulkFooditemsImages(),
            getAllBulkMenuImageList(),
            getAllFoodItemsImageList(),
            getKitchenPartenrImageList(),
            getMealPackageImageList()
        ];
        const res = await Promise.all(promiseArr);
        console.log('getAllImageDownLoadList', res.length);
        const finalList = [];
        if (res && res.length > 0) {
            res.forEach(imageUrls => {
                console.log('imageUrls', imageUrls.length)
                finalList.push(...imageUrls)
            });
            return finalList;
        } else {
            return finalList;
        }

    } catch (error) {
        console.log('getAllImageDownLoadList error', error);
    }
}

module.exports = {
    getAllImageDownLoadList
}