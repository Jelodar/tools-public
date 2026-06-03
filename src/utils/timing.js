export function createDebouncedFunction(callback, delayMs = 0, options = {}) {
  const wait = Math.max(0, Number(delayMs) || 0);
  const leading = options.leading === true;
  const trailing = options.trailing !== false;
  let timer = 0;
  let lastArgs = null;
  let lastThis = null;
  let hasLed = false;

  const clearTimer = () => {
    if (!timer) return;
    clearTimeout(timer);
    timer = 0;
  };

  const invoke = () => {
    if (!lastArgs) return undefined;
    const args = lastArgs;
    const context = lastThis;
    lastArgs = null;
    lastThis = null;
    return callback.apply(context, args);
  };

  const settle = () => {
    timer = 0;
    hasLed = false;
    if (trailing) invoke();
    else {
      lastArgs = null;
      lastThis = null;
    }
  };

  function debounced(...args) {
    lastArgs = args;
    lastThis = this;
    if (leading && !timer && !hasLed) {
      hasLed = true;
      invoke();
    }
    clearTimer();
    timer = setTimeout(settle, wait);
  }

  debounced.cancel = () => {
    clearTimer();
    hasLed = false;
    lastArgs = null;
    lastThis = null;
  };

  debounced.flush = () => {
    clearTimer();
    hasLed = false;
    return invoke();
  };

  return debounced;
}

export function createThrottledFunction(callback, delayMs = 0) {
  const wait = Math.max(0, Number(delayMs) || 0);
  let lastRun = 0;
  let timer = 0;
  let lastArgs = null;
  let lastThis = null;

  const clearTimer = () => {
    if (!timer) return;
    clearTimeout(timer);
    timer = 0;
  };

  const invoke = (time, args, context) => {
    lastRun = time;
    lastArgs = null;
    lastThis = null;
    return callback.apply(context, args);
  };

  function throttled(...args) {
    const now = Date.now();
    if (!lastRun || now - lastRun >= wait) {
      clearTimer();
      return invoke(now, args, this);
    }
    lastArgs = args;
    lastThis = this;
    if (timer) return undefined;
    timer = setTimeout(() => {
      timer = 0;
      if (lastArgs) invoke(Date.now(), lastArgs, lastThis);
    }, Math.max(0, wait - (now - lastRun)));
    return undefined;
  }

  throttled.cancel = () => {
    clearTimer();
    lastArgs = null;
    lastThis = null;
  };

  return throttled;
}
