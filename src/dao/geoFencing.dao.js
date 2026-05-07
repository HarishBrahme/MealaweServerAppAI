const GeoFencing = require('../model/geoFencing.model');

const getGeoFencingList = async () => {
    const geoFencingList = await GeoFencing.find({ active: true });
    return geoFencingList;
};
const getAllGeoFencingList = async () => {
    const geoFencingList = await GeoFencing.find();
    return geoFencingList;
};
const saveGeoFencing = async (geoFencing) => {
    const nGeoFencing = new GeoFencing();
    nGeoFencing.clusterId = geoFencing.clusterId;
    nGeoFencing.clusterName = geoFencing.clusterName;
    nGeoFencing.clusterCoordinates = geoFencing.clusterCoordinates;
    nGeoFencing.clusterConfigName = geoFencing.clusterConfigName;
    nGeoFencing.active = false;
    const savedgeoFencing = await nGeoFencing.save();
    return savedgeoFencing;
};
const updateGeoFencing = async (id, geoFencing) => {
    const savedGeoFencing = await GeoFencing.findOne({ _id: id })
    const nGeoFencing = {};
    nGeoFencing.clusterName = geoFencing.clusterName || savedGeoFencing.clusterName;
    nGeoFencing.clusterCoordinates = geoFencing.clusterCoordinates || savedGeoFencing.clusterCoordinates;
    nGeoFencing.clusterConfigName = geoFencing.clusterConfigName || savedGeoFencing.clusterConfigName;
    const savedgeoFencing = await GeoFencing.findOneAndUpdate({_id:id},{$set: nGeoFencing}, { new: true });
    return savedgeoFencing;
};

const deleteGeoFencing = async (id) => {
    const geoFencing = GeoFencing.findByIdAndRemove(id);
    return geoFencing;
}

const activateGeoFencing = async (id, active) => {
    const savedgeoFencing = await GeoFencing.findOneAndUpdate({ _id: id }, { $set: { active } }, { new: true });
    return savedgeoFencing;
}

const getclusterDetailsByclusterId = async (clusterId) => {
    const geoFencing = await GeoFencing.findOne({clusterId: clusterId });
    return geoFencing;
}

module.exports = {
    getGeoFencingList,
    getAllGeoFencingList,
    saveGeoFencing,
    updateGeoFencing,
    deleteGeoFencing,
    activateGeoFencing,
    getclusterDetailsByclusterId
};