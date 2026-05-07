const dao = require('../dao/adminProfile.dao');
const authAdmin = require('./authAdmin.service')

const saveNewAdminProfile = async (AdminProfile, imageName) => {
    if (AdminProfile.phoneNo) {
        const adminAuthObj = await authAdmin.registerAdmin(AdminProfile.phoneNo, AdminProfile.role);
        AdminProfile.loginId = adminAuthObj.adminId;
    }
    return dao.saveNewAdminProfile(AdminProfile, imageName);
};


const getAdminProfileList = async () => {
    const getAdminProfileList = await dao.getAdminProfileList();
    return getAdminProfileList;
};

const getAdminProfile = async (loginId) => {
    const getadminprofile = await dao.getAdminProfile(loginId)
    return getadminprofile;
}

const updateAdminProfile = async (id, AdminProfile, imageName) => {
    const updateadminprofile = await dao.updateAdminProfile(id, AdminProfile, imageName)
    return updateadminprofile;
}

const searchAdmin = async (searchObj) => {
    const adminList = await dao.searchAdmin(searchObj)
    return adminList;
}

const deleteAdmin = async (loginId) => {
    await authAdmin.deleteAdmin(loginId)
    const admin = await dao.deleteAdmin(loginId)
    return admin;
}

module.exports = {
    saveNewAdminProfile,
    getAdminProfileList,
    getAdminProfile,
    updateAdminProfile,
    searchAdmin,
    deleteAdmin
}