const Feedback = require('../model/generalAppFeedback.model');


const getfeedbackfromlist = async (page) => {
    let limit = 15;
    const getFeedBackFromList = await Feedback.find({})
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit * 1)
        .exec();
    return getFeedBackFromList;
}

const savefeedback = async (feedback) => {
    const nfeedback = new Feedback();
    nfeedback.feedbackFrom_id = feedback.feedbackFrom_id;
    nfeedback.feedbackFrom_name = feedback.feedbackFrom_name;
    nfeedback.feedbackFrom_phoneNo = feedback.feedbackFrom_phoneNo;
    nfeedback.feedbackFrom_userType = feedback.feedbackFrom_userType;
    nfeedback.feedbackComment = feedback.feedbackComment;
    nfeedback.feedbackType = feedback.feedbackType;
    const isInserted = await nfeedback.save();
    return isInserted;
}

const acknowledge = async (id) => {
    const update = await Feedback.findOneAndUpdate({ _id: id },
        { $set: { acknowledged: true } }, { new: true });
    return update;
}

module.exports = {
    getfeedbackfromlist,
    savefeedback,
    acknowledge
}