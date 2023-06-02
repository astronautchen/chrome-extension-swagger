chrome.webRequest.onHeadersReceived.addListener(
  function (details) {
    if (
      details.type === 'xmlhttprequest' &&
      details.url.includes('openapi.json') &&
      details.frameId == 0
    ) {
      fetch(details.url)
        .then((response) => response.json())
        .then(async (data) => {
          const tabs = await chrome.tabs.query({
            currentWindow: true,
            active: true,
          });
          chrome.tabs.sendMessage(tabs[0].id, {
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
  { urls: ['http://*/api/*'] }
);
// chrome.tabs.onActivated.addListener(function (activeInfo) {
//   // 当标签页切换时触发
//   // var tabId = activeInfo.tabId;
//   console.log('activeInfo',activeInfo)
//   chrome.storage.sync.clear(function () {
//     console.log('数据已成功清除');
//   });
//   // 执行操作
// });