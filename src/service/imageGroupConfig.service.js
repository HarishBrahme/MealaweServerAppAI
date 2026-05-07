const ImageGroupConfig = require('../dao/imageGroupConfig.dao');

const createImageGroupConfig = async (data) => {
    return ImageGroupConfig.createImageGroupConfig(data);
};

const getAllImageGroupConfigs = async (page, pageSize) => {
    return ImageGroupConfig.getAllImageGroupConfigs(page, pageSize);
};

const getImageGroupConfigById = async (id) => {
    return ImageGroupConfig.getImageGroupConfigById(id);
};

const getImageGroupConfigByName = async (name) => {
    return ImageGroupConfig.getImageGroupConfigByName(name);
};

const updateImageGroupConfig = async (id, data) => {
    return ImageGroupConfig.updateImageGroupConfig(id, data);
};

const deleteImageGroupConfig = async (id) => {
    return ImageGroupConfig.deleteImageGroupConfig(id);
};

module.exports = {
    createImageGroupConfig,
    getAllImageGroupConfigs,
    getImageGroupConfigById,
    getImageGroupConfigByName,
    updateImageGroupConfig,
    deleteImageGroupConfig
};