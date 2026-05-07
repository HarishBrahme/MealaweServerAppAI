const ProcessLock = require('../model/processLock.model');

const saveProcessLock = async (processName) => {
    const nProcessLock = new ProcessLock();
    nProcessLock.processName = processName;
    nProcessLock.createdAt = new Date();
    const saved = await nProcessLock.save();
    return saved;
};

const deleteProcessLock = async (id) => {
    const geoFencing = await ProcessLock.findByIdAndRemove(id);
    return geoFencing;
}

module.exports = {
    saveProcessLock,
    deleteProcessLock
}