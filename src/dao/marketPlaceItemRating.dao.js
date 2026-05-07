const MarketPlaceItemRating = require('../model/marketPlaceItemRating.model');

const getfeedbackfromlist = async () => {
    const getFeedBackFromList = await Feedback.find({});
    return getFeedBackFromList;
}

const savefeedback = async (feedback) => {
    const nfeedback = new Feedback();
    nfeedback.feedbackFrom_id = feedback.feedbackFrom_id;
    nfeedback.feedbackFrom_name = feedback.feedbackFrom_name;
    nfeedback.feedbackFrom_imageUrl = feedback.feedbackFrom_imageUrl;
    nfeedback.feedbackFrom_userType = feedback.feedbackFrom_userType;
    nfeedback.feedbackTo_id = feedback.feedbackTo_id;
    nfeedback.feedbackTo_name = feedback.feedbackTo_name;
    nfeedback.feedbackTo_userType = feedback.feedbackTo_userType;
    nfeedback.feedbackComment = feedback.feedbackComment;
    nfeedback.feedbackRating = feedback.feedbackRating;
    nfeedback.extraFeedback = feedback.extraFeedback;
    nfeedback.feedbackOrderNo = feedback.feedbackOrderNo;
    nfeedback.feedbackDate = new Date();
    const isInserted = await nfeedback.save();
    return isInserted;
}

module.exports = {

};