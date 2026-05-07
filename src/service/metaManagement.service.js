const metaManagement = require('../dao/metaManagement.dao');

async function createMetaManagement(data) {
    return metaManagement.createMetaManagement(data);
}

async function getAllMetaManagements(page = 1, pageSize = 10) {
    return metaManagement.getAllMetaManagements(page, pageSize);
}

async function getMetaManagementById(id) {
    return await metaManagement.getMetaManagementById(id);
}

async function getMetaManagementByPathName(pathName, pageType) {
    return await metaManagement.getMetaManagementByPathName(pathName, pageType);
}

async function getMetaManagementByPageId(pageId) {
    return await metaManagement.getMetaManagementByPageId(pageId);
}

async function updateMetaManagement(id, data) {
    return await metaManagement.updateMetaManagement(id, data);
}

async function updateMetaByPageId(pageId, data) {
    return await metaManagement.updateMetaByPageId(pageId, data);
}

async function deleteMetaManagement(id) {
    return await metaManagement.deleteMetaManagement(id);
}

async function deleteMetaByPageId(pageId) {
    return await metaManagement.deleteMetaByPageId(pageId);
}

module.exports = {
    createMetaManagement,
    getAllMetaManagements,
    getMetaManagementById,
    getMetaManagementByPathName,
    getMetaManagementByPageId,
    updateMetaManagement,
    updateMetaByPageId,
    deleteMetaManagement,
    deleteMetaByPageId,
};