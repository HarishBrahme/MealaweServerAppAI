const AppConfigImages = require('../model/appConfigImage');

const saveConfigImage = async (configImage, imageUrl) => {
    const nAppConfigImages = new AppConfigImages();
    nAppConfigImages.imageName = configImage.imageName;
    nAppConfigImages.imageUrl = imageUrl;
    const isInserted = await nAppConfigImages.save();
    return isInserted;
};

const getAllConfigImages = async () => {
    const images = await AppConfigImages.find({});
    return images;
};
const getConfigImages = async (imageNames) => {
    const images = await AppConfigImages.find({ imageName: { $in: [...imageNames] } });
    return images;
};
const updateConfigImage = async (id, imageObj, imageUrl) => {
    const updatedImage = {};
    if (imageObj && imageObj.imageName) {
        updatedImage.imageName = imageObj.imageName;
    }
    if (imageUrl) {
        updatedImage.imageUrl = imageUrl;
    }
    const updated = await AppConfigImages.findOneAndUpdate({ _id: id }, { $set: updatedImage }, { new: true });
    return updated;
};

const deleteConfigImage = async (id) => {
    const deleted = await AppConfigImages.deleteOne({ _id: id });
    return deleted;
};

const getOneConfigImage = async (imageName) => {
    const image = await AppConfigImages.findOne({ imageName: imageName });
    return image;
};
module.exports = {
    saveConfigImage,
    getAllConfigImages,
    getConfigImages,
    updateConfigImage,
    deleteConfigImage,
    getOneConfigImage
}