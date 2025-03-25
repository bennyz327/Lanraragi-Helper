// 確保腳本只執行一次的標記
let isUpdaterInjected = false;

// 在網站上注入進度反饋UI
function injectFeedbackUI() {
  // 避免重複注入
  if (isUpdaterInjected || !document.body) return;
  isUpdaterInjected = true;
  
  console.log('漫畫元數據更新器已注入頁面');
  
  try {
    // 檢測當前頁面類型
    const isLocalService = isLocalMangaService();
    const isTargetWebsite = isWebsiteA();
    const isSingleMangaPage = isTargetWebsite && isSingleMangaPageOnWebsiteA();
    
    // 如果不是支持的網站，就不注入UI
    if (!isLocalService && !isTargetWebsite) {
      console.log('非支持網站，略過注入');
      return;
    }
    
    // 創建反饋容器
    const feedbackContainer = document.createElement('div');
    feedbackContainer.id = 'manga-metadata-updater';
    feedbackContainer.style.position = 'fixed';
    feedbackContainer.style.bottom = '20px';
    feedbackContainer.style.right = '20px';
    feedbackContainer.style.width = '300px';
    feedbackContainer.style.backgroundColor = '#fff';
    feedbackContainer.style.border = '1px solid #ccc';
    feedbackContainer.style.borderRadius = '5px';
    feedbackContainer.style.padding = '15px';
    feedbackContainer.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    feedbackContainer.style.zIndex = '9999';
    feedbackContainer.style.display = 'none';
    feedbackContainer.style.fontFamily = 'Arial, sans-serif';
    
    // 標題 - 根據不同網站顯示不同的內容
    const title = document.createElement('h3');
    title.style.margin = '0 0 10px 0';
    title.style.borderBottom = '1px solid #eee';
    title.style.paddingBottom = '5px';
    title.textContent = isLocalService ? '修正漫畫元數據' : '更新本地漫畫元數據';
    
    // 添加到面板
    feedbackContainer.appendChild(title);
    
    // 本地漫畫服務頁面
    if (isLocalService) {
      // 自動從URL獲取漫畫ID
      const mangaId = extractMangaIdFromUrl();
      if (mangaId) {
        chrome.storage.local.set({currentLocalMangaId: mangaId});
      }
      
      // ID顯示
      const idDisplay = document.createElement('div');
      idDisplay.id = 'current-id-display';
      idDisplay.style.fontSize = '12px';
      idDisplay.style.color = mangaId ? '#666' : '#F44336';
      idDisplay.style.marginBottom = '10px';
      idDisplay.textContent = mangaId ? 
        `當前更新目標 漫畫ID: ${mangaId}` : 
        '無法從URL獲取漫畫ID';
      feedbackContainer.appendChild(idDisplay);
      
      // 搜索關鍵字標籤
      const searchLabelContainer = document.createElement('div');
      searchLabelContainer.style.display = 'flex';
      searchLabelContainer.style.alignItems = 'center';

      const searchLabel = document.createElement('label');
      searchLabel.textContent = '搜索EX關鍵字: ';
      searchLabel.style.marginRight = '10px';

      searchLabelContainer.appendChild(searchLabel);
      feedbackContainer.appendChild(searchLabelContainer);
      
      // 搜索輸入框和按鈕
      const searchContainer = document.createElement('div');
      searchContainer.style.marginBottom = '15px';
      searchContainer.style.display = 'flex';
      searchContainer.style.alignItems = 'center';
      
      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.id = 'search-keyword-input';
      searchInput.style.flexGrow = '1';
      searchInput.style.padding = '5px';
      searchInput.style.border = '1px solid #ccc';
      searchInput.style.borderRadius = '3px';
      
      const searchButton = document.createElement('button');
      searchButton.id = 'search-website-button';
      searchButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';
      searchButton.style.marginLeft = '10px';
      searchButton.style.padding = '5px 10px';
      searchButton.style.backgroundColor = '#2196F3';
      searchButton.style.color = 'white';
      searchButton.style.border = 'none';
      searchButton.style.borderRadius = '3px';
      searchButton.style.cursor = 'pointer';
      searchButton.style.fontSize = '16px';
      searchButton.title = '搜索網站A';
      
      searchContainer.appendChild(searchInput);
      searchContainer.appendChild(searchButton);
      feedbackContainer.appendChild(searchContainer);
      
      // 添加按鈕區域 (包含關閉按鈕)
      const buttonArea = document.createElement('div');
      buttonArea.style.display = 'flex';
      buttonArea.style.justifyContent = 'flex-end'; // 右對齊
      buttonArea.style.marginTop = '15px';
      
      // 添加關閉按鈕
      const closeButton = document.createElement('button');
      closeButton.id = 'close-feedback-button';
      closeButton.textContent = '關閉';
      closeButton.style.padding = '8px 16px';
      closeButton.style.backgroundColor = '#f5f5f5';
      closeButton.style.color = '#333';
      closeButton.style.border = '1px solid #ddd';
      closeButton.style.borderRadius = '4px';
      closeButton.style.cursor = 'pointer';
      
      buttonArea.appendChild(closeButton);
      feedbackContainer.appendChild(buttonArea);
    } 
    // 目標網站A頁面
    else if (isTargetWebsite) {
      // URL顯示
      const urlDisplay = document.createElement('div');
      urlDisplay.style.fontSize = '12px';
      urlDisplay.style.marginBottom = '15px';
      urlDisplay.style.wordBreak = 'break-all';
      urlDisplay.style.color = '#666';
      urlDisplay.textContent = `當前URL: ${window.location.href}`;
      feedbackContainer.appendChild(urlDisplay);
      
      // ID顯示
      const idDisplay = document.createElement('div');
      idDisplay.id = 'current-id-display';
      idDisplay.style.fontSize = '12px';
      idDisplay.style.color = '#666';
      idDisplay.style.marginBottom = '10px';
      feedbackContainer.appendChild(idDisplay);
      
      // 搜索結果頁顯示提示
      if (!isSingleMangaPage) {
        const tipElement = document.createElement('div');
        tipElement.textContent = '請點擊要使用的漫畫，進入詳情頁後可更新元數據';
        tipElement.style.padding = '8px';
        tipElement.style.backgroundColor = '#fff3cd';
        tipElement.style.color = '#856404';
        tipElement.style.borderRadius = '4px';
        tipElement.style.marginBottom = '15px';
        feedbackContainer.appendChild(tipElement);
      } 
      // 單一漫畫頁顯示進度和結果
      else {
        // 步驟顯示區域
        const stepsContainer = document.createElement('div');
        stepsContainer.id = 'update-steps';
        stepsContainer.style.display = 'none';
        
        // 創建步驟元素
        const steps = [
          '連接本地服務',
          '從網站獲取元數據',
          '更新本地漫畫資料'
        ];
        
        steps.forEach((step, index) => {
          const stepElement = document.createElement('div');
          stepElement.className = 'update-step';
          stepElement.style.margin = '10px 0';
          stepElement.style.display = 'flex';
          stepElement.style.alignItems = 'center';
          
          const stepNumber = document.createElement('span');
          stepNumber.textContent = (index + 1) + '.';
          stepNumber.style.marginRight = '10px';
          stepNumber.style.fontWeight = 'bold';
          
          const stepText = document.createElement('span');
          stepText.textContent = step;
          stepText.style.flexGrow = '1';
          
          const stepStatus = document.createElement('span');
          stepStatus.id = `step-status-${index}`;
          stepStatus.textContent = '等待中';
          stepStatus.style.marginLeft = '10px';
          stepStatus.style.color = '#999';
          
          stepElement.appendChild(stepNumber);
          stepElement.appendChild(stepText);
          stepElement.appendChild(stepStatus);
          stepsContainer.appendChild(stepElement);
        });
        feedbackContainer.appendChild(stepsContainer);
        
        // 結果顯示區域
        const resultArea = document.createElement('div');
        resultArea.id = 'update-result';
        resultArea.style.marginTop = '15px';
        resultArea.style.padding = '10px';
        resultArea.style.display = 'none';
        resultArea.style.borderRadius = '3px';
        feedbackContainer.appendChild(resultArea);
      }
      
      // 按鈕區域
      const buttonArea = document.createElement('div');
      buttonArea.style.display = 'flex';
      buttonArea.style.justifyContent = 'space-between';
      buttonArea.style.marginTop = '15px';
      
      // 在單一漫畫頁添加更新按鈕
      if (isSingleMangaPage) {
        const updateButton = document.createElement('button');
        updateButton.id = 'start-update-button';
        updateButton.textContent = '確認更新元數據';
        updateButton.style.padding = '8px 16px';
        updateButton.style.backgroundColor = '#4CAF50';
        updateButton.style.color = 'white';
        updateButton.style.border = 'none';
        updateButton.style.borderRadius = '4px';
        updateButton.style.cursor = 'pointer';
        buttonArea.appendChild(updateButton);
      }
      
      // 添加關閉按鈕
      const closeButton = document.createElement('button');
      closeButton.id = 'close-feedback-button';
      closeButton.textContent = '關閉';
      closeButton.style.padding = '8px 16px';
      closeButton.style.backgroundColor = '#f5f5f5';
      closeButton.style.color = '#333';
      closeButton.style.border = '1px solid #ddd';
      closeButton.style.borderRadius = '4px';
      closeButton.style.cursor = 'pointer';
      buttonArea.appendChild(closeButton);
      
      feedbackContainer.appendChild(buttonArea);
    }
    
    // 添加容器到頁面
    document.body.appendChild(feedbackContainer);
    
    // 創建懸浮顯示按鈕
    const toggleButton = document.createElement('button');
    toggleButton.id = 'toggle-updater-button';
    toggleButton.textContent = '漫畫元數據';
    toggleButton.style.position = 'fixed';
    toggleButton.style.bottom = '20px';
    toggleButton.style.right = '20px';
    toggleButton.style.zIndex = '9998';
    toggleButton.style.padding = '8px 16px';
    toggleButton.style.backgroundColor = '#2196F3';
    toggleButton.style.color = 'white';
    toggleButton.style.border = 'none';
    toggleButton.style.borderRadius = '4px';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.fontFamily = 'Arial, sans-serif';
    
    toggleButton.addEventListener('click', () => {
      const newState = feedbackContainer.style.display === 'none' ? 'block' : 'none';
      feedbackContainer.style.display = newState;
      
      // 保存顯示狀態
      saveDisplayState(newState);
      
      // 更新ID顯示
      if (newState === 'block') {
        updateIdDisplay();
      }
    });
    
    document.body.appendChild(toggleButton);
    
    // 設置事件監聽器
    setupEventListeners();
    
    // 讀取存儲的顯示狀態 (記憶開啟狀態)
    loadDisplayState();
    
    // 在單一漫畫頁確保更新ID顯示
    if (isSingleMangaPage) {
      setTimeout(updateIdDisplay, 100);
    }
    
    console.log('漫畫元數據更新器UI已成功注入');
  } catch (error) {
    console.error('注入漫畫元數據更新器時出錯:', error);
  }
}

