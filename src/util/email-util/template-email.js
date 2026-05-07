const getSampleEmailTamplate = (templateObj) => {
  const supportEmail = "support@deskdyne.com";
  const supportPhone = "+91-XXXXXXXXXX";
  const appName = "Deskdyne";
  const primaryColor = "#3498db";
  return {
    subject: `Order Confirmation - Order #${templateObj.orderNumber}`,
    body: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50; border-bottom: 2px solid ${primaryColor}; padding-bottom: 10px;">
              Order Confirmation
            </h2>
            <p>Dear ${templateObj.customerName},</p>
            <p>Thank you for your order! We're excited to confirm that we've received your order and it's being prepared.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #2c3e50;">Order Details:</h3>
              <p><strong>Order Number:</strong> ${templateObj.orderNumber}</p>
              <p><strong>Order Date:</strong> ${templateObj.orderDate}</p>
              <p><strong>Delivery Address:</strong> ${templateObj.deliveryAddress}</p>
              <p><strong>Estimated Delivery Time:</strong> ${templateObj.estimatedDelivery}</p>
            </div>
            <p>You can track your order by visiting our website or contacting customer service.</p>
            <p>Thank you for choosing ${templateObj.restaurantName}!</p>
            <p>Best regards,<br>${templateObj.restaurantName} Team</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #666;">
              If you have any questions, please contact us at 
              <a href="mailto:${supportEmail}" style="color: ${primaryColor};">${supportEmail}</a> 
              or call ${supportPhone}.
            </p>
          </div>
        </body>
      </html>
    `,
  };
};

const getContactUsNavmoolEmailTemplate = (data) => {
  const { name, email, subject, message, phone, date } = data;
  const supportEmail = "support@navmool.com";
  const supportPhone = "+91-9999999999";
  const primaryColor = "#f39c12";
  return {
    subject: `New Contact Inquiry - ${subject || "Message from Contact Form"}`,
    body: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50; border-bottom: 2px solid ${primaryColor}; padding-bottom: 10px;">
              New Contact Us Submission
            </h2>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
            <p><strong>Subject:</strong> ${subject}</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #2c3e50;">Message:</h3>
              <p>${message}</p>
            </div>
            <p style="color: #555;">
              This message was submitted via the <strong>Navmool</strong> Contact Us form.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #666;">
              Need assistance? Contact our support team at 
              <a href="mailto:${supportEmail}" style="color: ${primaryColor};">${supportEmail}</a> 
              or call ${supportPhone}.
            </p>
          </div>
        </body>
      </html>
    `,
  };
};

const getThankYouNavmoolTemplate = (name, message) => {
  const appName = "Navmool";
  const supportEmail = "support@navmool.com";
  const primaryColor = "#2d6a4f";
  const accentColor = "#74c69d";

  return {
    subject: `Thank you for contacting ${appName}`,
    body: `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333; background-color: #f8f9fa; margin: 0; padding: 0;">
          <table align="center" width="100%" cellpadding="0" cellspacing="0"
                 style="max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 10px;
                        overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <tr>
              <td style="padding: 30px;">
                <h2 style="color: ${primaryColor}; margin-top: 0;">Thank You, ${name || "Valued Customer"} 🌿</h2>
                <p>We’ve successfully received your message:</p>
                <blockquote style="border-left: 4px solid ${accentColor}; padding-left: 15px; color: #555; font-style: italic;">
                  “${message || "No message provided."}”
                </blockquote>
                <p>Our support team will get back to you within <strong>72 hours</strong>.</p>
                <p>If you have more information to share, simply reply to this email — we’re always here to help.</p>

                <p style="margin-top: 25px;">
                  Warm regards,<br>
                  <strong>Team ${appName}</strong><br>
                  <span style="color: ${primaryColor};">Pure. Honest. Organic.</span><br>
                  <em>#ShuddhHaiTohNavmoolHai 🌱</em>
                </p>

                <hr style="border:none; border-top:1px solid #eee; margin:30px 0;">
                <p style="font-size:12px; color:#777; text-align:center;">
                  This is an automated message from
                  <a href="mailto:${supportEmail}" style="color:${accentColor}; text-decoration:none;">${appName}</a>.<br>
                  Please do not reply directly to this message.
                </p>
              </td>
            </tr>
          </table>
          <p style="text-align:center; font-size:12px; color:#999; margin-top:10px;">
            © ${new Date().getFullYear()} ${appName}. All rights reserved.
          </p>
        </body>
      </html>
    `,
  };
};


module.exports = { getSampleEmailTamplate, getContactUsNavmoolEmailTemplate, getThankYouNavmoolTemplate };
