import{c as ce,T as le}from"./index-CGiSGYdp.js";import{s as K}from"./ui-utils-CG6aKAAj.js";import{r as X,b as de,s as ue,a as me,g as pe,d as ee,p as ve,f as he}from"./studio-CKR8zP_U.js";import{c as ye}from"./studio-shell-4kPB4zak.js";function b(a){return String(a??"").replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])}function ne(a,n,s=""){const r=String(s||"").trim().toLowerCase(),l=a.filter(i=>!r||i.toLowerCase().includes(r));return(l.some(i=>i===n)?l:[n,...l].filter(Boolean)).map(i=>`<option value="${b(i)}"${i===n?" selected":""}>${b(i)}</option>`).join("")}function A({id:a,label:n,options:s,selected:r,placeholder:l="Filter options"}){return`
    <label class="studio-field searchable-select-field" data-searchable-select="${b(a)}">
      <span>${b(n)}</span>
      <input id="${b(a)}-search" class="searchable-select-input" type="search" placeholder="${b(l)}">
      <select id="${b(a)}" data-searchable-select-menu>
        ${ne(s,r)}
      </select>
    </label>
  `}function ge(a,n,s){var v,k,f;const r=(v=a==null?void 0:a.querySelector)==null?void 0:v.call(a,`[data-searchable-select="${n}"]`),l=(k=r==null?void 0:r.querySelector)==null?void 0:k.call(r,`#${n}-search`),e=(f=r==null?void 0:r.querySelector)==null?void 0:f.call(r,`#${n}`);if(!r||!l||!e)return()=>{};const i=()=>{const w=e.value;e.innerHTML=ne(s,w,l.value)},y=w=>{w.key!=="Escape"||!l.value||(l.value="",i())};return l.addEventListener("input",i),l.addEventListener("keydown",y),()=>{l.removeEventListener("input",i),l.removeEventListener("keydown",y)}}let p=null;const C=typeof Intl.supportedValuesOf=="function"?Intl.supportedValuesOf("timeZone"):["UTC"],T=Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC";function Se(a){return le.find(n=>n.id===a)}function d(a){return String(a??"").replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])}function be(a){return`
    <div class="studio-stack">
      <section class="card studio-card time-world-card">
        <div class="studio-panel-head">
          <h3>World Clocks</h3>
        </div>
        <div class="studio-toolbar">
          <div class="studio-toolbar-group">
            ${A({id:"time-world-zone",label:"Add Timezone",options:C,selected:"Asia/Tehran",placeholder:"Search timezone"})}
          </div>
          <div class="studio-toolbar-group studio-toolbar-actions">
            <button id="time-world-add" type="button">Add Clock</button>
          </div>
        </div>
        <div id="time-world-clock-grid" class="time-world-grid"></div>
        <div id="time-current-date-formats" class="time-date-format-grid"></div>
      </section>

      <section class="card studio-card">
        <div class="tabs-header">
          ${[["stopwatch","Stopwatch"],["timer","Timer"],["alarms","Alarms"],["epoch","Epoch"],["timezone","Timezone"],["planning","Planner"],["date-math","Date Math"],["calendar","Calendar"]].map(([n,s])=>`
            <button class="tab-btn${n===a?" active":""}" data-time-tab="${n}">${s}</button>
          `).join("")}
        </div>

        <section class="time-view${a==="stopwatch"?"":" hidden"}" data-view="stopwatch">
          <div class="time-display-card">
            <div class="time-display-label">Elapsed</div>
            <div id="time-stopwatch-display" class="time-display-value">00:00:00.00</div>
            <div class="studio-actions studio-actions-centered">
              <button id="time-stopwatch-start">Start</button>
              <button id="time-stopwatch-stop" class="btn-secondary hidden">Stop</button>
              <button id="time-stopwatch-reset" class="btn-secondary">Reset</button>
            </div>
          </div>
        </section>

        <section class="time-view${a==="timer"?"":" hidden"}" data-view="timer">
          <div class="time-display-card">
            <div class="time-display-label">Countdown</div>
            <div id="time-timer-display" class="time-display-value">00:00:00</div>
            <div class="studio-inline-grid time-inline-grid">
              <label class="studio-field">
                <span>Hours</span>
                <input id="time-timer-hours" type="number" min="0" max="99" value="0">
              </label>
              <label class="studio-field">
                <span>Minutes</span>
                <input id="time-timer-minutes" type="number" min="0" max="59" value="15">
              </label>
              <label class="studio-field">
                <span>Seconds</span>
                <input id="time-timer-seconds" type="number" min="0" max="59" value="0">
              </label>
            </div>
            <div class="studio-actions studio-actions-centered">
              <button id="time-timer-start">Start Timer</button>
              <button id="time-timer-stop" class="btn-secondary hidden">Stop</button>
              <button id="time-timer-reset" class="btn-secondary">Reset</button>
            </div>
          </div>
        </section>

        <section class="time-view${a==="alarms"?"":" hidden"}" data-view="alarms">
          <div class="studio-toolbar">
            <div class="studio-toolbar-group">
              <label class="studio-field">
                <span>Alarm Time</span>
                <input id="time-alarm-input" type="time">
              </label>
            </div>
            <div class="studio-toolbar-group studio-toolbar-actions">
              <button id="time-alarm-add">Add Alarm</button>
            </div>
          </div>
          <div id="time-alarm-list" class="studio-list"></div>
        </section>

        <section class="time-view${a==="epoch"?"":" hidden"}" data-view="epoch">
          <div class="studio-toolbar">
            <div class="studio-toolbar-group">
              <label class="studio-field studio-field-wide">
                <span>Timestamp</span>
                <input id="time-epoch-input" type="text" placeholder="1713264000 or 1713264000000">
              </label>
            </div>
            <div class="studio-toolbar-group studio-toolbar-actions">
              <button id="time-epoch-convert">Convert</button>
              <button id="time-epoch-now" class="btn-secondary">Use Current Epoch</button>
            </div>
          </div>
          <div class="studio-inline-grid">
            <div class="studio-output-card">
              <span>Current Epoch</span>
              <strong id="time-epoch-current">0</strong>
            </div>
            <div class="studio-output-card">
              <span>Detected Unit</span>
              <strong id="time-epoch-unit">Awaiting input</strong>
            </div>
          </div>
          <div class="studio-result-grid">
            <div class="studio-output-card">
              <span>Local</span>
              <code id="time-epoch-local">Enter a timestamp.</code>
            </div>
            <div class="studio-output-card">
              <span>UTC</span>
              <code id="time-epoch-utc">Enter a timestamp.</code>
            </div>
            <div class="studio-output-card">
              <span>ISO</span>
              <code id="time-epoch-iso">Enter a timestamp.</code>
            </div>
          </div>
        </section>

        <section class="time-view${a==="timezone"?"":" hidden"}" data-view="timezone">
          <div class="studio-toolbar">
            <div class="studio-toolbar-group">
              ${A({id:"time-zone-source",label:"Source Timezone",options:C,selected:T,placeholder:"Search source"})}
              ${A({id:"time-zone-target",label:"Target Timezone",options:C,selected:"UTC",placeholder:"Search target"})}
              <label class="studio-field studio-field-wide">
                <span>Source Date & Time</span>
                <input id="time-zone-input" type="datetime-local">
              </label>
            </div>
            <div class="studio-toolbar-group studio-toolbar-actions">
              <button id="time-zone-convert">Convert</button>
              <button id="time-zone-now" class="btn-secondary">Use Current Time</button>
            </div>
          </div>
          <div class="studio-result-grid">
            <div class="studio-output-card">
              <span>Source</span>
              <code id="time-zone-source-output">Choose a date and time.</code>
            </div>
            <div class="studio-output-card">
              <span>Target</span>
              <code id="time-zone-target-output">Choose a date and time.</code>
            </div>
            <div class="studio-output-card">
              <span>Offset Context</span>
              <code id="time-zone-offset-output">Waiting for conversion.</code>
            </div>
          </div>
          <div class="form-group">
            <label>Quick Reference (Current Time)</label>
            <div id="time-zone-quick-grid" class="studio-result-grid"></div>
          </div>
        </section>

        <section class="time-view${a==="planning"?"":" hidden"}" data-view="planning">
          <div class="studio-panel-grid studio-panel-grid-dual time-planner-grid">
            <div class="studio-panel">
              <div class="studio-panel-head">
                <h3>Overlap Planner</h3>
              </div>
              <div class="studio-inline-grid">
                <label class="studio-field studio-field-wide">
                  <span>Zones</span>
                  <input id="time-overlap-zones" type="text" value="${T}, UTC, America/New_York">
                </label>
                <label class="studio-field">
                  <span>Date</span>
                  <input id="time-overlap-date" type="date">
                </label>
                <label class="studio-field">
                  <span>Work Start</span>
                  <input id="time-overlap-start" type="time" value="09:00">
                </label>
                <label class="studio-field">
                  <span>Work End</span>
                  <input id="time-overlap-end" type="time" value="17:00">
                </label>
              </div>
              <div class="studio-actions">
                <button id="time-overlap-build">Build Overlap</button>
              </div>
              <div id="time-overlap-output" class="time-overlap-output studio-list"></div>
            </div>

            <div class="studio-panel">
              <div class="studio-panel-head">
                <h3>DST Context</h3>
              </div>
              <div class="studio-inline-grid">
                ${A({id:"time-dst-zone",label:"Timezone",options:C,selected:T,placeholder:"Search timezone"})}
                <label class="studio-field">
                  <span>Year</span>
                  <input id="time-dst-year" type="number" min="1970" max="9999" value="${new Date().getFullYear()}">
                </label>
              </div>
              <div class="studio-actions">
                <button id="time-dst-build">Summarize DST</button>
              </div>
              <div id="time-dst-output" class="time-dst-output studio-list"></div>
            </div>
          </div>
        </section>

        <section class="time-view${a==="date-math"?"":" hidden"}" data-view="date-math">
          <div class="studio-panel-grid studio-panel-grid-dual time-planner-grid">
            <div class="studio-panel">
              <div class="studio-panel-head">
                <h3>Date Math</h3>
              </div>
              <div class="studio-inline-grid">
                <label class="studio-field">
                  <span>Start Date</span>
                  <input id="time-date-math-input" type="date">
                </label>
                <label class="studio-field">
                  <span>Years</span>
                  <input id="time-date-math-years" type="number" value="0">
                </label>
                <label class="studio-field">
                  <span>Months</span>
                  <input id="time-date-math-months" type="number" value="0">
                </label>
                <label class="studio-field">
                  <span>Weeks</span>
                  <input id="time-date-math-weeks" type="number" value="0">
                </label>
                <label class="studio-field">
                  <span>Days</span>
                  <input id="time-date-math-days" type="number" value="0">
                </label>
                <label class="studio-field">
                  <span>Business Days</span>
                  <input id="time-date-math-business" type="number" value="0">
                </label>
              </div>
              <div class="studio-actions">
                <button id="time-date-math-apply">Apply Date Math</button>
              </div>
              <div id="time-date-math-output" class="studio-output-card">
                <span>Result</span>
                <code>Choose a date and operation.</code>
              </div>
            </div>

            <div class="studio-panel">
              <div class="studio-panel-head">
                <h3>Date Difference</h3>
              </div>
              <div class="studio-inline-grid">
                <label class="studio-field">
                  <span>Start</span>
                  <input id="time-date-diff-start" type="date">
                </label>
                <label class="studio-field">
                  <span>End</span>
                  <input id="time-date-diff-end" type="date">
                </label>
              </div>
              <div class="studio-actions">
                <button id="time-date-diff-apply">Compare Dates</button>
              </div>
              <div id="time-date-diff-output" class="studio-output-card">
                <span>Difference</span>
                <code>Choose two dates.</code>
              </div>
            </div>
          </div>
        </section>

        <section class="time-view${a==="calendar"?"":" hidden"}" data-view="calendar">
          <div class="studio-toolbar">
            <div class="studio-toolbar-group">
              <label class="studio-field studio-field-wide">
                <span>Date</span>
                <input id="time-calendar-input" type="date">
              </label>
            </div>
            <div class="studio-toolbar-group studio-toolbar-actions">
              <button id="time-calendar-apply">Update</button>
              <button id="time-calendar-today" class="btn-secondary">Today</button>
            </div>
          </div>
          <div class="studio-result-grid">
            <div class="studio-output-card">
              <span>Gregorian</span>
              <strong id="time-calendar-gregorian-day">--</strong>
              <code id="time-calendar-gregorian-label">Choose a date.</code>
            </div>
            <div class="studio-output-card">
              <span>Jalali</span>
              <strong id="time-calendar-jalali-day">--</strong>
              <code id="time-calendar-jalali-label">Choose a date.</code>
            </div>
            <div class="studio-output-card">
              <span>Islamic</span>
              <strong id="time-calendar-islamic-day">--</strong>
              <code id="time-calendar-islamic-label">Choose a date.</code>
            </div>
          </div>
        </section>
      </section>
    </div>
  `}function fe(a){const n=Math.floor(a/10),s=Math.floor(n/36e4),r=Math.floor(n%36e4/6e3),l=Math.floor(n%6e3/100),e=n%100;return`${s.toString().padStart(2,"0")}:${r.toString().padStart(2,"0")}:${l.toString().padStart(2,"0")}.${e.toString().padStart(2,"0")}`}function E(a){const n=Math.floor(a/3600),s=Math.floor(a%3600/60),r=a%60;return`${n.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}:${r.toString().padStart(2,"0")}`}function te(a){return`${a.getFullYear()}-${String(a.getMonth()+1).padStart(2,"0")}-${String(a.getDate()).padStart(2,"0")}`}function ae(a){const n=a>=0?"+":"-",s=Math.abs(a);return`UTC${n}${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`}function we(a,n){var i;const s=new Intl.DateTimeFormat("en-US",{timeZone:n,weekday:"short",month:"short",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23",timeZoneName:"short"}).formatToParts(a).reduce((y,v)=>(v.type!=="literal"&&(y[v.type]=v.value),y),{}),r=Number(s.hour||0),l=Number(s.minute||0),e=Number(s.second||0);return{timeZone:n,city:((i=n.split("/").pop())==null?void 0:i.replace(/_/g," "))||n,dateLabel:`${s.weekday}, ${s.month} ${s.day}`,timeLabel:`${String(r).padStart(2,"0")}:${String(l).padStart(2,"0")}`,zoneName:s.timeZoneName||n,hourAngle:r%12*30+l*.5,minuteAngle:l*6,secondAngle:e*6}}function qe(a){return`
    <div class="time-world-clock-card" data-world-zone="${d(a.timeZone)}">
      <div class="time-world-clock-copy">
        <span>${d(a.city)}</span>
        <strong>${d(a.timeLabel)}</strong>
        <code>${d(a.zoneName)} ${d(a.dateLabel)}</code>
      </div>
      <div class="time-analog-clock">
        <i data-clock-hand="hour" data-angle="${a.hourAngle}"></i>
        <i data-clock-hand="minute" data-angle="${a.minuteAngle}"></i>
        <i data-clock-hand="second" data-angle="${a.secondAngle}"></i>
      </div>
      <button type="button" class="btn-secondary time-world-remove" data-world-remove="${d(a.timeZone)}">Remove</button>
    </div>
  `}function $e(a){return a.slots.length?a.slots.slice(0,12).map(n=>`
    <div class="time-overlap-slot">
      <strong>${d(n.label)}</strong>
      <div>
        ${n.localTimes.map(s=>`
          <span>${d(s.city)} ${d(s.hour)}:${d(s.minute)} ${d(s.zoneName)}</span>
        `).join("")}
      </div>
    </div>
  `).join(""):'<div class="studio-empty">No shared working window for those zones.</div>'}function Ce(a){return a.observesDst?a.transitions.map(n=>`
    <div class="time-dst-card">
      <strong>${d(n.date)} ${n.direction==="forward"?"Forward":"Back"}</strong>
      <span>${ae(n.fromOffsetMinutes)} to ${ae(n.toOffsetMinutes)}</span>
    </div>
  `).join(""):`
      <div class="time-dst-card">
        <strong>${d(a.timeZone)}</strong>
        <span>No DST transition detected in ${d(a.year)}.</span>
      </div>
    `}async function Le(a,n){const s=Se(n),r=ce(n),l={"epoch-and-date":"epoch","time-converter":"epoch","timezone-converter":"timezone","calendar-converter":"calendar","calendar-tool":"calendar"}[n]||"stopwatch",e=ye(a,{className:"time-studio-shell",eyebrow:r.title,title:s.title,description:{"epoch-and-date":"Epoch conversion now lives beside timers, timezone planning, and calendar views so time workflows stay together.","time-converter":"Epoch conversion now lives beside timers, timezone planning, and calendar views so time workflows stay together.","timezone-converter":"Timezone conversion now runs inside Time Studio with current-world quick references and route-safe compatibility.","calendar-converter":"Gregorian, Jalali, and Islamic calendar views now share the same studio as timers and timezone planning.","calendar-tool":"Gregorian, Jalali, and Islamic calendar views now share the same studio as timers and timezone planning."}[n]||"Switch between precision timing, countdowns, alarms, timestamp conversion, timezone planning, and calendar views.",toolIds:r.toolIds,activeToolId:n,metrics:[{key:"timezone",label:"Timezone",value:Intl.DateTimeFormat().resolvedOptions().timeZone||"Local"},{key:"clock",label:"Local Time",value:new Date().toLocaleTimeString()}]});e.content.innerHTML=be(l);const i=[],y=e.content.querySelector("#time-stopwatch-display"),v=e.content.querySelector("#time-timer-display"),k=e.content.querySelector("#time-epoch-current"),f=e.content.querySelector("#time-alarm-list"),w=e.content.querySelector("#time-zone-input"),R=e.content.querySelector("#time-calendar-input");let z=0,I=0,q=null,g=0,$=null,W=null,Z=null,h=[],S=Array.from(new Set([T,"Asia/Tehran"]));["time-world-zone","time-zone-source","time-zone-target","time-dst-zone"].forEach(t=>{i.push(ge(e.content,t,C))});const c=(t,o="neutral")=>e.setStatus(t,o);function O(){const t=e.content.querySelector("#time-world-clock-grid"),o=new Date;t.innerHTML=S.map(m=>qe(we(o,m))).join(""),t.querySelectorAll("[data-clock-hand]").forEach(m=>{m.style.transform=`rotate(${Number(m.dataset.angle)||0}deg)`}),t.querySelectorAll(".time-world-remove").forEach(m=>{m.classList.toggle("hidden",S.length<=1)})}function oe(){const t=e.content.querySelector("#time-current-date-formats"),o=ee(new Date);t.innerHTML=[["Gregorian",o.gregorian],["Persian Calendar",o.jalali],["Arabic Calendar",o.islamic]].map(([m,x])=>`
      <div class="studio-output-card">
        <span>${d(m)}</span>
        <strong>${d(x.day)}</strong>
        <code>${d(x.label)}</code>
      </div>
    `).join("")}const F=()=>{e.setMetric("clock",new Date().toLocaleTimeString()),k.textContent=`${Math.floor(Date.now()/1e3)}`,O(),oe()},D=()=>{if(!h.length){f.innerHTML='<div class="studio-empty">No alarms yet.</div>';return}f.innerHTML=h.map((t,o)=>`
      <div class="studio-list-item">
        <div>
          <strong>${t}</strong>
          <span>Local clock alarm</span>
        </div>
        <button class="btn-secondary" data-alarm-remove="${o}">Remove</button>
      </div>
    `).join(""),f.querySelectorAll("[data-alarm-remove]").forEach(t=>{i.push(u(t,"click",()=>{h=h.filter((o,m)=>m!==Number(t.dataset.alarmRemove)),D(),c("Alarm removed.","neutral")}))})},ie=t=>{e.content.querySelectorAll("[data-time-tab]").forEach(o=>{o.classList.toggle("active",o.dataset.timeTab===t)}),e.content.querySelectorAll(".time-view").forEach(o=>{o.classList.toggle("hidden",o.dataset.view!==t)})},L=()=>{const t=q?z+(Date.now()-I):z;y.textContent=fe(t)},N=()=>{q&&(clearInterval(q),q=null,z+=Date.now()-I,e.content.querySelector("#time-stopwatch-start").classList.remove("hidden"),e.content.querySelector("#time-stopwatch-stop").classList.add("hidden"))},H=()=>{clearInterval($),$=null,g=0,v.textContent=E(0),e.content.querySelector("#time-timer-start").classList.remove("hidden"),e.content.querySelector("#time-timer-stop").classList.add("hidden")},P=()=>{const t=e.content.querySelector("#time-epoch-input").value;try{const o=he(t);e.content.querySelector("#time-epoch-unit").textContent=o.detectedUnit,e.content.querySelector("#time-epoch-local").textContent=o.local,e.content.querySelector("#time-epoch-utc").textContent=o.utc,e.content.querySelector("#time-epoch-iso").textContent=o.iso,c("Timestamp converted.","success")}catch(o){e.content.querySelector("#time-epoch-unit").textContent="Invalid",e.content.querySelector("#time-epoch-local").textContent=o.message,e.content.querySelector("#time-epoch-utc").textContent=o.message,e.content.querySelector("#time-epoch-iso").textContent=o.message,c(o.message,"danger")}},V=()=>{const t=new Date;t.setMinutes(t.getMinutes()-t.getTimezoneOffset()),w.value=t.toISOString().slice(0,16)},se=()=>{const t=te(new Date);e.content.querySelector("#time-overlap-date").value=t,e.content.querySelector("#time-date-math-input").value=t,e.content.querySelector("#time-date-diff-start").value=t,e.content.querySelector("#time-date-diff-end").value=t},B=()=>{const t=Array.from(new Set(["UTC",T,"America/New_York","Europe/London","Asia/Tokyo","Asia/Tehran"])),o=e.content.querySelector("#time-zone-quick-grid"),m=new Date;o.innerHTML=t.map(x=>{const M=X(m.toISOString().slice(0,19),"UTC",x).target;return`
        <div class="studio-output-card">
          <span>${M.city}</span>
          <strong>${M.hour}:${M.minute}</strong>
          <code>${M.zoneName}</code>
        </div>
      `}).join("")},j=()=>{try{const t=X(w.value,e.content.querySelector("#time-zone-source").value,e.content.querySelector("#time-zone-target").value);e.content.querySelector("#time-zone-source-output").textContent=t.source.label,e.content.querySelector("#time-zone-target-output").textContent=t.target.label,e.content.querySelector("#time-zone-offset-output").textContent=`${t.source.zoneName} -> ${t.target.zoneName}`,c("Timezone converted.","success")}catch(t){e.content.querySelector("#time-zone-source-output").textContent=t.message,e.content.querySelector("#time-zone-target-output").textContent=t.message,e.content.querySelector("#time-zone-offset-output").textContent="Waiting for conversion.",c(t.message,"danger")}},Y=()=>{try{const t=e.content.querySelector("#time-overlap-zones").value.split(",").map(m=>m.trim()).filter(Boolean),o=de({date:e.content.querySelector("#time-overlap-date").value,zones:t,workStart:e.content.querySelector("#time-overlap-start").value,workEnd:e.content.querySelector("#time-overlap-end").value});e.content.querySelector("#time-overlap-output").innerHTML=$e(o),c("Overlap plan updated.","success")}catch(t){e.content.querySelector("#time-overlap-output").innerHTML=`<div class="studio-empty">${d(t.message)}</div>`,c(t.message,"danger")}},G=()=>{try{const t=ue(e.content.querySelector("#time-dst-zone").value,e.content.querySelector("#time-dst-year").value);e.content.querySelector("#time-dst-output").innerHTML=Ce(t),c("DST context updated.","success")}catch(t){e.content.querySelector("#time-dst-output").innerHTML=`<div class="studio-empty">${d(t.message)}</div>`,c(t.message,"danger")}},_=()=>{try{const t=me(e.content.querySelector("#time-date-math-input").value,{years:e.content.querySelector("#time-date-math-years").value,months:e.content.querySelector("#time-date-math-months").value,weeks:e.content.querySelector("#time-date-math-weeks").value,days:e.content.querySelector("#time-date-math-days").value,businessDays:e.content.querySelector("#time-date-math-business").value});e.content.querySelector("#time-date-math-output").innerHTML=`
        <span>Result</span>
        <strong>${d(t.isoDate)}</strong>
        <code>${d(t.label)}</code>
      `,c("Date math applied.","success")}catch(t){e.content.querySelector("#time-date-math-output").innerHTML=`<span>Result</span><code>${d(t.message)}</code>`,c(t.message,"danger")}},J=()=>{try{const t=pe(e.content.querySelector("#time-date-diff-start").value,e.content.querySelector("#time-date-diff-end").value);e.content.querySelector("#time-date-diff-output").innerHTML=`
        <span>Difference</span>
        <strong>${Math.abs(t.days)} days</strong>
        <code>${Math.abs(t.weeks)} weeks and ${t.remainderDays} days ${t.direction}</code>
      `,c("Date difference calculated.","success")}catch(t){e.content.querySelector("#time-date-diff-output").innerHTML=`<span>Difference</span><code>${d(t.message)}</code>`,c(t.message,"danger")}},Q=()=>{R.value=te(new Date)},U=()=>{try{const t=ee(ve(R.value));e.content.querySelector("#time-calendar-gregorian-day").textContent=t.gregorian.day,e.content.querySelector("#time-calendar-gregorian-label").textContent=t.gregorian.label,e.content.querySelector("#time-calendar-jalali-day").textContent=t.jalali.day,e.content.querySelector("#time-calendar-jalali-label").textContent=t.jalali.label,e.content.querySelector("#time-calendar-islamic-day").textContent=t.islamic.day,e.content.querySelector("#time-calendar-islamic-label").textContent=t.islamic.label,c("Calendar updated.","success")}catch(t){e.content.querySelector("#time-calendar-gregorian-day").textContent="--",e.content.querySelector("#time-calendar-gregorian-label").textContent=t.message,e.content.querySelector("#time-calendar-jalali-day").textContent="--",e.content.querySelector("#time-calendar-jalali-label").textContent=t.message,e.content.querySelector("#time-calendar-islamic-day").textContent="--",e.content.querySelector("#time-calendar-islamic-label").textContent=t.message,c(t.message,"danger")}};i.push(...Array.from(e.content.querySelectorAll("[data-time-tab]")).map(t=>u(t,"click",()=>ie(t.dataset.timeTab)))),i.push(u(e.content.querySelector("#time-stopwatch-start"),"click",()=>{q||(I=Date.now(),q=setInterval(L,25),e.content.querySelector("#time-stopwatch-start").classList.add("hidden"),e.content.querySelector("#time-stopwatch-stop").classList.remove("hidden"),c("Stopwatch running.","neutral"))})),i.push(u(e.content.querySelector("#time-stopwatch-stop"),"click",()=>{N(),L(),c("Stopwatch paused.","neutral")})),i.push(u(e.content.querySelector("#time-stopwatch-reset"),"click",()=>{N(),z=0,L(),c("Stopwatch reset.","neutral")})),i.push(u(e.content.querySelector("#time-timer-start"),"click",()=>{const t=Number(e.content.querySelector("#time-timer-hours").value||0),o=Number(e.content.querySelector("#time-timer-minutes").value||0),m=Number(e.content.querySelector("#time-timer-seconds").value||0);if(g=t*3600+o*60+m,g<=0){c("Enter a countdown above zero.","danger");return}clearInterval($),v.textContent=E(g),$=setInterval(()=>{g-=1,v.textContent=E(Math.max(g,0)),g<=0&&(H(),K("Timer finished.","success"),c("Timer finished.","success"))},1e3),e.content.querySelector("#time-timer-start").classList.add("hidden"),e.content.querySelector("#time-timer-stop").classList.remove("hidden"),c("Timer running.","neutral")})),i.push(u(e.content.querySelector("#time-timer-stop"),"click",()=>{clearInterval($),$=null,e.content.querySelector("#time-timer-start").classList.remove("hidden"),e.content.querySelector("#time-timer-stop").classList.add("hidden"),c("Timer paused.","neutral")})),i.push(u(e.content.querySelector("#time-timer-reset"),"click",()=>{H(),c("Timer reset.","neutral")})),i.push(u(e.content.querySelector("#time-alarm-add"),"click",()=>{const t=e.content.querySelector("#time-alarm-input").value;if(!t){c("Choose an alarm time first.","danger");return}h.includes(t)||(h=[...h,t].sort()),D(),c(`Alarm saved for ${t}.`,"success")})),i.push(u(e.content.querySelector("#time-epoch-convert"),"click",P)),i.push(u(e.content.querySelector("#time-epoch-now"),"click",()=>{e.content.querySelector("#time-epoch-input").value=`${Math.floor(Date.now()/1e3)}`,P()})),i.push(u(e.content.querySelector("#time-zone-convert"),"click",j)),i.push(u(e.content.querySelector("#time-zone-now"),"click",()=>{V(),j()})),i.push(u(e.content.querySelector("#time-overlap-build"),"click",Y)),i.push(u(e.content.querySelector("#time-dst-build"),"click",G)),i.push(u(e.content.querySelector("#time-date-math-apply"),"click",_)),i.push(u(e.content.querySelector("#time-date-diff-apply"),"click",J)),i.push(u(e.content.querySelector("#time-calendar-apply"),"click",U)),i.push(u(e.content.querySelector("#time-calendar-today"),"click",()=>{Q(),U()})),i.push(u(e.content.querySelector("#time-world-add"),"click",()=>{const t=e.content.querySelector("#time-world-zone").value;S.includes(t)||(S=[...S,t]),O(),c("World clock added.","success")})),i.push(u(e.content.querySelector("#time-world-clock-grid"),"click",t=>{const o=t.target.closest("[data-world-remove]");o&&(S=S.filter(m=>m!==o.dataset.worldRemove),O(),c("World clock removed.","neutral"))})),W=setInterval(F,1e3);const re=setInterval(B,6e4);Z=setInterval(()=>{const t=new Date,o=`${t.getHours().toString().padStart(2,"0")}:${t.getMinutes().toString().padStart(2,"0")}`;h.includes(o)&&(h=h.filter(m=>m!==o),D(),K(`Alarm ${o}`,"success"),c(`Alarm fired at ${o}.`,"success"))},15e3),F(),L(),v.textContent=E(0),D(),V(),se(),B(),l==="timezone"&&j(),Y(),G(),_(),J(),Q(),l==="calendar"&&U(),p={root:e.root,cleanup:i,timers:[W,re,Z],stopStopwatch:N,resetTimer:H}}function xe(){var a,n,s;if(p){for(const r of p.cleanup)r();(a=p.stopStopwatch)==null||a.call(p),(n=p.resetTimer)==null||n.call(p);for(const r of p.timers)clearInterval(r);(s=p.root)==null||s.remove(),p=null}}function u(a,n,s){return a?(a.addEventListener(n,s),()=>a.removeEventListener(n,s)):()=>{}}export{Le as m,xe as u};
