// 背景腳本只應包含與API通信和消息處理的代碼

async function getConfig() {
  return new Promise(resolve =>
    chrome.storage.sync.get(['lanraragiUrl', 'apiKey'], resolve)
  )
}


/**
 * 
 * @param {*} baseUrl 
 * @param {*} apiKey 
 * @param {*} localMangaId 
 * @param {object} sourceUrl
 * @returns {{ data: { new_tags: string, title: string }}}
 */
async function fetchPluginData(baseUrl, apiKey, localMangaId, sourceUrl) {
  const params = new URLSearchParams({ plugin: 'ehplugin', id: localMangaId })
  const finalParams = `${params.toString()}&arg=${sourceUrl}`
  const response = await fetch(`${baseUrl}?${finalParams}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: apiKey }
  })
  if (!response.ok) throw new Error(`外掛API返回錯誤: ${response.status}`)
  return response.json()
}


/**
 * 取得特定漫畫的 date_added 標籤，通常只有一個
 * @param {string} lanraragiUrl 
 * @param {string} apiKey 
 * @param {string} localMangaId 
 * @returns {string[]}
 */
async function getDateAddedTags(lanraragiUrl, apiKey, localMangaId) {
  const url = `${lanraragiUrl}/api/archives/${localMangaId}/metadata`
  const resp = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: apiKey }
  })
  if (!resp.ok) throw new Error(`取得原本 metadata 失敗: ${resp.status}`)
  const { tags } = await resp.json()
  return tags
    .split(',')
    .map(t => t.trim())
    .filter(t => t.startsWith('date_added'))
}


/**
 * 更新元數據
 * @param {string} lanraragiUrl 必要
 * @param {string} apiKey 必要
 * @param {string} localMangaId 必要
 * @param {string} tags
 * @param {string} title
 * @returns 
 */
async function updateMetadata(lanraragiUrl, apiKey, localMangaId, tags, title) {
  const url = `${lanraragiUrl}/api/archives/${localMangaId}/metadata`
  const params = new URLSearchParams({ title, tags })
  const resp = await fetch(`${url}?${params.toString()}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: apiKey }
  })
  if (!resp.ok) throw new Error(`更新 API 返回錯誤: ${resp.status}`)
  return resp.json()
}


chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action !== 'updateMetadata') return

  const { lanraragiUrl = '', apiKey = '' } = await getConfig()
  const tabId = sender.tab.id

  const sendStatus = (step, status) =>
    chrome.tabs.sendMessage(tabId, { action: 'updateStepStatus', step, status })

  if (!lanraragiUrl || !request.localMangaId || !request.sourceUrl) {
    return sendResponse({ success: false, error: '沒有設定好資料' })

  } else {
    try {
      sendStatus(0, 'success')
      sendStatus(1, 'processing')
  
      // 先清空原有的留下 date_added 標籤
      const addDateTag = (await getDateAddedTags(lanraragiUrl, apiKey, request.localMangaId))[0]
      await updateMetadata(lanraragiUrl, apiKey, request.localMangaId, addDateTag)
      const pluginData = await fetchPluginData(`${lanraragiUrl}/api/plugins/use`, apiKey, request.localMangaId, request.sourceUrl)

      sendStatus(1, 'success')
      sendStatus(2, 'processing')

      // 更新正確的元數據
      const composedTags = `${addDateTag},${pluginData.data.new_tags}`
      const title = pluginData.data.title
      const result = await updateMetadata(lanraragiUrl, apiKey, request.localMangaId, composedTags, title)
  
      sendStatus(2, 'success')
      sendResponse({ success: true, data: result })
    } catch (err) {
      const step = err.message.includes('外掛API') ? 1 : 2
      sendStatus(step, 'error')
      sendResponse({ success: false, error: err.message })
    }
  }

  return true
})