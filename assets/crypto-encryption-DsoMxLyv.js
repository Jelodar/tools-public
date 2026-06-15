import{_ as m}from"./index-B6SKL95y.js";import{c as _,d as x}from"./ui-utils-CG6aKAAj.js";typeof window.process>"u"&&(window.process={env:{NODE_ENV:"production"}});let t=null;async function K(h){t=document.createElement("div"),t.className="tool-crypto",t.innerHTML=`
    <div class="card rj-layout">
      <div class="settings-grid">
        <div class="form-group" id="group-pass">
          <label>Passphrase / Secret Key</label>
          <input type="password" id="crypto-pass" placeholder="Use a strong local passphrase">
          <div class="info-hint">A strong passphrase with 12+ characters protects local encryption.</div>
        </div>
        <div class="form-group hidden" id="group-keys">
          <label>Asymmetric Keys (PEM/Armored)</label>
          <textarea id="crypto-keys" class="crypto-key-textarea" placeholder="Paste RSA/PGP Public or Private key..."></textarea>
          <div class="info-hint">RSA-OAEP or PGP keys in standard PEM/Armored format.</div>
        </div>
        <div class="form-group">
          <label>Algorithm Subset</label>
          <select id="crypto-mode">
            <optgroup label="Standard (WebCrypto)">
              <option value="AES-GCM" data-tooltip="Standard for modern security; includes data authentication.">AES-256-GCM (Authenticated)</option>
              <option value="AES-CBC" data-tooltip="Legacy mode; fast but lacks built-in integrity checking.">AES-256-CBC (Legacy)</option>
              <option value="AES-CTR" data-tooltip="Streaming mode; ideal for processing large files.">AES-256-CTR (Streaming)</option>
              <option value="RSA-OAEP" data-tooltip="Public-key encryption for secure message exchange.">RSA-OAEP (Public Key)</option>
            </optgroup>
            <optgroup label="Modern (Noble/Ciphers)">
              <option value="CHACHA20" data-tooltip="Optimized for CPUs without AES hardware acceleration.">ChaCha20-Poly1305</option>
              <option value="SALSA20" data-tooltip="High-speed stream cipher predecessor to ChaCha20.">Salsa20</option>
            </optgroup>
            <optgroup label="OpenPGP (RFC 4880)">
              <option value="PGP-S" data-tooltip="Standard PGP symmetric encryption using a passphrase.">PGP Symmetric</option>
              <option value="PGP-K" data-tooltip="Key-based PGP encryption using a public key.">PGP Key-Based</option>
            </optgroup>
          </select>
          <div class="info-hint">Choose AES-GCM for most use cases, or OpenPGP for email security.</div>
        </div>
      </div>

      <div class="studio-section expanded">
        <div class="studio-section-header">
          <span class="studio-section-title">Security & Output Options</span>
          <span class="section-toggle-icon">▼</span>
        </div>
        <div class="studio-section-content">
          <div class="settings-grid">
            <div class="form-group">
              <label>Output Encoding</label>
              <select id="opt-encoding">
                <option value="base64" data-tooltip="Standard URL-safe character set.">Base64 (Standard)</option>
                <option value="hex" data-tooltip="Raw hexadecimal string representation.">Hex (Raw Hexadecimal)</option>
                <option value="armored" id="opt-encoding-armored" data-tooltip="Text-based PGP format with headers.">ASCII Armored (PGP Style)</option>
              </select>
              <div class="info-hint">Determines how the binary cipher data is represented as text.</div>
            </div>
            <div class="form-group" id="group-iterations">
              <label>PBKDF2 Iterations</label>
              <select id="opt-iterations">
                <option value="100000" data-tooltip="Balanced performance.">100,000 (Fast)</option>
                <option value="250000" selected data-tooltip="Recommended default.">250,000 (Secure)</option>
                <option value="600000" data-tooltip="Higher work factor for slower brute-force attempts.">600,000 (High)</option>
                <option value="1000000" data-tooltip="Slowest local setting.">1,000,000 (Maximum)</option>
              </select>
              <div class="info-hint">Higher iterations make it harder for attackers to guess your password.</div>
            </div>
          </div>
        </div>
      </div>

      <div class="form-group crypto-plain-group">
        <label>Plaintext Context</label>
        <textarea id="crypto-plain" class="crypto-textarea" placeholder="Enter text to encrypt..."></textarea>
        <button id="btn-encrypt" class="crypto-run-button">Encrypt</button>
      </div>

      <div class="form-group">
        <label>Ciphertext Result</label>
        <textarea id="crypto-cipher" class="crypto-textarea crypto-cipher-textarea" placeholder="Enter payload to decrypt..."></textarea>
        <button id="btn-decrypt" class="btn-secondary crypto-run-button">Decrypt</button>
      </div>

      <div class="crypto-actions">
        <button id="btn-copy-cipher" class="crypto-action">Copy Payload</button>
        <button id="btn-dl-cipher" class="btn-secondary crypto-action">Download Binary</button>
      </div>

      <div id="crypto-status" class="crypto-status">Status: Awaiting Input</div>
    </div>
  `,h.appendChild(t),T()}function T(){const h=t.querySelector("#crypto-mode"),f=t.querySelector("#group-pass"),b=t.querySelector("#group-keys"),C=t.querySelector("#group-iterations"),R=t.querySelector("#opt-encoding-armored"),w=t.querySelector("#opt-encoding"),v=t.querySelector("#crypto-status");t.querySelector(".studio-section-header").onclick=e=>{e.currentTarget.parentElement.classList.toggle("expanded")};const A=()=>{const e=h.value,r=e==="PGP-K"||e==="RSA-OAEP",s=e.startsWith("PGP");f.classList.toggle("hidden",r),b.classList.toggle("hidden",!r),C.classList.toggle("hidden",r),R.classList.toggle("hidden",!s),s?w.value="armored":w.value==="armored"&&(w.value="base64")};h.onchange=A,A();const S=e=>w.value==="hex"?Array.from(e).map(s=>s.toString(16).padStart(2,"0")).join(""):btoa(String.fromCharCode(...e)),P=e=>{if(w.value==="hex")return new Uint8Array(e.match(/.{1,2}/g).map(i=>parseInt(i,16)));const s=e.replace(/[^A-Za-z0-9+/=]/g,"");return new Uint8Array(atob(s).split("").map(i=>i.charCodeAt(0)))},E=async(e,r,s)=>{const i=new TextEncoder,o=parseInt(t.querySelector("#opt-iterations").value),c=await window.crypto.subtle.importKey("raw",i.encode(e),"PBKDF2",!1,["deriveKey"]);return window.crypto.subtle.deriveKey({name:"PBKDF2",salt:r,iterations:o,hash:"SHA-256"},c,{name:s.includes("CBC")?"AES-CBC":s.includes("CTR")?"AES-CTR":"AES-GCM",length:256},!1,["encrypt","decrypt"])};t.querySelector("#btn-encrypt").onclick=async()=>{try{const e=h.value,r=t.querySelector("#crypto-plain").value,s=t.querySelector("#crypto-pass").value,i=t.querySelector("#crypto-keys").value;if(!r)return;if(v.textContent="STATUS: COMPUTING...",e.startsWith("PGP")){const o=await m(()=>import("https://cdn.jsdelivr.net/npm/openpgp@5.11.0/dist/openpgp.min.mjs"),[]),c=await o.createMessage({text:r}),a=w.value==="armored"?"armored":"binary";let n;if(e==="PGP-S"){if(!s)throw new Error("Passphrase is required for PGP Symmetric mode");n=await o.encrypt({message:c,passwords:[s],format:a})}else{if(!i||!i.includes("BEGIN PGP PUBLIC KEY"))throw new Error("Valid PGP Public Key is required");n=await o.encrypt({message:c,encryptionKeys:await o.readKey({armoredKey:i}),format:a})}t.querySelector("#crypto-cipher").value=typeof n=="string"?n:S(n)}else if(e==="CHACHA20"||e==="SALSA20"){const{chacha20poly1305:o}=await m(async()=>{const{chacha20poly1305:u}=await import("https://esm.sh/@noble/ciphers@0.5.3/chacha");return{chacha20poly1305:u}},[]),{salsa20:c}=await m(async()=>{const{salsa20:u}=await import("https://esm.sh/@noble/ciphers@0.5.3/salsa");return{salsa20:u}},[]),{sha256:a}=await m(async()=>{const{sha256:u}=await import("https://esm.sh/@noble/hashes@1.3.1/sha256");return{sha256:u}},[]),n=a(new TextEncoder().encode(s)),l=window.crypto.getRandomValues(new Uint8Array(e==="CHACHA20"?12:8)),d=new TextEncoder().encode(r);let p;e==="CHACHA20"?p=o(n,l).encrypt(d):p=c(n,l,d);const y=new Uint8Array(l.length+p.length);y.set(l),y.set(p,l.length),t.querySelector("#crypto-cipher").value=S(y)}else if(e==="RSA-OAEP"){if(!i)throw new Error("RSA Public Key is required");const o=i.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\n|\r/g,"").trim(),c=await window.crypto.subtle.importKey("spki",P(o),{name:"RSA-OAEP",hash:"SHA-256"},!1,["encrypt"]),a=await window.crypto.subtle.encrypt({name:"RSA-OAEP"},c,new TextEncoder().encode(r));t.querySelector("#crypto-cipher").value=S(new Uint8Array(a))}else{const o=window.crypto.getRandomValues(new Uint8Array(16)),c=e==="AES-GCM"?12:16,a=window.crypto.getRandomValues(new Uint8Array(c)),n=await E(s,o,e),l={name:e,iv:a};e==="AES-CTR"&&(l.counter=a,l.length=64);const d=await window.crypto.subtle.encrypt(l,n,new TextEncoder().encode(r)),p=new Uint8Array(o.length+a.length+d.byteLength);p.set(o,0),p.set(a,16),p.set(new Uint8Array(d),16+a.length),t.querySelector("#crypto-cipher").value=S(p)}v.textContent="STATUS: ENCRYPTION COMPLETE"}catch(e){v.textContent=`ERROR: ${e.message}`}},t.querySelector("#btn-decrypt").onclick=async()=>{try{const e=h.value,r=t.querySelector("#crypto-cipher").value,s=t.querySelector("#crypto-pass").value,i=t.querySelector("#crypto-keys").value;if(!r)return;if(v.textContent="STATUS: DECRYPTING...",e.startsWith("PGP")){const o=await m(()=>import("https://cdn.jsdelivr.net/npm/openpgp@5.11.0/dist/openpgp.min.mjs"),[]),n={message:await(r.includes("-----BEGIN PGP")?o.readMessage({armoredMessage:r}):o.readMessage({binaryMessage:P(r)}))};if(e==="PGP-S"){if(!s)throw new Error("Passphrase is required for decryption");n.passwords=[s]}else{if(!i||!i.includes("BEGIN PGP PRIVATE KEY"))throw new Error("Valid PGP Private Key is required");n.decryptionKeys=await o.readPrivateKey({armoredKey:i})}const{data:l}=await o.decrypt(n);t.querySelector("#crypto-plain").value=l}else if(e==="CHACHA20"||e==="SALSA20"){const{chacha20poly1305:o}=await m(async()=>{const{chacha20poly1305:g}=await import("https://esm.sh/@noble/ciphers@0.5.3/chacha");return{chacha20poly1305:g}},[]),{salsa20:c}=await m(async()=>{const{salsa20:g}=await import("https://esm.sh/@noble/ciphers@0.5.3/salsa");return{salsa20:g}},[]),{sha256:a}=await m(async()=>{const{sha256:g}=await import("https://esm.sh/@noble/hashes@1.3.1/sha256");return{sha256:g}},[]),n=P(r),l=e==="CHACHA20"?12:8,d=n.slice(0,l),p=n.slice(l),y=a(new TextEncoder().encode(s));let u;e==="CHACHA20"?u=o(y,d).decrypt(p):u=c(y,d,p),t.querySelector("#crypto-plain").value=new TextDecoder().decode(u)}else if(e==="RSA-OAEP"){if(!i)throw new Error("RSA Private Key is required");const o=i.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n|\r/g,"").trim(),c=await window.crypto.subtle.importKey("pkcs8",P(o),{name:"RSA-OAEP",hash:"SHA-256"},!1,["decrypt"]),a=await window.crypto.subtle.decrypt({name:"RSA-OAEP"},c,P(r));t.querySelector("#crypto-plain").value=new TextDecoder().decode(a)}else{const o=P(r),c=o.slice(0,16),a=e==="AES-GCM"?12:16,n=o.slice(16,16+a),l=o.slice(16+a),d=await E(s,c,e),p={name:e,iv:n};e==="AES-CTR"&&(p.counter=n,p.length=64);const y=await window.crypto.subtle.decrypt(p,d,l);t.querySelector("#crypto-plain").value=new TextDecoder().decode(y)}v.textContent="STATUS: DECRYPTING SUCCESSFUL"}catch(e){v.textContent=`ERROR: ${e.message}`}},t.querySelector("#btn-copy-cipher").onclick=()=>_(t.querySelector("#crypto-cipher").value),t.querySelector("#btn-dl-cipher").onclick=()=>x(t.querySelector("#crypto-cipher").value,"encrypted.dat")}function I(){t&&t.remove()}export{K as mount,I as unmount};
