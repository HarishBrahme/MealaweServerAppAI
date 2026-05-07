const AppConfigVideos = require('../model/appConfigVideo.model');

const saveConfigVideo = async (configVideo, videoUrl) => {
    const nAppConfigVideos = new AppConfigVideos();
    nAppConfigVideos.videoName = configVideo.videoName;
    nAppConfigVideos.videoUrl = videoUrl;
    const isInserted = await nAppConfigVideos.save();
    return isInserted;
};

const getAllConfigVideos = async () => {
    const videos = await AppConfigVideos.find({});
    return videos;
};
const getConfigVideos = async (videoNames) => {
    const videos = await AppConfigVideos.find({ videoName: { $in: [...videoNames] } });
    return videos;
};
const updateConfigVideo = async (id, videoObj, videoUrl) => {
    const updatedVideo = {};
    if (videoObj && videoObj.videoName) {
        updatedVideo.videoName = videoObj.videoName;
    }
    if (videoUrl) {
        updatedVideo.videoUrl = videoUrl;
    }
    const updated = await AppConfigVideos.findOneAndUpdate({ _id: id }, { $set: updatedVideo }, { new: true });
    return updated;
};

const deleteConfigVideo = async (id) => {
    const deleted = await AppConfigVideos.deleteOne({ _id: id });
    return deleted;
};

const getOneConfigVideo = async (videoName) => {
    const video = await AppConfigVideos.findOne({ videoName: videoName });
    return video;
};
module.exports = {
    saveConfigVideo,
    getAllConfigVideos,
    getConfigVideos,
    updateConfigVideo,
    deleteConfigVideo,
    getOneConfigVideo
}