const DishSuggestion = require('../model/dishSuggestion.model');


const getDishList = async (page) => {
    let limit = 10;
    const getFeedBackFromList = await DishSuggestion.find({})
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit * 1)
        .exec();
    return getFeedBackFromList;
}

const saveDishList = async (dishSuggestion) => {
    const ndishSuggestion = new DishSuggestion();
    ndishSuggestion.dishName = dishSuggestion.dishName;
    ndishSuggestion.dishType = dishSuggestion.dishType;
    ndishSuggestion.dishRegion = dishSuggestion.dishRegion;
    ndishSuggestion.description = dishSuggestion.description;
    ndishSuggestion.kitchenName = dishSuggestion.kitchenName;
    ndishSuggestion.kitchenLoginId = dishSuggestion.kitchenLoginId;
    ndishSuggestion.kitchenPhoneNo = dishSuggestion.kitchenPhoneNo;
    ndishSuggestion.kitchenPartnerName = dishSuggestion.kitchenPartnerName;
    const isInserted = await ndishSuggestion.save();
    return isInserted;
}
const acknowledge = async (id) => {
    const update = await DishSuggestion.findOneAndUpdate({ _id: id },
        { $set: { acknowledged: true } }, { new: true });
    return update;
}

module.exports = {
    getDishList,
    saveDishList,
    acknowledge
}