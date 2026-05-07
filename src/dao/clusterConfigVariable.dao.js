const ClusterConfigVariables = require('../model/clusterConfigVariable.model');

const saveUpdateClusterVariable = async (clusterConfigVariable) => {
    const { _id } = clusterConfigVariable;
    const savedclusterConfigVariable = await ClusterConfigVariables.findOne({ _id });
    let nSavedclusterConfigVariable;

    if (savedclusterConfigVariable) {
        nSavedclusterConfigVariable = {};

        nSavedclusterConfigVariable.configName = clusterConfigVariable.configName ?? savedclusterConfigVariable.configName;

        nSavedclusterConfigVariable.subscriptionPlatformCharges = clusterConfigVariable.subscriptionPlatformCharges ?? savedclusterConfigVariable.subscriptionPlatformCharges;
        nSavedclusterConfigVariable.subscriptionPlatformChargesDiscount = clusterConfigVariable.subscriptionPlatformChargesDiscount ?? savedclusterConfigVariable.subscriptionPlatformChargesDiscount;
        nSavedclusterConfigVariable.subscriptionDeliveryCharges = clusterConfigVariable.subscriptionDeliveryCharges ?? savedclusterConfigVariable.subscriptionDeliveryCharges;
        nSavedclusterConfigVariable.subscriptionDeliveryChargesDiscount = clusterConfigVariable.subscriptionDeliveryChargesDiscount ?? savedclusterConfigVariable.subscriptionDeliveryChargesDiscount;
        nSavedclusterConfigVariable.subscriptionEcoFriendlyPackagingCharges = clusterConfigVariable.subscriptionEcoFriendlyPackagingCharges ?? savedclusterConfigVariable.subscriptionEcoFriendlyPackagingCharges;
        nSavedclusterConfigVariable.subscriptionEcoFriendlyPackagingChargesDiscount = clusterConfigVariable.subscriptionEcoFriendlyPackagingChargesDiscount ?? savedclusterConfigVariable.subscriptionEcoFriendlyPackagingChargesDiscount;

        nSavedclusterConfigVariable.onDemandPlatformCharges = clusterConfigVariable.onDemandPlatformCharges ?? savedclusterConfigVariable.onDemandPlatformCharges;
        nSavedclusterConfigVariable.onDemandPlatformChargesDiscount = clusterConfigVariable.onDemandPlatformChargesDiscount ?? savedclusterConfigVariable.onDemandPlatformChargesDiscount;
        nSavedclusterConfigVariable.onDemandDeliveryCharges = clusterConfigVariable.onDemandDeliveryCharges ?? savedclusterConfigVariable.onDemandDeliveryCharges;
        nSavedclusterConfigVariable.onDemandDeliveryChargesDiscount = clusterConfigVariable.onDemandDeliveryChargesDiscount ?? savedclusterConfigVariable.onDemandDeliveryChargesDiscount;
        nSavedclusterConfigVariable.onDemandEcoFriendlyPackagingCharges = clusterConfigVariable.onDemandEcoFriendlyPackagingCharges ?? savedclusterConfigVariable.onDemandEcoFriendlyPackagingCharges;
        nSavedclusterConfigVariable.onDemandEcoFriendlyPackagingChargesDiscount = clusterConfigVariable.onDemandEcoFriendlyPackagingChargesDiscount ?? savedclusterConfigVariable.onDemandEcoFriendlyPackagingChargesDiscount;
        nSavedclusterConfigVariable.onDemandPlatformChargesGstPercentage = clusterConfigVariable.onDemandPlatformChargesGstPercentage ?? savedclusterConfigVariable.onDemandPlatformChargesGstPercentage;
        nSavedclusterConfigVariable.onDemandDeliveryGstPercentage = clusterConfigVariable.onDemandDeliveryGstPercentage ?? savedclusterConfigVariable.onDemandDeliveryGstPercentage;
        nSavedclusterConfigVariable.onDemandEcoFriendlyPackagingGstPercentage = clusterConfigVariable.onDemandEcoFriendlyPackagingGstPercentage ?? savedclusterConfigVariable.onDemandEcoFriendlyPackagingGstPercentage;

        nSavedclusterConfigVariable.subscriptionPlatformGstPercentage = clusterConfigVariable.subscriptionPlatformGstPercentage?? savedclusterConfigVariable.subscriptionPlatformGstPercentage;
        nSavedclusterConfigVariable.subscriptionDeliveryGstPercentage = clusterConfigVariable.subscriptionDeliveryGstPercentage?? savedclusterConfigVariable.subscriptionDeliveryGstPercentage;
        nSavedclusterConfigVariable.subscriptionEcoFriendlyPackagingGstPercentage = clusterConfigVariable.subscriptionEcoFriendlyPackagingGstPercentage?? savedclusterConfigVariable.subscriptionEcoFriendlyPackagingGstPercentage;
        nSavedclusterConfigVariable.bulkPlatformChargesGstPercentage = clusterConfigVariable.bulkPlatformChargesGstPercentage?? savedclusterConfigVariable.bulkPlatformChargesGstPercentage;
        nSavedclusterConfigVariable.bulkEcoFriendlyPackagingGstPercentage = clusterConfigVariable.bulkEcoFriendlyPackagingGstPercentage?? savedclusterConfigVariable.bulkEcoFriendlyPackagingGstPercentage;
        nSavedclusterConfigVariable.bulkDeliveryGstPercentage = clusterConfigVariable.bulkDeliveryGstPercentage?? savedclusterConfigVariable.bulkDeliveryGstPercentage;

        nSavedclusterConfigVariable.showSubscription = clusterConfigVariable.showSubscription ?? savedclusterConfigVariable.showSubscription;
        nSavedclusterConfigVariable.showOndemand = clusterConfigVariable.showOndemand ?? savedclusterConfigVariable.showOndemand;
        nSavedclusterConfigVariable.showClusterMenu = clusterConfigVariable.showClusterMenu ?? savedclusterConfigVariable.showClusterMenu;
        // nSavedclusterConfigVariable.showOyo = clusterConfigVariable.showOyo ?? savedclusterConfigVariable.showOyo;
        nSavedclusterConfigVariable.showNavmool = clusterConfigVariable.showNavmool ?? savedclusterConfigVariable.showNavmool;
        nSavedclusterConfigVariable.showBulk = clusterConfigVariable.showBulk ?? savedclusterConfigVariable.showBulk;


        // nSavedclusterConfigVariable.subscriptionScrenType = clusterConfigVariable.subscriptionScrenType ?? savedclusterConfigVariable.subscriptionScrenType;

        return await ClusterConfigVariables.findOneAndUpdate(
            { _id: savedclusterConfigVariable._id },
            { $set: nSavedclusterConfigVariable },
            { new: true }
        );
    } else {
        nSavedclusterConfigVariable = new ClusterConfigVariables();
        nSavedclusterConfigVariable.configName = clusterConfigVariable.configName;
        nSavedclusterConfigVariable.subscriptionPlatformCharges = clusterConfigVariable.subscriptionPlatformCharges;
        nSavedclusterConfigVariable.subscriptionPlatformChargesDiscount = clusterConfigVariable.subscriptionPlatformChargesDiscount;
        nSavedclusterConfigVariable.subscriptionDeliveryCharges = clusterConfigVariable.subscriptionDeliveryCharges;
        nSavedclusterConfigVariable.subscriptionDeliveryChargesDiscount = clusterConfigVariable.subscriptionDeliveryChargesDiscount;
        nSavedclusterConfigVariable.subscriptionEcoFriendlyPackagingCharges = clusterConfigVariable.subscriptionEcoFriendlyPackagingCharges;
        nSavedclusterConfigVariable.subscriptionEcoFriendlyPackagingChargesDiscount = clusterConfigVariable.subscriptionEcoFriendlyPackagingChargesDiscount;
        nSavedclusterConfigVariable.subscriptionPlatformGstPercentage = clusterConfigVariable.subscriptionPlatformGstPercentage;
        nSavedclusterConfigVariable.subscriptionEcoFriendlyPackagingGstPercentage = clusterConfigVariable.subscriptionEcoFriendlyPackagingGstPercentage;
        nSavedclusterConfigVariable.subscriptionDeliveryGstPercentage = clusterConfigVariable.subscriptionDeliveryGstPercentage;
        nSavedclusterConfigVariable.onDemandPlatformCharges = clusterConfigVariable.onDemandPlatformCharges;
        nSavedclusterConfigVariable.onDemandPlatformChargesDiscount = clusterConfigVariable.onDemandPlatformChargesDiscount;
        nSavedclusterConfigVariable.onDemandDeliveryCharges = clusterConfigVariable.onDemandDeliveryCharges;
        nSavedclusterConfigVariable.onDemandDeliveryChargesDiscount = clusterConfigVariable.onDemandDeliveryChargesDiscount;
        nSavedclusterConfigVariable.onDemandEcoFriendlyPackagingCharges = clusterConfigVariable.onDemandEcoFriendlyPackagingCharges;
        nSavedclusterConfigVariable.onDemandEcoFriendlyPackagingChargesDiscount = clusterConfigVariable.onDemandEcoFriendlyPackagingChargesDiscount;

        nSavedclusterConfigVariable.subscriptionPlatformGstPercentage = clusterConfigVariable.subscriptionPlatformGstPercentage;
        nSavedclusterConfigVariable.subscriptionDeliveryGstPercentage = clusterConfigVariable.subscriptionDeliveryGstPercentage;
        nSavedclusterConfigVariable.subscriptionEcoFriendlyPackagingGstPercentage = clusterConfigVariable.subscriptionEcoFriendlyPackagingGstPercentage;
        nSavedclusterConfigVariable.bulkPlatformChargesGstPercentage = clusterConfigVariable.bulkPlatformChargesGstPercentage;
        nSavedclusterConfigVariable.bulkEcoFriendlyPackagingGstPercentage = clusterConfigVariable.bulkEcoFriendlyPackagingGstPercentage;
        nSavedclusterConfigVariable.bulkDeliveryGstPercentage = clusterConfigVariable.bulkDeliveryGstPercentage;


        nSavedclusterConfigVariable.showSubscription = clusterConfigVariable.showSubscription ?? savedclusterConfigVariable.showSubscription;
        nSavedclusterConfigVariable.showOndemand = clusterConfigVariable.showOndemand ?? savedclusterConfigVariable.showOndemand;
        nSavedclusterConfigVariable.showClusterMenu = clusterConfigVariable.showClusterMenu ?? savedclusterConfigVariable.showClusterMenu;
        // nSavedclusterConfigVariable.showOyo = clusterConfigVariable.showOyo ?? savedclusterConfigVariable.showOyo;
        nSavedclusterConfigVariable.showNavmool = clusterConfigVariable.showNavmool ?? savedclusterConfigVariable.showNavmool;
        nSavedclusterConfigVariable.showBulk = clusterConfigVariable.showBulk ?? savedclusterConfigVariable.showBulk;




        // nSavedclusterConfigVariable.subscriptionScrenType = clusterConfigVariable.subscriptionScrenType;

        const isInserted = await nSavedclusterConfigVariable.save();
        return isInserted;
    }
};


const getClusterVariable = async () => {
    const clusterConfigVariables = await ClusterConfigVariables.find({});
    return clusterConfigVariables;
}

const getClusterVariablesnameList = async () => {
    const clusterConfigVariables = await ClusterConfigVariables.find({}).select('configName');
    return clusterConfigVariables;
}

const searchClusterVariable = async (searchObj) => {
    const records = await ClusterConfigVariables.findOne(searchObj);
    return records;
}

const deleteClusterVariable = async (id) => {
    const deleted = await ClusterConfigVariables.findByIdAndRemove({ _id: id });
    return deleted;
};
module.exports = {
    saveUpdateClusterVariable,
    getClusterVariable,
    searchClusterVariable,
    deleteClusterVariable,
    getClusterVariablesnameList
};