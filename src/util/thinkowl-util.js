const https = require('https');
const axios = require('axios');


const sendOrderWhatsappMsg= (eventType, payload) => {
    return new Promise((resolve, reject) => {
        const baseURL = process.env.THINKOWL_SERVER_URL|| 'https://thinkowl-vm.mealawe.com/integration-server';
        const url = `${baseURL}/webhook/order/${eventType}`;

        const headers = {
            'X-THINKOWL-MEALAWE': process.env.THINKOWL_CALLBACK_TOKEN, // Verification key
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        };

        axios({
            method: 'POST',
            url: url,
            data: payload,
            headers: headers,
            responseType: 'json',
            timeout: 15000, // Shorter timeout is usually better for webhooks
        })
        .then((res) => {
            // Success Response: 200 OK
            if (res.status === 200) {
                resolve(res.data);
                console.log("Thinkowl",res.data)
            } else {
                reject({ errorMsg: `Unexpected status code: ${res.status}` });
            }
        })
        .catch(error => {
            console.error(`Error sending Webhook [${eventType}]:`, error.response?.data || error.message);
            
            // Per the requirement: "Please retry if a 200 OK is not received"
            reject({ 
                errorMsg: 'Webhook failed', 
                status: error.response?.status 
            });
        });
    });
};

module.exports = {
    sendOrderWhatsappMsg
}