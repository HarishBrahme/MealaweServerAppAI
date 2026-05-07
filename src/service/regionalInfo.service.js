const dao = require('../dao/regionalInfo.dao');

const saveNewRegionalInfoList = async (regionalInfoObj, imageName) => {
    return dao.saveNewRegionalInfoList(regionalInfoObj, imageName);
};

const getRegionalInfoList = async () => {
    const bannerList = await dao.getRegionalInfoList();
    return bannerList;
};

const deleteRegionalInfo = async (id) => {
    const deleteregionalinfo = await dao.deleteRegionalInfo(id);
    return deleteregionalinfo;

}

module.exports = {
    saveNewRegionalInfoList,
    getRegionalInfoList,
    deleteRegionalInfo
};