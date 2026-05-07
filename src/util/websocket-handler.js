const webSocketMapper = {};
let pongWebSocketCounter = 0;

const storeWebSocket = (ws, key, identifier) => {
    try {
        if (webSocketMapper[key]) {
            webSocketMapper[key][identifier] = ws;
        } else {
            webSocketMapper[key] = {};
            webSocketMapper[key][identifier] = ws;
        }
        pongWebSocket(key);
    }
    catch (error) {
        // console.log('error in storeWebSocket ==>',error)
    }
}

const pongWebSocket = (key) => {
    clearTimeout(pongWebSocketCounter);
    const webSocketKeyList = Object.keys(webSocketMapper);
    if (webSocketKeyList && webSocketKeyList.length > 0) {
        webSocketKeyList.forEach(key => {
            sendToWebSocket(key, { msg: 'pong' });
        });
        pongWebSocketCounter = setTimeout(() => {
            // // console.log('inside pong settimeout');
            pongWebSocket(key);
        }, 10000);
    }
}

// const trigger = () => {
//     setInterval(()=>{
//         sendToWebSocket('NEW_ORDER',{orderNo:Math.random().toString(36).slice(2)});
//     },60000)
// }

const removeWebSocket = (key, identifier) => {
    try {
        if (webSocketMapper[key] && webSocketMapper[key][identifier]) {
            delete webSocketMapper[key][identifier];
            const identifierKeyList = Object.keys(webSocketMapper[key]);
            if (identifierKeyList && identifierKeyList.length === 0) {
                delete webSocketMapper[key];
            }
        }
    }
    catch (error) {
        // console.log('error in removeWebSocket ==>',error)
    }

}

const sendToWebSocket = (key, data) => {
    try {
        const identifiersObj = webSocketMapper[key];
        if (identifiersObj) {
            const identifierKeyList = Object.keys(identifiersObj);
            // // console.log('sendToWebSocket',identifierKeyList);            
            identifierKeyList.forEach(identifier => {
                const ws = identifiersObj[identifier];
                // // console.log('sendToWebSocket',identifier,data); 
                ws.send(JSON.stringify({ key, data }));
            });
        }
    }
    catch (error) {
        // console.log('error in sendToWebSocket ==>',error)
    }


}

module.exports = { storeWebSocket, sendToWebSocket, removeWebSocket }
