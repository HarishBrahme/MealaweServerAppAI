const CustomerFavKitchen = require('../model/customerFavKitchen.model');

const getFavKitchenList = async (customerId) => {
    const favkitchenList = await CustomerFavKitchen.findOne({ customerId });
    return favkitchenList;
}
const setFavKitchenList = async (payload) => {
    const customerId = payload.customerId
    const savedKitchenList = await CustomerFavKitchen.findOne({ customerId });
    const favKitchens = payload.favKitchens
    if (savedKitchenList && savedKitchenList._id) {
        const updated = await CustomerFavKitchen.findOneAndUpdate({ customerId },
            { $set: { favKitchens } }, { new: true });
        return updated;
    } else {
        const newCustomerFavKitchen = new CustomerFavKitchen();
        newCustomerFavKitchen.customerId = customerId;
        newCustomerFavKitchen.favKitchens = favKitchens;
        const isInserted = await newCustomerFavKitchen.save();
        return isInserted;
    }
}

module.exports = {
    getFavKitchenList,
    setFavKitchenList
};