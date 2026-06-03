import { TOOLS } from '../../core/config.js';
import { getStudioByToolId } from '../../core/studios.js';
import { bindSearchableSelect, renderSearchableSelect } from '../../ui/searchable-select.js';
import { showToast } from '../../ui/ui-utils.js';
import {
  applyDateMath,
  buildTimeOverlapPlan,
  formatTimestampSnapshot,
  getCalendarSnapshot,
  getDateDifference,
  parseDateInputAsLocalDate,
  resolveTimeZoneConversion,
  summarizeDstContext
} from '../../utils/studio.js';
import { createStudioShell } from './studio-shell.js';

let state = null;
const ZONES = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : ['UTC'];
const LOCAL_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

function getTool(toolId) {
  return TOOLS.find((tool) => tool.id === toolId);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function renderTimeLayout(defaultTab) {
  return `
    <div class="studio-stack">
      <section class="card studio-card time-world-card">
        <div class="studio-panel-head">
          <h3>World Clocks</h3>
        </div>
        <div class="studio-toolbar">
          <div class="studio-toolbar-group">
            ${renderSearchableSelect({
              id: 'time-world-zone',
              label: 'Add Timezone',
              options: ZONES,
              selected: 'Asia/Tehran',
              placeholder: 'Search timezone'
            })}
          </div>
          <div class="studio-toolbar-group studio-toolbar-actions">
            <button id="time-world-add" type="button">Add Clock</button>
          </div>
        </div>
        <div id="time-world-clock-grid" class="time-world-grid"></div>
        <div id="time-current-date-formats" class="time-date-format-grid"></div>
      </section>

      <section class="card studio-card">
        <div class="tabs-header">
          ${[
            ['stopwatch', 'Stopwatch'],
            ['timer', 'Timer'],
            ['alarms', 'Alarms'],
            ['epoch', 'Epoch'],
            ['timezone', 'Timezone'],
            ['planning', 'Planner'],
            ['date-math', 'Date Math'],
            ['calendar', 'Calendar']
          ].map(([id, label]) => `
            <button class="tab-btn${id === defaultTab ? ' active' : ''}" data-time-tab="${id}">${label}</button>
          `).join('')}
        </div>

        <section class="time-view${defaultTab === 'stopwatch' ? '' : ' hidden'}" data-view="stopwatch">
          <div class="time-display-card">
            <div class="time-display-label">Elapsed</div>
            <div id="time-stopwatch-display" class="time-display-value">00:00:00.00</div>
            <div class="studio-actions studio-actions-centered">
              <button id="time-stopwatch-start">Start</button>
              <button id="time-stopwatch-stop" class="btn-secondary hidden">Stop</button>
              <button id="time-stopwatch-reset" class="btn-secondary">Reset</button>
            </div>
          </div>
        </section>

        <section class="time-view${defaultTab === 'timer' ? '' : ' hidden'}" data-view="timer">
          <div class="time-display-card">
            <div class="time-display-label">Countdown</div>
            <div id="time-timer-display" class="time-display-value">00:00:00</div>
            <div class="studio-inline-grid time-inline-grid">
              <label class="studio-field">
                <span>Hours</span>
                <input id="time-timer-hours" type="number" min="0" max="99" value="0">
              </label>
              <label class="studio-field">
                <span>Minutes</span>
                <input id="time-timer-minutes" type="number" min="0" max="59" value="15">
              </label>
              <label class="studio-field">
                <span>Seconds</span>
                <input id="time-timer-seconds" type="number" min="0" max="59" value="0">
              </label>
            </div>
            <div class="studio-actions studio-actions-centered">
              <button id="time-timer-start">Start Timer</button>
              <button id="time-timer-stop" class="btn-secondary hidden">Stop</button>
              <button id="time-timer-reset" class="btn-secondary">Reset</button>
            </div>
          </div>
        </section>

        <section class="time-view${defaultTab === 'alarms' ? '' : ' hidden'}" data-view="alarms">
          <div class="studio-toolbar">
            <div class="studio-toolbar-group">
              <label class="studio-field">
                <span>Alarm Time</span>
                <input id="time-alarm-input" type="time">
              </label>
            </div>
            <div class="studio-toolbar-group studio-toolbar-actions">
              <button id="time-alarm-add">Add Alarm</button>
            </div>
          </div>
          <div id="time-alarm-list" class="studio-list"></div>
        </section>

        <section class="time-view${defaultTab === 'epoch' ? '' : ' hidden'}" data-view="epoch">
          <div class="studio-toolbar">
            <div class="studio-toolbar-group">
              <label class="studio-field studio-field-wide">
                <span>Timestamp</span>
                <input id="time-epoch-input" type="text" placeholder="1713264000 or 1713264000000">
              </label>
            </div>
            <div class="studio-toolbar-group studio-toolbar-actions">
              <button id="time-epoch-convert">Convert</button>
              <button id="time-epoch-now" class="btn-secondary">Use Current Epoch</button>
            </div>
          </div>
          <div class="studio-inline-grid">
            <div class="studio-output-card">
              <span>Current Epoch</span>
              <strong id="time-epoch-current">0</strong>
            </div>
            <div class="studio-output-card">
              <span>Detected Unit</span>
              <strong id="time-epoch-unit">Awaiting input</strong>
            </div>
          </div>
          <div class="studio-result-grid">
            <div class="studio-output-card">
              <span>Local</span>
              <code id="time-epoch-local">Enter a timestamp.</code>
            </div>
            <div class="studio-output-card">
              <span>UTC</span>
              <code id="time-epoch-utc">Enter a timestamp.</code>
            </div>
            <div class="studio-output-card">
              <span>ISO</span>
              <code id="time-epoch-iso">Enter a timestamp.</code>
            </div>
          </div>
        </section>

        <section class="time-view${defaultTab === 'timezone' ? '' : ' hidden'}" data-view="timezone">
          <div class="studio-toolbar">
            <div class="studio-toolbar-group">
              ${renderSearchableSelect({
                id: 'time-zone-source',
                label: 'Source Timezone',
                options: ZONES,
                selected: LOCAL_ZONE,
                placeholder: 'Search source'
              })}
              ${renderSearchableSelect({
                id: 'time-zone-target',
                label: 'Target Timezone',
                options: ZONES,
                selected: 'UTC',
                placeholder: 'Search target'
              })}
              <label class="studio-field studio-field-wide">
                <span>Source Date & Time</span>
                <input id="time-zone-input" type="datetime-local">
              </label>
            </div>
            <div class="studio-toolbar-group studio-toolbar-actions">
              <button id="time-zone-convert">Convert</button>
              <button id="time-zone-now" class="btn-secondary">Use Current Time</button>
            </div>
          </div>
          <div class="studio-result-grid">
            <div class="studio-output-card">
              <span>Source</span>
              <code id="time-zone-source-output">Choose a date and time.</code>
            </div>
            <div class="studio-output-card">
              <span>Target</span>
              <code id="time-zone-target-output">Choose a date and time.</code>
            </div>
            <div class="studio-output-card">
              <span>Offset Context</span>
              <code id="time-zone-offset-output">Waiting for conversion.</code>
            </div>
          </div>
          <div class="form-group">
            <label>Quick Reference (Current Time)</label>
            <div id="time-zone-quick-grid" class="studio-result-grid"></div>
          </div>
        </section>

        <section class="time-view${defaultTab === 'planning' ? '' : ' hidden'}" data-view="planning">
          <div class="studio-panel-grid studio-panel-grid-dual time-planner-grid">
            <div class="studio-panel">
              <div class="studio-panel-head">
                <h3>Overlap Planner</h3>
              </div>
              <div class="studio-inline-grid">
                <label class="studio-field studio-field-wide">
                  <span>Zones</span>
                  <input id="time-overlap-zones" type="text" value="${LOCAL_ZONE}, UTC, America/New_York">
                </label>
                <label class="studio-field">
                  <span>Date</span>
                  <input id="time-overlap-date" type="date">
                </label>
                <label class="studio-field">
                  <span>Work Start</span>
                  <input id="time-overlap-start" type="time" value="09:00">
                </label>
                <label class="studio-field">
                  <span>Work End</span>
                  <input id="time-overlap-end" type="time" value="17:00">
                </label>
              </div>
              <div class="studio-actions">
                <button id="time-overlap-build">Build Overlap</button>
              </div>
              <div id="time-overlap-output" class="time-overlap-output studio-list"></div>
            </div>

            <div class="studio-panel">
              <div class="studio-panel-head">
                <h3>DST Context</h3>
              </div>
              <div class="studio-inline-grid">
                ${renderSearchableSelect({
                  id: 'time-dst-zone',
                  label: 'Timezone',
                  options: ZONES,
                  selected: LOCAL_ZONE,
                  placeholder: 'Search timezone'
                })}
                <label class="studio-field">
                  <span>Year</span>
                  <input id="time-dst-year" type="number" min="1970" max="9999" value="${new Date().getFullYear()}">
                </label>
              </div>
              <div class="studio-actions">
                <button id="time-dst-build">Summarize DST</button>
              </div>
              <div id="time-dst-output" class="time-dst-output studio-list"></div>
            </div>
          </div>
        </section>

        <section class="time-view${defaultTab === 'date-math' ? '' : ' hidden'}" data-view="date-math">
          <div class="studio-panel-grid studio-panel-grid-dual time-planner-grid">
            <div class="studio-panel">
              <div class="studio-panel-head">
                <h3>Date Math</h3>
              </div>
              <div class="studio-inline-grid">
                <label class="studio-field">
                  <span>Start Date</span>
                  <input id="time-date-math-input" type="date">
                </label>
                <label class="studio-field">
                  <span>Years</span>
                  <input id="time-date-math-years" type="number" value="0">
                </label>
                <label class="studio-field">
                  <span>Months</span>
                  <input id="time-date-math-months" type="number" value="0">
                </label>
                <label class="studio-field">
                  <span>Weeks</span>
                  <input id="time-date-math-weeks" type="number" value="0">
                </label>
                <label class="studio-field">
                  <span>Days</span>
                  <input id="time-date-math-days" type="number" value="0">
                </label>
                <label class="studio-field">
                  <span>Business Days</span>
                  <input id="time-date-math-business" type="number" value="0">
                </label>
              </div>
              <div class="studio-actions">
                <button id="time-date-math-apply">Apply Date Math</button>
              </div>
              <div id="time-date-math-output" class="studio-output-card">
                <span>Result</span>
                <code>Choose a date and operation.</code>
              </div>
            </div>

            <div class="studio-panel">
              <div class="studio-panel-head">
                <h3>Date Difference</h3>
              </div>
              <div class="studio-inline-grid">
                <label class="studio-field">
                  <span>Start</span>
                  <input id="time-date-diff-start" type="date">
                </label>
                <label class="studio-field">
                  <span>End</span>
                  <input id="time-date-diff-end" type="date">
                </label>
              </div>
              <div class="studio-actions">
                <button id="time-date-diff-apply">Compare Dates</button>
              </div>
              <div id="time-date-diff-output" class="studio-output-card">
                <span>Difference</span>
                <code>Choose two dates.</code>
              </div>
            </div>
          </div>
        </section>

        <section class="time-view${defaultTab === 'calendar' ? '' : ' hidden'}" data-view="calendar">
          <div class="studio-toolbar">
            <div class="studio-toolbar-group">
              <label class="studio-field studio-field-wide">
                <span>Date</span>
                <input id="time-calendar-input" type="date">
              </label>
            </div>
            <div class="studio-toolbar-group studio-toolbar-actions">
              <button id="time-calendar-apply">Update</button>
              <button id="time-calendar-today" class="btn-secondary">Today</button>
            </div>
          </div>
          <div class="studio-result-grid">
            <div class="studio-output-card">
              <span>Gregorian</span>
              <strong id="time-calendar-gregorian-day">--</strong>
              <code id="time-calendar-gregorian-label">Choose a date.</code>
            </div>
            <div class="studio-output-card">
              <span>Jalali</span>
              <strong id="time-calendar-jalali-day">--</strong>
              <code id="time-calendar-jalali-label">Choose a date.</code>
            </div>
            <div class="studio-output-card">
              <span>Islamic</span>
              <strong id="time-calendar-islamic-day">--</strong>
              <code id="time-calendar-islamic-label">Choose a date.</code>
            </div>
          </div>
        </section>
      </section>
    </div>
  `;
}

function renderStopwatchValue(elapsedMs) {
  const totalCentiseconds = Math.floor(elapsedMs / 10);
  const hours = Math.floor(totalCentiseconds / 360000);
  const minutes = Math.floor((totalCentiseconds % 360000) / 6000);
  const seconds = Math.floor((totalCentiseconds % 6000) / 100);
  const centiseconds = totalCentiseconds % 100;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}

function renderTimerValue(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function formatDateInputValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatOffset(minutes) {
  const sign = minutes >= 0 ? '+' : '-';
  const value = Math.abs(minutes);
  return `UTC${sign}${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

function getWorldClockSnapshot(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'short'
  }).formatToParts(date).reduce((accumulator, part) => {
    if (part.type !== 'literal') accumulator[part.type] = part.value;
    return accumulator;
  }, {});
  const hour = Number(parts.hour || 0);
  const minute = Number(parts.minute || 0);
  const second = Number(parts.second || 0);
  return {
    timeZone,
    city: timeZone.split('/').pop()?.replace(/_/g, ' ') || timeZone,
    dateLabel: `${parts.weekday}, ${parts.month} ${parts.day}`,
    timeLabel: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    zoneName: parts.timeZoneName || timeZone,
    hourAngle: ((hour % 12) * 30) + (minute * 0.5),
    minuteAngle: minute * 6,
    secondAngle: second * 6
  };
}

function renderAnalogClock(snapshot) {
  return `
    <div class="time-world-clock-card" data-world-zone="${escapeHtml(snapshot.timeZone)}">
      <div class="time-world-clock-copy">
        <span>${escapeHtml(snapshot.city)}</span>
        <strong>${escapeHtml(snapshot.timeLabel)}</strong>
        <code>${escapeHtml(snapshot.zoneName)} ${escapeHtml(snapshot.dateLabel)}</code>
      </div>
      <div class="time-analog-clock">
        <i data-clock-hand="hour" data-angle="${snapshot.hourAngle}"></i>
        <i data-clock-hand="minute" data-angle="${snapshot.minuteAngle}"></i>
        <i data-clock-hand="second" data-angle="${snapshot.secondAngle}"></i>
      </div>
      <button type="button" class="btn-secondary time-world-remove" data-world-remove="${escapeHtml(snapshot.timeZone)}">Remove</button>
    </div>
  `;
}

function renderOverlapPlan(plan) {
  if (!plan.slots.length) {
    return '<div class="studio-empty">No shared working window for those zones.</div>';
  }

  return plan.slots.slice(0, 12).map((slot) => `
    <div class="time-overlap-slot">
      <strong>${escapeHtml(slot.label)}</strong>
      <div>
        ${slot.localTimes.map((time) => `
          <span>${escapeHtml(time.city)} ${escapeHtml(time.hour)}:${escapeHtml(time.minute)} ${escapeHtml(time.zoneName)}</span>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function renderDstSummary(summary) {
  if (!summary.observesDst) {
    return `
      <div class="time-dst-card">
        <strong>${escapeHtml(summary.timeZone)}</strong>
        <span>No DST transition detected in ${escapeHtml(summary.year)}.</span>
      </div>
    `;
  }

  return summary.transitions.map((transition) => `
    <div class="time-dst-card">
      <strong>${escapeHtml(transition.date)} ${transition.direction === 'forward' ? 'Forward' : 'Back'}</strong>
      <span>${formatOffset(transition.fromOffsetMinutes)} to ${formatOffset(transition.toOffsetMinutes)}</span>
    </div>
  `).join('');
}

export async function mountTimeStudio(parent, toolId) {
  const tool = getTool(toolId);
  const studio = getStudioByToolId(toolId);
  const defaultTab = ({
    'epoch-and-date': 'epoch',
    'time-converter': 'epoch',
    'timezone-converter': 'timezone',
    'calendar-converter': 'calendar',
    'calendar-tool': 'calendar'
  })[toolId] || 'stopwatch';
  const shell = createStudioShell(parent, {
    className: 'time-studio-shell',
    eyebrow: studio.title,
    title: tool.title,
    description: ({
      'epoch-and-date': 'Epoch conversion now lives beside timers, timezone planning, and calendar views so time workflows stay together.',
      'time-converter': 'Epoch conversion now lives beside timers, timezone planning, and calendar views so time workflows stay together.',
      'timezone-converter': 'Timezone conversion now runs inside Time Studio with current-world quick references and route-safe compatibility.',
      'calendar-converter': 'Gregorian, Jalali, and Islamic calendar views now share the same studio as timers and timezone planning.',
      'calendar-tool': 'Gregorian, Jalali, and Islamic calendar views now share the same studio as timers and timezone planning.'
    })[toolId] || 'Switch between precision timing, countdowns, alarms, timestamp conversion, timezone planning, and calendar views.',
    toolIds: studio.toolIds,
    activeToolId: toolId,
    metrics: [
      { key: 'timezone', label: 'Timezone', value: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local' },
      { key: 'clock', label: 'Local Time', value: new Date().toLocaleTimeString() }
    ]
  });

  shell.content.innerHTML = renderTimeLayout(defaultTab);

  const cleanup = [];
  const stopwatchDisplay = shell.content.querySelector('#time-stopwatch-display');
  const timerDisplay = shell.content.querySelector('#time-timer-display');
  const currentEpoch = shell.content.querySelector('#time-epoch-current');
  const alarmList = shell.content.querySelector('#time-alarm-list');
  const timezoneInput = shell.content.querySelector('#time-zone-input');
  const calendarInput = shell.content.querySelector('#time-calendar-input');
  let activeView = defaultTab;
  let stopwatchElapsed = 0;
  let stopwatchStartedAt = 0;
  let stopwatchTicker = null;
  let timerSeconds = 0;
  let timerTicker = null;
  let clockTicker = null;
  let alarmTicker = null;
  let alarms = [];
  let worldClockZones = Array.from(new Set([LOCAL_ZONE, 'Asia/Tehran']));

  ['time-world-zone', 'time-zone-source', 'time-zone-target', 'time-dst-zone'].forEach((id) => {
    cleanup.push(bindSearchableSelect(shell.content, id, ZONES));
  });

  const setStatus = (message, tone = 'neutral') => shell.setStatus(message, tone);

  function renderWorldClocks() {
    const grid = shell.content.querySelector('#time-world-clock-grid');
    const now = new Date();
    grid.innerHTML = worldClockZones
      .map((zone) => renderAnalogClock(getWorldClockSnapshot(now, zone)))
      .join('');
    grid.querySelectorAll('[data-clock-hand]').forEach((hand) => {
      hand.style.transform = `rotate(${Number(hand.dataset.angle) || 0}deg)`;
    });
    grid.querySelectorAll('.time-world-remove').forEach((button) => {
      button.classList.toggle('hidden', worldClockZones.length <= 1);
    });
  }

  function renderCurrentDateFormats() {
    const grid = shell.content.querySelector('#time-current-date-formats');
    const snapshot = getCalendarSnapshot(new Date());
    grid.innerHTML = [
      ['Gregorian', snapshot.gregorian],
      ['Persian Calendar', snapshot.jalali],
      ['Arabic Calendar', snapshot.islamic]
    ].map(([label, entry]) => `
      <div class="studio-output-card">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(entry.day)}</strong>
        <code>${escapeHtml(entry.label)}</code>
      </div>
    `).join('');
  }

  const refreshClock = () => {
    shell.setMetric('clock', new Date().toLocaleTimeString());
    currentEpoch.textContent = `${Math.floor(Date.now() / 1000)}`;
    renderWorldClocks();
    renderCurrentDateFormats();
  };

  const renderAlarms = () => {
    if (!alarms.length) {
      alarmList.innerHTML = '<div class="studio-empty">No alarms yet.</div>';
      return;
    }

    alarmList.innerHTML = alarms.map((time, index) => `
      <div class="studio-list-item">
        <div>
          <strong>${time}</strong>
          <span>Local clock alarm</span>
        </div>
        <button class="btn-secondary" data-alarm-remove="${index}">Remove</button>
      </div>
    `).join('');

    alarmList.querySelectorAll('[data-alarm-remove]').forEach((button) => {
      cleanup.push(bind(button, 'click', () => {
        alarms = alarms.filter((_, index) => index !== Number(button.dataset.alarmRemove));
        renderAlarms();
        setStatus('Alarm removed.', 'neutral');
      }));
    });
  };

  const openView = (viewId) => {
    activeView = viewId;
    shell.content.querySelectorAll('[data-time-tab]').forEach((button) => {
      button.classList.toggle('active', button.dataset.timeTab === viewId);
    });
    shell.content.querySelectorAll('.time-view').forEach((view) => {
      view.classList.toggle('hidden', view.dataset.view !== viewId);
    });
  };

  const updateStopwatch = () => {
    const elapsed = stopwatchTicker ? stopwatchElapsed + (Date.now() - stopwatchStartedAt) : stopwatchElapsed;
    stopwatchDisplay.textContent = renderStopwatchValue(elapsed);
  };

  const stopStopwatch = () => {
    if (!stopwatchTicker) return;
    clearInterval(stopwatchTicker);
    stopwatchTicker = null;
    stopwatchElapsed += Date.now() - stopwatchStartedAt;
    shell.content.querySelector('#time-stopwatch-start').classList.remove('hidden');
    shell.content.querySelector('#time-stopwatch-stop').classList.add('hidden');
  };

  const resetTimer = () => {
    clearInterval(timerTicker);
    timerTicker = null;
    timerSeconds = 0;
    timerDisplay.textContent = renderTimerValue(0);
    shell.content.querySelector('#time-timer-start').classList.remove('hidden');
    shell.content.querySelector('#time-timer-stop').classList.add('hidden');
  };

  const runEpochConversion = () => {
    const input = shell.content.querySelector('#time-epoch-input').value;

    try {
      const snapshot = formatTimestampSnapshot(input);
      shell.content.querySelector('#time-epoch-unit').textContent = snapshot.detectedUnit;
      shell.content.querySelector('#time-epoch-local').textContent = snapshot.local;
      shell.content.querySelector('#time-epoch-utc').textContent = snapshot.utc;
      shell.content.querySelector('#time-epoch-iso').textContent = snapshot.iso;
      setStatus('Timestamp converted.', 'success');
    } catch (error) {
      shell.content.querySelector('#time-epoch-unit').textContent = 'Invalid';
      shell.content.querySelector('#time-epoch-local').textContent = error.message;
      shell.content.querySelector('#time-epoch-utc').textContent = error.message;
      shell.content.querySelector('#time-epoch-iso').textContent = error.message;
      setStatus(error.message, 'danger');
    }
  };

  const setCurrentDateTimeInput = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    timezoneInput.value = now.toISOString().slice(0, 16);
  };

  const setPlanningDateInputs = () => {
    const today = formatDateInputValue(new Date());
    shell.content.querySelector('#time-overlap-date').value = today;
    shell.content.querySelector('#time-date-math-input').value = today;
    shell.content.querySelector('#time-date-diff-start').value = today;
    shell.content.querySelector('#time-date-diff-end').value = today;
  };

  const updateTimezoneQuickGrid = () => {
    const quickZones = Array.from(new Set(['UTC', LOCAL_ZONE, 'America/New_York', 'Europe/London', 'Asia/Tokyo', 'Asia/Tehran']));
    const grid = shell.content.querySelector('#time-zone-quick-grid');
    const now = new Date();

    grid.innerHTML = quickZones.map((zone) => {
      const snapshot = resolveTimeZoneConversion(
        now.toISOString().slice(0, 19),
        'UTC',
        zone
      ).target;

      return `
        <div class="studio-output-card">
          <span>${snapshot.city}</span>
          <strong>${snapshot.hour}:${snapshot.minute}</strong>
          <code>${snapshot.zoneName}</code>
        </div>
      `;
    }).join('');
  };

  const runTimezoneConversion = () => {
    try {
      const snapshot = resolveTimeZoneConversion(
        timezoneInput.value,
        shell.content.querySelector('#time-zone-source').value,
        shell.content.querySelector('#time-zone-target').value
      );

      shell.content.querySelector('#time-zone-source-output').textContent = snapshot.source.label;
      shell.content.querySelector('#time-zone-target-output').textContent = snapshot.target.label;
      shell.content.querySelector('#time-zone-offset-output').textContent = `${snapshot.source.zoneName} -> ${snapshot.target.zoneName}`;
      setStatus('Timezone converted.', 'success');
    } catch (error) {
      shell.content.querySelector('#time-zone-source-output').textContent = error.message;
      shell.content.querySelector('#time-zone-target-output').textContent = error.message;
      shell.content.querySelector('#time-zone-offset-output').textContent = 'Waiting for conversion.';
      setStatus(error.message, 'danger');
    }
  };

  const runOverlapPlanning = () => {
    try {
      const zones = shell.content.querySelector('#time-overlap-zones').value.split(',').map((zone) => zone.trim()).filter(Boolean);
      const plan = buildTimeOverlapPlan({
        date: shell.content.querySelector('#time-overlap-date').value,
        zones,
        workStart: shell.content.querySelector('#time-overlap-start').value,
        workEnd: shell.content.querySelector('#time-overlap-end').value
      });
      shell.content.querySelector('#time-overlap-output').innerHTML = renderOverlapPlan(plan);
      setStatus('Overlap plan updated.', 'success');
    } catch (error) {
      shell.content.querySelector('#time-overlap-output').innerHTML = `<div class="studio-empty">${escapeHtml(error.message)}</div>`;
      setStatus(error.message, 'danger');
    }
  };

  const runDstSummary = () => {
    try {
      const summary = summarizeDstContext(
        shell.content.querySelector('#time-dst-zone').value,
        shell.content.querySelector('#time-dst-year').value
      );
      shell.content.querySelector('#time-dst-output').innerHTML = renderDstSummary(summary);
      setStatus('DST context updated.', 'success');
    } catch (error) {
      shell.content.querySelector('#time-dst-output').innerHTML = `<div class="studio-empty">${escapeHtml(error.message)}</div>`;
      setStatus(error.message, 'danger');
    }
  };

  const runDateMath = () => {
    try {
      const result = applyDateMath(shell.content.querySelector('#time-date-math-input').value, {
        years: shell.content.querySelector('#time-date-math-years').value,
        months: shell.content.querySelector('#time-date-math-months').value,
        weeks: shell.content.querySelector('#time-date-math-weeks').value,
        days: shell.content.querySelector('#time-date-math-days').value,
        businessDays: shell.content.querySelector('#time-date-math-business').value
      });
      shell.content.querySelector('#time-date-math-output').innerHTML = `
        <span>Result</span>
        <strong>${escapeHtml(result.isoDate)}</strong>
        <code>${escapeHtml(result.label)}</code>
      `;
      setStatus('Date math applied.', 'success');
    } catch (error) {
      shell.content.querySelector('#time-date-math-output').innerHTML = `<span>Result</span><code>${escapeHtml(error.message)}</code>`;
      setStatus(error.message, 'danger');
    }
  };

  const runDateDifference = () => {
    try {
      const diff = getDateDifference(
        shell.content.querySelector('#time-date-diff-start').value,
        shell.content.querySelector('#time-date-diff-end').value
      );
      shell.content.querySelector('#time-date-diff-output').innerHTML = `
        <span>Difference</span>
        <strong>${Math.abs(diff.days)} days</strong>
        <code>${Math.abs(diff.weeks)} weeks and ${diff.remainderDays} days ${diff.direction}</code>
      `;
      setStatus('Date difference calculated.', 'success');
    } catch (error) {
      shell.content.querySelector('#time-date-diff-output').innerHTML = `<span>Difference</span><code>${escapeHtml(error.message)}</code>`;
      setStatus(error.message, 'danger');
    }
  };

  const setCurrentCalendarInput = () => {
    calendarInput.value = formatDateInputValue(new Date());
  };

  const runCalendarConversion = () => {
    try {
      const snapshot = getCalendarSnapshot(parseDateInputAsLocalDate(calendarInput.value));
      shell.content.querySelector('#time-calendar-gregorian-day').textContent = snapshot.gregorian.day;
      shell.content.querySelector('#time-calendar-gregorian-label').textContent = snapshot.gregorian.label;
      shell.content.querySelector('#time-calendar-jalali-day').textContent = snapshot.jalali.day;
      shell.content.querySelector('#time-calendar-jalali-label').textContent = snapshot.jalali.label;
      shell.content.querySelector('#time-calendar-islamic-day').textContent = snapshot.islamic.day;
      shell.content.querySelector('#time-calendar-islamic-label').textContent = snapshot.islamic.label;
      setStatus('Calendar updated.', 'success');
    } catch (error) {
      shell.content.querySelector('#time-calendar-gregorian-day').textContent = '--';
      shell.content.querySelector('#time-calendar-gregorian-label').textContent = error.message;
      shell.content.querySelector('#time-calendar-jalali-day').textContent = '--';
      shell.content.querySelector('#time-calendar-jalali-label').textContent = error.message;
      shell.content.querySelector('#time-calendar-islamic-day').textContent = '--';
      shell.content.querySelector('#time-calendar-islamic-label').textContent = error.message;
      setStatus(error.message, 'danger');
    }
  };

  cleanup.push(...Array.from(shell.content.querySelectorAll('[data-time-tab]')).map((button) => bind(button, 'click', () => openView(button.dataset.timeTab))));
  cleanup.push(bind(shell.content.querySelector('#time-stopwatch-start'), 'click', () => {
    if (stopwatchTicker) return;
    stopwatchStartedAt = Date.now();
    stopwatchTicker = setInterval(updateStopwatch, 25);
    shell.content.querySelector('#time-stopwatch-start').classList.add('hidden');
    shell.content.querySelector('#time-stopwatch-stop').classList.remove('hidden');
    setStatus('Stopwatch running.', 'neutral');
  }));
  cleanup.push(bind(shell.content.querySelector('#time-stopwatch-stop'), 'click', () => {
    stopStopwatch();
    updateStopwatch();
    setStatus('Stopwatch paused.', 'neutral');
  }));
  cleanup.push(bind(shell.content.querySelector('#time-stopwatch-reset'), 'click', () => {
    stopStopwatch();
    stopwatchElapsed = 0;
    updateStopwatch();
    setStatus('Stopwatch reset.', 'neutral');
  }));
  cleanup.push(bind(shell.content.querySelector('#time-timer-start'), 'click', () => {
    const hours = Number(shell.content.querySelector('#time-timer-hours').value || 0);
    const minutes = Number(shell.content.querySelector('#time-timer-minutes').value || 0);
    const seconds = Number(shell.content.querySelector('#time-timer-seconds').value || 0);
    timerSeconds = (hours * 3600) + (minutes * 60) + seconds;

    if (timerSeconds <= 0) {
      setStatus('Enter a countdown above zero.', 'danger');
      return;
    }

    clearInterval(timerTicker);
    timerDisplay.textContent = renderTimerValue(timerSeconds);
    timerTicker = setInterval(() => {
      timerSeconds -= 1;
      timerDisplay.textContent = renderTimerValue(Math.max(timerSeconds, 0));
      if (timerSeconds <= 0) {
        resetTimer();
        showToast('Timer finished.', 'success');
        setStatus('Timer finished.', 'success');
      }
    }, 1000);
    shell.content.querySelector('#time-timer-start').classList.add('hidden');
    shell.content.querySelector('#time-timer-stop').classList.remove('hidden');
    setStatus('Timer running.', 'neutral');
  }));
  cleanup.push(bind(shell.content.querySelector('#time-timer-stop'), 'click', () => {
    clearInterval(timerTicker);
    timerTicker = null;
    shell.content.querySelector('#time-timer-start').classList.remove('hidden');
    shell.content.querySelector('#time-timer-stop').classList.add('hidden');
    setStatus('Timer paused.', 'neutral');
  }));
  cleanup.push(bind(shell.content.querySelector('#time-timer-reset'), 'click', () => {
    resetTimer();
    setStatus('Timer reset.', 'neutral');
  }));
  cleanup.push(bind(shell.content.querySelector('#time-alarm-add'), 'click', () => {
    const value = shell.content.querySelector('#time-alarm-input').value;
    if (!value) {
      setStatus('Choose an alarm time first.', 'danger');
      return;
    }
    if (!alarms.includes(value)) alarms = [...alarms, value].sort();
    renderAlarms();
    setStatus(`Alarm saved for ${value}.`, 'success');
  }));
  cleanup.push(bind(shell.content.querySelector('#time-epoch-convert'), 'click', runEpochConversion));
  cleanup.push(bind(shell.content.querySelector('#time-epoch-now'), 'click', () => {
    shell.content.querySelector('#time-epoch-input').value = `${Math.floor(Date.now() / 1000)}`;
    runEpochConversion();
  }));
  cleanup.push(bind(shell.content.querySelector('#time-zone-convert'), 'click', runTimezoneConversion));
  cleanup.push(bind(shell.content.querySelector('#time-zone-now'), 'click', () => {
    setCurrentDateTimeInput();
    runTimezoneConversion();
  }));
  cleanup.push(bind(shell.content.querySelector('#time-overlap-build'), 'click', runOverlapPlanning));
  cleanup.push(bind(shell.content.querySelector('#time-dst-build'), 'click', runDstSummary));
  cleanup.push(bind(shell.content.querySelector('#time-date-math-apply'), 'click', runDateMath));
  cleanup.push(bind(shell.content.querySelector('#time-date-diff-apply'), 'click', runDateDifference));
  cleanup.push(bind(shell.content.querySelector('#time-calendar-apply'), 'click', runCalendarConversion));
  cleanup.push(bind(shell.content.querySelector('#time-calendar-today'), 'click', () => {
    setCurrentCalendarInput();
    runCalendarConversion();
  }));
  cleanup.push(bind(shell.content.querySelector('#time-world-add'), 'click', () => {
    const zone = shell.content.querySelector('#time-world-zone').value;
    if (!worldClockZones.includes(zone)) worldClockZones = [...worldClockZones, zone];
    renderWorldClocks();
    setStatus('World clock added.', 'success');
  }));
  cleanup.push(bind(shell.content.querySelector('#time-world-clock-grid'), 'click', (event) => {
    const button = event.target.closest('[data-world-remove]');
    if (!button) return;
    worldClockZones = worldClockZones.filter((zone) => zone !== button.dataset.worldRemove);
    renderWorldClocks();
    setStatus('World clock removed.', 'neutral');
  }));

  clockTicker = setInterval(refreshClock, 1000);
  const timezoneTicker = setInterval(updateTimezoneQuickGrid, 60000);
  alarmTicker = setInterval(() => {
    const current = new Date();
    const currentValue = `${current.getHours().toString().padStart(2, '0')}:${current.getMinutes().toString().padStart(2, '0')}`;
    if (!alarms.includes(currentValue)) return;
    alarms = alarms.filter((alarm) => alarm !== currentValue);
    renderAlarms();
    showToast(`Alarm ${currentValue}`, 'success');
    setStatus(`Alarm fired at ${currentValue}.`, 'success');
  }, 15000);

  refreshClock();
  updateStopwatch();
  timerDisplay.textContent = renderTimerValue(0);
  renderAlarms();
  setCurrentDateTimeInput();
  setPlanningDateInputs();
  updateTimezoneQuickGrid();
  if (defaultTab === 'timezone') runTimezoneConversion();
  runOverlapPlanning();
  runDstSummary();
  runDateMath();
  runDateDifference();
  setCurrentCalendarInput();
  if (defaultTab === 'calendar') runCalendarConversion();

  state = {
    root: shell.root,
    cleanup,
    timers: [clockTicker, timezoneTicker, alarmTicker],
    stopStopwatch,
    resetTimer
  };
}

export function unmountTimeStudio() {
  if (!state) return;
  for (const dispose of state.cleanup) dispose();
  state.stopStopwatch?.();
  state.resetTimer?.();
  for (const timer of state.timers) clearInterval(timer);
  state.root?.remove();
  state = null;
}

function bind(node, eventName, handler) {
  if (!node) return () => {};
  node.addEventListener(eventName, handler);
  return () => node.removeEventListener(eventName, handler);
}
