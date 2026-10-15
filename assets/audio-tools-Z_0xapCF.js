import{s as K,r as ze,c as De,d as Ve,b as Ge}from"./audio-trim-processing-CMMEA2WQ.js";import{b as _e,s as B}from"./media-session-BHNa2ppJ.js";import{d as je}from"./ui-utils-BycjcbQ0.js";import{g as ae,e as qe}from"./index-ATPg-6Fd.js";function We({startHz:n=20,endHz:t=2e4,durationSeconds:p=10,mode:i="linear"}={}){let s=Math.max(1,Number(n)||20),a=Math.max(1,Number(t)||2e4);a<s&&([s,a]=[a,s]);const c=Math.max(.5,Number(p)||1),f=i==="logarithmic"&&s>0?"logarithmic":"linear",M=Math.max(1e-6,c);return{startHz:s,endHz:a,durationSeconds:c,mode:f,frequencyAt:w=>{const h=Math.max(0,Math.min(c,Number(w)||0))/M;return f==="logarithmic"?s*Math.pow(a/s,h):s+(a-s)*h}}}function Ue(n,{bpm:t=120,beatsPerBar:p=4}={}){const i=Math.max(1,Number(t)||120),s=Math.max(1,Math.floor(Number(p)||4)),a=Math.max(0,Math.floor(Number(n)||0));return{beatInBar:a%s,isAccent:a%s===0,secondsPerBeat:60/i}}const Xe=new Set(["in-phase","out-of-phase","left-only","right-only","mono"]);function xe(n="in-phase",{level:t=1,frequencyHz:p=440}={}){const i=Xe.has(n)?n:"in-phase",s=Math.max(0,Math.min(1,Number(t)||0)),a={"in-phase":[s,s],mono:[s,s],"out-of-phase":[s,-s],"left-only":[s,0],"right-only":[0,s]},[c,f]=a[i];return{mode:i,frequencyHz:Math.max(20,Math.min(2e4,Number(p)||440)),level:s,gains:[{channel:0,gain:c},{channel:1,gain:f}]}}function Ye(n){let t=1;for(;t<n;)t*=2;return t}function ue(n,t,p=!1){const i=n.length;if(i!==t.length||(i&i-1)!==0||i===0)throw new Error("FFT length must be a power of two.");for(let a=1,c=0;a<i;a+=1){let f=i>>1;for(;c&f;f>>=1)c^=f;c^=f,a<c&&([n[a],n[c]]=[n[c],n[a]],[t[a],t[c]]=[t[c],t[a]])}const s=p?1:-1;for(let a=2;a<=i;a<<=1){const c=s*2*Math.PI/a,f=Math.cos(c),M=Math.sin(c);for(let g=0;g<i;g+=a){let w=1,h=0;for(let u=0;u<a/2;u+=1){const b=g+u,T=g+u+a/2,S=w*n[T]-h*t[T],x=w*t[T]+h*n[T];n[T]=n[b]-S,t[T]=t[b]-x,n[b]+=S,t[b]+=x;const L=w*f-h*M;h=w*M+h*f,w=L}}}if(p)for(let a=0;a<i;a+=1)n[a]/=i,t[a]/=i}function Ke({f0:n=40,f1:t=18e3,duration:p=6,sampleRate:i=48e3,amplitude:s=.85}={}){const a=Math.max(10,Number(n)||40),c=Math.min(i/2-100,Number(t)||12e3),f=Math.max(1,Math.floor((Number(p)||1)*i)),M=new Float32Array(f),g=Math.log(c/a),w=2*Math.PI*a*(p||1)/g;let h=0,u=0;for(let b=0;b<f;b+=1){const T=b/i,S=w*(Math.exp(T*g/(p||1))-1);h+=S-u,u=S,M[b]=s*Math.sin(h)}return M}function Je(n,t,{epsilon:p=1e-6}={}){const i=n.length-t.length+1>0?n.length:t.length,s=Ye(Math.max(i,t.length)*2),a=new Float64Array(s),c=new Float64Array(s);a.set(t),ue(a,c,!1);const f=new Float64Array(s),M=new Float64Array(s);f.set(n),ue(f,M,!1);const g=Math.max(...a.map((u,b)=>u*u+c[b]*c[b])),w=Math.max(p,g*p*1e3);for(let u=0;u<s;u+=1){const b=a[u]*a[u]+c[u]*c[u]+w,T=a[u]/b,S=-c[u]/b,x=f[u]*T-M[u]*S,L=f[u]*S+M[u]*T;f[u]=x,M[u]=L}ue(f,M,!0);const h=new Float32Array(n.length);for(let u=0;u<h.length;u+=1)h[u]=f[u];return h}function Le(n,t,{startDb:p=-5,endDb:i=-35}={}){if(!n||n.length<t/4)return null;const s=8,a=Math.max(1,Math.floor(n.length/s)),c=q=>{let v=0;const E=q*a,O=Math.min(n.length,E+a);for(let W=E;W<O;W+=1)v+=n[W]*n[W];return Math.sqrt(v/Math.max(1,O-E))},f=c(0),M=c(s-1);if(f<=0||20*Math.log10(f/Math.max(M,1e-12))<25)return null;const w=new Float64Array(n.length);let h=0;for(let q=n.length-1;q>=0;q-=1)h+=n[q]*n[q],w[q]=h;const u=w[0];if(u<=0)return null;const b=q=>10*Math.log10(w[q]/u),T=q=>{for(let v=0;v<n.length;v+=1)if(b(v)<=q)return v;return null},S=T(p),x=S!==null?T(i):null;if(S===null||x===null||x<=S+t*.02)return null;const L=x-S;let I=0,A=0,D=0,R=0;for(let q=S;q<x;q+=1){const v=q/t,E=b(q);I+=v,A+=E,D+=v*E,R+=v*v}const J=L*R-I*I;if(J===0)return null;const V=(L*D-I*A)/J;return V>=0?null:et(60/-V,2)}function Qe(n,{sampleRate:t=48e3,frequency:p=1e3,q:i=1.414}={}){const s=2*Math.PI*Math.max(10,Math.min(p,t/2-10))/t,a=Math.sin(s)/(2*Math.max(.05,i)),c=a,f=0,M=-a,g=1+a,w=-2*Math.cos(s),h=1-a,u=new Float32Array(n.length);let b=0,T=0,S=0,x=0;for(let L=0;L<n.length;L+=1){const I=n[L],A=c/g*I+f/g*b+M/g*T-w/g*S-h/g*x;u[L]=A,T=b,b=I,x=S,S=A}return u}function Ze(n,{sampleRate:t=48e3,frequencies:p=[250,500,1e3,2e3,4e3],q:i=1.414}={}){const s={};for(const a of p){const c=Qe(n,{sampleRate:t,frequency:a,q:i});s[String(a)]=Le(c,t)}return s}function et(n,t){const p=10**t;return Math.round(n*p)/p}const tt=new URL("/assets/pcm-recorder.worklet-M_3AoleU.js",import.meta.url);function ot(n){const t={};["sweep-start","sweep-end","sweep-duration","metro-bpm"].forEach(p=>{const i=n.querySelector(`#${p}`);i&&(t[p]=i.value)}),["sweep-mode","metro-beats"].forEach(p=>{const i=n.querySelector(`#${p}`);i&&(t[p]=i.value)}),["sweep-loop"].forEach(p=>{const i=n.querySelector(`#${p}`);i&&(t[p]=i.checked)}),ae.dispatch({type:"SAVE_TOOL_DATA",toolId:"audio-tools",payload:t})}function at(n){var i;const t=ae.getState(),p=((i=t==null?void 0:t.toolData)==null?void 0:i["audio-tools"])||{};Object.entries(p).forEach(([s,a])=>{const c=n.querySelector(`#${s}`);c&&(c.type==="checkbox"?c.checked=a===!0:c.value=String(a))})}let r=null,z=null,P=null,_=null,Z=null,$=null,ee=!1,k="tone",H=null,j=null,Ae=!1,F=null,N=null;const ke={tone:"Audio Tone Generator",sweep:"Frequency Sweep Generator",metronome:"Metronome",stereo:"Stereo & Phase Checker",acoustics:"Impulse & RT60 Measurement"};async function ct(n){Z=n,k="tone",n.innerHTML=`
    <div class="tool-audio-tools">
      <div class="audio-tools-tabs" role="tablist">
        <button type="button" class="audio-tools-tab is-active" data-tab="tone">Tone</button>
        <button type="button" class="audio-tools-tab" data-tab="sweep">Sweep</button>
        <button type="button" class="audio-tools-tab" data-tab="metronome">Metronome</button>
        <button type="button" class="audio-tools-tab" data-tab="stereo">Stereo Test</button>
        <button type="button" class="audio-tools-tab" data-tab="acoustics">Acoustics</button>
      </div>

      <div class="audio-tools-panel audio-tools-tab-panel" data-panel="tone">
        <div class="audio-tools-readout audio-tools-readout--primary" id="freq-display">440 Hz</div>

        <div class="audio-tools-slider-shell">
          <input type="range" id="freq-slider" class="audio-tools-slider" min="20" max="20000" value="440">
          <div class="audio-tools-range-labels">
            <span>20 Hz</span>
            <span>20,000 Hz</span>
          </div>
        </div>

        <div class="audio-tools-wave-options">
          <label><input type="radio" name="wave" value="sine" checked> Sine</label>
          <label><input type="radio" name="wave" value="square"> Square</label>
          <label><input type="radio" name="wave" value="sawtooth"> Sawtooth</label>
          <label><input type="radio" name="wave" value="triangle"> Triangle</label>
        </div>

        <button id="play-btn" class="audio-tools-play-button">Play Tone</button>

        <div class="audio-tools-control-group audio-tools-lfo-panel">
          <label class="audio-tools-field-label">LFO Modulation</label>
          <div class="audio-tools-recording-mode-row">
            <div class="sound-studio-inline-control">
              <label class="rj-switch">
                <input type="checkbox" id="lfo-enable">
                <span class="slider-switch"></span>
              </label>
              <label for="lfo-enable" class="sound-studio-mode-label">Enable LFO</label>
            </div>
          </div>
          <div class="audio-tools-slider-shell">
            <label class="audio-tools-field-label">LFO Rate (Hz)</label>
            <input type="range" id="lfo-rate" class="audio-tools-slider" min="0.1" max="20" step="0.1" value="5">
            <div class="audio-tools-range-labels"><span>0.1 Hz</span><span>20 Hz</span></div>
          </div>
          <div class="audio-tools-slider-shell">
            <label class="audio-tools-field-label">LFO Depth</label>
            <input type="range" id="lfo-depth" class="audio-tools-slider" min="0" max="100" value="50">
            <div class="audio-tools-range-labels"><span>0%</span><span>100%</span></div>
          </div>
        </div>
      </div>

      <div class="audio-tools-panel audio-tools-tab-panel hidden" data-panel="sweep">
        <div class="audio-tools-readout" id="sweep-readout">100 Hz → 2,000 Hz · 10s</div>
        <div class="audio-tools-field-grid audio-tools-sweep-grid">
          <label class="audio-tools-field-label">Start Hz<input type="number" id="sweep-start" min="20" max="20000" value="100"></label>
          <label class="audio-tools-field-label">End Hz<input type="number" id="sweep-end" min="20" max="20000" value="2000"></label>
          <label class="audio-tools-field-label">Duration (s)<input type="number" id="sweep-duration" min="1" max="60" value="10"></label>
          <label class="audio-tools-field-label">Curve<select id="sweep-mode">
            <option value="linear">Linear</option>
            <option value="logarithmic">Logarithmic</option>
          </select></label>
        </div>
        <label class="audio-tools-check-row"><input type="checkbox" id="sweep-loop"> Loop sweep</label>
        <div class="audio-tools-preset-row">
          <input type="text" id="sweep-preset-name" placeholder="Preset name" class="audio-tools-preset-name">
          <button id="sweep-save-preset" type="button" class="mini-btn">Save</button>
          <select id="sweep-preset-select"><option value="">Load preset…</option></select>
          <button id="sweep-delete-preset" type="button" class="mini-btn danger">Delete</button>
        </div>
        <button id="sweep-btn" class="audio-tools-play-button">Run Sweep</button>
      </div>

      <div class="audio-tools-panel audio-tools-tab-panel hidden" data-panel="metronome">
        <div class="audio-tools-readout"><span id="metro-beat">1</span> / <span id="metro-bar-count">4</span></div>
        <div class="audio-tools-control-group">
          <label class="audio-tools-field-label">Tempo (BPM)</label>
          <input type="range" id="metro-bpm" class="audio-tools-slider" min="30" max="300" value="120">
          <div class="audio-tools-range-labels">
            <span>30 BPM</span>
            <span>300 BPM</span>
          </div>
          <label class="audio-tools-field-label" for="metro-beats">Beats per bar</label>
          <select id="metro-beats">
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4" selected>4</option>
          <option value="5">5</option>
          <option value="6">6</option>
          <option value="7">7</option>
          </select>
        </div>
        <button id="metro-btn" class="audio-tools-play-button">Start Metronome</button>
      </div>

      <div class="audio-tools-panel audio-tools-tab-panel hidden" data-panel="stereo">
        <div class="audio-tools-readout" id="stereo-readout">In Phase · 440 Hz</div>
        <div class="audio-tools-control-group">
          <label class="audio-tools-field-label" for="stereo-mode">Test signal</label>
          <select id="stereo-mode">
          <option value="in-phase">In Phase (both channels)</option>
          <option value="out-of-phase">Out of Phase (polarity flip)</option>
          <option value="left-only">Left Channel Only</option>
          <option value="right-only">Right Channel Only</option>
          <option value="mono">Mono Check</option>
          </select>
          <label class="audio-tools-field-label">Tone Hz</label>
          <input type="range" id="stereo-hz" class="audio-tools-slider" min="100" max="2000" value="440">
        </div>
        <button id="stereo-btn" class="audio-tools-play-button">Play Test</button>
      </div>

      <div class="audio-tools-panel audio-tools-panel--acoustics audio-tools-tab-panel hidden" data-panel="acoustics">
        <h3 class="audio-tools-section-title">Impulse response and reverb time measurement</h3>
        <p class="audio-tools-measure-note">Plays an exponential sine sweep, captures the room through your microphone, then deconvolves the impulse response and estimates RT60 per octave band.</p>
        <div class="audio-tools-field-grid audio-tools-acoustics-grid">
          <label class="audio-tools-field-label">From Hz<input type="number" id="ac-from" min="20" max="1000" value="60"></label>
          <label class="audio-tools-field-label">To Hz<input type="number" id="ac-to" min="2000" max="20000" value="12000"></label>
          <label class="audio-tools-field-label">Sweep s<input type="number" id="ac-duration" min="2" max="20" value="6"></label>
          <label class="audio-tools-field-label">Tail s<input type="number" id="ac-tail" min="0.5" max="5" step="0.5" value="1.5"></label>
        </div>
        <div class="audio-tools-actions">
          <button id="ac-arm" type="button" class="audio-tools-play-button">Arm Microphone</button>
          <button id="ac-measure" type="button" class="audio-tools-play-button" disabled>Measure</button>
          <button id="ac-download-ir" type="button" class="mini-btn" disabled>Download IR WAV</button>
        </div>
        <div id="ac-status" class="audio-tools-status">Microphone not armed.</div>
        <div id="ac-results"></div>
      </div>
    </div>
  `;const t=n.querySelector(".tool-audio-tools"),p=t.querySelector("#freq-display"),i=t.querySelector("#freq-slider"),s=t.querySelector("#play-btn");let a=null,c=null;const f=()=>{const e=[z,P];a&&e.push(a,c),K(e.filter(Boolean),{context:r}),z=null,P=null,a=null,c=null,s.textContent="Play Tone",s.classList.remove("is-playing"),ee=!1,B("paused")},M=async()=>{var o,l,d;if(ee)return;if(await Q(),z=r.createOscillator(),P=r.createGain(),z.type=t.querySelector('input[name="wave"]:checked').value,z.frequency.setValueAtTime(i.value,r.currentTime),P.gain.setValueAtTime(.1,r.currentTime),z.connect(P),P.connect(r.destination),((o=t.querySelector("#lfo-enable"))==null?void 0:o.checked)===!0){const m=Math.max(.1,parseFloat((l=t.querySelector("#lfo-rate"))==null?void 0:l.value)||5),y=Math.max(0,Math.min(100,parseFloat((d=t.querySelector("#lfo-depth"))==null?void 0:d.value)||50))/100;a=r.createOscillator(),c=r.createGain(),a.type="sine",a.frequency.setValueAtTime(m,r.currentTime),c.gain.setValueAtTime(parseFloat(i.value)*y*.5,r.currentTime),a.connect(c),c.connect(z.frequency),a.start()}z.start(),s.textContent="Stop Tone",s.classList.add("is-playing"),ee=!0,B("playing")},g=()=>ee?f():M(),w=t.querySelector("#sweep-readout"),h="audio-tools-sweep-presets",u=()=>{var o,l;const e=(l=(o=ae.getState())==null?void 0:o.toolData)==null?void 0:l[h];return e&&typeof e=="object"?e:{}},b=e=>{ae.dispatch({type:"SAVE_TOOL_DATA",toolId:h,payload:e})},T=()=>{var e,o,l,d,m;return{startHz:Number((e=t.querySelector("#sweep-start"))==null?void 0:e.value)||100,endHz:Number((o=t.querySelector("#sweep-end"))==null?void 0:o.value)||2e3,durationSeconds:Number((l=t.querySelector("#sweep-duration"))==null?void 0:l.value)||10,mode:((d=t.querySelector("#sweep-mode"))==null?void 0:d.value)||"linear",loop:((m=t.querySelector("#sweep-loop"))==null?void 0:m.checked)===!0}},S=e=>{if(!e)return;const o=t.querySelector("#sweep-start"),l=t.querySelector("#sweep-end"),d=t.querySelector("#sweep-duration"),m=t.querySelector("#sweep-mode"),y=t.querySelector("#sweep-loop");o&&(o.value=String(e.startHz??100)),l&&(l.value=String(e.endHz??2e3)),d&&(d.value=String(e.durationSeconds??10)),m&&(m.value=e.mode||"linear"),y&&(y.checked=!!e.loop)},x=t.querySelector("#sweep-preset-select"),L=()=>{const e=u();x.innerHTML='<option value="">Load preset…</option>'+Object.keys(e).map(o=>`<option value="${qe(o)}">${qe(o)}</option>`).join("")};t.querySelector("#sweep-save-preset").addEventListener("click",()=>{const e=t.querySelector("#sweep-preset-name"),o=((e==null?void 0:e.value)||"").trim();if(!o)return;const l=T();b({...u(),[o]:l}),L(),x.value=o}),x.addEventListener("change",()=>{const e=x.value,o=u();!e||!o[e]||S(o[e])}),t.querySelector("#sweep-delete-preset").addEventListener("click",()=>{const e=x.value;if(!e)return;const o=u();delete o[e],b(o),L()});const I=t.querySelector("#sweep-btn");let A=null,D=!1,R=null,J=!1,V=null,q=48e3;const v=e=>{const o=t.querySelector("#ac-status");o&&(o.textContent=e)},E=e=>t.querySelector(e),O=()=>{E("#ac-measure").disabled=!R||D,E("#ac-arm").textContent=A?"Disarm Microphone":"Arm Microphone",E("#ac-download-ir").disabled=!V},W=()=>{R&&(K(R,{context:r}),R=null)},He=async()=>{var e;W(),(e=A==null?void 0:A.getTracks)==null||e.call(A).forEach(o=>o.stop()),A=null,v("Microphone not armed."),O()},Ee=async()=>{await Q(),ze(r);try{A=await window.navigator.mediaDevices.getUserMedia({audio:{echoCancellation:!1,noiseSuppression:!1,autoGainControl:!1}})}catch{v("Microphone access denied; measurement needs a mic.");return}if(!J)try{await r.audioWorklet.addModule(tt),J=!0}catch{v("AudioWorklet unavailable in this browser.");return}const e=r.createMediaStreamSource(A),o=new AudioWorkletNode(r,"pcm-recorder-processor"),l=r.createGain();l.gain.value=0,e.connect(o),o.connect(l),l.connect(r.destination),R=[e,o,l],v("Microphone armed. Press Measure to play the sweep."),O()},Ie=async(e,o)=>{const l=[],d=m=>{var y;Array.isArray((y=m.data)==null?void 0:y.buffer)&&l.push(...m.data.buffer)};return e.port.addEventListener("message",d),await new Promise(m=>setTimeout(m,o)),e.port.postMessage({command:"flush"}),await new Promise(m=>setTimeout(m,120)),e.port.removeEventListener("message",d),l},Re=async()=>{if(!R||D)return;D=!0,O(),v("Measuring: keep the room quiet until it finishes.");const e=r.sampleRate;q=e;const o=Number(t.querySelector("#ac-from").value)||60,l=Number(t.querySelector("#ac-to").value)||12e3,d=Math.max(2,Number(t.querySelector("#ac-duration").value)||6),m=Math.max(.5,Number(t.querySelector("#ac-tail").value)||1.5),y=Ke({f0:o,f1:l,duration:d,sampleRate:e}),U=r.createBuffer(1,y.length,e);U.copyToChannel(y,0);const C=r.createBufferSource();C.buffer=U,C.connect(r.destination);const[X]=R.filter(G=>G instanceof AudioWorkletNode);try{C.start();const G=await Ie(X,(d+m)*1e3),ie=new Float32Array(G.length?G.map(Y=>Y.length).reduce((Y,$e)=>Y+$e,0):0);let Te=0;for(const Y of G)ie.set(Y,Te),Te+=Y.length;if(ie.length<e){v("Capture came back empty; re-arm the microphone and retry.");return}const ce=Je(ie,y);V=ce;const Ne=Le(ce,e),Oe=Ze(ce,{sampleRate:e,frequencies:[125,250,500,1e3,2e3,4e3]});Ce({broadband:Ne,bands:Oe}),v("Measurement complete. Download the IR or remeasure."),O()}catch(G){v(`Measurement failed: ${G.message}`)}finally{D=!1,O()}},Ce=({broadband:e,bands:o})=>{const l=t.querySelector("#ac-results");if(!l)return;const d=y=>y==null?"—":`${y.toFixed?y.toFixed(2):y}s`,m=Object.entries(o).map(([y,U])=>`<tr><td>${y} Hz</td><td>${d(U)}</td></tr>`).join("");l.innerHTML=`
      <div class="audio-tools-status">Broadband RT60: ${d(e)}</div>
      <table class="audio-tools-eq-table">
        <thead><tr><th>Band</th><th>RT60</th></tr></thead>
        <tbody>${m}</tbody>
      </table>
    `};E("#ac-arm").addEventListener("click",()=>{A?He():Ee()}),E("#ac-measure").addEventListener("click",Re),E("#ac-download-ir").addEventListener("click",()=>{if(!V)return;const e=Ve(V,q);je(new Blob([e],{type:"audio/wav"}),"impulse-response.wav","audio/wav")});let de=0;const pe=()=>We({startHz:t.querySelector("#sweep-start").value,endHz:t.querySelector("#sweep-end").value,durationSeconds:t.querySelector("#sweep-duration").value,mode:t.querySelector("#sweep-mode").value}),me=()=>{const e=pe();w.textContent=`${e.startHz} Hz → ${e.endHz} Hz · ${e.durationSeconds}s (${e.mode})`},ne=()=>{j&&clearInterval(j),j=null,H&&(K([H.oscillator,H.gain],{context:r}),H=null),I.textContent="Run Sweep",I.classList.remove("is-playing"),B("paused")},fe=async()=>{await Q();const e=pe();Ae=t.querySelector("#sweep-loop").checked;const o=r.createOscillator(),l=r.createGain();o.type="sine";const d=r.currentTime+.05;o.frequency.setValueAtTime(e.startHz,d),e.mode==="logarithmic"?o.frequency.exponentialRampToValueAtTime(e.endHz,d+e.durationSeconds):o.frequency.linearRampToValueAtTime(e.endHz,d+e.durationSeconds),l.gain.setValueAtTime(.1,d),o.connect(l),l.connect(r.destination),o.start(d),o.stop(d+e.durationSeconds),o.onended=()=>{(H==null?void 0:H.oscillator)===o&&Ae&&k==="sweep"?fe():k==="sweep"&&ne()},H={oscillator:o,gain:l},de=performance.now(),j=setInterval(()=>{if(!H)return;const m=(performance.now()-de)/1e3%e.durationSeconds;w.textContent=`${Math.round(e.frequencyAt(m))} Hz`},100),I.textContent="Stop Sweep",I.classList.add("is-playing"),B("playing")},be=()=>H?ne():fe(),te=t.querySelector("#metro-btn"),Be=t.querySelector("#metro-beat"),se=()=>{F&&(clearInterval(F.intervalId),F=null),te.textContent="Start Metronome",te.classList.remove("is-playing"),B("paused")},Pe=(e,o)=>{const l=r.createOscillator(),d=r.createGain();l.type="square",l.frequency.setValueAtTime(o?1600:1100,e),d.gain.setValueAtTime(o?.22:.12,e),d.gain.exponentialRampToValueAtTime(.001,e+.05),l.connect(d),d.connect(r.destination),l.start(e),l.stop(e+.06)},he=async()=>{await Q();const e=Number(t.querySelector("#metro-bpm").value)||120,o=Number(t.querySelector("#metro-beats").value)||4;let l=0,d=r.currentTime+.08;F={bpm:e,beatsPerBar:o,intervalId:setInterval(()=>{for(;d<r.currentTime+.12;){const m=Ue(l,{bpm:e,beatsPerBar:o});Pe(d,m.isAccent);const y=m.beatInBar+1;setTimeout(()=>{Be.textContent=String(y)},Math.max(0,(d-r.currentTime)*1e3)),d+=m.secondsPerBeat,l+=1}},25)},te.textContent="Stop Metronome",te.classList.add("is-playing"),B("playing")},ye=()=>F?se():he(),ve=t.querySelector("#stereo-readout"),oe=t.querySelector("#stereo-btn"),le=()=>{N&&(K(N.nodes,{context:r}),N=null),oe.textContent="Play Test",oe.classList.remove("is-playing"),B("paused")},ge=async()=>{await Q();const e=t.querySelector("#stereo-mode").value,o=Number(t.querySelector("#stereo-hz").value)||440,l=xe(e,{frequencyHz:o}),d=r.createChannelMerger(2),m=[];l.gains.forEach(({channel:y,gain:U})=>{const C=r.createOscillator(),X=r.createGain();C.type="sine",C.frequency.setValueAtTime(l.frequencyHz,r.currentTime),X.gain.setValueAtTime(U,r.currentTime),C.connect(X),X.connect(d,0,y),C.start(),m.push(C,X)}),d.connect(r.destination),N={nodes:[...m,d]},ve.textContent=`${l.mode.replace(/-/g," ")} · ${l.frequencyHz} Hz`,oe.textContent="Stop Test",oe.classList.add("is-playing"),B("playing")},we=()=>N?le():ge(),re=()=>{k==="tone"?f():k==="sweep"?ne():k==="metronome"?se():k==="stereo"&&le()},Se=()=>k==="tone"?g():k==="sweep"?be():k==="metronome"?ye():we(),Fe=e=>{!ke[e]||e===k||(re(),k=e,t.querySelectorAll(".audio-tools-tab").forEach(o=>{o.classList.toggle("is-active",o.dataset.tab===k)}),t.querySelectorAll(".audio-tools-tab-panel").forEach(o=>{o.classList.toggle("hidden",o.dataset.panel!==k)}),$==null||$(),Me())};function Me(){$=_e({target:window,metadata:{title:ke[k]||"Audio Tools",artist:"Jelodar Tools"},playbackState:"paused",handlers:{play:()=>Se(),pause:re,stop:re,toggle:()=>Se()}})}_=async e=>{var l,d;const o=(d=(l=e.target).closest)==null?void 0:d.call(l,".audio-tools-tab");if(e.type==="click"&&o){Fe(o.dataset.tab);return}if(e.target.id==="freq-slider"){const m=e.target.value;p.textContent=`${m} Hz`,z&&z.frequency.setValueAtTime(m,r.currentTime)}else if(e.target.name==="wave")z&&(z.type=e.target.value);else if(e.target.id==="play-btn")await g();else if(e.target.id==="sweep-btn")await be();else if(["sweep-start","sweep-end","sweep-duration","sweep-mode"].includes(e.target.id))me();else if(e.target.id==="metro-btn")await ye();else if(e.target.id==="metro-bpm"||e.target.id==="metro-beats")e.target.id==="metro-beats"&&(t.querySelector("#metro-bar-count").textContent=e.target.value),F&&(se(),he());else if(e.target.id==="stereo-btn")await we();else if(e.target.id==="stereo-mode"||e.target.id==="stereo-hz")if(N)le(),ge();else{const m=xe(t.querySelector("#stereo-mode").value,{frequencyHz:t.querySelector("#stereo-hz").value});ve.textContent=`${m.mode.replace(/-/g," ")} · ${m.frequencyHz} Hz`}},t.addEventListener("input",_),t.addEventListener("click",_),t.addEventListener("change",()=>ot(n)),me(),at(n),Me()}async function Q(){r||(r=De(window)),await ze(r)}function ut(){nt(),$==null||$();const n=Z==null?void 0:Z.querySelector(".tool-audio-tools");n&&_&&(n.removeEventListener("input",_),n.removeEventListener("click",_)),K([z,P],{context:r}),r&&Ge(r),z=null,r=null,P=null,H=null,F=null,N=null,_=null,Z=null,$=null,ee=!1,k="tone"}function nt(){try{j&&clearInterval(j),j=null,F&&clearInterval(F.intervalId),K([z,P,...H?[H.oscillator,H.gain]:[],...N?N.nodes:[]],{context:r}),B("paused")}catch{}}export{ct as mount,ut as unmount};
