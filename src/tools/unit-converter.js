import { convertTemp, convertUnits } from '../utils/logic.js';
import { getUnitCategoryUnits } from '../utils/units.js';

let container = null;

export async function mount(parent) {
  container = document.createElement('div');
  container.className = 'tool-units';
  container.innerHTML = `
    <div class="card">
      <div class="settings-grid">
        <div class="form-group">
          <label>Category</label>
          <select id="unit-cat">
            <option value="length">Length & Distance</option>
            <option value="weight">Mass & Weight</option>
            <option value="storage">Digital Storage</option>
            <option value="typography">Typography (px/pt/em)</option>
          </select>
        </div>
      </div>

      <div class="unit-converter-row">
        <div class="form-group">
          <label>From</label>
          <input type="number" id="unit-val-1" value="1">
          <select id="unit-type-1" class="unit-select"></select>
        </div>
        
        <div class="unit-equals">=</div>

        <div class="form-group">
          <label>To</label>
          <div id="unit-val-2" class="unit-result">100</div>
          <select id="unit-type-2" class="unit-select"></select>
        </div>
      </div>

      <div class="section unit-temperature-section">
        <h3>Temperature Converter</h3>
        <div class="unit-converter-row unit-temperature-row">
          <div class="form-group">
            <input type="number" id="temp-val-1" value="0">
            <select id="temp-type-1" class="unit-select">
              <option value="C">Celsius</option>
              <option value="F">Fahrenheit</option>
              <option value="K">Kelvin</option>
            </select>
          </div>
          <div class="unit-equals unit-temperature-equals">=</div>
          <div class="form-group">
            <div id="temp-val-2" class="unit-result unit-result-success">32</div>
            <select id="temp-type-2" class="unit-select">
              <option value="F">Fahrenheit</option>
              <option value="C">Celsius</option>
              <option value="K">Kelvin</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `;
  
  parent.appendChild(container);
  
  const catSelect = container.querySelector('#unit-cat');
  const type1 = container.querySelector('#unit-type-1');
  const type2 = container.querySelector('#unit-type-2');
  const val1 = container.querySelector('#unit-val-1');
  const val2 = container.querySelector('#unit-val-2');

  const updateOptions = () => {
    const cat = catSelect.value;
    const units = getUnitCategoryUnits(cat);
    type1.innerHTML = '';
    type2.innerHTML = '';
    Object.keys(units).forEach((unit) => {
      type1.add(new Option(unit, unit));
      type2.add(new Option(unit, unit));
    });
    type2.selectedIndex = 1;
    updateUnits();
  };

  const updateUnits = () => {
    const cat = catSelect.value;
    const v = parseFloat(val1.value) || 0;
    const t1 = type1.value;
    const t2 = type2.value;
    const units = getUnitCategoryUnits(cat);
    
    const res = convertUnits(v, units[t1], units[t2]);
    val2.textContent = res.toLocaleString(undefined, { maximumFractionDigits: 8 });
  };

  catSelect.addEventListener('change', updateOptions);
  [val1, type1, type2].forEach((element) => element.addEventListener('input', updateUnits));

  const t1 = container.querySelector('#temp-val-1');
  const t2 = container.querySelector('#temp-val-2');
  const ty1 = container.querySelector('#temp-type-1');
  const ty2 = container.querySelector('#temp-type-2');

  const updateTemp = () => {
    const v = parseFloat(t1.value) || 0;
    const from = ty1.value;
    const to = ty2.value;
    const res = convertTemp(v, from, to);
    t2.textContent = res.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  [t1, ty1, ty2].forEach((element) => element.addEventListener('input', updateTemp));

  updateOptions();
}

export function unmount() {
  if (container) container.remove();
}
