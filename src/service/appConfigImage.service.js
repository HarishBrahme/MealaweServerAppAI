const dao = require('../dao/appConfigImage.dao');

const saveConfigImage = async (configImage, imageUrl) => {
    return dao.saveConfigImage(configImage, imageUrl);
}
const getAllConfigImages = async () => {
    return dao.getAllConfigImages();
}
const getConfigImages = async (imageNames) => {
    return dao.getConfigImages(imageNames);
}
const updateConfigImage = async (id, imageObj, imageUrl) => {
    return dao.updateConfigImage(id, imageObj, imageUrl);
}
const deleteConfigImage = async (id) => {
    return dao.deleteConfigImage(id);
}
const getOneConfigImage = async (imageName) => {
    return dao.getOneConfigImage(imageName);
}


module.exports = {
    saveConfigImage,
    getAllConfigImages,
    getConfigImages,
    updateConfigImage,
    deleteConfigImage,
    getOneConfigImage
}