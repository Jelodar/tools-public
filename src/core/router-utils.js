export const TOOL_BOOT_TIMEOUT_MS = 12000;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function runWithTimeout(task, timeoutMs, message) {
  return new Promise((resolve, reject) => {
    const getTime = () => globalThis.performance?.now?.() ?? Date.now();
    const startedAt = getTime();
    let settled = false;
    let timer = null;
    const hasTimedOut = () => getTime() - startedAt >= timeoutMs;
    const finish = (handler) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      handler();
    };
    const fail = () => {
      finish(() => reject(new Error(message)));
    };
    timer = setTimeout(fail, timeoutMs);
    Promise.resolve(task).then(
      (value) => {
        if (hasTimedOut()) {
          fail();
          return;
        }
        finish(() => resolve(value));
      },
      (error) => {
        if (hasTimedOut()) {
          fail();
          return;
        }
        finish(() => reject(error));
      }
    );
  });
}

export function createToolErrorMarkup(tool, error, timeoutMs = TOOL_BOOT_TIMEOUT_MS) {
  const reason = error?.message || 'Unknown load failure.';
  return `
    <div class="error-state">
      <div class="error-state-kicker">Route Guard</div>
      <h2>${escapeHtml(tool.title)} Could Not Start</h2>
      <p>The route did not finish loading cleanly. The guard stops the broken surface and keeps the shell responsive.</p>
      <div class="error-state-detail">Timeout budget: ${Math.ceil(timeoutMs / 1000)}s</div>
      <pre>${escapeHtml(reason)}</pre>
      <div class="error-state-actions">
        <button type="button" data-error-retry>Try Again</button>
        <a href="/" data-route class="error-state-link">Go Home</a>
      </div>
    </div>
  `;
}
