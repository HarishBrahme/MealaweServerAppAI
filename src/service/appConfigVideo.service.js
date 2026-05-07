const dao = require('../dao/appConfigVideo.dao');

const saveConfigVideo = async (configVideo, videoUrl) => {
    return dao.saveConfigVideo(configVideo, videoUrl);
}
const getAllConfigVideos = async () => {
    return dao.getAllConfigVideos();
}
const getConfigVideos = async (videoNames) => {
    return dao.getConfigVideos(videoNames);
}
const updateConfigVideo = async (id, videoObj, videoUrl) => {
    return dao.updateConfigVideo(id, videoObj, videoUrl);
}
const deleteConfigVideo = async (id) => {
    return dao.deleteConfigVideo(id);
}
const getOneConfigVideo = async (videoName) => {
    return dao.getOneConfigVideo(videoName);
}


module.exports = {
    saveConfigVideo,
    getAllConfigVideos,
    getConfigVideos,
    updateConfigVideo,
    deleteConfigVideo,
    getOneConfigVideo
}