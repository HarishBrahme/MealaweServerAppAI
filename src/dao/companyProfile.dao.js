const CompanyProfile = require('../model/companyProfile.model');

const saveCompanyProfile = async (companyProfileObj) => {
    const nCompanyProfile = new CompanyProfile();
    nCompanyProfile.companyName = companyProfileObj.companyName;
    nCompanyProfile.address = companyProfileObj.address;
    nCompanyProfile.contactPerson = companyProfileObj.contactPerson;
    nCompanyProfile.contactNo = companyProfileObj.contactNo;
    const isInserted = await nCompanyProfile.save();
    return isInserted;
};

const getCompanyProfileList = async () => {
    const list = await CompanyProfile.find({});
    return list;
};

const updateCompanyProfile = async (id, companyProfile) => {
    const savedcompanyProfile = await CompanyProfile.findOne({ _id: id })
    const nCompanyProfile = {};
    nCompanyProfile.companyName = companyProfile.companyName || savedcompanyProfile.companyName;
    nCompanyProfile.address = companyProfile.address || savedcompanyProfile.address;
    nCompanyProfile.contactPerson = companyProfile.contactPerson || savedcompanyProfile.contactPerson;
    nCompanyProfile.contactNo = companyProfile.contactNo || savedcompanyProfile.contactNo;

    const updated = await CompanyProfile.findOneAndUpdate({ _id: id }, { $set: nCompanyProfile }, { new: true });
    return updated;
};
const deleteCompanyProfile = async (id) => {
    const deleted = CompanyProfile.findByIdAndRemove({ _id: id });
    return deleted;
}

module.exports = {
    saveCompanyProfile,
    getCompanyProfileList,
    updateCompanyProfile,
    deleteCompanyProfile
};