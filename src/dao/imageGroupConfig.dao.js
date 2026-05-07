const ImageGroupConfig = require('../model/imageGroupConfig.model');

async function createImageGroupConfig(data) {
    try {
        console.log(data, "data")
        const config = new ImageGroupConfig(data);
        return await config.save();
    } catch (error) {
        throw new Error('Error creating image group config: ' + error.message);
    }
}

async function getAllImageGroupConfigs(page, pageSize) {
    try {
        const skip = (page - 1) * pageSize;
        const [configs, total] = await Promise.all([
            ImageGroupConfig.find().skip(skip).limit(pageSize),
            ImageGroupConfig.countDocuments()
        ]);
        return { configs, total };
    } catch (error) {
        throw new Error('Error fetching image group configs: ' + error.message);
    }
}

async function getImageGroupConfigById(id) {
    try {
        return await ImageGroupConfig.findById(id);
    } catch (error) {
        throw new Error('Error fetching image group config by ID: ' + error.message);
    }
}

async function getImageGroupConfigByName(name) {
    try {
        return await ImageGroupConfig.findOne({ name: name }).select('imageData -_id');
    } catch (error) {
        throw new Error('Error fetching image group config by Name: ' + error.message);
    }
}

async function updateImageGroupConfig(id, data) {
    try {
        return await ImageGroupConfig.findByIdAndUpdate(id, data, { new: true });
    } catch (error) {
        throw new Error('Error updating image group config: ' + error.message);
    }
}

async function deleteImageGroupConfig(id) {
    try {
        return await ImageGroupConfig.findByIdAndDelete(id);
    } catch (error) {
        throw new Error('Error deleting image group config: ' + error.message);
    }
}

module.exports = {
    createImageGroupConfig,
    getAllImageGroupConfigs,
    getImageGroupConfigById,
    getImageGroupConfigByName,
    updateImageGroupConfig,
    deleteImageGroupConfig
};