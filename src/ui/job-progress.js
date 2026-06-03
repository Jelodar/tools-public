import { div, button } from './dom.js';

export function createJobProgress(parent, options = {}) {
  if (!parent) throw new Error('Job progress host is required.');
  const stopLabel = options.stopLabel || 'Stop';
  const idleMessage = options.idleMessage || 'Ready.';
  const idleDetail = options.idleDetail || '';
  const root = div({
    className: `job-progress ${options.variant === 'compact' ? 'job-progress-compact' : 'job-progress-panel'} hidden${options.className ? ` ${options.className}` : ''}`,
    attrs: {
      role: 'status',
      'aria-live': 'polite',
      'aria-atomic': 'true',
      'aria-busy': 'false',
      'aria-hidden': 'true'
    }
  }, [
    div({ className: 'job-progress-body' }, [
      div({ className: 'job-progress-spinner', attrs: { 'aria-hidden': 'true' } }),
      div({ className: 'job-progress-copy' }, [
        div({ className: 'job-progress-title', text: idleMessage }),
        div({ className: 'job-progress-detail', text: idleDetail })
      ]),
      div({ className: 'job-progress-side' }, [
        button({ className: 'job-progress-stop hidden', text: stopLabel, props: { type: 'button' } }),
        div({ className: 'job-progress-percent' })
      ])
    ]),
    div({ className: 'job-progress-meter hidden' }, [
      div({ className: 'job-progress-meter-fill' })
    ])
  ]);
  parent.appendChild(root);

  const titleNode = root.querySelector('.job-progress-title');
  const detailNode = root.querySelector('.job-progress-detail');
  const percentNode = root.querySelector('.job-progress-percent');
  const stopButton = root.querySelector('.job-progress-stop');
  const sideNode = root.querySelector('.job-progress-side');
  const meter = root.querySelector('.job-progress-meter');
  const meterFill = root.querySelector('.job-progress-meter-fill');
  let autoResetTimer = null;

  const clearAutoReset = () => {
    if (!autoResetTimer) return;
    clearTimeout(autoResetTimer);
    autoResetTimer = null;
  };

  const hide = () => {
    clearAutoReset();
    root.classList.add('hidden');
    root.dataset.tone = 'neutral';
    root.dataset.busy = 'false';
    root.dataset.cancellable = 'false';
    root.dataset.hasDetail = 'false';
    root.dataset.hasProgress = 'false';
    root.dataset.hasSide = 'false';
    root.setAttribute('aria-busy', 'false');
    root.setAttribute('aria-hidden', 'true');
    titleNode.textContent = idleMessage;
    detailNode.textContent = idleDetail;
    detailNode.classList.toggle('hidden', !idleDetail);
    percentNode.textContent = '';
    percentNode.classList.add('hidden');
    meter.classList.add('hidden');
    meterFill.style.width = '0%';
    stopButton.classList.add('hidden');
    sideNode.classList.add('hidden');
  };

  const show = () => {
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');
  };

  const update = ({
    visible = true,
    tone = 'neutral',
    busy = false,
    title = idleMessage,
    detail = '',
    progress = null,
    cancellable = false,
    autoResetMs = 0
  } = {}) => {
    clearAutoReset();
    if (!visible) {
      hide();
      return;
    }
    show();
    root.dataset.tone = tone;
    root.dataset.busy = busy ? 'true' : 'false';
    root.dataset.cancellable = cancellable ? 'true' : 'false';
    root.setAttribute('aria-busy', busy ? 'true' : 'false');
    titleNode.textContent = title;
    const hasDetail = Boolean(detail);
    detailNode.textContent = detail || '';
    detailNode.classList.toggle('hidden', !hasDetail);
    stopButton.classList.toggle('hidden', !cancellable);
    root.dataset.hasDetail = hasDetail ? 'true' : 'false';
    if (typeof progress === 'number' && Number.isFinite(progress)) {
      const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));
      percentNode.textContent = `${safeProgress}%`;
      percentNode.classList.remove('hidden');
      meter.classList.remove('hidden');
      meterFill.style.width = `${safeProgress}%`;
      root.dataset.hasProgress = 'true';
    } else {
      percentNode.textContent = '';
      percentNode.classList.add('hidden');
      meter.classList.add('hidden');
      meterFill.style.width = '0%';
      root.dataset.hasProgress = 'false';
    }
    sideNode.classList.toggle('hidden', !cancellable && !(typeof progress === 'number' && Number.isFinite(progress)));
    root.dataset.hasSide = sideNode.classList.contains('hidden') ? 'false' : 'true';
    if (autoResetMs > 0) {
      autoResetTimer = setTimeout(() => hide(), autoResetMs);
    }
  };

  if (typeof options.onStop === 'function') {
    stopButton.addEventListener('click', options.onStop);
  }

  update({ visible: false });

  return {
    root,
    stopButton,
    update,
    hide,
    show,
    destroy() {
      clearAutoReset();
      if (typeof options.onStop === 'function') {
        stopButton.removeEventListener('click', options.onStop);
      }
      root.remove();
    }
  };
}
