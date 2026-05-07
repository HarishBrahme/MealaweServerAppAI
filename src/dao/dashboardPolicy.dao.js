const policySchema = require('../model/dashboardPolicy.model')

const addPolicy = async (policy) => {
    try {
        const savePolicy = {
            button_policies: policy.button_policies,
            policy_description: policy.policy_description,
            policy_name: policy.policy_name,
            route_policies: policy.route_policies,
        };
        const newPolicy = await policySchema.create(savePolicy);
        return newPolicy;
    } catch (error) {
        // console.log(error);
    }
}

const getAllPolicy = async () => {
    try {
        const allPolicy = await policySchema.find({});
        return allPolicy;
    } catch (error) {
        // console.log(error);
    }
}

const updatePolicy = async (id, policy) => {
    try {
        // console.log(id);
        const updatedPolicy = {
            button_policies: policy.button_policies,
            policy_description: policy.policy_description,
            policy_name: policy.policy_name,
            route_policies: policy.route_policies,
        };
        const savedPolicy = await policySchema.findOneAndUpdate({ _id: id }, { $set: updatedPolicy }, { new: true });
        //const savedPolicy = await policySchema.findOne({_id:id});
        // // console.log('savedPolicy',savedPolicy);
        return savedPolicy;
    } catch (error) {
        // console.log(error);
    }
}

const deletePolicy = async (id) => {
    try {
        const allPolicy = await policySchema.deleteOne({ _id: id });
        return allPolicy;
    } catch (error) {
        // console.log(error);
    }
}
module.exports = {
    addPolicy,
    getAllPolicy,
    updatePolicy,
    deletePolicy
}