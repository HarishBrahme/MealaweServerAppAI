alert('hi')
function close(){
    const messageObj = {close: true}
    const stringifiedMessageObj = JSON.stringify(messageObj)
  if (window.webkit && Window.webkit.messageHandlers) {
        console.log('postmessage call on webkit')
        window.webkit.messageHandlers.cordova_iab.postMessage(stringifiedMessageObj)
      }
}