const dao = require('../dao/companyMenu.dao');

const saveCompanyMenu = async (data) => {
    return dao.saveCompanyMenu(data);
};
const getCompanyMenuList = async () => {
    return dao.getCompanyMenuList();
};

const updateCompanyMenu = async (id, data) => {
    return dao.updateCompanyMenu(id, data);
}

const deleteCompanyMenu = async (id) => {
    return dao.deleteCompanyMenu(id);
}


module.exports = {
    saveCompanyMenu,
    getCompanyMenuList,
    updateCompanyMenu,
    deleteCompanyMenu
};