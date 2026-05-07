const { getEmailConfigAndTransporter } = require("../../config/smtp.config");


const TestConnection = async () => {
  try {
    const { transporter, emailConfig } = getEmailConfigAndTransporter();
    if (!transporter) {
      console.error('❌ SMTP transporter not initialized. Run configureSMTP() first.');
      return { status: false };
    }
    await transporter.verify();
    return { status: true, transporter, emailConfig };
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
    return { status: false };
  }
};

const sendEmail = async (toAddresses, subject, body, attachments = [], customFromAddress, customReplyToAddress) => {
  try {
    const { status, transporter } = await TestConnection();
    if (!status || !transporter) {
      console.error('❌ SMTP transporter not ready.');
      return { status: false, error: 'SMTP not initialized' };
    }
    const fromAddress = customFromAddress || 'no-reply@deskdyne.com';
    const recipients = Array.isArray(toAddresses) ? toAddresses.join(', ') : toAddresses;
    let mailOptions = {
      from: fromAddress,
      to: recipients,
      subject: subject,
      html: body || '',
      ...(Array.isArray(attachments) && attachments.length ? { attachments } : {}),
    };
    if (customReplyToAddress) {
      mailOptions.replyTo = customReplyToAddress
    }
    const info = await transporter.sendMail(mailOptions);
    return { status: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return { status: false, error: error.message };
  }
};

module.exports = { sendEmail };