// 檢測是否為您的漫畫服務頁面
function isLocalMangaService() {
  return window.location.hostname.includes('localhost') && 
		 window.location.pathname.includes('/edit') || 
         window.location.hostname.includes('您的漫畫服務域名');
}

// 檢測是否為目標網站
function isWebsiteA() {
  return window.location.hostname.includes('exhentai.org');
}

// 檢測是否為網站A的單一漫畫頁面
function isSingleMangaPageOnWebsiteA() {
  // 根據網站A的單一漫畫頁面網址特徵進行判斷
  //return isWebsiteA() && 
  //       (window.location.pathname.includes('/manga/') || 
  //        window.location.pathname.match(/\/[0-9]+$/));
  return isWebsiteA() && /^\/g\/\d+\/[0-9a-f]+\/?$/i.test(window.location.pathname);
}

// 從URL中提取漫畫ID
function extractMangaIdFromUrl() {
  //const match = window.location.pathname.match(/\/edit?(\d+)$/);
  //if (match && match[1]) {
  //  return match[1];
  //}
  //return null;
  
  const params = new URL(window.location.href).searchParams;
  const id = params.get('id');
  return id;
}

// 設置事件監聽器
function setupEventListeners() {
  try {
    // 關閉按鈕點擊事件
    const closeButton = document.getElementById('close-feedback-button');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        // 點擊關閉按鈕時隱藏面板並保存狀態
        const container = document.getElementById('manga-metadata-updater');
        if (container) {
          container.style.display = 'none';
          saveDisplayState('none');
        }
      });
    }
    if (isLocalMangaService()) {
      // 搜索按鈕點擊事件
      const searchButton = document.getElementById('search-website-button');
      if (searchButton) {
        searchButton.addEventListener('click', () => {
          const keyword = document.getElementById('search-keyword-input').value.trim();
          if (keyword) {
            // 構建搜索URL並跳轉
            const searchUrl = `https://exhentai.org/favorites.php?favcat=all&f_search=${encodeURIComponent(keyword)}`;
            window.open(searchUrl, '_blank');
          } else {
            alert('請輸入搜索關鍵字');
          }
        });
      }
      
      // 回車鍵搜索
      const searchInput = document.getElementById('search-keyword-input');
      if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            const searchButton = document.getElementById('search-website-button');
            if (searchButton) searchButton.click();
          }
        });
      }
    }
    
    // 網站A的單一漫畫頁事件
    if (isWebsiteA() && isSingleMangaPageOnWebsiteA()) {
      // 更新按鈕點擊事件
      const updateButton = document.getElementById('start-update-button');
      if (updateButton) {
        updateButton.addEventListener('click', () => {
          // 顯示進度UI
          const stepsContainer = document.getElementById('update-steps');
          if (stepsContainer) {
            stepsContainer.style.display = 'block';
          }
          
          const resultArea = document.getElementById('update-result');
          if (resultArea) {
            resultArea.style.display = 'none';
          }
          
          updateButton.disabled = true;
          
          // 更新狀態：第一步進行中
          updateStepStatus(0, 'processing');
          
          // 從URL獲取源網址
          const sourceUrl = window.location.href;
          
          // 從存儲中獲取本地漫畫ID
          chrome.storage.local.get(['currentLocalMangaId'], function(result) {
            if (result.currentLocalMangaId) {
              // 發送消息到背景腳本
              chrome.runtime.sendMessage({
                action: "updateMetadata",
                localMangaId: result.currentLocalMangaId,
                sourceUrl: sourceUrl
              }, response => {
                updateButton.disabled = false;
                
                if (response && response.success) {
                  // 顯示成功結果
                  if (resultArea) {
                    resultArea.textContent = '更新成功！';
                    resultArea.style.backgroundColor = '#dff2e0';
                    resultArea.style.color = '#3c763d';
                    resultArea.style.display = 'block';
                  }
                } else {
                  // 顯示錯誤結果
                  if (resultArea) {
                    resultArea.textContent = '更新失敗: ' + (response ? response.error : '未知錯誤');
                    resultArea.style.backgroundColor = '#f2dede';
                    resultArea.style.color = '#a94442';
                    resultArea.style.display = 'block';
                  }
                }
              });
            } else {
              // 顯示錯誤結果
              updateButton.disabled = false;
              
              if (resultArea) {
                resultArea.textContent = '錯誤：未找到漫畫ID。請先從您的漫畫服務訪問。';
                resultArea.style.backgroundColor = '#f2dede';
                resultArea.style.color = '#a94442';
                resultArea.style.display = 'block';
              }
            }
          });
        });
      }
    }
    
    console.log('事件監聽器設置成功');
  } catch (error) {
    console.error('設置事件監聽器時出錯:', error);
  }
}

