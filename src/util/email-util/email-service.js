const { sendEmail } = require("./email-main");
const { getSampleEmailTamplate, getContactUsNavmoolEmailTemplate, getThankYouNavmoolTemplate } = require("./template-email");

const istNowYMD = () => {
    const fmt = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
    return fmt.format(new Date());
};

const sendSampleTemplateEmail = async (toAddresses) => {
    try {
        const templateObj = {
            customerName: "John Doe",
            orderNumber: "ORD-2024-00123",
            orderDate: "2024-07-12",
            deliveryAddress: "123 Main St, City, State 12345",
            estimatedDelivery: "6:30 PM - 7:00 PM",
            restaurantName: "Delicious Eats",
        };
        const template = getSampleEmailTamplate(templateObj);
        return await sendEmail(toAddresses, template.subject, template.body);
    } catch (error) {
        console.error(`Error in sendSampleTemplateEmail:`, error);
        return { status: false, error: error.message };
    }
};

const sendContactUsEmail = async (data) => {
    try {
        const formattedDate = istNowYMD();
        const contactTemplate = getContactUsNavmoolEmailTemplate({ ...data, date: formattedDate });
        const supportEmails = ["support@navmool.com", "info@navmool.com"];
        const supportRes = await sendEmail(supportEmails, contactTemplate.subject, contactTemplate.body, [], 'noreply@navmool.com');
        const ackTemplate = getThankYouNavmoolTemplate(data.name, data.message);
        await sendEmail([data.email], ackTemplate.subject, ackTemplate.body, [], 'noreply@navmool.com');
        return { status: true, supportRes };
    } catch (error) {
        console.error(`Error in sendContactUsEmail:`, error);
        return { status: false, error: error.message };
    }
};

module.exports = { sendSampleTemplateEmail, sendContactUsEmail };