const CustomerCart = require('../model/customerCart.model');


const saveNewCustomerCart = async (id, customerProfile) => {
    const nsaveNewCustomerCart = new CustomerCart();
    nsaveNewCustomerCart.customerId = id
    nsaveNewCustomerCart.customerName = customerProfile.customerName;
    nsaveNewCustomerCart.itemList = customerProfile.itemList;
    nsaveNewCustomerCart.addOns = customerProfile.addOns
    nsaveNewCustomerCart.orderType = customerProfile.orderType
    const isInserted = await nsaveNewCustomerCart.save();
    return isInserted;
}

const DeleteCart = async (id) => {
    const deletecart = CustomerCart.findByIdAndRemove(id);
    return deletecart;
}
module.exports = {
    saveNewCustomerCart,
    DeleteCart
}