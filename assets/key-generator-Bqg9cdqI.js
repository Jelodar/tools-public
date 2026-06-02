import{_ as y}from"./index-C4lglzE7.js";import{s as E,c as k,d as A}from"./ui-utils-CG6aKAAj.js";let t=null;const C=()=>y(()=>import("https://esm.sh/@noble/curves@1.4.0/ed25519"),[]),h=()=>y(()=>import("https://esm.sh/@noble/curves@1.4.0/ed448"),[]),x=()=>y(()=>import("https://esm.sh/@noble/curves@1.4.0/secp256k1"),[]),G={ED25519:C,ED448:h,X25519:C,X448:h,SECP256K1:x},O={ED25519:"ed25519",ED448:"ed448",X25519:"x25519",X448:"x448",SECP256K1:"secp256k1"};async function N(d){t=document.createElement("div"),t.className="tool-key-gen",t.innerHTML=`
    <div class="card rj-layout">
      <div class="settings-grid">
        <div class="form-group">
          <label>Algorithm Family</label>
          <select id="key-algo">
            <optgroup label="Asymmetric Signatures">
              <option value="ED25519">Ed25519</option>
              <option value="ED448">Ed448 (Goldilocks)</option>
              <option value="ECDSA">ECDSA (NIST Curves)</option>
              <option value="SECP256K1">secp256k1 (Koblitz)</option>
              <option value="RSASSA-PKCS1-v1_5">RSASSA-PKCS1</option>
            </optgroup>
            <optgroup label="Key Exchange / Encryption">
              <option value="X25519">X25519 (Montgomery)</option>
              <option value="X448">X448 (Montgomery)</option>
              <option value="RSA-OAEP">RSA-OAEP</option>
            </optgroup>
            <optgroup label="Web Push & Cloud">
              <option value="VAPID">VAPID (Web Push Keys)</option>
            </optgroup>
            <optgroup label="OpenPGP (Standard)">
              <option value="PGP-RSA">OpenPGP RSA</option>
              <option value="PGP-ECC">OpenPGP ECC</option>
            </optgroup>
          </select>
        </div>

        <div class="form-group hidden" id="rsa-options">
          <label>Modulus Strength</label>
          <select id="key-bits">
            <option value="2048">2048 bit</option>
            <option value="3072">3072 bit</option>
            <option value="4096">4096 bit</option>
            <option value="8192">8192 bit</option>
          </select>
        </div>

        <div class="form-group hidden" id="ecdsa-options">
          <label>Curve Selection</label>
          <select id="key-curve">
            <option value="P-256">P-256 (NIST)</option>
            <option value="P-384">P-384 (NIST)</option>
            <option value="P-521">P-521 (NIST)</option>
          </select>
        </div>
      </div>

      <div class="studio-section expanded">
        <div class="studio-section-header">
          <span class="studio-section-title">Generation Options</span>
          <span class="section-toggle-icon">▼</span>
        </div>
        <div class="studio-section-content keygen-options-stack">
          
          <div id="pgp-identity" class="hidden keygen-pgp-identity">
            <label class="keygen-subtle-label">PGP User Identity</label>
            <div class="keygen-identity-grid">
              <input type="text" id="pgp-name" placeholder="Full Name" value="Anonymous">
              <input type="text" id="pgp-email" placeholder="Email Address" value="tools@jelodar.com">
            </div>
          </div>

          <div class="settings-grid">
            <div class="form-group" id="group-format">
              <label>Export Format</label>
              <select id="opt-format">
                <option value="pem">PEM (OpenSSL Standard)</option>
                <option value="ssh" id="opt-format-ssh">OpenSSH (id_rsa style)</option>
                <option value="armored" id="opt-format-armored">ASCII Armored (PGP)</option>
                <option value="raw" id="opt-format-raw">Raw / Base64URL (VAPID Style)</option>
              </select>
            </div>
            <div class="form-group" id="group-passphrase">
              <label>Passphrase Protection</label>
              <input type="password" id="key-passphrase" placeholder="Encrypt private key...">
            </div>
          </div>
        </div>
      </div>
      
      <button id="btn-generate-keys" class="keygen-generate-button">Generate Keys</button>
      
      <div id="keys-result" class="hidden keygen-result">
        <div id="key-metadata" class="keygen-metadata">
          <div class="keygen-metadata-title">Key Details</div>
          <div id="meta-content" class="keygen-metadata-content"></div>
        </div>

        <div class="form-group">
          <label>Public Component</label>
          <textarea id="pub-key" class="keygen-output keygen-output-public" readonly></textarea>
          <div class="keygen-output-actions">
            <button id="btn-copy-pub" class="btn-secondary">Copy Public</button>
            <button id="btn-dl-pub" class="btn-secondary">Download .pub</button>
          </div>
        </div>

        <div class="form-group">
          <label>Private Component</label>
          <textarea id="priv-key" class="keygen-output keygen-output-private" readonly></textarea>
          <div class="keygen-output-actions">
            <button id="btn-copy-priv" class="btn-secondary">Copy Private</button>
            <button id="btn-dl-priv" class="btn-secondary">Download .key</button>
          </div>
        </div>
      </div>
    </div>
  `,d.appendChild(t),T()}function T(){const d=t.querySelector("#key-algo"),f=t.querySelector("#rsa-options"),w=t.querySelector("#ecdsa-options"),D=t.querySelector("#pgp-identity"),c=t.querySelector("#btn-generate-keys"),K=t.querySelector("#keys-result"),_=t.querySelector("#meta-content"),v=t.querySelector("#pub-key"),g=t.querySelector("#priv-key"),u=t.querySelector("#opt-format"),R=t.querySelector("#group-passphrase");t.querySelector(".studio-section-header").onclick=e=>{e.currentTarget.parentElement.classList.toggle("expanded")};const S=()=>{const e=d.value,l=e.includes("RSA"),a=e.startsWith("PGP"),i=e==="ECDSA",s=["ED25519","ED448","X25519","X448","SECP256K1"].includes(e),o=e==="VAPID";f.classList.toggle("hidden",!l),w.classList.toggle("hidden",!i),D.classList.toggle("hidden",!a),t.querySelector("#opt-format-ssh").classList.toggle("hidden",a||o),t.querySelector("#opt-format-armored").classList.toggle("hidden",!a),a?u.value="armored":o||s?u.value="raw":u.value="pem",R.classList.toggle("hidden",o||s)};d.onchange=S,S();const b=e=>btoa(String.fromCharCode(...new Uint8Array(e))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""),m=(e,l)=>{const i=btoa(String.fromCharCode(...new Uint8Array(e))).match(/.{1,64}/g).join(`
`);return`-----BEGIN ${l}-----
${i}
-----END ${l}-----`};c.onclick=async()=>{c.disabled=!0,c.textContent="Generating...";try{const e=d.value,l=t.querySelector("#key-passphrase").value;let a="",i="",s="";if(e.startsWith("PGP")){const o=await y(()=>import("https://cdn.jsdelivr.net/npm/openpgp@5.11.0/dist/openpgp.min.mjs"),[]),{privateKey:r,publicKey:n}=await o.generateKey({type:e==="PGP-RSA"?"rsa":"ecc",rsaBits:e==="PGP-RSA"?parseInt(t.querySelector("#key-bits").value):void 0,curve:e==="PGP-ECC"?"ed25519":void 0,userIDs:[{name:t.querySelector("#pgp-name").value,email:t.querySelector("#pgp-email").value}],passphrase:l});a=n,i=r,s=`Standard: OpenPGP
Fingerprint: ${(await o.readKey({armoredKey:n})).getFingerprint()}
Algorithm: ${e==="PGP-RSA"?"RSA":"Ed25519"}`}else if(e==="VAPID"){const o=await window.crypto.subtle.generateKey({name:"ECDSA",namedCurve:"P-256"},!0,["sign","verify"]),r=await window.crypto.subtle.exportKey("raw",o.publicKey),n=await window.crypto.subtle.exportKey("jwk",o.privateKey);a=b(r),i=n.d,s=`Standard: RFC 8292 (VAPID)
Curve: NIST P-256
Format: URL-Safe Base64`}else if(["ED25519","ED448","X25519","X448","SECP256K1"].includes(e)){const o=await G[e](),r=o[O[e]]||o[e];let n=32;e==="ED448"?n=57:e==="X448"&&(n=56);const p=window.crypto.getRandomValues(new Uint8Array(n)),I=r.getPublicKey(p),P=L=>Array.from(L).map(q=>q.toString(16).padStart(2,"0")).join("");a=P(I),i=P(p),s=`Standard: Noble Curve
Algorithm: ${e}
Strength: ${n*8}-bit entropy`}else{let o;e.startsWith("RSA")?o={name:e,modulusLength:parseInt(t.querySelector("#key-bits").value),publicExponent:new Uint8Array([1,0,1]),hash:"SHA-256"}:o={name:"ECDSA",namedCurve:t.querySelector("#key-curve").value};const r=await window.crypto.subtle.generateKey(o,!0,e.includes("SSA")||e==="ECDSA"?["sign","verify"]:["encrypt","decrypt"]),n=await window.crypto.subtle.exportKey("spki",r.publicKey),p=await window.crypto.subtle.exportKey("pkcs8",r.privateKey);u.value==="raw"?(a=b(n),i=b(p)):(a=m(n,"PUBLIC KEY"),i=m(p,"PRIVATE KEY")),s=`Standard: WebCrypto PKCS#8
Algorithm: ${e}
Strength: ${e.includes("RSA")?o.modulusLength+" bit":o.namedCurve}`}v.value=a,g.value=i,_.innerText=s,K.classList.remove("hidden"),E("Key material generated.","success")}catch(e){E("Error: "+e.message,"danger")}finally{c.disabled=!1,c.textContent="Generate Keys"}},t.querySelector("#btn-copy-pub").onclick=()=>k(v.value),t.querySelector("#btn-copy-priv").onclick=()=>k(g.value),t.querySelector("#btn-dl-pub").onclick=()=>A(v.value,"public_key.key"),t.querySelector("#btn-dl-priv").onclick=()=>A(g.value,"private_key.key")}function U(){t&&t.remove()}export{N as mount,U as unmount};