// 更新ID顯示
function updateIdDisplay() {
  const idDisplay = document.getElementById('current-id-display');
  if (idDisplay) {
    chrome.storage.local.get(['currentLocalMangaId'], function(result) {
      if (result.currentLocalMangaId) {
        // 根據不同網站顯示不同的文本
        if (isLocalMangaService()) {
          idDisplay.textContent = `當前更新目標 漫畫ID: ${result.currentLocalMangaId}`;
        } else if (isWebsiteA()) {
          idDisplay.textContent = `待更新的本地漫畫ID: ${result.currentLocalMangaId}`;
        } else {
          idDisplay.textContent = `當前漫畫ID: ${result.currentLocalMangaId}`;
        }
        idDisplay.style.color = '#666'; // 正常顯示顏色
      } else {
        if (isWebsiteA()) {
          idDisplay.textContent = '未找到漫畫ID，請先從您的漫畫服務訪問';
        } else {
          idDisplay.textContent = '尚未設置漫畫ID';
        }
        idDisplay.style.color = '#F44336'; // 錯誤顯示顏色
      }
    });
  }
}

// 更新步驟狀態
function updateStepStatus(stepIndex, status) {
  const stepStatus = document.getElementById(`step-status-${stepIndex}`);
  if (!stepStatus) return;
  
  switch (status) {
    case 'waiting':
      stepStatus.textContent = '等待中';
      stepStatus.style.color = '#999';
      break;
    case 'processing':
      stepStatus.textContent = '處理中...';
      stepStatus.style.color = '#2196F3';
      break;
    case 'success':
      stepStatus.textContent = '成功 ✓';
      stepStatus.style.color = '#4CAF50';
      // 如果不是最後一步，自動啟動下一步
      if (stepIndex < 2) {
        updateStepStatus(stepIndex + 1, 'processing');
      }
      break;
    case 'error':
      stepStatus.textContent = '失敗 ✗';
      stepStatus.style.color = '#F44336';
      break;
  }
}

