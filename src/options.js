const lanraragiInput = document.getElementById('lanraragiUrl');
const apiKeyInput = document.getElementById('apiKey');
const statusEl = document.getElementById('status');

chrome.storage.sync.get(['lanraragiUrl','apiKey'], ({ lanraragiUrl, apiKey }) => {
  if (lanraragiUrl) lanraragiInput.value = lanraragiUrl;
  if (apiKey) apiKeyInput.value = apiKey;
});

document.getElementById('saveBtn').addEventListener('click', () => {
  const config = {
    lanraragiUrl: lanraragiInput.value.trim(),
    apiKey: apiKeyInput.value.trim()
  };
  chrome.storage.sync.set(config, () => {
    statusEl.textContent = '已儲存 ✔️';
    setTimeout(() => statusEl.textContent = '', 1500);
  });
});
