const RegionalInfo = require('../model/regionalInfo.model');

const saveNewRegionalInfoList = async (regionalInfo, imageUrl) => {
    const nregionalInfo = new RegionalInfo();
    nregionalInfo.name = regionalInfo.name;
    nregionalInfo.keywords = regionalInfo.keywords;
    nregionalInfo.imageUrl = imageUrl;
    const isInserted = await nregionalInfo.save();
    return isInserted;
};

const getRegionalInfoList = async () => {
    const regionalInfoList = await RegionalInfo.find({});
    return regionalInfoList;
};

const deleteRegionalInfo = async (id) => {
    const deleteregionalinfo = await RegionalInfo.findByIdAndRemove(id);
    return deleteregionalinfo;
}

module.exports = {
    saveNewRegionalInfoList,
    getRegionalInfoList,
    deleteRegionalInfo
};