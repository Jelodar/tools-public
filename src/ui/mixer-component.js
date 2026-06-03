import { renderTimelineLane } from './timeline-lane.js';

function clearNode(node) {
  node.innerHTML = '';
}

function mapClipToTimelineClip(clip) {
  return {
    ...clip,
    id: clip.id,
    start: Number(clip.start ?? clip.offset) || 0,
    duration: Math.max(0.1, Number(clip.duration ?? ((Number(clip.trimEnd) || 0) - (Number(clip.trimStart) || 0))) || 0.1)
  };
}

export function createMixerComponent(parent, {
  lanes = [],
  clips = [],
  scale = 100,
  selectedClipId = '',
  onAction = () => {}
} = {}) {
  const root = document.createElement('div');
  root.className = 'shared-mixer-component';
  parent.appendChild(root);
  let state = { lanes, clips, scale, selectedClipId };
  let laneControllers = [];

  const render = () => {
    laneControllers.forEach((controller) => controller.destroy());
    laneControllers = [];
    clearNode(root);
    const laneEntries = Array.isArray(state.lanes) ? state.lanes : [];
    laneEntries.forEach((lane) => {
      const laneHost = document.createElement('div');
      laneHost.className = 'shared-mixer-lane-host';
      laneHost.setAttribute('data-mixer-lane-id', lane.id || '');
      laneHost.setAttribute('data-kind', lane.kind || 'audio');
      root.appendChild(laneHost);
      const laneClips = (Array.isArray(state.clips) ? state.clips : [])
        .filter((clip) => (clip.laneId || clip.trackId) === lane.id)
        .map(mapClipToTimelineClip);
      const controller = renderTimelineLane(laneHost, {
        lane,
        clips: laneClips,
        scale: state.scale,
        selectedClipId: state.selectedClipId,
        onAction(event) {
          if (event.type === 'select-clip') {
            onAction({ ...event, type: 'select-clip', lane, laneId: lane.id || '' });
            return;
          }
          onAction({ ...event, lane, laneId: lane.id || '' });
        }
      });
      laneHost.querySelectorAll('[data-timeline-action]').forEach((node) => {
        node.setAttribute('data-mixer-action', node.dataset.timelineAction);
      });
      laneHost.querySelectorAll('[data-timeline-clip-id]').forEach((node) => {
        node.setAttribute('data-mixer-clip-id', node.dataset.timelineClipId);
      });
      laneControllers.push(controller);
    });
  };

  render();

  return {
    root,
    update(nextState = {}) {
      state = {
        ...state,
        ...nextState,
        lanes: Array.isArray(nextState.lanes) ? nextState.lanes : state.lanes,
        clips: Array.isArray(nextState.clips) ? nextState.clips : state.clips
      };
      render();
    },
    destroy() {
      laneControllers.forEach((controller) => controller.destroy());
      laneControllers = [];
      root.remove();
    }
  };
}
