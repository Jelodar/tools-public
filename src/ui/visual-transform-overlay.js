function applyBox(node, clip) {
  node.style.left = `${Number(clip.x) || 0}px`;
  node.style.top = `${Number(clip.y) || 0}px`;
  node.style.width = `${Math.max(8, Number(clip.width) || 8)}px`;
  node.style.height = `${Math.max(8, Number(clip.height) || 8)}px`;
  node.style.transform = `rotate(${Number(clip.rotate) || 0}deg)`;
}

export function createVisualTransformOverlay(parent, {
  clip = {},
  onChange = () => {}
} = {}) {
  const root = document.createElement('div');
  root.className = 'visual-transform-overlay';
  parent.appendChild(root);
  let state = {
    id: clip.id,
    x: Number(clip.x) || 0,
    y: Number(clip.y) || 0,
    width: Math.max(8, Number(clip.width) || 8),
    height: Math.max(8, Number(clip.height) || 8),
    rotate: Number(clip.rotate) || 0
  };

  const render = () => {
    root.innerHTML = `
      <div class="visual-transform-box" data-transform-surface="move">
        <span data-transform-handle="nw"></span>
        <span data-transform-handle="n"></span>
        <span data-transform-handle="ne"></span>
        <span data-transform-handle="e"></span>
        <span data-transform-handle="se"></span>
        <span data-transform-handle="s"></span>
        <span data-transform-handle="sw"></span>
        <span data-transform-handle="w"></span>
        <span data-transform-handle="rotate"></span>
      </div>
    `;
    applyBox(root.querySelector('.visual-transform-box'), state);
  };

  const patch = (updates) => {
    state = { ...state, ...updates };
    applyBox(root.querySelector('.visual-transform-box'), state);
    onChange({ id: state.id, ...updates });
  };

  render();

  return {
    root,
    update(nextClip = {}) {
      state = {
        ...state,
        ...nextClip,
        x: Number(nextClip.x ?? state.x) || 0,
        y: Number(nextClip.y ?? state.y) || 0,
        width: Math.max(8, Number(nextClip.width ?? state.width) || 8),
        height: Math.max(8, Number(nextClip.height ?? state.height) || 8),
        rotate: Number(nextClip.rotate ?? state.rotate) || 0
      };
      applyBox(root.querySelector('.visual-transform-box'), state);
    },
    applyMove(dx = 0, dy = 0) {
      patch({ x: state.x + (Number(dx) || 0), y: state.y + (Number(dy) || 0) });
    },
    applyResize(handle = 'se', dx = 0, dy = 0) {
      const west = String(handle).includes('w');
      const north = String(handle).includes('n');
      const updates = {
        width: Math.max(8, state.width + (west ? -(Number(dx) || 0) : (Number(dx) || 0))),
        height: Math.max(8, state.height + (north ? -(Number(dy) || 0) : (Number(dy) || 0)))
      };
      if (west) updates.x = state.x + (Number(dx) || 0);
      if (north) updates.y = state.y + (Number(dy) || 0);
      patch(updates);
    },
    applyRotate(degrees = 0) {
      patch({ rotate: Number(degrees) || 0 });
    },
    destroy() {
      root.remove();
    }
  };
}
