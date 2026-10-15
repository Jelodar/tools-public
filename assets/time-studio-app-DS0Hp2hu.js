import{e as c,b as re,T as ce}from"./index-ATPg-6Fd.js";import{s as Q}from"./ui-utils-BycjcbQ0.js";import{r as K,b as le,s as de,a as ue,g as me,d as X,p as pe,f as ve}from"./studio-CKR8zP_U.js";import{c as he}from"./studio-shell-DA5EhZrc.js";function ae(a,n,s=""){const r=String(s||"").trim().toLowerCase(),d=a.filter(i=>!r||i.toLowerCase().includes(r));return(d.some(i=>i===n)?d:[n,...d].filter(Boolean)).map(i=>`<option value="${c(i)}"${i===n?" selected":""}>${c(i)}</option>`).join("")}function M({id:a,label:n,options:s,selected:r,placeholder:d="Filter options"}){return`
    <label class="studio-field searchable-select-field" data-searchable-select="${c(a)}">
      <span>${c(n)}</span>
      <input id="${c(a)}-search" class="searchable-select-input" type="search" placeholder="${c(d)}">
      <select id="${c(a)}" data-searchable-select-menu>
        ${ae(s,r)}
      </select>
    </label>
  `}function ye(a,n,s){var v,T,b;const r=(v=a==null?void 0:a.querySelector)==null?void 0:v.call(a,`[data-searchable-select="${n}"]`),d=(T=r==null?void 0:r.querySelector)==null?void 0:T.call(r,`#${n}-search`),e=(b=r==null?void 0:r.querySelector)==null?void 0:b.call(r,`#${n}`);if(!r||!d||!e)return()=>{};const i=()=>{const f=e.value;e.innerHTML=ae(s,f,d.value)},y=f=>{f.key!=="Escape"||!d.value||(d.value="",i())};return d.addEventListener("input",i),d.addEventListener("keydown",y),()=>{d.removeEventListener("input",i),d.removeEventListener("keydown",y)}}let p=null;const $=typeof Intl.supportedValuesOf=="function"?Intl.supportedValuesOf("timeZone"):["UTC"],C=Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC";function ge(a){return ce.find(n=>n.id===a)}function Se(a){return`
    <div class="studio-stack">
      <section class="card studio-card time-world-card">
        <div class="studio-panel-head">
          <h3>World Clocks</h3>
        </div>
        <div class="studio-toolbar">
          <div class="studio-toolbar-group">
            ${M({id:"time-world-zone",label:"Add Timezone",options:$,selected:"Asia/Tehran",placeholder:"Search timezone"})}
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
              ${M({id:"time-zone-source",label:"Source Timezone",options:$,selected:C,placeholder:"Search source"})}
              ${M({id:"time-zone-target",label:"Target Timezone",options:$,selected:"UTC",placeholder:"Search target"})}
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
                  <input id="time-overlap-zones" type="text" value="${C}, UTC, America/New_York">
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
                ${M({id:"time-dst-zone",label:"Timezone",options:$,selected:C,placeholder:"Search timezone"})}
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
  `}function be(a){const n=Math.floor(a/10),s=Math.floor(n/36e4),r=Math.floor(n%36e4/6e3),d=Math.floor(n%6e3/100),e=n%100;return`${s.toString().padStart(2,"0")}:${r.toString().padStart(2,"0")}:${d.toString().padStart(2,"0")}.${e.toString().padStart(2,"0")}`}function A(a){const n=Math.floor(a/3600),s=Math.floor(a%3600/60),r=a%60;return`${n.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}:${r.toString().padStart(2,"0")}`}function ee(a){return`${a.getFullYear()}-${String(a.getMonth()+1).padStart(2,"0")}-${String(a.getDate()).padStart(2,"0")}`}function te(a){const n=a>=0?"+":"-",s=Math.abs(a);return`UTC${n}${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`}function fe(a,n){var i;const s=new Intl.DateTimeFormat("en-US",{timeZone:n,weekday:"short",month:"short",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23",timeZoneName:"short"}).formatToParts(a).reduce((y,v)=>(v.type!=="literal"&&(y[v.type]=v.value),y),{}),r=Number(s.hour||0),d=Number(s.minute||0),e=Number(s.second||0);return{timeZone:n,city:((i=n.split("/").pop())==null?void 0:i.replace(/_/g," "))||n,dateLabel:`${s.weekday}, ${s.month} ${s.day}`,timeLabel:`${String(r).padStart(2,"0")}:${String(d).padStart(2,"0")}`,zoneName:s.timeZoneName||n,hourAngle:r%12*30+d*.5,minuteAngle:d*6,secondAngle:e*6}}function we(a){return`
    <div class="time-world-clock-card" data-world-zone="${c(a.timeZone)}">
      <div class="time-world-clock-copy">
        <span>${c(a.city)}</span>
        <strong>${c(a.timeLabel)}</strong>
        <code>${c(a.zoneName)} ${c(a.dateLabel)}</code>
      </div>
      <div class="time-analog-clock">
        <i data-clock-hand="hour" data-angle="${a.hourAngle}"></i>
        <i data-clock-hand="minute" data-angle="${a.minuteAngle}"></i>
        <i data-clock-hand="second" data-angle="${a.secondAngle}"></i>
      </div>
      <button type="button" class="btn-secondary time-world-remove" data-world-remove="${c(a.timeZone)}">Remove</button>
    </div>
  `}function qe(a){return a.slots.length?a.slots.slice(0,12).map(n=>`
    <div class="time-overlap-slot">
      <strong>${c(n.label)}</strong>
      <div>
        ${n.localTimes.map(s=>`
          <span>${c(s.city)} ${c(s.hour)}:${c(s.minute)} ${c(s.zoneName)}</span>
        `).join("")}
      </div>
    </div>
  `).join(""):'<div class="studio-empty">No shared working window for those zones.</div>'}function $e(a){return a.observesDst?a.transitions.map(n=>`
    <div class="time-dst-card">
      <strong>${c(n.date)} ${n.direction==="forward"?"Forward":"Back"}</strong>
      <span>${te(n.fromOffsetMinutes)} to ${te(n.toOffsetMinutes)}</span>
    </div>
  `).join(""):`
      <div class="time-dst-card">
        <strong>${c(a.timeZone)}</strong>
        <span>No DST transition detected in ${c(a.year)}.</span>
      </div>
    `}async function De(a,n){const s=ge(n),r=re(n),d={"epoch-and-date":"epoch","time-converter":"epoch","timezone-converter":"timezone","calendar-converter":"calendar","calendar-tool":"calendar"}[n]||"stopwatch",e=he(a,{className:"time-studio-shell",eyebrow:r.title,title:s.title,description:{"epoch-and-date":"Epoch conversion now lives beside timers, timezone planning, and calendar views so time workflows stay together.","time-converter":"Epoch conversion now lives beside timers, timezone planning, and calendar views so time workflows stay together.","timezone-converter":"Timezone conversion now runs inside Time Studio with current-world quick references and route-safe compatibility.","calendar-converter":"Gregorian, Jalali, and Islamic calendar views now share the same studio as timers and timezone planning.","calendar-tool":"Gregorian, Jalali, and Islamic calendar views now share the same studio as timers and timezone planning."}[n]||"Switch between precision timing, countdowns, alarms, timestamp conversion, timezone planning, and calendar views.",toolIds:r.toolIds,activeToolId:n,metrics:[{key:"timezone",label:"Timezone",value:Intl.DateTimeFormat().resolvedOptions().timeZone||"Local"},{key:"clock",label:"Local Time",value:new Date().toLocaleTimeString()}]});e.content.innerHTML=Se(d);const i=[],y=e.content.querySelector("#time-stopwatch-display"),v=e.content.querySelector("#time-timer-display"),T=e.content.querySelector("#time-epoch-current"),b=e.content.querySelector("#time-alarm-list"),f=e.content.querySelector("#time-zone-input"),U=e.content.querySelector("#time-calendar-input");let k=0,E=0,w=null,g=0,q=null,R=null,W=null,h=[],S=Array.from(new Set([C,"Asia/Tehran"]));["time-world-zone","time-zone-source","time-zone-target","time-dst-zone"].forEach(t=>{i.push(ye(e.content,t,$))});const l=(t,o="neutral")=>e.setStatus(t,o);function I(){const t=e.content.querySelector("#time-world-clock-grid"),o=new Date;t.innerHTML=S.map(m=>we(fe(o,m))).join(""),t.querySelectorAll("[data-clock-hand]").forEach(m=>{m.style.transform=`rotate(${Number(m.dataset.angle)||0}deg)`}),t.querySelectorAll(".time-world-remove").forEach(m=>{m.classList.toggle("hidden",S.length<=1)})}function ne(){const t=e.content.querySelector("#time-current-date-formats"),o=X(new Date);t.innerHTML=[["Gregorian",o.gregorian],["Persian Calendar",o.jalali],["Arabic Calendar",o.islamic]].map(([m,L])=>`
      <div class="studio-output-card">
        <span>${c(m)}</span>
        <strong>${c(L.day)}</strong>
        <code>${c(L.label)}</code>
      </div>
    `).join("")}const Z=()=>{e.setMetric("clock",new Date().toLocaleTimeString()),T.textContent=`${Math.floor(Date.now()/1e3)}`,I(),ne()},z=()=>{if(!h.length){b.innerHTML='<div class="studio-empty">No alarms yet.</div>';return}b.innerHTML=h.map((t,o)=>`
      <div class="studio-list-item">
        <div>
          <strong>${t}</strong>
          <span>Local clock alarm</span>
        </div>
        <button class="btn-secondary" data-alarm-remove="${o}">Remove</button>
      </div>
    `).join(""),b.querySelectorAll("[data-alarm-remove]").forEach(t=>{i.push(u(t,"click",()=>{h=h.filter((o,m)=>m!==Number(t.dataset.alarmRemove)),z(),l("Alarm removed.","neutral")}))})},oe=t=>{e.content.querySelectorAll("[data-time-tab]").forEach(o=>{o.classList.toggle("active",o.dataset.timeTab===t)}),e.content.querySelectorAll(".time-view").forEach(o=>{o.classList.toggle("hidden",o.dataset.view!==t)})},D=()=>{const t=w?k+(Date.now()-E):k;y.textContent=be(t)},O=()=>{w&&(clearInterval(w),w=null,k+=Date.now()-E,e.content.querySelector("#time-stopwatch-start").classList.remove("hidden"),e.content.querySelector("#time-stopwatch-stop").classList.add("hidden"))},N=()=>{clearInterval(q),q=null,g=0,v.textContent=A(0),e.content.querySelector("#time-timer-start").classList.remove("hidden"),e.content.querySelector("#time-timer-stop").classList.add("hidden")},F=()=>{const t=e.content.querySelector("#time-epoch-input").value;try{const o=ve(t);e.content.querySelector("#time-epoch-unit").textContent=o.detectedUnit,e.content.querySelector("#time-epoch-local").textContent=o.local,e.content.querySelector("#time-epoch-utc").textContent=o.utc,e.content.querySelector("#time-epoch-iso").textContent=o.iso,l("Timestamp converted.","success")}catch(o){e.content.querySelector("#time-epoch-unit").textContent="Invalid",e.content.querySelector("#time-epoch-local").textContent=o.message,e.content.querySelector("#time-epoch-utc").textContent=o.message,e.content.querySelector("#time-epoch-iso").textContent=o.message,l(o.message,"danger")}},P=()=>{const t=new Date;t.setMinutes(t.getMinutes()-t.getTimezoneOffset()),f.value=t.toISOString().slice(0,16)},ie=()=>{const t=ee(new Date);e.content.querySelector("#time-overlap-date").value=t,e.content.querySelector("#time-date-math-input").value=t,e.content.querySelector("#time-date-diff-start").value=t,e.content.querySelector("#time-date-diff-end").value=t},V=()=>{const t=Array.from(new Set(["UTC",C,"America/New_York","Europe/London","Asia/Tokyo","Asia/Tehran"])),o=e.content.querySelector("#time-zone-quick-grid"),m=new Date;o.innerHTML=t.map(L=>{const x=K(m.toISOString().slice(0,19),"UTC",L).target;return`
        <div class="studio-output-card">
          <span>${x.city}</span>
          <strong>${x.hour}:${x.minute}</strong>
          <code>${x.zoneName}</code>
        </div>
      `}).join("")},j=()=>{try{const t=K(f.value,e.content.querySelector("#time-zone-source").value,e.content.querySelector("#time-zone-target").value);e.content.querySelector("#time-zone-source-output").textContent=t.source.label,e.content.querySelector("#time-zone-target-output").textContent=t.target.label,e.content.querySelector("#time-zone-offset-output").textContent=`${t.source.zoneName} -> ${t.target.zoneName}`,l("Timezone converted.","success")}catch(t){e.content.querySelector("#time-zone-source-output").textContent=t.message,e.content.querySelector("#time-zone-target-output").textContent=t.message,e.content.querySelector("#time-zone-offset-output").textContent="Waiting for conversion.",l(t.message,"danger")}},B=()=>{try{const t=e.content.querySelector("#time-overlap-zones").value.split(",").map(m=>m.trim()).filter(Boolean),o=le({date:e.content.querySelector("#time-overlap-date").value,zones:t,workStart:e.content.querySelector("#time-overlap-start").value,workEnd:e.content.querySelector("#time-overlap-end").value});e.content.querySelector("#time-overlap-output").innerHTML=qe(o),l("Overlap plan updated.","success")}catch(t){e.content.querySelector("#time-overlap-output").innerHTML=`<div class="studio-empty">${c(t.message)}</div>`,l(t.message,"danger")}},Y=()=>{try{const t=de(e.content.querySelector("#time-dst-zone").value,e.content.querySelector("#time-dst-year").value);e.content.querySelector("#time-dst-output").innerHTML=$e(t),l("DST context updated.","success")}catch(t){e.content.querySelector("#time-dst-output").innerHTML=`<div class="studio-empty">${c(t.message)}</div>`,l(t.message,"danger")}},G=()=>{try{const t=ue(e.content.querySelector("#time-date-math-input").value,{years:e.content.querySelector("#time-date-math-years").value,months:e.content.querySelector("#time-date-math-months").value,weeks:e.content.querySelector("#time-date-math-weeks").value,days:e.content.querySelector("#time-date-math-days").value,businessDays:e.content.querySelector("#time-date-math-business").value});e.content.querySelector("#time-date-math-output").innerHTML=`
        <span>Result</span>
        <strong>${c(t.isoDate)}</strong>
        <code>${c(t.label)}</code>
      `,l("Date math applied.","success")}catch(t){e.content.querySelector("#time-date-math-output").innerHTML=`<span>Result</span><code>${c(t.message)}</code>`,l(t.message,"danger")}},_=()=>{try{const t=me(e.content.querySelector("#time-date-diff-start").value,e.content.querySelector("#time-date-diff-end").value);e.content.querySelector("#time-date-diff-output").innerHTML=`
        <span>Difference</span>
        <strong>${Math.abs(t.days)} days</strong>
        <code>${Math.abs(t.weeks)} weeks and ${t.remainderDays} days ${t.direction}</code>
      `,l("Date difference calculated.","success")}catch(t){e.content.querySelector("#time-date-diff-output").innerHTML=`<span>Difference</span><code>${c(t.message)}</code>`,l(t.message,"danger")}},J=()=>{U.value=ee(new Date)},H=()=>{try{const t=X(pe(U.value));e.content.querySelector("#time-calendar-gregorian-day").textContent=t.gregorian.day,e.content.querySelector("#time-calendar-gregorian-label").textContent=t.gregorian.label,e.content.querySelector("#time-calendar-jalali-day").textContent=t.jalali.day,e.content.querySelector("#time-calendar-jalali-label").textContent=t.jalali.label,e.content.querySelector("#time-calendar-islamic-day").textContent=t.islamic.day,e.content.querySelector("#time-calendar-islamic-label").textContent=t.islamic.label,l("Calendar updated.","success")}catch(t){e.content.querySelector("#time-calendar-gregorian-day").textContent="--",e.content.querySelector("#time-calendar-gregorian-label").textContent=t.message,e.content.querySelector("#time-calendar-jalali-day").textContent="--",e.content.querySelector("#time-calendar-jalali-label").textContent=t.message,e.content.querySelector("#time-calendar-islamic-day").textContent="--",e.content.querySelector("#time-calendar-islamic-label").textContent=t.message,l(t.message,"danger")}};i.push(...Array.from(e.content.querySelectorAll("[data-time-tab]")).map(t=>u(t,"click",()=>oe(t.dataset.timeTab)))),i.push(u(e.content.querySelector("#time-stopwatch-start"),"click",()=>{w||(E=Date.now(),w=setInterval(D,25),e.content.querySelector("#time-stopwatch-start").classList.add("hidden"),e.content.querySelector("#time-stopwatch-stop").classList.remove("hidden"),l("Stopwatch running.","neutral"))})),i.push(u(e.content.querySelector("#time-stopwatch-stop"),"click",()=>{O(),D(),l("Stopwatch paused.","neutral")})),i.push(u(e.content.querySelector("#time-stopwatch-reset"),"click",()=>{O(),k=0,D(),l("Stopwatch reset.","neutral")})),i.push(u(e.content.querySelector("#time-timer-start"),"click",()=>{const t=Number(e.content.querySelector("#time-timer-hours").value||0),o=Number(e.content.querySelector("#time-timer-minutes").value||0),m=Number(e.content.querySelector("#time-timer-seconds").value||0);if(g=t*3600+o*60+m,g<=0){l("Enter a countdown above zero.","danger");return}clearInterval(q),v.textContent=A(g),q=setInterval(()=>{g-=1,v.textContent=A(Math.max(g,0)),g<=0&&(N(),Q("Timer finished.","success"),l("Timer finished.","success"))},1e3),e.content.querySelector("#time-timer-start").classList.add("hidden"),e.content.querySelector("#time-timer-stop").classList.remove("hidden"),l("Timer running.","neutral")})),i.push(u(e.content.querySelector("#time-timer-stop"),"click",()=>{clearInterval(q),q=null,e.content.querySelector("#time-timer-start").classList.remove("hidden"),e.content.querySelector("#time-timer-stop").classList.add("hidden"),l("Timer paused.","neutral")})),i.push(u(e.content.querySelector("#time-timer-reset"),"click",()=>{N(),l("Timer reset.","neutral")})),i.push(u(e.content.querySelector("#time-alarm-add"),"click",()=>{const t=e.content.querySelector("#time-alarm-input").value;if(!t){l("Choose an alarm time first.","danger");return}h.includes(t)||(h=[...h,t].sort()),z(),l(`Alarm saved for ${t}.`,"success")})),i.push(u(e.content.querySelector("#time-epoch-convert"),"click",F)),i.push(u(e.content.querySelector("#time-epoch-now"),"click",()=>{e.content.querySelector("#time-epoch-input").value=`${Math.floor(Date.now()/1e3)}`,F()})),i.push(u(e.content.querySelector("#time-zone-convert"),"click",j)),i.push(u(e.content.querySelector("#time-zone-now"),"click",()=>{P(),j()})),i.push(u(e.content.querySelector("#time-overlap-build"),"click",B)),i.push(u(e.content.querySelector("#time-dst-build"),"click",Y)),i.push(u(e.content.querySelector("#time-date-math-apply"),"click",G)),i.push(u(e.content.querySelector("#time-date-diff-apply"),"click",_)),i.push(u(e.content.querySelector("#time-calendar-apply"),"click",H)),i.push(u(e.content.querySelector("#time-calendar-today"),"click",()=>{J(),H()})),i.push(u(e.content.querySelector("#time-world-add"),"click",()=>{const t=e.content.querySelector("#time-world-zone").value;S.includes(t)||(S=[...S,t]),I(),l("World clock added.","success")})),i.push(u(e.content.querySelector("#time-world-clock-grid"),"click",t=>{const o=t.target.closest("[data-world-remove]");o&&(S=S.filter(m=>m!==o.dataset.worldRemove),I(),l("World clock removed.","neutral"))})),R=setInterval(Z,1e3);const se=setInterval(V,6e4);W=setInterval(()=>{const t=new Date,o=`${t.getHours().toString().padStart(2,"0")}:${t.getMinutes().toString().padStart(2,"0")}`;h.includes(o)&&(h=h.filter(m=>m!==o),z(),Q(`Alarm ${o}`,"success"),l(`Alarm fired at ${o}.`,"success"))},15e3),Z(),D(),v.textContent=A(0),z(),P(),ie(),V(),d==="timezone"&&j(),B(),Y(),G(),_(),J(),d==="calendar"&&H(),p={root:e.root,cleanup:i,timers:[R,se,W],stopStopwatch:O,resetTimer:N}}function Le(){var a,n,s;if(p){for(const r of p.cleanup)r();(a=p.stopStopwatch)==null||a.call(p),(n=p.resetTimer)==null||n.call(p);for(const r of p.timers)clearInterval(r);(s=p.root)==null||s.remove(),p=null}}function u(a,n,s){return a?(a.addEventListener(n,s),()=>a.removeEventListener(n,s)):()=>{}}export{De as m,Le as u};
