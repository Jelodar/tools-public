import { calculateCompoundGrowth, calculateLoanPayment, calculateTaxBreakdown } from '../utils/logic.js';

let container = null;

export async function mount(parent) {
  container = document.createElement('div');
  container.className = 'tool-finance';
  container.innerHTML = `
    <div class="card">
      <div class="tabs finance-tabs">
        <button class="tab-btn active" data-tab="loan">Loan Calculator</button>
        <button class="tab-btn" data-tab="compound">Compound Interest</button>
        <button class="tab-btn" data-tab="tax">VAT / Tax</button>
      </div>

      <div id="loan-tab" class="tab-content">
        <div class="settings-grid">
          <div class="form-group">
            <label>Principal Amount</label>
            <input type="number" id="loan-p" value="100000">
          </div>
          <div class="form-group">
            <label>Annual Interest (%)</label>
            <input type="number" id="loan-r" value="5" step="0.1">
          </div>
          <div class="form-group">
            <label>Term (Years)</label>
            <input type="number" id="loan-t" value="30">
          </div>
        </div>
        <div class="finance-result-card">
          <div class="finance-result-label">Estimated Monthly Payment</div>
          <div id="loan-res" class="finance-result-value">$536.82</div>
        </div>
      </div>

      <div id="compound-tab" class="tab-content hidden">
        <div class="settings-grid">
          <div class="form-group">
            <label>Initial Investment</label>
            <input type="number" id="comp-p" value="10000">
          </div>
          <div class="form-group">
            <label>Monthly Contribution</label>
            <input type="number" id="comp-m" value="500">
          </div>
          <div class="form-group">
            <label>Duration (Years)</label>
            <input type="number" id="comp-t" value="10">
          </div>
          <div class="form-group">
            <label>Annual Return (%)</label>
            <input type="number" id="comp-r" value="7" step="0.1">
          </div>
        </div>
        <div class="finance-result-card">
          <div class="finance-result-label">Projected Final Balance</div>
          <div id="comp-res" class="finance-result-value finance-result-value-success">$96,452.12</div>
        </div>
      </div>

      <div id="tax-tab" class="tab-content hidden">
        <div class="settings-grid">
          <div class="form-group">
            <label>Net Amount</label>
            <input type="number" id="tax-net" value="100">
          </div>
          <div class="form-group">
            <label>Tax Rate (%)</label>
            <input type="number" id="tax-rate" value="20">
          </div>
        </div>
        <div class="finance-tax-grid">
          <div class="finance-tax-card">
            <div class="finance-tax-label">TAX AMOUNT</div>
            <div id="tax-val" class="finance-tax-value">$20.00</div>
          </div>
          <div class="finance-tax-card">
            <div class="finance-tax-label">GROSS TOTAL</div>
            <div id="tax-gross" class="finance-tax-value finance-tax-value-success">$120.00</div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  parent.appendChild(container);
  
  const initTabs = () => {
    container.querySelectorAll('.tab-btn').forEach((button) => button.addEventListener('click', () => {
      container.querySelectorAll('.tab-btn').forEach((entry) => entry.classList.remove('active'));
      container.querySelectorAll('.tab-content').forEach((entry) => entry.classList.add('hidden'));
      button.classList.add('active');
      container.querySelector(`#${button.dataset.tab}-tab`).classList.remove('hidden');
    }));
  };

  const updateLoan = () => {
    const p = parseFloat(container.querySelector('#loan-p').value) || 0;
    const r = parseFloat(container.querySelector('#loan-r').value) || 0;
    const t = parseFloat(container.querySelector('#loan-t').value) || 0;
    const payment = calculateLoanPayment(p, r, t);
    container.querySelector('#loan-res').textContent = `$${payment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const updateComp = () => {
    const p = parseFloat(container.querySelector('#comp-p').value) || 0;
    const m = parseFloat(container.querySelector('#comp-m').value) || 0;
    const t = parseFloat(container.querySelector('#comp-t').value) || 0;
    const r = parseFloat(container.querySelector('#comp-r').value) || 0;
    const total = calculateCompoundGrowth(p, m, t, r);
    container.querySelector('#comp-res').textContent = `$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const updateTax = () => {
    const net = parseFloat(container.querySelector('#tax-net').value) || 0;
    const rate = parseFloat(container.querySelector('#tax-rate').value) || 0;
    const breakdown = calculateTaxBreakdown(net, rate);
    container.querySelector('#tax-val').textContent = `$${breakdown.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    container.querySelector('#tax-gross').textContent = `$${breakdown.gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  initTabs();
  ['#loan-p', '#loan-r', '#loan-t'].forEach((id) => container.querySelector(id).addEventListener('input', updateLoan));
  ['#comp-p', '#comp-m', '#comp-t', '#comp-r'].forEach((id) => container.querySelector(id).addEventListener('input', updateComp));
  ['#tax-net', '#tax-rate'].forEach((id) => container.querySelector(id).addEventListener('input', updateTax));

  updateLoan();
  updateComp();
  updateTax();
}

export function unmount() {
  if (container) container.remove();
}
