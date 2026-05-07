const express = require('express');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { storeWebSocket, removeWebSocket } = require('../util/websocket-handler');
router.ws('/orderSocket', async (ws, req) => {
    try {
        const identifier = Math.random().toString(36).slice(2);
        let wsKey;
        ws.on('message', (key) => {
            wsKey = key;
            storeWebSocket(ws, key, identifier);
            // ws.send(id)     
        });
        ws.on('close', () => {
            removeWebSocket(wsKey, identifier);
        });
    }
    catch (error) {
        // console.log('error in websocket.route ==>',error)
    }

});

module.exports = router;