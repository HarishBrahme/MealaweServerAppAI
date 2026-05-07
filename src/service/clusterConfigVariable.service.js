const dao = require('../dao/clusterConfigVariable.dao');

const saveUpdateClusterVariable = async (clusterVariable) => {
    return dao.saveUpdateClusterVariable(clusterVariable);
}
const getClusterVariable = async () => {
    return await dao.getClusterVariable();
}

const searchClusterVariable = async (searchObj) => {
    return await dao.searchClusterVariable(searchObj);
}

const deleteClusterVariable = async (id) => {
    return await dao.deleteClusterVariable(id);
}
const getClusterVariablesnameList = async () => {
    return await dao.getClusterVariablesnameList();
}

module.exports = {
    saveUpdateClusterVariable,
    getClusterVariable,
    searchClusterVariable,
    deleteClusterVariable,
    getClusterVariablesnameList
};