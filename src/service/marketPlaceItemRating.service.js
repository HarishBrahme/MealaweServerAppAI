const dao = require('../dao/marketPlaceItemRating.dao');
const counterDao = require('../dao/counters.dao');


const getRatingfromList = async () => {
    const getRatingfromList = await dao.getRatingfromList;
    return getRatingfromList;
};

const saveRating = async (feedback) => {
    const saveRating = await dao.saveRating(feedback);
    return saveRating;
}

module.exports = {
    getRatingfromList: getRatingfromList,
    saveRating: saveRating
}