// 保存面板顯示狀態
function saveDisplayState(state) {
  // 使用主機名作為鍵，保存面板狀態
  const key = `panelState_${window.location.hostname}`;
  chrome.storage.local.set({[key]: state});
  console.log(`面板狀態已保存: ${state} 用於 ${key}`);
}

// 讀取面板顯示狀態
function loadDisplayState() {
  const key = `panelState_${window.location.hostname}`;
  chrome.storage.local.get([key], function(result) {
    if (result[key]) {
      const container = document.getElementById('manga-metadata-updater');
      if (container) {
        container.style.display = result[key];
        console.log(`已恢復面板狀態: ${result[key]} 從 ${key}`);
        
        // 如果面板是顯示狀態，則更新ID顯示
        if (result[key] === 'block') {
          updateIdDisplay();
        }
      }
    }
  });
}

// 監聽來自背景腳本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('收到消息:', request);
  if (request.action === "updateStepStatus") {
    updateStepStatus(request.step, request.status);
  }
});

// 頁面載入初始化
function initUpdater() {
  console.log('初始化更新器...');
  
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    if (document.body) {
      injectFeedbackUI();
    } else {
      const bodyCheckInterval = setInterval(() => {
        if (document.body) {
          clearInterval(bodyCheckInterval);
          injectFeedbackUI();
        }
      }, 50);
    }
  } else {
    document.addEventListener('DOMContentLoaded', injectFeedbackUI);
  }
}

// 確保在各種加載情況下都能正確注入
initUpdater();
window.addEventListener('load', () => {
  if (!isUpdaterInjected) injectFeedbackUI();
  
  // 確保面板中的ID信息是最新的
  setTimeout(() => {
    const container = document.getElementById('manga-metadata-updater');
    if (container && container.style.display === 'block') {
      updateIdDisplay();
    }
  }, 500);
});

// 延遲注入處理動態加載的網站
setTimeout(() => {
  if (!isUpdaterInjected) {
    console.log('嘗試延遲注入...');
    injectFeedbackUI();
  }
}, 5000);