const geoFencingDao = require('../dao/geoFencing.dao');
const authUtil = require('../util/auth-util');


const getGeoFencingList = async () => {
    return geoFencingDao.getGeoFencingList();
};
const getAllGeoFencingList = async () => {
    return geoFencingDao.getAllGeoFencingList();
};
const saveGeoFencing = async (geofencing) => {
    const clusterId = await authUtil.getNewClusterId();
    geofencing.clusterId = clusterId;
    return geoFencingDao.saveGeoFencing(geofencing);
};
const updateGeoFencing = async (id, geofencing) => {
    return geoFencingDao.updateGeoFencing(id, geofencing);
};
const deleteGeoFencing = async (id) => {
    return geoFencingDao.deleteGeoFencing(id);
};

const activateGeoFencing = async (id, active) => {
    return geoFencingDao.activateGeoFencing(id, active);
};
const getclusterDetailsByclusterId = async (clusterId) => {
    return geoFencingDao.getclusterDetailsByclusterId(clusterId);
};

module.exports = {
    getGeoFencingList,
    getAllGeoFencingList,
    saveGeoFencing,
    updateGeoFencing,
    deleteGeoFencing,
    activateGeoFencing,
    getclusterDetailsByclusterId
};