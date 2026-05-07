const dao = require('./../dao/processLock.dao');

const saveProcessLock = async (processName) => {
    return dao.saveProcessLock(processName);
}
const deleteProcessLock = async (id) => {
    return dao.deleteProcessLock(id);
}

module.exports = {
    saveProcessLock,
    deleteProcessLock
}