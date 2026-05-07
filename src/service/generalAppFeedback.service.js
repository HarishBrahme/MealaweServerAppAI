const dao = require('../dao/generalAppFeedback.dao')

const getfeedbackfromlist = async (pageNumber) => {
    const getfeedbackfromlist = await dao.getfeedbackfromlist(pageNumber);
    return getfeedbackfromlist;
};

const savefeedback = async (feedback) => {
    const saveFeedback = await dao.savefeedback(feedback);
    return saveFeedback;
}

const acknowledge = async (id) => {
    return dao.acknowledge(id);
}

module.exports = {
    getfeedbackfromlist,
    savefeedback,
    acknowledge
}