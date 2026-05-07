const SECRET_KEY = process.env.API_SECTET_KEY;;
const CryptoJS = require('crypto-js');

const messageListObj = {
    '100': { msg: 'Order is not eligible for refund', msgcode: 'msg100' },
    '101': { msg: 'Either mobile no. or email is already being used', msgcode: 'msg101' },
    '102': { msg: 'Email is already registered, kindly use another email', msgcode: 'msg102' },
    '103': { msg: 'Mobile no. is already registered, kindly use another mobile no.', msgcode: 'msg103' },
    '104': { msg: 'Mobile no. and email are already registered, kindly use different mobile no. and email', msgcode: 'msg104' },
    '105': { msg: 'Wrong OTP entered !!!', msgcode: 'msg105' },
    '106': { msg: 'This order cannot be rescheduled', msgcode: 'msg106' },
    '107': { msg: 'You have crossed the Maximum no. of retry, Please Login again!!!', msgcode: 'msg107' },
};

const encryptLastware = (req, data) => {
    if (req.headers['session-token']) {
        const token = req.headers['authorization'];
        const key = token ? token + token : SECRET_KEY;
        const session_x = req.headers['session_x'];
        const finalKey = session_x ? key + session_x : SECRET_KEY;
        const dataStrigyfy = JSON.stringify(data)
        return { data_key: CryptoJS.AES.encrypt(dataStrigyfy, finalKey).toString() };
    } else {
        return data;
    }
}

const success200 = (req, res, data) => {
    const encrypData = encryptLastware(req, data);
    res.status(200).send(encrypData);
}

const hasError500 = (res, msg) => {
    msgstr = msg ? msg : 'Please retry after some time !';
    res.status(500).send({ msg: msgstr });
}

const hasError401 = (res, msg) => {
    msgstr = msg ? msg : 'Invalid Credential !';
    res.status(401).send({ msg: msgstr });
}

const hasError404 = (res, msg) => {
    msgstr = msg ? msg : 'Invalid Credential !';
    res.status(404).send({ msg: msgstr });
}

const hasError402 = (res, msg) => {
    msgstr = msg ? msg : 'Invalid Request !';
    res.status(402).send({ msg: msgstr });
}

const hasError503 = (res, msgCode) => {
    res.status(503).send(messageListObj[msgCode]);
}

module.exports = {
    success200,
    hasError500,
    hasError402,
    hasError401,
    hasError404,
    hasError503
}