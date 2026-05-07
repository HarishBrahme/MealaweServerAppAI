const dao = require('../dao/dashboardPolicy.dao')

const addPolicy = async (policyObj) => {
    const policy = await dao.addPolicy(policyObj);
    return policy;
}

const getAllPolicy = async (id) => {
    const allPolicy = await dao.getAllPolicy(id);
    return allPolicy;
}

const updatePolicy = async (id, policy) => {
    const allPolicy = await dao.updatePolicy(id, policy);
    return allPolicy;
}

const deletePolicy = async (id) => {
    const allPolicy = await dao.deletePolicy(id);
    return allPolicy;
}

module.exports = {
    addPolicy,
    getAllPolicy,
    updatePolicy,
    deletePolicy
}