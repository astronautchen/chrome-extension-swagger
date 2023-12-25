console.log(111);
chrome.webRequest.onCompleted.addListener(
  function (details) {
    // console.log('details', details);
    if (details.type === 'xmlhttprequest' && details.url.includes('openapi.json') && details.frameId == 0) {
      fetch(details.url)
        .then((response) => response.json())
        .then(async (data) => {
          const tabs = await chrome.tabs.query({
            currentWindow: true,
            active: true,
          });
          const response = await chrome.tabs.sendMessage(tabs[0].id, {
            type: 'NEW',
            data,
          });
        })
        .catch((error) => {
          console.error(error);
        }); //请求baidu .png文件时会拦截
      //onHeadersReceived {frameId: 0, initiator: "chrome-extension://agkllkkjbhclhjnlebdbdagkagfgcecj", method: "GET", parentFrameId: -1, requestId: "72074", …}
      return { cancel: true };
    }
  },
  { urls: ['<all_urls>'] }
);
