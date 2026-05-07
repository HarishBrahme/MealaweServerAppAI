const FAQ = require('../model/faq.model');

const saveFAQ = async (faq) => {
    const newfaq = new FAQ();
    newfaq.question = faq.question;
    newfaq.answer = faq.answer;
    newfaq.faqFor = faq.faqFor;
    const isInserted = await newfaq.save();
    return isInserted;
};
const getAllFAQs = async () => {
    const FAQs = await FAQ.find({});
    return FAQs;
};
const getFAQFor = async (faqFor) => {
    const faqlist = await FAQ.find({ faqFor: { $in: ['All', faqFor] } });
    return faqlist;
};
const updateFAQ = async (faq) => {
    const updatedFAQ = {
        question: faq.question,
        answer: faq.answer,
        faqFor: faq.faqFor
    };
    const updated = await FAQ.findOneAndUpdate({ _id: faq._id }, { $set: updatedFAQ }, { new: true });
    return updated;
};

const deleteFAQ = async (id) => {
    const deleted = await FAQ.deleteOne({ _id: id });
    return deleted;
};

module.exports = {
    saveFAQ,
    getAllFAQs,
    getFAQFor,
    updateFAQ,
    deleteFAQ
};