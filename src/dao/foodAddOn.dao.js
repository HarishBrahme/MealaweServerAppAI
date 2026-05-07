const FoodAddOn = require('../model/foodAddOn.model');
const { deleteImage } = require('../service/images.service');

const saveAddOn = async (foodaddon, imageName) => {
    const FoodAddon = new FoodAddOn();
    FoodAddon.addOnName = foodaddon.addOnName;
    FoodAddon.hidetoKitchen = foodaddon.hidetoKitchen;
    FoodAddon.imageUrl = imageName;
    FoodAddon.aliasNames = foodaddon.aliasNames;
    FoodAddon.addOnFlavour = foodaddon.addOnFlavour;
    FoodAddon.addOnPrice = foodaddon.addOnPrice;
    FoodAddon.addOnMaxPrice = foodaddon.addOnMaxPrice;
    FoodAddon.addOnType = foodaddon.addOnType;
    FoodAddon.addOnDescription = foodaddon.addOnDescription;
    const isInserted = await FoodAddon.save()
    return isInserted;
}


const UpdateAddOn = async (id, foodaddon, imageName) => {
    const addOn = await FoodAddOn.findOne({ _id: id });
    if (addOn && addOn._id) {
        const FoodAddon = {}
        FoodAddon.addOnName = foodaddon.addOnName || addOn.addOnName;
        FoodAddon.hidetoKitchen = foodaddon.hidetoKitchen || addOn.hidetoKitchen;
        FoodAddon.imageUrl = imageName ? imageName : addOn.imageUrl;
        FoodAddon.aliasNames = foodaddon.aliasNames || addOn.aliasNames;
        FoodAddon.addOnFlavour = foodaddon.addOnFlavour || addOn.addOnFlavour;
        FoodAddon.addOnPrice = foodaddon.addOnPrice || addOn.addOnPrice;
        FoodAddon.addOnMaxPrice = foodaddon.addOnMaxPrice || addOn.addOnMaxPrice;
        FoodAddon.addOnType = foodaddon.addOnType || addOn.addOnType;
        FoodAddon.addOnDescription = foodaddon.addOnDescription || addOn.addOnDescription;
        const update = await FoodAddOn.findOneAndUpdate({ _id: id },
            { $set: FoodAddon },
            { new: true });
        if (imageName) {
            deleteImage(addOn.imageUrl);
        }
        return update;
    } else {
        // console.log('addon not found ', addOn)
        return addOn;
    }

}



const saveAddOnList = async (foodaddon) => {
    var FoodAddon = [{}] = new FoodAddOn();
    FoodAddon.addOnName = foodaddon.addOnName;
    //   FoodAddon.imageUrl = imageName;
    FoodAddon.aliasNames = foodaddon.aliasNames;
    FoodAddon.hidetoKitchen = foodaddon.hidetoKitchen;
    FoodAddon.addOnFlavour = foodaddon.addOnFlavour
    FoodAddon.addOnPrice = foodaddon.addOnPrice;
    FoodAddon.addOnMaxPrice = foodaddon.addOnMaxPrice;
    FoodAddon.addOnDescription = foodaddon.addOnDescription;
    const isInserted = await FoodAddon.save()
    return isInserted;

}


const getAddOnList = async () => {
    const getaddonlist = await FoodAddOn.find({});
    return getaddonlist;
}


const deleteAddonList = async (ids) => {
    const deleteaddonlist = await FoodAddOn.deleteMany(
        {
            _id: {
                $in: [
                    ...ids
                ]
            }
        })
    return deleteaddonlist;
}




const getAddOn = async (id) => {
    const getaddon = await FoodAddOn.findById(id)
    return getaddon;
};


const deleteAddon = async (id) => {
    const deleteaddon = await FoodAddOn.findOneAndRemove(id);
    return deleteaddon;
}

module.exports = {
    getAddOnList,
    deleteAddonList,
    saveAddOn,
    getAddOn,
    deleteAddon,
    saveAddOnList,
    UpdateAddOn
}