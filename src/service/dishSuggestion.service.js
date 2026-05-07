const dao = require('../dao/dishSuggestion.dao')

const getDishList = async (pageNumber) => {
    return dao.getDishList(pageNumber);
}

const saveDishList = async (dish) => {
    return dao.saveDishList(dish);
}

const acknowledge = async (id) => {
    return dao.acknowledge(id);
}

module.exports = {
    getDishList,
    saveDishList,
    acknowledge
};
