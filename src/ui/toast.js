/**
 * Global Toast System
 * Pub/Sub based notifications.
 */

export function initToastSystem() {
  const container = document.getElementById('toast-container');
  if (!container) return;

  window.addEventListener('toast', (e) => {
    const { message, type = 'info', duration = 3000 } = e.detail;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      background: ${type === 'success' ? 'var(--success-color)' : type === 'danger' ? 'var(--danger-color)' : 'var(--surface-color)'};
      color: #fff;
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      margin-top: 0.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-size: 0.9rem;
      font-weight: 500;
      animation: slideIn 0.3s ease forwards;
      pointer-events: auto;
    `;
    
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  });
}

/**
 * Helper to trigger a toast from anywhere
 */
export function showToast(message, type = 'info') {
  window.dispatchEvent(new CustomEvent('toast', { detail: { message, type } }));
}
