const dao = require('../dao/companyProfile.dao');

const saveCompanyProfile = async (data) => {
    return dao.saveCompanyProfile(data);
};
const getCompanyProfileList = async () => {
    return dao.getCompanyProfileList();
};

const updateCompanyProfile = async (id, data) => {
    return dao.updateCompanyProfile(id, data);
}

const deleteCompanyProfile = async (id) => {
    return dao.deleteCompanyProfile(id);
}


module.exports = {
    saveCompanyProfile,
    getCompanyProfileList,
    updateCompanyProfile,
    deleteCompanyProfile
}