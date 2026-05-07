const MealPackage = require('../model/mealPackage.model');
const { deleteImage } = require('../service/images.service');

const getMealPackageList = async () => {
    const list = await MealPackage.find({}).sort({ priority: 1 });
    return list;
};

const getMealPackageListCluster = async (clusterList) => {
    const list = await MealPackage.find({ clusters: { $in: [...clusterList] }, isActive: true }).sort({ priority: 1 });
    return list;
};

const getMealPackageById = async (id) => {
    return await MealPackage.findById(id);
}

const saveMealPackage = async (mealPackage, imageUrl) => {
    try {
        // console.log('mealPackage ',mealPackage,imageUrl);
        const nMealPackage = new MealPackage();
        nMealPackage.imageUrl = imageUrl;
        nMealPackage.packageName = mealPackage.packageName;
        nMealPackage.packagePrice = mealPackage.packagePrice;
        nMealPackage.packageCategory = mealPackage.packageCategory;
        nMealPackage.packageSubCategory = mealPackage.packageSubCategory;
        nMealPackage.packageType = mealPackage.packageType;
        nMealPackage.days = mealPackage.days;
        nMealPackage.payToKitchenPerMeal = mealPackage.payToKitchenPerMeal;
        nMealPackage.payToKitchenPerMeal2 = mealPackage.payToKitchenPerMeal2;
        nMealPackage.vegMealDescription = mealPackage.vegMealDescription;
        nMealPackage.nonVegMealDescription = mealPackage.nonVegMealDescription;
        nMealPackage.deliveryOnWeekends = (mealPackage.deliveryOnWeekends === 'true');;
        nMealPackage.discount = mealPackage.discount;
        nMealPackage.priority = mealPackage.priority;
        nMealPackage.offerText = mealPackage.offerText;
        nMealPackage.offerColor = mealPackage.offerColor;
        nMealPackage.multiDateAllowed = mealPackage.multiDateAllowed;
        nMealPackage.isBreakFast = mealPackage.isBreakFast;
        nMealPackage.isBestSeller = mealPackage.isBestSeller;
        nMealPackage.packageInfo = mealPackage.packageInfo;
        nMealPackage.clusters = JSON.parse(mealPackage.clusters);;
        nMealPackage.addonsList = JSON.parse(mealPackage.addonsList);
        nMealPackage.menuList = JSON.parse(mealPackage.menuList);
        nMealPackage.searchCategory = mealPackage.searchCategory;
        const saved = await nMealPackage.save();
        return saved;
    } catch (err) {
        console.log(err);
    }
};
const updateMealPackage = async (id, mealPackage, imageName) => {

    const nMealPackage = { ...mealPackage };
    nMealPackage.deliveryOnWeekends = (mealPackage.deliveryOnWeekends === 'true');
    nMealPackage.multiDateAllowed = (mealPackage.multiDateAllowed === 'true');
    nMealPackage.addonsList = JSON.parse(mealPackage.addonsList);
    nMealPackage.menuList = JSON.parse(mealPackage.menuList);
    nMealPackage.clusters = JSON.parse(mealPackage.clusters);
    if (nMealPackage.addonsList.length > 0) {
        nMealPackage.addonsList.forEach((addOns) => {
            delete addOns?.showKitchen;
        });
    }
    if (imageName) {
        nMealPackage.imageUrl = imageName;
    }
    try {
        const updated = await MealPackage.findOneAndUpdate({ _id: id }, { $set: nMealPackage }, { new: true });
        if (imageName && mealPackage.imageUrl) {
            deleteImage(mealPackage.imageUrl);
        }
        return updated;
    } catch (err) {
        console.log(err);
        return err;
    }
};
const deleteMealPackage = async (id) => {
    const deleted = await MealPackage.findByIdAndRemove({ _id: id });
    return deleted;
};
const changePackageStatus = async (status, id) => {
    const res = await MealPackage.findOneAndUpdate({ _id: id }, { $set: { isActive: status } }, { new: true });
    return res;
}
const getMealPackageImageList = async () => {
    const list = await MealPackage.find({}, { imageUrl: 1 });
    return list;
};

module.exports = {
    saveMealPackage,
    getMealPackageListCluster,
    getMealPackageList,
    getMealPackageById,
    updateMealPackage,
    deleteMealPackage,
    changePackageStatus,
    getMealPackageImageList
};