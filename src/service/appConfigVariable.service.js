const dao = require('../dao/appConfigVariable.dao');

const saveVariable = async (appVariable) => {
    return dao.saveVariable(appVariable);
}

const getAllVariables = async () => {
    return dao.getAllVariables();
}

const getVariables = async (variableNames) => {
    return dao.getVariables(variableNames);
}

const updateVariable = async (variable) => {
    return dao.updateVariable(variable);
}

const deleteVariable = async (id) => {
    return dao.deleteVariable(id);
}
const getOneVariable = async (variable) => {
    return dao.getOneVariable(variable);
}

module.exports = {
    saveVariable,
    getAllVariables,
    getVariables,
    updateVariable,
    deleteVariable,
    getOneVariable
};