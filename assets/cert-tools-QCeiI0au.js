import{_ as n}from"./index-B6SKL95y.js";import{d,s as o}from"./ui-utils-CG6aKAAj.js";let e=null;function u(i){return String(i??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}async function S(i){e=document.createElement("div"),e.className="tool-certs",e.innerHTML=`
    <div class="card">
      <div class="tabs cert-tabs">
        <button class="tab-btn active" data-tab="inspect">Inspector</button>
        <button class="tab-btn" data-tab="build">CSR Builder</button>
      </div>

      <div id="inspect-tab" class="tab-content">
        <div class="form-group">
          <label>Certificate / CSR (PEM)</label>
          <textarea id="cert-input" class="cert-pem-input" placeholder="-----BEGIN CERTIFICATE-----..."></textarea>
        </div>
        <button id="btn-cert-inspect" class="cert-full-button cert-inspect-button">Inspect Metadata</button>
        
        <div id="cert-results" class="hidden cert-results">
          <table class="cert-results-table">
            <tbody id="cert-details-body"></tbody>
          </table>
        </div>
      </div>

      <div id="build-tab" class="tab-content hidden">
        <div class="settings-grid">
          <div class="form-group"><label>Common Name (CN)</label><input type="text" id="csr-cn" placeholder="example.com"></div>
          <div class="form-group"><label>Organization (O)</label><input type="text" id="csr-o" placeholder="Acme Corp"></div>
          <div class="form-group"><label>Country (C)</label><input type="text" id="csr-c" placeholder="US" maxlength="2"></div>
          <div class="form-group"><label>State (ST)</label><input type="text" id="csr-st" placeholder="California"></div>
        </div>
        <button id="btn-csr-generate" class="cert-full-button cert-build-button">Generate CSR & Private Key</button>
        
        <div id="csr-results" class="hidden csr-results">
          <div class="form-group">
            <label>Generated CSR (PEM)</label>
            <textarea id="csr-out" class="csr-output" readonly></textarea>
            <button id="btn-dl-csr" class="btn-secondary cert-download-button">Download .csr</button>
          </div>
          <div class="form-group">
            <label>Associated Private Key</label>
            <textarea id="csr-key-out" class="csr-output" readonly></textarea>
            <button id="btn-dl-csr-key" class="btn-secondary cert-download-button">Download .key</button>
          </div>
        </div>
      </div>
    </div>
  `,i.appendChild(e);const b=()=>{e.querySelectorAll(".tab-btn").forEach(a=>a.addEventListener("click",()=>{e.querySelectorAll(".tab-btn").forEach(t=>t.classList.remove("active")),e.querySelectorAll(".tab-content").forEach(t=>t.classList.add("hidden")),a.classList.add("active"),e.querySelector(`#${a.dataset.tab}-tab`).classList.remove("hidden")}))},v=async()=>{const a=e.querySelector("#cert-input").value.trim();if(a)try{const{default:t}=await n(async()=>{const{default:s}=await import("https://esm.sh/node-forge@1.3.1");return{default:s}},[]),l=[],r=(s,c)=>{l.push(`
          <tr class="cert-detail-row">
            <td class="cert-detail-label">${u(s)}</td>
            <td class="cert-detail-value">${u(c)}</td>
          </tr>
        `)};if(a.includes("CERTIFICATE REQUEST")){const s=t.pki.certificationRequestFromPem(a);r("Type","CSR (Signing Request)"),r("Subject",s.subject.attributes.map(c=>`${c.shortName}=${c.value}`).join(", "))}else{const s=t.pki.certificateFromPem(a);r("Type","X.509 Certificate"),r("Subject",s.subject.attributes.map(c=>`${c.shortName}=${c.value}`).join(", ")),r("Issuer",s.issuer.attributes.map(c=>`${c.shortName}=${c.value}`).join(", ")),r("Valid From",s.validity.notBefore),r("Valid To",s.validity.notAfter),r("Serial",s.serialNumber)}e.querySelector("#cert-details-body").innerHTML=l.join(""),e.querySelector("#cert-results").classList.remove("hidden")}catch(t){o("Parse error: "+t.message,"danger")}},p=async()=>{const a=e.querySelector("#btn-csr-generate");a.disabled=!0,a.textContent="Generating RSA-2048...";try{const{default:t}=await n(async()=>{const{default:s}=await import("https://esm.sh/node-forge@1.3.1");return{default:s}},[]),l=t.pki.rsa.generateKeyPair(2048),r=t.pki.createCertificationRequest();r.publicKey=l.publicKey,r.setSubject([{shortName:"CN",value:e.querySelector("#csr-cn").value||"localhost"},{shortName:"C",value:e.querySelector("#csr-c").value||"US"},{shortName:"ST",value:e.querySelector("#csr-st").value||"State"},{shortName:"O",value:e.querySelector("#csr-o").value||"Organization"}]),r.sign(l.privateKey),e.querySelector("#csr-out").value=t.pki.certificationRequestToPem(r),e.querySelector("#csr-key-out").value=t.pki.privateKeyToPem(l.privateKey),e.querySelector("#csr-results").classList.remove("hidden"),o("CSR and private key generated.","success")}catch(t){o(t.message,"danger")}finally{a.disabled=!1,a.textContent="Generate CSR & Private Key"}};b(),e.querySelector("#btn-cert-inspect").addEventListener("click",v),e.querySelector("#btn-csr-generate").addEventListener("click",p),e.querySelector("#btn-dl-csr").addEventListener("click",()=>d(e.querySelector("#csr-out").value,"request.csr")),e.querySelector("#btn-dl-csr-key").addEventListener("click",()=>d(e.querySelector("#csr-key-out").value,"private.key"))}function f(){e&&e.remove()}export{S as mount,f as unmount};
