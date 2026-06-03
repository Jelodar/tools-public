export async function copyToClipboard(text, message = 'Copied to clipboard!') {
  try {
    await navigator.clipboard.writeText(text);
    showToast(message, 'success');
    return true;
  } catch (err) {
    showToast('Copy failed: ' + err.message, 'danger');
    return false;
  }
}

export function showToast(message, type = 'info', duration = 3000) {
  window.dispatchEvent(new CustomEvent('toast', {
    detail: { message, type, duration }
  }));
}

export function downloadFile(content, fileName, mimeType = '') {
  const blob = content instanceof Blob && !mimeType
    ? content
    : new Blob([content], { type: mimeType || 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', fileName);
  a.click();
  URL.revokeObjectURL(url);
}

export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}
