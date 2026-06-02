import{s as m,a as b,c as T,r as w}from"./audio-context-DqMvUB_Q.js";import{b as S,s as f}from"./media-session-BHNa2ppJ.js";let t=null,e=null,a=null,o=null,s=null,r=null,u=!1;async function A(l){s=l,l.innerHTML=`
    <div class="tool-audio-tools">
      <header>
        <h2 class="audio-tools-title">Audio Tone Generator</h2>
        <p class="audio-tools-copy">
          Generate precise audio tones and frequencies directly in your browser. Utilize the native Web Audio API to create custom sounds (Sine, Square, Sawtooth, Triangle) for testing audio equipment, musical tuning, or acoustic experiments.
        </p>
      </header>
      <div class="audio-tools-panel">
        <div class="audio-tools-frequency" id="freq-display">440 Hz</div>
        
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
      </div>
    </div>
  `;const n=l.querySelector(".tool-audio-tools"),g=n.querySelector("#freq-display"),q=n.querySelector("#freq-slider"),d=n.querySelector("#play-btn"),c=()=>{e&&(m([e,a],{context:t}),e=null,a=null),d.textContent="Play Tone",d.classList.remove("is-playing"),u=!1,f("paused")},p=async()=>{u||(t||(t=T(window)),await w(t),e=t.createOscillator(),a=t.createGain(),e.type=n.querySelector('input[name="wave"]:checked').value,e.frequency.setValueAtTime(q.value,t.currentTime),a.gain.setValueAtTime(.1,t.currentTime),e.connect(a),a.connect(t.destination),e.start(),d.textContent="Stop Tone",d.classList.add("is-playing"),u=!0,f("playing"))},y=()=>u?c():p();r=S({target:window,metadata:{title:"Audio Tone Generator",artist:"Jelodar Tools"},playbackState:"paused",handlers:{play:p,pause:c,stop:c,toggle:y}}),o=async i=>{if(i.target.id==="freq-slider"){const v=i.target.value;g.textContent=`${v} Hz`,e&&e.frequency.setValueAtTime(v,t.currentTime)}else i.target.name==="wave"?e&&(e.type=i.target.value):i.target.id==="play-btn"&&await y()},n.addEventListener("input",o),n.addEventListener("click",o)}function L(){r==null||r();const l=s==null?void 0:s.querySelector(".tool-audio-tools");l&&o&&(l.removeEventListener("input",o),l.removeEventListener("click",o)),m([e,a],{context:t}),t&&b(t),e=null,t=null,a=null,o=null,s=null,r=null,u=!1}export{A as mount,L as unmount};
