const CompanyMenu = require('../model/companyMenu.model');

const saveCompanyMenu = async (companyMenuObj) => {
    const nCompanyMenu = new CompanyMenu();
    nCompanyMenu.itemName = companyMenuObj.itemName;
    nCompanyMenu.itemType = companyMenuObj.itemType;
    nCompanyMenu.itemPrice = companyMenuObj.itemPrice;
    nCompanyMenu.itemDescription = companyMenuObj.itemDescription;
    const isInserted = await nCompanyMenu.save();
    return isInserted;
};

const getCompanyMenuList = async () => {
    const list = await CompanyMenu.find({});
    return list;
};

const updateCompanyMenu = async (id, companyMenu) => {
    const savedcompanyMenu = await CompanyMenu.findOne({ _id: id })
    const nCompanyMenu = {};
    nCompanyMenu.itemName = companyMenu.itemName || savedcompanyMenu.itemName;
    nCompanyMenu.itemType = companyMenu.itemType || savedcompanyMenu.itemType;
    nCompanyMenu.itemPrice = companyMenu.itemPrice || savedcompanyMenu.itemPrice;
    nCompanyMenu.itemDescription = companyMenu.itemDescription || savedcompanyMenu.itemDescription;

    const updated = await CompanyMenu.findOneAndUpdate({ _id: id }, { $set: nCompanyMenu }, { new: true });
    return updated;
};
const deleteCompanyMenu = async (id) => {
    const deleted = CompanyMenu.findByIdAndRemove({ _id: id });
    return deleted;
}

module.exports = {
    saveCompanyMenu,
    getCompanyMenuList,
    updateCompanyMenu,
    deleteCompanyMenu
};