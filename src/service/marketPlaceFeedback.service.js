const dao = require('../dao/marketPlaceFeedback.dao')

const getfeedbackfromlist = async () => {
    const getfeedbackfromlist = await dao.getfeedbackfromlist;
    return getfeedbackfromlist;
};

const saveNavmoolfeedback = async (feedback) => {
    const saveFeedback = await dao.saveNavmoolfeedback(feedback);
    return saveFeedback;
}

const getfeedbackTolist = async (id, pageNumber, nPerPage) => {
    const getfeedback = await dao.getfeedbackTolist(id, pageNumber, nPerPage);
    return getfeedback;
}

const acknowledge = async (id) => {
    return dao.acknowledged(id);
}

const getfeedbackToListCount = async (id) => {
    return dao.getfeedbackToListCount(id);
}

module.exports = {
    getfeedbackfromlist,
    saveNavmoolfeedback,
    getfeedbackTolist,
    acknowledge,
    getfeedbackToListCount
}