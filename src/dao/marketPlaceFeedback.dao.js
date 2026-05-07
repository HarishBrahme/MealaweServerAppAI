const Feedback = require('../model/marketPlaceFeedback.model');

const getfeedbackfromlist = async () => {
  const getFeedBackFromList = await Feedback.find({});
  return getFeedBackFromList;
}

const saveNavmoolfeedback = async (feedback) => {
  try {
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
    nfeedback.feedback_orderType = 'marketPlace';
    nfeedback.feedbackDate = new Date();
    const isInserted = await nfeedback.save();
    return isInserted;
  } catch (err) {
    console.log(err);
  }
}

const getfeedbackTolist = async (id, page, limit) => {
  const getfeedbackList = await Feedback.find({ feedbackTo_id: id }).sort({ _id: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
  return getfeedbackList;
}

const getFullFeedbackRating = async (id) => {
  const getfeedbackList = await Feedback.find({ feedbackTo_id: id }, { feedbackRating: 1 });
  return getfeedbackList;
}

const acknowledge = async (id) => {
  const update = await Feedback.findOneAndUpdate({ _id: id },
    { $set: { acknowledged: true } }, { new: true });
  return update;
}

const getfeedbackToListCount = async (id) => {
  const count = await Feedback.count({ feedbackTo_id: id });
  return { count };
}

const setfeedbackDate = async () => {
  const feedbackList = await Feedback.find({ feedbackDate: { $exists: false } });
  if (feedbackList && feedbackList.length > 0) {
    const promiseArr = [];
    feedbackList.forEach(async (feedback) => {
      // console.log('feedback',feedback._id);
      const feedbackDate = new Date(parseInt(feedback._id.toString().substring(0, 8), 16) * 1000);
      promiseArr.push(await Feedback.findOneAndUpdate({ _id: feedback._id },
        { feedbackDate }, { new: true }));
      // console.log('feedback saved');
    });
    return promiseArr;
  } else {
    return [];
  }
};


module.exports = {
  getfeedbackfromlist,
  saveNavmoolfeedback,
  getfeedbackTolist,
  getFullFeedbackRating,
  acknowledge,
  getfeedbackToListCount,
  setfeedbackDate
}