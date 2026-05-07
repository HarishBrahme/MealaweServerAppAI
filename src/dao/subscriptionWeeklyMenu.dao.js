const SubscriptionWeeklyMenu = require('../model/subscriptionWeeklyMenu.model')

const saveSubscriptionWeeklyMenu = async (weeklyMenu) => {
    const { packageCategory, clusterIds, weekMenuList, _id } = weeklyMenu;
    const savedMenu = await SubscriptionWeeklyMenu.findOne({ _id });

    if (savedMenu) {
        nSubscriptionWeeklyMenu = {};
        nSubscriptionWeeklyMenu.clusterIds = clusterIds || savedMenu.clusterIds;
        nSubscriptionWeeklyMenu.weekMenuList = weekMenuList || savedMenu.weekMenuList;
        nSubscriptionWeeklyMenu.packageCategory = packageCategory || savedMenu.packageCategory;

        return await SubscriptionWeeklyMenu.findOneAndUpdate({ _id: savedMenu._id }, { $set: nSubscriptionWeeklyMenu }, { new: true });
    } else {
        nSubscriptionWeeklyMenu = new SubscriptionWeeklyMenu();
        nSubscriptionWeeklyMenu.packageCategory = packageCategory;
        nSubscriptionWeeklyMenu.clusterIds = clusterIds || [];
        nSubscriptionWeeklyMenu.weekMenuList = weekMenuList || [];

        const isInserted = await nSubscriptionWeeklyMenu.save();
        return isInserted;
    }
}

const getSubscriptionWeeklyMenu = async (packageCategory, clusterId) => {
    const query = {};
    if (packageCategory) query.packageCategory = packageCategory;

    if (clusterId) query.clusterIds = { $in: [clusterId] };

    const weeklyMenu = await SubscriptionWeeklyMenu.find(query);
    return weeklyMenu;
}

const searchSubscriptionWeeklyMenuList = async (searchObj, page) => {
    const limit = 50;
    const skip = (page - 1) * limit;
    const query = {};

    const { clusterId, packageCategory } = searchObj

    if (clusterId) {
        query.clusterIds = { $in: [...clusterId] }
    }

    if (packageCategory) {
        query.packageCategory = packageCategory;
    }

    const records = await SubscriptionWeeklyMenu.find(query).skip(skip).limit(limit).sort({ _id: -1 }).exec();
    return records;
}

const deleteSubscriptionWeeklyMenu = async (id) => {
    const deleted = await SubscriptionWeeklyMenu.findByIdAndRemove({ _id: id });
    return deleted;
};

const getWeeklyMenuByCategory = async (packageCategory) => {
    const query = {};
    if (packageCategory) query.packageCategory = packageCategory;

    const weeklyMenus = await SubscriptionWeeklyMenu.find(query)
        .sort({ _id: -1 })
        .exec();

    const seenClusters = new Set();
    const uniqueMenus = [];
    const clusterIds = [];
    weeklyMenus.forEach(menu => {
        if (Array.isArray(menu.clusterIds)) {
            const uniqueClustersInMenu = menu.clusterIds.filter(cId => !seenClusters.has(cId.toString()));
            if (uniqueClustersInMenu.length > 0) {
                uniqueClustersInMenu.forEach(cId => seenClusters.add(cId.toString()));
                uniqueMenus.push(menu.toObject());
                clusterIds.push(...uniqueClustersInMenu.map(cId => cId.toString()));
            }
        }
    });
    return { uniqueMenus, clusterIds };
};

module.exports = {
    saveSubscriptionWeeklyMenu,
    getSubscriptionWeeklyMenu,
    searchSubscriptionWeeklyMenuList,
    deleteSubscriptionWeeklyMenu,
    getWeeklyMenuByCategory
}