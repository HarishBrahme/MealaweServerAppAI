const dao = require('../dao/customercart.dao')



const saveNewCustomerCart = async (id, customer) => {

    return dao.saveNewCustomerCart(id, customer);
};

const deleteCart = async (id) => {
    return dao.DeleteCart(id);
}


module.exports = {
    saveNewCustomerCart,
    deleteCart
}