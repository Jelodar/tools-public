let container = null;

export async function mount(parent) {
  container = document.createElement('div');
  container.className = 'tool-password-gen';
  container.innerHTML = `
    <div class="card password-card">
      <div class="settings-grid password-settings">
        <div class="form-group">
          <label>Password Length</label>
          <input type="number" id="pass-length" value="16" min="4" max="128">
        </div>
        <div class="form-group password-options">
          <div class="password-option-row">
            <label class="rj-switch">
              <input type="checkbox" id="pass-upper" checked>
              <span class="slider-switch"></span>
            </label>
            <label for="pass-upper" class="password-option-label">Uppercase (A-Z)</label>
          </div>
          <div class="password-option-row">
            <label class="rj-switch">
              <input type="checkbox" id="pass-lower" checked>
              <span class="slider-switch"></span>
            </label>
            <label for="pass-lower" class="password-option-label">Lowercase (a-z)</label>
          </div>
          <div class="password-option-row">
            <label class="rj-switch">
              <input type="checkbox" id="pass-numbers" checked>
              <span class="slider-switch"></span>
            </label>
            <label for="pass-numbers" class="password-option-label">Numbers (0-9)</label>
          </div>
          <div class="password-option-row">
            <label class="rj-switch">
              <input type="checkbox" id="pass-symbols" checked>
              <span class="slider-switch"></span>
            </label>
            <label for="pass-symbols" class="password-option-label">Symbols (!@#$%^&*)</label>
          </div>
        </div>
      </div>

      <button id="btn-gen-pass" class="password-generate-button">Generate Password</button>

      <div class="result-section">
        <div id="pass-output" class="password-output">--</div>
        <button id="btn-copy-pass" class="password-copy-button">Copy to Clipboard</button>
      </div>
    </div>
  `;
  
  parent.appendChild(container);
  
  const lengthIn = container.querySelector('#pass-length');
  const upperCb = container.querySelector('#pass-upper');
  const lowerCb = container.querySelector('#pass-lower');
  const numCb = container.querySelector('#pass-numbers');
  const symCb = container.querySelector('#pass-symbols');
  const output = container.querySelector('#pass-output');
  const btnGen = container.querySelector('#btn-gen-pass');

  const generate = () => {
    const length = parseInt(lengthIn.value);
    const charsets = {
      upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lower: 'abcdefghijklmnopqrstuvwxyz',
      numbers: '0123456789',
      symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    let allowed = '';
    if (upperCb.checked) allowed += charsets.upper;
    if (lowerCb.checked) allowed += charsets.lower;
    if (numCb.checked) allowed += charsets.numbers;
    if (symCb.checked) allowed += charsets.symbols;

    if (!allowed) {
      output.textContent = 'Select at least one option';
      return;
    }

    let res = '';
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
      res += allowed.charAt(array[i] % allowed.length);
    }

    output.textContent = res;
  };

  btnGen.addEventListener('click', generate);
  container.querySelector('#btn-copy-pass').addEventListener('click', () => {
    navigator.clipboard.writeText(output.textContent);
  });

  generate();
}

export function unmount() {
  if (container) {
    container.remove();
    container = null;
  }
}
