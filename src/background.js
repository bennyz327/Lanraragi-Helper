// 背景腳本只應包含與API通信和消息處理的代碼
// 不應該包含任何使用 document 的代碼

// 監聽來自內容腳本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateMetadata") {
    // 反饋第一步完成
    chrome.tabs.sendMessage(sender.tab.id, {
      action: "updateStepStatus",
      step: 0,
      status: "success"
    });
    
    // 開始第二步：呼叫外掛端口取得元數據
    chrome.tabs.sendMessage(sender.tab.id, {
      action: "updateStepStatus",
      step: 1,
      status: "processing"
    });
    
    // 第一步：呼叫外掛端口取得元數據
    fetch('http://localhost:您的服務端口/api/plugin/網站A/fetchMetadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sourceUrl: request.sourceUrl
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`外掛API返回錯誤: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(metadata => {
      // 反饋第二步完成
      chrome.tabs.sendMessage(sender.tab.id, {
        action: "updateStepStatus",
        step: 1,
        status: "success"
      });
      
      // 開始第三步：使用獲取的元數據呼叫更新API
      chrome.tabs.sendMessage(sender.tab.id, {
        action: "updateStepStatus",
        step: 2,
        status: "processing"
      });
      
      // 第二步：使用獲取的元數據呼叫更新API
      return fetch('http://localhost:您的服務端口/api/update-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: request.localMangaId,
          // 將外掛返回的元數據格式傳遞給更新API
          ...metadata
        })
      });
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`更新API返回錯誤: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      // 反饋第三步完成
      chrome.tabs.sendMessage(sender.tab.id, {
        action: "updateStepStatus",
        step: 2,
        status: "success"
      });
      
      sendResponse({success: true, data: data});
    })
    .catch(error => {
      // 在出錯時更新步驟狀態
      if (error.message.includes("外掛API")) {
        chrome.tabs.sendMessage(sender.tab.id, {
          action: "updateStepStatus",
          step: 1,
          status: "error"
        });
      } else {
        chrome.tabs.sendMessage(sender.tab.id, {
          action: "updateStepStatus",
          step: 2,
          status: "error"
        });
      }
      
      sendResponse({success: false, error: error.toString()});
    });
    
    return true; // 保持通道開啟以進行非同步回應
  }
});