const AppConfigVariables = require('../model/appConfigVariables');

const saveVariable = async (appVariable) => {
    const appConfigVariables = new AppConfigVariables();
    appConfigVariables.configName = appVariable.configName;
    appConfigVariables.configData = appVariable.configData;
    appConfigVariables.configIndex = appVariable.configIndex;
    const isInserted = await appConfigVariables.save();
    return isInserted;
};
const getAllVariables = async () => {
    const variables = await AppConfigVariables.find({}).sort({ configIndex: 1 });
    return variables;
};
const getVariables = async (variableNames) => {
    const variables = await AppConfigVariables.find({ configName: { $in: [...variableNames] } }).sort({ configIndex: 1 });
    return variables;
};
const updateVariable = async (variable) => {
    const updatedVariable = {
        configName: variable.configName,
        configData: variable.configData,
        configIndex: variable.configIndex
    };
    const updated = await AppConfigVariables.findOneAndUpdate({ _id: variable._id }, { $set: updatedVariable }, { new: true });
    return updated;
};

const deleteVariable = async (id) => {
    const deleted = await AppConfigVariables.deleteOne({ _id: id });
    return deleted;
};

const getOneVariable = async (variableName) => {
    const variable = await AppConfigVariables.findOne({ configName: variableName });
    return variable;
};

module.exports = {
    saveVariable,
    getAllVariables,
    getVariables,
    updateVariable,
    deleteVariable,
    getOneVariable
};