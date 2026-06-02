import{d as T,e as C}from"./logic-D2DrM3Rx.js";const b={length:{m:1,mm:.001,cm:.01,km:1e3,in:.0254,ft:.3048,yd:.9144,mi:1609.34},weight:{kg:1,g:.001,mg:1e-6,lb:.453592,oz:.0283495},storage:{B:1,KB:1e3,MB:1e6,GB:1e9,TB:1e12,KiB:1024,MiB:1048576,GiB:1073741824,TiB:1099511627776},typography:{px:1,pt:1.33333,em:16,rem:16}};function g(a){const i=b[a];if(!i)throw new Error(`Unknown unit category: ${a}`);return i}let t=null;async function E(a){t=document.createElement("div"),t.className="tool-units",t.innerHTML=`
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
  `,a.appendChild(t);const i=t.querySelector("#unit-cat"),l=t.querySelector("#unit-type-1"),o=t.querySelector("#unit-type-2"),r=t.querySelector("#unit-val-1"),h=t.querySelector("#unit-val-2"),u=()=>{const e=i.value,s=g(e);l.innerHTML="",o.innerHTML="",Object.keys(s).forEach(n=>{l.add(new Option(n,n)),o.add(new Option(n,n))}),o.selectedIndex=1,p()},p=()=>{const e=i.value,s=parseFloat(r.value)||0,n=l.value,c=o.value,y=g(e),q=T(s,y[n],y[c]);h.textContent=q.toLocaleString(void 0,{maximumFractionDigits:8})};i.addEventListener("change",u),[r,l,o].forEach(e=>e.addEventListener("input",p));const v=t.querySelector("#temp-val-1"),f=t.querySelector("#temp-val-2"),d=t.querySelector("#temp-type-1"),m=t.querySelector("#temp-type-2"),S=()=>{const e=parseFloat(v.value)||0,s=d.value,n=m.value,c=C(e,s,n);f.textContent=c.toLocaleString(void 0,{maximumFractionDigits:2})};[v,d,m].forEach(e=>e.addEventListener("input",S)),u()}function B(){t&&t.remove()}export{E as mount,B as unmount};
