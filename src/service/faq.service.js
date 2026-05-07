const dao = require('../dao/faq.dao')

const saveFAQ = async (FAQ) => {
    return dao.saveFAQ(FAQ);
}

const getAllFAQs = async () => {
    return dao.getAllFAQs();
}

const getFAQFor = async (faqFor) => {
    return dao.getFAQFor(faqFor);
}

const updateFAQ = async (FAQ) => {
    return dao.updateFAQ(FAQ);
}

const deleteFAQ = async (id) => {
    return dao.deleteFAQ(id);
}


module.exports = {
    saveFAQ,
    getAllFAQs,
    getFAQFor,
    updateFAQ,
    deleteFAQ
};