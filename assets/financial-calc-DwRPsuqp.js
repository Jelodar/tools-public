import{c as u,a as v,b as m}from"./logic-D2DrM3Rx.js";let a=null;async function b(c){a=document.createElement("div"),a.className="tool-finance",a.innerHTML=`
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
  `,c.appendChild(a);const r=()=>{a.querySelectorAll(".tab-btn").forEach(e=>e.addEventListener("click",()=>{a.querySelectorAll(".tab-btn").forEach(t=>t.classList.remove("active")),a.querySelectorAll(".tab-content").forEach(t=>t.classList.add("hidden")),e.classList.add("active"),a.querySelector(`#${e.dataset.tab}-tab`).classList.remove("hidden")}))},i=()=>{const e=parseFloat(a.querySelector("#loan-p").value)||0,t=parseFloat(a.querySelector("#loan-r").value)||0,n=parseFloat(a.querySelector("#loan-t").value)||0,l=u(e,t,n);a.querySelector("#loan-res").textContent=`$${l.toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}`},o=()=>{const e=parseFloat(a.querySelector("#comp-p").value)||0,t=parseFloat(a.querySelector("#comp-m").value)||0,n=parseFloat(a.querySelector("#comp-t").value)||0,l=parseFloat(a.querySelector("#comp-r").value)||0,d=v(e,t,n,l);a.querySelector("#comp-res").textContent=`$${d.toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}`},s=()=>{const e=parseFloat(a.querySelector("#tax-net").value)||0,t=parseFloat(a.querySelector("#tax-rate").value)||0,n=m(e,t);a.querySelector("#tax-val").textContent=`$${n.tax.toLocaleString(void 0,{minimumFractionDigits:2})}`,a.querySelector("#tax-gross").textContent=`$${n.gross.toLocaleString(void 0,{minimumFractionDigits:2})}`};r(),["#loan-p","#loan-r","#loan-t"].forEach(e=>a.querySelector(e).addEventListener("input",i)),["#comp-p","#comp-m","#comp-t","#comp-r"].forEach(e=>a.querySelector(e).addEventListener("input",o)),["#tax-net","#tax-rate"].forEach(e=>a.querySelector(e).addEventListener("input",s)),i(),o(),s()}function f(){a&&a.remove()}export{b as mount,f as unmount};
