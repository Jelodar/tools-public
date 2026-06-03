function clearNode(node) {
  node.innerHTML = '';
}

function makeButton(document, className, label, dataset = {}) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  Object.entries(dataset).forEach(([key, value]) => {
    const attr = key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
    button.setAttribute(`data-${attr}`, value);
  });
  return button;
}

export function renderTimelineLane(parent, {
  lane = {},
  clips = [],
  scale = 100,
  selectedClipId = '',
  onAction = () => {}
} = {}) {
  clearNode(parent);
  const document = parent.ownerDocument || globalThis.document;
  const root = document.createElement('section');
  root.className = 'shared-timeline-lane';
  root.setAttribute('data-timeline-lane-id', lane.id || '');
  root.setAttribute('data-kind', lane.kind || 'video');

  const header = document.createElement('div');
  header.className = 'shared-timeline-lane-header';
  const title = document.createElement('strong');
  title.textContent = lane.name || 'Lane';
  header.appendChild(title);
  header.appendChild(makeButton(document, 'shared-timeline-lane-control', lane.muted ? 'Unmute' : 'Mute', { timelineAction: 'toggle-mute' }));
  header.appendChild(makeButton(document, 'shared-timeline-lane-control', lane.locked ? 'Unlock' : 'Lock', { timelineAction: 'toggle-lock' }));

  const track = document.createElement('div');
  track.className = 'shared-timeline-lane-track';

  clips.forEach((clip) => {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = `shared-timeline-clip${clip.id === selectedClipId ? ' is-selected' : ''}`;
    node.setAttribute('data-timeline-clip-id', clip.id || '');
    node.setAttribute('data-kind', clip.kind || lane.kind || 'clip');
    node.style.left = `${Math.max(0, Number(clip.start) || 0) * scale}px`;
    node.style.width = `${Math.max(8, (Number(clip.duration) || 0.1) * scale)}px`;
    node.textContent = clip.name || clip.id || 'Clip';
    track.appendChild(node);
  });

  root.appendChild(header);
  root.appendChild(track);
  parent.appendChild(root);

  const handleClick = (event) => {
    const actionNode = event.target.closest('[data-timeline-action]');
    if (actionNode) {
      onAction({ type: actionNode.dataset.timelineAction, lane, laneId: lane.id || '' });
      return;
    }
    const clipNode = event.target.closest('[data-timeline-clip-id]');
    if (clipNode) {
      const clip = clips.find((entry) => entry.id === clipNode.dataset.timelineClipId) || null;
      onAction({ type: 'select-clip', clip, clipId: clip?.id || '' });
    }
  };

  root.addEventListener('click', handleClick);

  return {
    root,
    update(nextOptions = {}) {
      return renderTimelineLane(parent, {
        lane,
        clips,
        scale,
        selectedClipId,
        onAction,
        ...nextOptions
      });
    },
    destroy() {
      root.removeEventListener('click', handleClick);
      root.remove();
    }
  };
}
