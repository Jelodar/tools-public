import { escapeHtml, formatDuration } from '../utils/string-utils.js';
import { createModalController } from './modal.js';

function formatBytes(value) {
  const bytes = Number(value) || 0;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function assetMeta(asset) {
  const parts = [asset.kind || 'media'];
  if (Number(asset.duration) > 0) parts.push(formatDuration(asset.duration, { milliseconds: false }));
  if (Number(asset.size) > 0) parts.push(formatBytes(asset.size));
  return parts.join(' / ');
}

export function createMediaLibraryModal(parent, {
  assets = [],
  selectedAssetId = '',
  title = 'Media Library',
  onAction = () => {}
} = {}) {
  const root = document.createElement('div');
  root.className = 'shared-media-library-modal hidden';
  parent.appendChild(root);

  let state = {
    assets: Array.isArray(assets) ? assets : [],
    selectedAssetId
  };

  const emit = (event) => onAction(event);

  const render = () => {
    root.innerHTML = `
      <div class="shared-media-library-dialog">
        <header class="shared-media-library-header">
          <strong>${escapeHtml(title)}</strong>
          <div class="shared-media-library-actions">
            <button type="button" data-media-action="import">Import</button>
            <button type="button" data-media-action="add-selected">Add</button>
            <button type="button" data-media-action="close">Close</button>
          </div>
        </header>
        <div class="shared-media-library-list">
          ${state.assets.length ? state.assets.map((asset) => `
            <button type="button" class="shared-media-library-item${asset.id === state.selectedAssetId ? ' is-selected' : ''}" data-media-asset-id="${escapeHtml(asset.id)}">
              <span>${escapeHtml(asset.name || asset.id)}</span>
              <small>${escapeHtml(assetMeta(asset))}</small>
            </button>
          `).join('') : '<div class="shared-media-library-empty">No assets loaded</div>'}
        </div>
      </div>
    `;
  };

  render();

  const modal = createModalController(root, {
    closeSelectors: ['[data-media-action="close"]']
  });

  const handleClick = (event) => {
    const assetNode = event.target.closest('[data-media-asset-id]');
    if (assetNode) {
      const asset = state.assets.find((entry) => entry.id === assetNode.dataset.mediaAssetId) || null;
      state = { ...state, selectedAssetId: asset?.id || '' };
      render();
      emit({ type: 'select', asset, assetId: asset?.id || '' });
      return;
    }
    const actionNode = event.target.closest('[data-media-action]');
    if (!actionNode) return;
    const type = actionNode.dataset.mediaAction;
    if (type === 'close') return;
    const asset = state.assets.find((entry) => entry.id === state.selectedAssetId) || null;
    emit({ type, asset, assetId: asset?.id || '' });
  };

  root.addEventListener('click', handleClick);

  return {
    root,
    open: modal.open,
    close: modal.close,
    isOpen: modal.isOpen,
    update(nextState = {}) {
      state = {
        assets: Array.isArray(nextState.assets) ? nextState.assets : state.assets,
        selectedAssetId: nextState.selectedAssetId ?? state.selectedAssetId
      };
      render();
    },
    destroy() {
      root.removeEventListener('click', handleClick);
      modal.destroy();
      root.remove();
    }
  };
}
