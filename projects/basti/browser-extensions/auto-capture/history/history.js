const fileList = document.getElementById('fileList');
const emptyMsg = document.getElementById('emptyMsg');
const fileTable = document.getElementById('fileTable');
const selectAll = document.getElementById('selectAll');
const selectedCount = document.getElementById('selectedCount');
const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');

let currentHistory = [];
let selectedIndexes = new Set();

function loadHistory() {
  chrome.storage.local.get(['history'], (result) => {
    currentHistory = result.history || [];
    selectedIndexes = new Set(
      Array.from(selectedIndexes).filter(index => index >= 0 && index < currentHistory.length)
    );

    renderHistory();
  });
}

function renderHistory() {
  fileList.innerHTML = '';

  if (currentHistory.length === 0) {
    fileTable.style.display = 'none';
    emptyMsg.style.display = 'block';
    updateBulkState();
    return;
  }

  fileTable.style.display = 'table';
  emptyMsg.style.display = 'none';

  getDisplayItems().forEach(({ item, originalIndex }) => {
    const tr = document.createElement('tr');

    const selectTd = document.createElement('td');
    selectTd.className = 'select-col';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'file-select';
    checkbox.checked = selectedIndexes.has(originalIndex);
    checkbox.setAttribute('aria-label', `Select ${item.url || item.filename || 'capture'}`);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        selectedIndexes.add(originalIndex);
      } else {
        selectedIndexes.delete(originalIndex);
      }
      updateBulkState();
    });
    selectTd.appendChild(checkbox);

    const urlTd = document.createElement('td');
    const link = document.createElement('a');
    link.href = item.url || '#';
    link.className = 'file-name';
    link.target = '_blank';
    link.textContent = item.url || 'Unknown page';
    urlTd.appendChild(link);

    if (item.filename) {
      const path = document.createElement('span');
      path.className = 'file-path';
      path.textContent = item.filename;
      urlTd.appendChild(path);
    }

    if (item.status && item.status !== 'saved') {
      const status = document.createElement('span');
      status.className = 'file-status';
      status.textContent = item.status === 'download_failed' ? 'Download failed' : item.status;
      urlTd.appendChild(status);
    }

    const dateTd = document.createElement('td');
    dateTd.className = 'file-date';
    dateTd.textContent = item.timestamp ? new Date(item.timestamp).toLocaleString() : '-';

    const actionsTd = document.createElement('td');
    actionsTd.className = 'actions';
    const deleteBtn = document.createElement('span');
    deleteBtn.className = 'btn-delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.tabIndex = 0;
    deleteBtn.setAttribute('role', 'button');
    deleteBtn.addEventListener('click', () => deleteEntries([originalIndex]));
    deleteBtn.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        deleteEntries([originalIndex]);
      }
    });
    actionsTd.appendChild(deleteBtn);

    tr.append(selectTd, urlTd, dateTd, actionsTd);
    fileList.appendChild(tr);
  });

  updateBulkState();
}

function getDisplayItems() {
  return currentHistory
    .map((item, originalIndex) => ({ item, originalIndex }))
    .reverse();
}

function updateBulkState() {
  const selectedCountValue = selectedIndexes.size;
  selectedCount.textContent = `${selectedCountValue} selected`;
  deleteSelectedBtn.disabled = selectedCountValue === 0;

  if (currentHistory.length === 0) {
    selectAll.checked = false;
    selectAll.indeterminate = false;
    selectAll.disabled = true;
    return;
  }

  selectAll.disabled = false;
  selectAll.checked = selectedCountValue === currentHistory.length;
  selectAll.indeterminate = selectedCountValue > 0 && selectedCountValue < currentHistory.length;
}

async function deleteEntries(indexes) {
  const uniqueIndexes = Array.from(new Set(indexes))
    .filter(index => index >= 0 && index < currentHistory.length)
    .sort((a, b) => b - a);

  if (uniqueIndexes.length === 0) return;

  const itemsToDelete = uniqueIndexes.map(index => currentHistory[index]);
  await Promise.all(itemsToDelete.map(removeDownloadedFile));

  chrome.storage.local.get(['history'], (result) => {
    const history = result.history || [];
    uniqueIndexes.forEach(index => {
      history.splice(index, 1);
      selectedIndexes.delete(index);
    });
    selectedIndexes = new Set();
    chrome.storage.local.set({ history }, loadHistory);
  });
}

function removeDownloadedFile(item) {
  return new Promise(resolve => {
    if (!item || typeof item.downloadId !== 'number') {
      resolve();
      return;
    }

    chrome.downloads.removeFile(item.downloadId, () => {
      if (chrome.runtime.lastError) {
        console.warn('Could not remove downloaded file:', chrome.runtime.lastError.message);
      }
      chrome.downloads.erase({ id: item.downloadId }, () => {
        if (chrome.runtime.lastError) {
          console.warn('Could not erase download record:', chrome.runtime.lastError.message);
        }
        resolve();
      });
    });
  });
}

selectAll.addEventListener('change', () => {
  if (selectAll.checked) {
    selectedIndexes = new Set(currentHistory.map((_, index) => index));
  } else {
    selectedIndexes = new Set();
  }
  renderHistory();
});

deleteSelectedBtn.addEventListener('click', () => {
  deleteEntries(Array.from(selectedIndexes));
});

loadHistory();
