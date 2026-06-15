import{_ as E}from"./index-notwamio.js";import{s as O,c as H,d as K}from"./ui-utils-CG6aKAAj.js";import{a as R}from"./ui-monaco-DnB_Gdp7.js";let r=null,w=null,y=null;const A={alg:"HS256",typ:"JWT"},I={sub:"1234567890",name:"John Doe",iat:Math.floor(Date.now()/1e3)},U={language:"json",wordWrap:"on",tabSize:2,insertSpaces:!0,folding:!0,renderWhitespace:"selection",matchBrackets:"always",bracketPairColorization:{enabled:!0},guides:{bracketPairs:!0,indentation:!0},quickSuggestions:{other:!0,comments:!1,strings:!0},suggestOnTriggerCharacters:!0,selectionHighlight:!0,occurrencesHighlight:"singleFile",colorDecorators:!0,stickyScroll:{enabled:!1}};function p(t){return String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function P(t,s){if(!t)throw new Error(`Missing ${s} segment`);const n=t.replace(/-/g,"+").replace(/_/g,"/"),i=n.padEnd(Math.ceil(n.length/4)*4,"=");try{const u=atob(i),o=Uint8Array.from(u,m=>m.charCodeAt(0));return new TextDecoder().decode(o)}catch{throw new Error(`${s} segment is not valid base64url`)}}function C(t){const s=new TextEncoder().encode(t);let n="";return s.forEach(i=>{n+=String.fromCharCode(i)}),btoa(n).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}function M(t){return{...U,value:t}}function $(t,s,n=`${s}s`){return`${t} ${t===1?s:n}`}function z(t){if(Array.isArray(t))return"Array";if(t===null)return"Null";if(Number.isInteger(t))return"Integer";const s=typeof t;return s==="number"?"Number":s==="boolean"?"Boolean":s==="object"?"Object":"String"}function F(t,s=72){const n=String(t??"");if(n.length<=s)return n;const i=Math.max(8,Math.floor((s-3)/2));return`${n.slice(0,i)}...${n.slice(-i)}`}function v(t){const s=Math.abs(t),n=[["day",86400],["hour",3600],["minute",60],["second",1]],[i,u]=n.find(([,m])=>s>=m)||n.at(-1),o=Math.max(1,Math.round(s/u));return`${o} ${i}${o===1?"":"s"}`}function G(t,s,n){if(!["exp","iat","nbf"].includes(t)||!Number.isFinite(Number(s)))return null;const i=Number(s),o=new Date(i*1e3).toLocaleString();if(t==="exp"){const m=i<n;return{copy:m?"Expired":"Valid",tone:m?"danger":"success",detail:m?`${v(n-i)} ago`:`Expires in ${v(i-n)}`,dateText:o}}if(t==="nbf"){const m=i>n;return{copy:m?"Pending":"Active",tone:m?"warning":"success",detail:m?`Starts in ${v(i-n)}`:`Active for ${v(n-i)}`,dateText:o}}return{copy:"Issued",tone:"neutral",detail:i>n?`In ${v(i-n)}`:`${v(n-i)} ago`,dateText:o}}function B(t){const s=JSON.stringify(t,null,2),n=/"(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*"|true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;return s.replace(n,(i,u)=>{let o="jwt-json-number";return i.startsWith('"')&&i.endsWith('"')?o=s.slice(u+i.length).trimStart().startsWith(":")?"jwt-json-key":"jwt-json-string":i==="true"||i==="false"?o="jwt-json-boolean":i==="null"&&(o="jwt-json-null"),`<span class="${o}">${p(i)}</span>`})}function X(t,s){return s?`
      <span class="jwt-claim-scalar jwt-claim-date">${p(s.dateText)}</span>
      <span class="jwt-claim-raw">${p(String(t))}</span>
      <span class="jwt-claim-detail">${p(s.detail)}</span>
    `:typeof t=="object"&&t!==null?`<pre class="jwt-json-preview">${B(t)}</pre>`:`<span class="jwt-claim-scalar jwt-claim-${p(t===null?"null":typeof t)}">${p(t===null?"null":String(t))}</span>`}function V(t){const s=Object.keys(t||{}),n=[`JSON ${$(s.length,"key")}`,`alg ${(t==null?void 0:t.alg)||"none"}`,`typ ${(t==null?void 0:t.typ)||"none"}`];return t!=null&&t.kid&&n.push(`kid ${t.kid}`),n}function _(t){const s=Object.keys(t||{}),n=s.filter(u=>["exp","iat","nbf"].includes(u)).length,i=[`JSON ${$(s.length,"claim")}`];return n&&i.push($(n,"time claim")),t!=null&&t.iss&&i.push(`iss ${t.iss}`),t!=null&&t.aud&&i.push(`aud ${Array.isArray(t.aud)?t.aud.join(", "):t.aud}`),i}function x(t){return t.filter(s=>s!=null&&String(s).trim()).map(s=>`<span>${p(s)}</span>`).join("")}function Y(t,s,n,i={}){const u=t[2]||"",o=i.unsignedPreview?"Unsigned preview":u?`${u.length} chars`:"Missing";return[{className:"jwt-segment-header",number:"1",title:"Header",kind:"JSON",summary:V(s).join(" · "),code:t[0]||""},{className:"jwt-segment-payload",number:"2",title:"Payload",kind:"Claims",summary:_(n).join(" · "),code:t[1]||""},{className:"jwt-segment-signature",number:"3",title:"Signature",kind:i.unsignedPreview?"Preview":"JWS",summary:o,code:u||"Not present"}].map(j=>`
    <div class="jwt-segment-pill ${j.className}">
      <div class="jwt-segment-top">
        <span class="jwt-segment-index">${j.number}</span>
        <span class="jwt-segment-title">${p(j.title)}</span>
        <span class="jwt-segment-kind">${p(j.kind)}</span>
      </div>
      <div class="jwt-segment-summary">${p(j.summary)}</div>
      <code>${p(F(j.code))}</code>
    </div>
  `).join("")}async function at(t){r=document.createElement("div"),r.className="tool-jwt",r.innerHTML=`
    <div class="card rj-layout">
      <div class="jwt-grid">
        <div class="jwt-column">
          <div class="form-group jwt-encoded-group">
            <label>Encoded Token (Paste to Decode / Updates when editing right)</label>
            <textarea id="jwt-input" class="jwt-token-input" placeholder="xxxxx.yyyyy.zzzzz"></textarea>
          </div>

          <div id="jwt-segment-map" class="jwt-segment-map hidden"></div>

          <div class="studio-section expanded">
            <div class="studio-section-header">
              <span class="studio-section-title">Signature & Verification</span>
            </div>
            <div class="studio-section-content jwt-section-content">
              <div class="form-group">
                <label>Secret or Key (HMAC Secret / RSA/EC PEM / JWK)</label>
                <textarea id="jwt-key" class="jwt-key-input" placeholder="Enter secret or paste private/public key..."></textarea>
              </div>
              <div id="sig-status" class="jwt-status jwt-status-neutral">
                NO KEY PROVIDED
              </div>
              <div class="jwt-action-row">
                <button id="btn-verify" class="btn-secondary jwt-action-btn">Verify Signature</button>
                <button id="btn-sign" class="jwt-action-btn">Sign / Update</button>
              </div>
            </div>
          </div>
        </div>

        <div class="jwt-column">
          <div class="tabs-header jwt-tabs">
            <button class="tab-btn active" data-tab="decoded">Decoded View</button>
            <button class="tab-btn" data-tab="analysis">Claim Analysis</button>
            <button class="tab-btn" data-tab="keys">Key Toolkit</button>
          </div>

          <div id="tab-decoded" class="tab-content jwt-decoded-tab">
            <div class="form-group jwt-editor-card-short">
              <div class="jwt-editor-heading">
                <label class="jwt-header-label">Header: Algorithm & Token Type</label>
                <div id="jwt-header-meta" class="jwt-editor-meta"></div>
              </div>
              <div id="monaco-jwt-header" class="jwt-monaco-fill"></div>
            </div>
            <div class="form-group jwt-editor-card-fill">
              <div class="jwt-editor-heading">
                <label class="jwt-payload-label">Payload: Data & Claims</label>
                <div id="jwt-payload-meta" class="jwt-editor-meta"></div>
              </div>
              <div id="monaco-jwt-payload" class="jwt-monaco-fill"></div>
            </div>
          </div>

          <div id="tab-analysis" class="tab-content hidden jwt-surface">
            <div id="analysis-list" class="jwt-analysis-list">
              <div class="jwt-empty">Input a token to analyze claims...</div>
            </div>
          </div>

          <div id="tab-keys" class="tab-content hidden jwt-surface">
             <div class="form-group">
                <label>Convert Key Format</label>
                <div class="jwt-key-stack">
                  <button id="btn-jwk-to-pem" class="btn-secondary">JWK to PEM</button>
                  <button id="btn-pem-to-jwk" class="btn-secondary">PEM to JWK</button>
                  <div class="jwt-key-hint">Result will be shown in the Key field on the left.</div>
                </div>
             </div>
          </div>

          <div class="jwt-footer-row">
            <button id="btn-copy-decoded" class="btn-secondary jwt-grow-btn">Copy Decoded</button>
            <button id="btn-dl-decoded" class="btn-secondary jwt-grow-btn">Export JSON</button>
          </div>
        </div>

      </div>
    </div>
  `,t.appendChild(r);const s=r.querySelector("#jwt-input"),n=r.querySelector("#jwt-key"),i=r.querySelector("#sig-status"),u=r.querySelector("#analysis-list"),o=r.querySelector("#jwt-segment-map"),m=r.querySelector("#jwt-header-meta"),j=r.querySelector("#jwt-payload-meta"),b=(e,a="neutral")=>{i.textContent=e,i.className=`jwt-status jwt-status-${a}`},f=(e=A,a=I)=>{m.innerHTML=x(V(e)),j.innerHTML=x(_(a))},T=(e,a,d,c={})=>{o.innerHTML=Y(e,a,d,c),o.classList.remove("hidden")},k=()=>{o.innerHTML="",o.classList.add("hidden")},L=e=>{b(`DECODE ERROR: ${e.message.toUpperCase()}`,"invalid"),k(),u.innerHTML='<div class="jwt-empty">Token could not be decoded.</div>'};f(),w=(await R(r.querySelector("#monaco-jwt-header"),M(JSON.stringify(A,null,2)))).editor,y=(await R(r.querySelector("#monaco-jwt-payload"),M(JSON.stringify(I,null,2)))).editor,s.addEventListener("input",()=>q(s.value)),w.onDidChangeModelContent(()=>{S||D()}),y.onDidChangeModelContent(()=>{S||D()});let S=!1;const q=e=>{if(!e.trim()){k(),f(),u.innerHTML='<div class="jwt-empty">Input a token to analyze claims...</div>',b("NO TOKEN PROVIDED","neutral");return}S=!0;try{const a=e.trim().split(".");if(a.length<2)throw new Error("Incomplete JWT structure");const d=P(a[0],"Header"),c=P(a[1],"Payload"),l=JSON.parse(d),g=JSON.parse(c);w.setValue(JSON.stringify(l,null,2)),y.setValue(JSON.stringify(g,null,2)),f(l,g),T(a,l,g),J(g),b(a[2]?"SIGNATURE PRESENT - AWAITING VERIFICATION":"NO SIGNATURE SEGMENT - DECODED HEADER/PAYLOAD","neutral")}catch(a){L(a)}finally{S=!1}},D=()=>{try{const e=JSON.parse(w.getValue()),a=JSON.parse(y.getValue()),d=C(w.getValue()),c=C(y.getValue());s.value=`${d}.${c}.[Signature]`,f(e,a),T([d,c,"[Signature]"],e,a,{unsignedPreview:!0}),J(a),b("UNSIGNED TOKEN PREVIEW","neutral")}catch(e){b(`EDIT ERROR: ${e.message.toUpperCase()}`,"invalid")}},J=e=>{let a="";const d=Math.floor(Date.now()/1e3),c={iss:"Issuer",sub:"Subject",aud:"Audience",exp:"Expiration Time",nbf:"Not Before",iat:"Issued At",jti:"JWT ID"};Object.entries(e).forEach(([l,g])=>{const N=c[l]||l,h=G(l,g,d),W=h?`<span class="jwt-claim-state jwt-claim-state-${h.tone}">${p(h.copy)}</span>`:"";a+=`
        <div class="jwt-claim-row" data-claim="${p(l)}">
          <div class="jwt-claim-top">
            <div class="jwt-claim-label">${p(N)} <span>(${p(l)})</span></div>
            <div class="jwt-claim-badges">
              <span class="jwt-claim-type">${p(z(g))}</span>
              ${W}
            </div>
          </div>
          <div class="jwt-claim-value">${X(g,h)}</div>
        </div>
      `}),u.innerHTML=a||'<div class="jwt-empty">No standard claims found.</div>'};r.querySelector("#btn-verify").onclick=async()=>{try{const e=await E(()=>import("https://esm.sh/jose@5.2.3"),[]),a=n.value.trim(),d=s.value.trim();if(!a)throw new Error("Key required for verification");let c;const l=JSON.parse(w.getValue()).alg;if(l.startsWith("HS"))c=new TextEncoder().encode(a);else try{a.startsWith("{")?c=await e.importJWK(JSON.parse(a),l):c=await e.importSPKI(a,l)}catch{c=await e.importX509(a,l)}await e.jwtVerify(d,c),b("SIGNATURE VERIFIED","valid")}catch(e){b("INVALID SIGNATURE: "+e.message.toUpperCase(),"invalid")}},r.querySelector("#btn-sign").onclick=async()=>{try{const e=await E(()=>import("https://esm.sh/jose@5.2.3"),[]),a=n.value.trim();if(!a)throw new Error("Secret/Private Key required to sign");const d=JSON.parse(w.getValue()),c=JSON.parse(y.getValue()),l=d.alg;let g;l.startsWith("HS")?g=new TextEncoder().encode(a):a.startsWith("{")?g=await e.importJWK(JSON.parse(a),l):g=await e.importPKCS8(a,l);const N=await new e.SignJWT(c).setProtectedHeader(d).sign(g);s.value=N,b("TOKEN SIGNED & UPDATED","signed")}catch(e){O("Signing error: "+e.message,"danger")}},r.querySelector("#btn-jwk-to-pem").onclick=async()=>{const e=await E(()=>import("https://esm.sh/jose@5.2.3"),[]);try{const a=JSON.parse(n.value),d=await e.importJWK(a,a.alg||"RS256"),c=await e.exportSPKI(d);n.value=c}catch(a){O("Conversion error: "+a.message,"danger")}},r.querySelector("#btn-pem-to-jwk").onclick=async()=>{const e=await E(()=>import("https://esm.sh/jose@5.2.3"),[]);try{const a=n.value,d=await e.importSPKI(a,"RS256"),c=await e.exportJWK(d);n.value=JSON.stringify(c,null,2)}catch(a){O("Conversion error: "+a.message,"danger")}},r.querySelectorAll(".tab-btn").forEach(e=>{e.onclick=()=>{r.querySelectorAll(".tab-btn").forEach(a=>a.classList.remove("active")),r.querySelectorAll(".tab-content").forEach(a=>a.classList.add("hidden")),e.classList.add("active"),r.querySelector(`#tab-${e.dataset.tab}`).classList.remove("hidden"),e.dataset.tab==="decoded"&&(w.layout(),y.layout())}}),r.querySelector("#btn-copy-decoded").onclick=()=>{try{const e={header:JSON.parse(w.getValue()),payload:JSON.parse(y.getValue())};H(JSON.stringify(e,null,2))}catch(e){b(`EXPORT ERROR: ${e.message.toUpperCase()}`,"invalid")}},r.querySelector("#btn-dl-decoded").onclick=()=>{try{const e={header:JSON.parse(w.getValue()),payload:JSON.parse(y.getValue())};K(JSON.stringify(e,null,2),"jwt_decoded.json","application/json")}catch(e){b(`EXPORT ERROR: ${e.message.toUpperCase()}`,"invalid")}}}function nt(){w&&w.dispose(),y&&y.dispose(),r&&r.remove()}export{at as mount,nt as unmount};
