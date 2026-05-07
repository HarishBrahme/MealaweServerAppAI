const { createTransport } = require('nodemailer');

let transporter;
let emailConfig;

const configureSMTP = () => {
    emailConfig = {
        smtpServer: process.env.SMTP_SERVER || '',
        smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
        username: process.env.SMTP_USERNAME || '',
        password: process.env.SMTP_PASSWORD || ''
    };
    const requiredFields = ['smtpServer', 'username', 'password'];
    const missingFields = requiredFields.filter(f => !emailConfig[f]);
    if (missingFields.length > 0) {
        console.error(`❌ Missing required environment variables: ${missingFields.join(', ')}`);
        return null;
    }
    transporter = createTransport({
        host: emailConfig.smtpServer,
        port: emailConfig.smtpPort,
        secure: emailConfig.smtpPort === 465,
        auth: {
            user: emailConfig.username,
            pass: emailConfig.password,
        },
    });
    console.log('email setup ready')
    return transporter;
};

const getEmailConfigAndTransporter = () => ({ transporter, emailConfig });

module.exports = { configureSMTP, getEmailConfigAndTransporter };