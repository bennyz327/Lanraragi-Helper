// 背景腳本只應包含與API通信和消息處理的代碼
// 不應該包含任何使用 document 的代碼

async function getConfig() {
  return new Promise(resolve => {
    chrome.storage.sync.get(['lanraragiUrl','apiKey'], resolve);
  });
}

// 監聽來自內容腳本的消息
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "updateMetadata") {
	  // 取得設定
	  const { lanraragiUrl = '', apiKey = '' } = await getConfig();
	  
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

    if (lanraragiUrl === '' 
        || (!request.localMangaId || request.localMangaId === '') 
        || (!request.sourceUrl || request.sourceUrl === '')
      ) {
      console.log(`沒有設定好資料`);
      sendResponse({success: false, error: `沒有設定好資料`})
    }
    
    // 第一步：呼叫外掛端口取得元數據
    const baseUrl = `${lanraragiUrl}/api/plugins/use`
    const params = new URLSearchParams({
      plugin: 'ehplugin',
      id: request.localMangaId,
      arg: request.sourceUrl,
    });
    fetch(`${baseUrl}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
		    'Authorization': apiKey
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
    .then(async metadata => {
      // metadata.data.new_tags 為標籤字串
      // metadata.data.title 為標題
      // metadata.success 判斷成功與否

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


      // 第 2.5 步 先取得原本標籤字串，每個標籤以","區隔後，去除前後空白就是個別標籤
      // 找到 date_added 開頭和 source開頭的標籤保留下來
      const getBaseUrl = `${lanraragiUrl}/api/archives/${request.localMangaId}/metadata`
      const getResponse = await fetch(getBaseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey
        }
      });
      const metadataJson = await getResponse.json()
      const filteredTagString = metadataJson.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.startsWith('date_added'))
        .join(',')


      console.log(filteredTagString);
      console.log(metadata.data.new_tags);
      // 第二步：使用獲取的元數據呼叫更新API
      const putBaseUrl = `${lanraragiUrl}/api/archives/${request.localMangaId}/metadata`
      const putParams = new URLSearchParams({
        title: metadata.data.title,
        tags: `${filteredTagString},${metadata.data.new_tags},source:${request.sourceUrl}`,
      });
      return fetch(`${putBaseUrl}?${putParams.toString()}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey
        }
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