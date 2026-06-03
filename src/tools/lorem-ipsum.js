import { copyToClipboard, downloadFile } from '../ui/ui-utils.js';

let container = null;

const WORDS = ["lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "curabitur", "vel", "hendrerit", "libero", "eleifend", "blandit", "nunc", "ornare", "odio", "ut", "orci", "gravida", "imperdiet", "nullam", "purus", "lacinia", "a", "pretium", "quis", "congue", "praesent", "sagittis", "laoreet", "auctor", "mauris", "non", "velit", "eros", "dictum", "proin", "accumsan", "sapien", "nec", "massa", "volutpat", "venenatis", "sed", "eu", "molestie", "lacus", "quisque", "porttitor", "ligula", "dui", "mollis", "tempus", "at", "magna", "vestibulum", "turpis", "ac", "diam", "tincidunt", "id", "condimentum", "enim", "sodales", "in", "hac", "habitasse", "platea", "dictumst", "aenean", "neque", "fusce", "augue", "leo", "eget", "semper", "mattis", "tortor", "scelerisque", "nulla", "interdum", "tellus", "malesuada", "rhoncus", "accusantium", "ut", "facilis", "nihil", "quidem", "illum", "facere"];

export async function mount(parent) {
  container = document.createElement('div');
  container.className = 'tool-lorem';
  container.innerHTML = `
    <div class="card">
      <div class="settings-grid">
        <div class="form-group">
          <label>Content Type</label>
          <select id="lorem-type">
            <option value="paras">Paragraphs</option>
            <option value="words">Individual Words</option>
            <option value="lists">Unordered List</option>
          </select>
        </div>
        <div class="form-group">
          <label>Quantity</label>
          <input type="number" id="lorem-amount" value="3" min="1" max="100">
        </div>
      </div>
      
      <button id="btn-lorem-gen" class="lorem-generate-button">Generate Text</button>
      
      <div class="form-group lorem-output-group">
        <label>Resulting Text</label>
        <div id="lorem-output" class="lorem-output"></div>
      </div>

      <div class="lorem-actions">
        <button id="btn-copy-lorem" class="lorem-action">Copy Text</button>
        <button id="btn-dl-lorem" class="btn-secondary lorem-action">Download .txt</button>
      </div>
    </div>
  `;
  
  parent.appendChild(container);
  
  const typeIn = container.querySelector('#lorem-type');
  const amountIn = container.querySelector('#lorem-amount');
  const output = container.querySelector('#lorem-output');

  const generate = () => {
    const n = parseInt(amountIn.value) || 1;
    const t = typeIn.value;
    let res = '';

    const getWord = () => WORDS[Math.floor(Math.random() * WORDS.length)];
    const getSentence = () => {
      const len = 8 + Math.floor(Math.random() * 10);
      const s = Array.from({length: len}, getWord).join(' ');
      return s.charAt(0).toUpperCase() + s.slice(1) + '.';
    };

    if (t === 'words') {
      res = Array.from({length: n}, getWord).join(' ');
    } else if (t === 'paras') {
      res = Array.from({length: n}, () => {
        return Array.from({length: 4 + Math.floor(Math.random() * 4)}, getSentence).join(' ');
      }).join('\n\n');
    } else {
      res = Array.from({length: n}, () => '• ' + getSentence()).join('\n');
    }

    output.textContent = res;
  };

  container.querySelector('#btn-lorem-gen').addEventListener('click', generate);
  container.querySelector('#btn-copy-lorem').addEventListener('click', () => copyToClipboard(output.textContent));
  container.querySelector('#btn-dl-lorem').addEventListener('click', () => downloadFile(output.textContent, 'lorem_ipsum.txt'));

  generate();
}

export function unmount() {
  if (container) container.remove();
}
