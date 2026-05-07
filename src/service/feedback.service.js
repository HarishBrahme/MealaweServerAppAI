const dao = require('../dao/feedback.dao')
const kitchenPartnerdao = require('../dao/kitchenPartner.dao')

const getfeedbackfromlist = async () => {
    const getfeedbackfromlist = await dao.getfeedbackfromlist;
    return getfeedbackfromlist;
};

const savefeedback = async (feedback) => {
    const saveFeedback = await dao.savefeedback(feedback);
    if (saveFeedback && saveFeedback._id) {
        if (saveFeedback.feedbackTo_userType === 'kitchenPartner') {
            await kitchenPartnerdao.avgRating(saveFeedback.feedbackTo_id)
        }
    }
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

const exportFeedbackList = async (fromDate, toDate) => {
    return dao.exportFeedbackList(fromDate, toDate);
}

module.exports = {
    getfeedbackfromlist,
    savefeedback,
    getfeedbackTolist,
    acknowledge,
    getfeedbackToListCount,
    exportFeedbackList
}