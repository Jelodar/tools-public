import{g as ye}from"./pool-B8YPuBrh.js";import{s as ve}from"./drag-drop-ekerx5Fy.js";import{c as te}from"./modal-DKefIaRW.js";import{a as he}from"./ui-monaco-CRF4nTOZ.js";import{s as H,d as G}from"./ui-utils-CG6aKAAj.js";import"./index-C4lglzE7.js";function v(t){const e=String(t??"").trim();if(!e)throw new Error("Identifier is required.");return`"${e.replace(/"/g,'""')}"`}function Se(t,e,l=1e3){const a=Math.floor(Number(t));return!Number.isFinite(a)||a<0?e:Math.min(l,a)}function Y(t={}){return Object.entries(t).filter(([e])=>e!=="__rowid__"&&String(e||"").trim()).map(([e,l])=>[String(e),l===""?null:l])}function ge(t){const e=String(t||"TEXT").trim().toUpperCase();return["INTEGER","REAL","TEXT","BLOB","NUMERIC"].includes(e)?e:"TEXT"}function Ee(t={}){const e=v(t.tableName),l=Array.isArray(t.columns)?t.columns.filter(Boolean).map(String):[],a=String(t.filter??"").trim(),s=[],o=a&&l.length?` WHERE ${l.map(T=>(s.push(`%${a}%`),`CAST(${v(T)} AS TEXT) LIKE ?`)).join(" OR ")}`:"",i=l.includes(t.orderBy)||t.orderBy==="rowid"?t.orderBy:"",q=i?` ORDER BY ${i==="rowid"?"rowid":v(i)} ${String(t.orderDirection).toUpperCase()==="DESC"?"DESC":"ASC"}`:"",y=100,D=Se(t.offset,0,1e9);return s.push(y,D),{sql:`SELECT rowid AS __rowid__, * FROM ${e}${o}${q} LIMIT ? OFFSET ?`,params:s}}function Te(t={}){const e=Y(t.values);if(!e.length)throw new Error("At least one column value is required.");return{sql:`INSERT INTO ${v(t.tableName)} (${e.map(([l])=>v(l)).join(", ")}) VALUES (${e.map(()=>"?").join(", ")})`,params:e.map(([,l])=>l)}}function $e(t={}){const l=(Array.isArray(t.columns)?t.columns:[]).filter(a=>String((a==null?void 0:a.name)||"").trim()).map(a=>{const s=[v(a.name),ge(a.type)];return a.primaryKey&&s.push("PRIMARY KEY"),a.notNull&&!a.primaryKey&&s.push("NOT NULL"),a.unique&&!a.primaryKey&&s.push("UNIQUE"),a.defaultValue!==void 0&&String(a.defaultValue).trim()!==""&&s.push(`DEFAULT ${String(a.defaultValue).replace(/;/g,"")}`),s.join(" ")});if(!l.length)throw new Error("At least one column is required.");return{sql:`CREATE TABLE ${v(t.tableName)} (${l.join(", ")})`,params:[]}}function Le(t={}){return{sql:`DROP TABLE ${v(t.tableName)}`,params:[]}}function P(t={}){const e=Y(t.values),l=Number(t.rowid);if(!Number.isFinite(l))throw new Error("A rowid is required for updates.");if(!e.length)throw new Error("At least one column value is required.");return{sql:`UPDATE ${v(t.tableName)} SET ${e.map(([a])=>`${v(a)} = ?`).join(", ")} WHERE rowid = ?`,params:[...e.map(([,a])=>a),l]}}function Ne(t={}){const e=Number(t.rowid);if(!Number.isFinite(e))throw new Error("A rowid is required for deletion.");return{sql:`DELETE FROM ${v(t.tableName)} WHERE rowid = ?`,params:[e]}}function xe(t={}){const e=t.row||{},l=Number(e.__rowid__);if(!Number.isFinite(l))throw new Error("A rowid is required for row restore.");const a=Y(e);return{sql:`INSERT INTO ${v(t.tableName)} (rowid${a.length?`, ${a.map(([s])=>v(s)).join(", ")}`:""}) VALUES (${["?",...a.map(()=>"?")].join(", ")})`,params:[l,...a.map(([,s])=>s)]}}function le(t){return t==null?"":`"${String(t).replace(/"/g,'""')}"`}function ke(t={}){const e=Array.isArray(t.columns)?t.columns:[],l=Array.isArray(t.values)?t.values:[];return[e.map(le).join(","),...l.map(a=>(Array.isArray(a)?a:[]).map(le).join(","))].join(`
`)}function Ce(t={}){const e=Array.isArray(t.columns)?t.columns:[];return(Array.isArray(t.values)?t.values:[]).map(a=>Object.fromEntries(e.map((s,o)=>[s,a[o]])))}function re(t){return String(t||"").replace(/\s+/g," ").trim()}let r=null,B=[],_=null,O="",f=null,L=null,N=null,u={objects:[],tables:[],views:[],indexes:[],triggers:[]},b=null,n=null,d=null,h=null,$=null,w=null,I=[],k=[],x=[{name:"id",type:"INTEGER",primaryKey:!0,notNull:!1,unique:!1,defaultValue:""},{name:"name",type:"TEXT",primaryKey:!1,notNull:!1,unique:!1,defaultValue:""}];function m(t,e,l){t==null||t.addEventListener(e,l),B.push(()=>t==null?void 0:t.removeEventListener(e,l))}function p(t){return String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function c(){return{dropZone:r.querySelector("#db-drop-zone"),fileInput:r.querySelector("#db-input"),dbName:r.querySelector("#active-db-name"),ui:r.querySelector("#db-explorer-ui"),objectFilter:r.querySelector("#sqlite-object-filter"),objectList:r.querySelector("#sqlite-object-list"),schemaTitle:r.querySelector("#sqlite-schema-title"),schemaBody:r.querySelector("#sqlite-schema-body"),browseTable:r.querySelector("#sqlite-browse-table"),browseFilter:r.querySelector("#sqlite-browse-filter"),browseOrder:r.querySelector("#sqlite-browse-order"),browseDirection:r.querySelector("#sqlite-browse-direction"),browseLimit:r.querySelector("#sqlite-browse-limit"),browseOffset:r.querySelector("#sqlite-browse-offset"),browseFirst:r.querySelector("#sqlite-browse-first"),browsePrev:r.querySelector("#sqlite-browse-prev"),browseNext:r.querySelector("#sqlite-browse-next"),browseLast:r.querySelector("#sqlite-browse-last"),browsePageIndex:r.querySelector("#sqlite-browse-page-index"),browsePage:r.querySelector("#sqlite-browse-page"),createTable:r.querySelector("#sqlite-create-table"),createColumns:r.querySelector("#sqlite-create-columns"),rowEditor:r.querySelector("#sqlite-row-editor"),rowEditorTitle:r.querySelector("#sqlite-row-editor-title"),resultsHead:r.querySelector("#results-head"),resultsBody:r.querySelector("#results-body"),status:r.querySelector("#sqlite-status"),history:r.querySelector("#sqlite-query-history"),undoLog:r.querySelector("#sqlite-undo-log"),cellTitle:r.querySelector("#sqlite-cell-title"),cellMeta:r.querySelector("#sqlite-cell-meta"),cellValue:r.querySelector("#sqlite-cell-value"),cellEditValue:r.querySelector("#sqlite-cell-edit-value"),cellApply:r.querySelector("#btn-sqlite-apply-cell"),latestUndo:r.querySelector("#btn-sqlite-undo-latest")}}function S(t,e="muted"){const l=c().status;l&&(l.textContent=t,l.dataset.tone=e)}function _e(t,e="muted"){S(t,e)}function ie(t,e,l,a){const s=Math.floor(Number(t));return Number.isFinite(s)?Math.min(a,Math.max(l,s)):e}function je(t){var e;(e=t==null?void 0:t.scrollIntoView)==null||e.call(t,{block:"center",inline:"nearest"})}function ne(t){t!=null&&t.scrollIntoView&&t.scrollIntoView({block:"center",inline:"nearest"})}function j(t){const e=t||"browse";r==null||r.querySelectorAll("[data-sqlite-workspace-tab]").forEach(l=>{l.classList.toggle("is-active",l.dataset.sqliteWorkspaceTab===e)}),r==null||r.querySelectorAll("[data-sqlite-workspace-panel]").forEach(l=>{l.classList.toggle("is-active",l.dataset.sqliteWorkspacePanel===e)}),ne(r==null?void 0:r.querySelector(`[data-sqlite-workspace-panel="${e}"]`))}function oe(t){const e=c();O=t||"Untitled database",e.dbName.textContent=`Current: ${O}`,e.ui.classList.remove("hidden"),r.querySelector("#btn-sqlite-download-db").disabled=!1}function Me(){_=null,O="",u={objects:[],tables:[],views:[],indexes:[],triggers:[]},b=null,n=null,d=null,h=null,$=null,w=null,k=[]}function Ae(t="Open or create a database."){Me();const e=c();e.dbName.textContent="No database loaded",e.ui.classList.add("hidden"),r.querySelector("#btn-sqlite-download-db").disabled=!0,e.objectFilter.value="",e.objectList.innerHTML="",e.browseTable.innerHTML="",e.browseOrder.innerHTML="",e.browseFilter.value="",e.browseDirection.value="ASC",e.browseLimit.value="100",e.browseOffset.value="0",A(0),e.schemaTitle.textContent="Schema",e.schemaBody.innerHTML='<div class="sqlite-empty-note">Select a database object.</div>',e.rowEditorTitle.textContent="Row Editor",e.rowEditor.innerHTML='<div class="sqlite-empty-note">Select a table to edit rows.</div>',e.resultsHead.innerHTML="",e.resultsBody.innerHTML="",X(),_e(t)}function Re(t,e){const l=t||"Selected file",a=r.querySelector("#sqlite-error-detail");a&&(a.textContent=`${l} could not be opened. SQLite reported: ${e.message}. The workspace was cleared so stale tables are not shown.`),L==null||L.open("sqlite-import-error")}function De(t,e){const l=c();$=t;const a=h==null?void 0:h.__rowid__,s=e==null?"NULL":String(e);l.cellTitle.textContent=t?`Cell: ${t}`:"Cell Detail",l.cellMeta.textContent=[n?`Table ${n}`:"",a!==void 0?`rowid ${a}`:"",`${s.length} characters`].filter(Boolean).join(" / "),l.cellValue.textContent=s,l.cellEditValue.value=e==null?"":String(e),l.cellApply.disabled=!n||!t||t==="__rowid__"||a===void 0,me(),N==null||N.open("cell-detail"),j("results"),ne(l.cellValue)}async function ce(){if(f)return;const{editor:t,monaco:e}=await he(r.querySelector("#monaco-sql-editor"),{value:"SELECT name, type, sql FROM sqlite_master ORDER BY type, name;",language:"sql",renderLineHighlight:"all",minimap:{enabled:!1}});f=t,f.addCommand(e.KeyMod.CtrlCmd|e.KeyCode.Enter,fe)}async function E(t,e=[],l={}){const a=await ye.run("sqlite-query",{dbBuffer:_,sql:t,params:e,includeMetadata:l.includeMetadata!==!1});if(!a.success)throw new Error(a.error||"SQLite task failed.");const s=a.result||{};return s.dbBuffer&&(_=s.dbBuffer),s.metadata&&(u=s.metadata),s}function F(t=n){return u.tables.find(e=>e.name===t)||null}function M(){const t=c(),e=String(t.objectFilter.value||"").trim().toLowerCase(),l=[["Tables",u.tables],["Views",u.views],["Indexes",u.indexes],["Triggers",u.triggers]];t.objectList.innerHTML=l.map(([a,s])=>{const o=s.filter(i=>`${i.name} ${i.tableName||""}`.toLowerCase().includes(e));return o.length?`
      <div class="sqlite-object-group">
        <div class="sqlite-object-group-title">${a}</div>
        ${o.map(i=>`
          <button class="sqlite-object-item${(b==null?void 0:b.name)===i.name&&(b==null?void 0:b.type)===i.type?" selected":""}" type="button" data-object-type="${p(i.type)}" data-object-name="${p(i.name)}">
            <span>${p(i.name)}</span>
            <small>${i.type==="table"?`${Number(i.rowCount)||0} rows`:p(i.tableName||i.type)}</small>
          </button>
        `).join("")}
      </div>
    `:""}).join("")||'<div class="sqlite-empty-note">No matching objects.</div>',t.objectList.querySelectorAll(".sqlite-object-item").forEach(a=>{a.addEventListener("click",()=>{be(a.dataset.objectType,a.dataset.objectName)})})}function V(){var e,l;const t=c();t.browseTable.innerHTML=u.tables.map(a=>`<option value="${p(a.name)}">${p(a.name)}</option>`).join(""),t.browseTable.value=n||((e=u.tables[0])==null?void 0:e.name)||"",de(),A(((l=w==null?void 0:w.values)==null?void 0:l.length)||0)}function de(){const t=c(),e=F(t.browseTable.value),l=t.browseOrder.value;t.browseOrder.innerHTML='<option value="">Natural order</option><option value="rowid">rowid</option>'+((e==null?void 0:e.columns)||[]).map(s=>`<option value="${p(s.name)}">${p(s.name)}</option>`).join("");const a=["","rowid",...((e==null?void 0:e.columns)||[]).map(s=>s.name)];t.browseOrder.value=a.includes(l)?l:""}function K(){const t=c();t.browseFilter.value="",t.browseDirection.value="ASC",t.browseLimit.value="100",t.browseOffset.value="0",de(),t.browseOrder.value="",A(0)}function Z(t=0){const e=c(),l=100,a=ie(e.browseOffset.value,0,0,1e9),s=Math.max(0,Math.floor(Number(t))||0),o=F(),i=Number(o==null?void 0:o.rowCount),q=Number.isFinite(i)&&i>=0&&!String(e.browseFilter.value||"").trim(),y=a>0,D=q?a+s<i:s>=l,T=Math.floor(a/Math.max(1,l))+1,z=q?Math.max(1,Math.ceil(i/Math.max(1,l))):null,we=s?`Rows ${a+1}-${a+s}${q?` of ${i}`:""}${z?` / page ${T} of ${z}`:` / page ${T}`}`:a>0?`No rows at offset ${a}`:"No rows loaded";return{limit:l,offset:a,loaded:s,totalRows:i,hasTotal:q,canPrevious:y,canNext:D,pageIndex:T,pageCount:z,label:we}}function A(t=0){const e=c();if(!e.browsePage||!e.browsePrev||!e.browseNext)return;const l=Z(t);e.browseLimit.value=String(l.limit),e.browseOffset.value=String(l.offset),e.browsePage.textContent=l.label,e.browsePageIndex.value=String(l.pageIndex),e.browseFirst.disabled=!l.canPrevious,e.browsePrev.disabled=!l.canPrevious,e.browseNext.disabled=!l.canNext,e.browseLast.disabled=!l.hasTotal||!l.canNext}function Q(){const t=c();t.createColumns.innerHTML=x.map((e,l)=>`
    <div class="sqlite-create-column-row" data-create-index="${l}">
      <input data-create-column-name value="${p(e.name)}" placeholder="Column name">
      <select data-create-column-type>
        ${["INTEGER","TEXT","REAL","BLOB","NUMERIC"].map(a=>`<option value="${a}" ${e.type===a?"selected":""}>${a}</option>`).join("")}
      </select>
      <label><input type="checkbox" data-create-column-primary ${e.primaryKey?"checked":""}> PK</label>
      <label><input type="checkbox" data-create-column-required ${e.notNull?"checked":""}> Required</label>
      <label><input type="checkbox" data-create-column-unique ${e.unique?"checked":""}> Unique</label>
      <input data-create-column-default value="${p(e.defaultValue||"")}" placeholder="Default">
      <button class="btn-secondary sqlite-create-remove" type="button" data-create-remove="${l}">Remove</button>
    </div>
  `).join(""),t.createColumns.querySelectorAll("[data-create-remove]").forEach(e=>{e.addEventListener("click",()=>{J(),x.splice(Number(e.dataset.createRemove),1),x.length||x.push({name:"",type:"TEXT",primaryKey:!1,notNull:!1,unique:!1,defaultValue:""}),Q()})})}function J(){const t=c();x=Array.from(t.createColumns.querySelectorAll(".sqlite-create-column-row")).map(e=>{var l,a,s,o,i,q;return{name:((l=e.querySelector("[data-create-column-name]"))==null?void 0:l.value)||"",type:((a=e.querySelector("[data-create-column-type]"))==null?void 0:a.value)||"TEXT",primaryKey:!!((s=e.querySelector("[data-create-column-primary]"))!=null&&s.checked),notNull:!!((o=e.querySelector("[data-create-column-required]"))!=null&&o.checked),unique:!!((i=e.querySelector("[data-create-column-unique]"))!=null&&i.checked),defaultValue:((q=e.querySelector("[data-create-column-default]"))==null?void 0:q.value)||""}})}function R(){var o;const t=c();if(!b){t.schemaTitle.textContent="Schema",t.schemaBody.innerHTML='<div class="sqlite-empty-note">Select a database object.</div>';return}t.schemaTitle.textContent=`${b.type}: ${b.name}`;const e=b.type==="table"?F(b.name):null,l=(o=e==null?void 0:e.columns)!=null&&o.length?`
      <table class="sqlite-schema-table">
        <thead><tr><th>Name</th><th>Type</th><th>Required</th><th>Default</th><th>PK</th></tr></thead>
        <tbody>
          ${e.columns.map(i=>`
            <tr>
              <td>${p(i.name)}</td>
              <td>${p(i.type||"")}</td>
              <td>${i.notnull?"Yes":"No"}</td>
              <td>${p(i.dflt_value??"")}</td>
              <td>${i.pk?"Yes":"No"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `:"";t.schemaBody.innerHTML=`
    ${l}
    <pre class="sqlite-schema-sql">${p(re(b.sql||""))}</pre>
    ${e?`
      <div class="sqlite-schema-actions">
        <input id="sqlite-drop-confirm" placeholder="Type ${p(e.name)} to drop">
        <button id="btn-sqlite-drop-table" class="btn-secondary danger" type="button" disabled>Drop Table</button>
      </div>
    `:""}
  `;const a=t.schemaBody.querySelector("#sqlite-drop-confirm"),s=t.schemaBody.querySelector("#btn-sqlite-drop-table");a&&s&&e&&(a.addEventListener("input",()=>{s.disabled=a.value!==e.name}),s.addEventListener("click",()=>He(e.name)))}function C(){var l,a,s,o;const t=c(),e=F();if(!e){t.rowEditor.innerHTML='<div class="sqlite-empty-note">Select a table to edit rows.</div>',t.rowEditorTitle.textContent="Row Editor";return}t.rowEditorTitle.textContent=d?`Editing rowid ${d.__rowid__}`:`Insert into ${e.name}`,t.rowEditor.innerHTML=e.columns.map(i=>`
    <label class="sqlite-row-field">
      <span>${p(i.name)} <small>${p(i.type||"value")}</small></span>
      <input data-column="${p(i.name)}" value="${p((d==null?void 0:d[i.name])??"")}" placeholder="${i.notnull?"required":"NULL"}">
    </label>
  `).join("")+`
    <div class="sqlite-row-actions">
      <button id="btn-sqlite-insert-row" type="button">Insert Row</button>
      <button id="btn-sqlite-update-row" type="button" class="btn-secondary" ${d?"":"disabled"}>Update Row</button>
      <button id="btn-sqlite-delete-row" type="button" class="btn-secondary danger" ${d?"":"disabled"}>Delete Row</button>
      <button id="btn-sqlite-clear-row" type="button" class="btn-secondary">Clear</button>
    </div>
  `,(l=t.rowEditor.querySelector("#btn-sqlite-insert-row"))==null||l.addEventListener("click",Pe),(a=t.rowEditor.querySelector("#btn-sqlite-update-row"))==null||a.addEventListener("click",Qe),(s=t.rowEditor.querySelector("#btn-sqlite-delete-row"))==null||s.addEventListener("click",Ue),(o=t.rowEditor.querySelector("#btn-sqlite-clear-row"))==null||o.addEventListener("click",()=>{d=null,C()})}function ue(){return Object.fromEntries(Array.from(c().rowEditor.querySelectorAll("[data-column]")).map(t=>[t.dataset.column,t.value]))}function U(t,e={}){var s;const l=c();if(w=t||null,l.resultsHead.innerHTML="",l.resultsBody.innerHTML="",!((s=t==null?void 0:t.columns)!=null&&s.length)){l.resultsBody.innerHTML='<tr><td class="tool-table-state-cell is-success">Command executed. No rows returned.</td></tr>',e.editable&&A(0);return}l.resultsHead.innerHTML=`<tr>${t.columns.map(o=>`<th class="tool-table-head-cell">${p(o)}</th>`).join("")}</tr>`,Ce(t).forEach(o=>{const i=document.createElement("tr");i.className="tool-table-row",e.editable&&o.__rowid__!==void 0&&i.classList.add("sqlite-editable-row"),t.columns.forEach(q=>{const y=document.createElement("td");y.className="tool-table-cell tool-table-cell-ellipsis",y.setAttribute("data-cell-column",q),y.addEventListener("click",()=>{h=o,De(q,o[q])}),o[q]===null||o[q]===void 0?y.innerHTML='<span class="tool-table-null">NULL</span>':y.textContent=o[q],i.appendChild(y)}),e.editable&&o.__rowid__!==void 0&&i.addEventListener("click",()=>{d=o,C()}),l.resultsBody.appendChild(i)})}async function Be(){const t=await E("PRAGMA user_version;",[],{includeMetadata:!0});return!n&&u.tables[0]&&(n=u.tables[0].name),!b&&n&&(b=u.objects.find(e=>e.type==="table"&&e.name===n)||null),M(),V(),R(),C(),A(0),t}async function ae(t){const e=t==null?void 0:t[0];if(e)try{_=await e.arrayBuffer(),b=null,n=null,d=null,oe(e.name),await ce(),S("Inspecting database..."),await Be(),u.tables[0]&&be("table",u.tables[0].name),S("Database ready.","success")}catch(l){Ae("Database open failed."),Re(e.name,l)}finally{const l=c().fileInput;l&&(l.value="")}}async function Ie(){_=null,b=null,n=null,d=null,oe("Untitled.sqlite"),await ce(),await E("PRAGMA user_version = 0;",[],{includeMetadata:!0}),u.tables[0]&&(n=u.tables[0].name,b=u.objects.find(t=>t.type==="table"&&t.name===n)||null),M(),V(),R(),C(),A(0),S("New empty database ready.","success")}async function Oe(){J();const t=c(),e=$e({tableName:t.createTable.value,columns:x});S(`Creating ${t.createTable.value}...`),await E(e.sql,e.params,{includeMetadata:!0}),n=t.createTable.value,b=u.objects.find(l=>l.type==="table"&&l.name===n)||null,d=null,t.createTable.value="",K(),x=[{name:"id",type:"INTEGER",primaryKey:!0,notNull:!1,unique:!1,defaultValue:""},{name:"name",type:"TEXT",primaryKey:!1,notNull:!1,unique:!1,defaultValue:""}],Q(),M(),V(),R(),C(),await g(),H("Table created.","success")}async function He(t){var l;const e=Le({tableName:t});S(`Dropping ${t}...`),await E(e.sql,e.params,{includeMetadata:!0}),n=((l=u.tables[0])==null?void 0:l.name)||null,b=n&&u.objects.find(a=>a.type==="table"&&a.name===n)||null,d=null,K(),M(),V(),R(),C(),U(null),S(`Dropped ${t}.`,"success")}function be(t,e){const l=t==="table"&&n!==e;b=u.objects.find(a=>a.type===t&&a.name===e)||null,t==="table"&&(n=e),d=null,l&&K(),M(),V(),R(),C(),t==="table"&&g()}async function g(){var i,q,y,D;const t=c();n=t.browseTable.value||n||((i=u.tables[0])==null?void 0:i.name)||"";const e=F();if(!e){U(null);return}b=u.objects.find(T=>T.type==="table"&&T.name===n)||b;const l=Ee({tableName:n,columns:e.columns.map(T=>T.name),filter:t.browseFilter.value,orderBy:t.browseOrder.value,orderDirection:t.browseDirection.value,limit:t.browseLimit.value,offset:t.browseOffset.value});S(`Browsing ${n}...`);const s=(q=(await E(l.sql,l.params,{includeMetadata:!1})).result)==null?void 0:q[0];U(s,{editable:!0}),M(),R(),C(),A(((y=s==null?void 0:s.values)==null?void 0:y.length)||0),j("results"),je(r.querySelector(".sqlite-results-panel"));const o=c().browsePage.textContent||`${((D=s==null?void 0:s.values)==null?void 0:D.length)||0} rows`;S(`${o} loaded from ${n}. Click a cell for full value.`,"success")}function se(t){var a;const e=c();if(t<0&&e.browsePrev.disabled||t>0&&e.browseNext.disabled)return;const l=Z(((a=w==null?void 0:w.values)==null?void 0:a.length)||0);e.browseOffset.value=String(Math.max(0,l.offset+t*l.limit)),g()}function W(t){var a;const e=c(),l=Z(((a=w==null?void 0:w.values)==null?void 0:a.length)||0);if(t==="first")e.browseOffset.value="0";else if(t==="last"&&l.hasTotal)e.browseOffset.value=String(Math.max(0,(Math.max(1,l.pageCount)-1)*l.limit));else{const s=ie(e.browsePageIndex.value,l.pageIndex,1,l.pageCount||1e9);e.browseOffset.value=String(Math.max(0,(s-1)*l.limit))}g()}function Ve(t){const e=String(t||"").trim();e&&(I=[e,...I.filter(l=>l!==e)].slice(0,12),pe())}function pe(){const t=c().history;t.innerHTML=I.length?I.map((e,l)=>`<button class="sqlite-history-item" type="button" data-history-index="${l}">${p(e)}</button>`).join(""):'<div class="sqlite-empty-note">No query history yet.</div>',t.querySelectorAll("[data-history-index]").forEach(e=>{e.addEventListener("click",()=>{f==null||f.setValue(I[Number(e.dataset.historyIndex)]||"")})})}function ee(t){k=[t,...k].slice(0,12),X()}function me(){const t=c().latestUndo;t&&(t.disabled=!k.length)}function X(){const t=c().undoLog;t&&(t.innerHTML=k.length?k.map((e,l)=>`
      <button class="sqlite-undo-item" type="button" data-undo-index="${l}">
        <span>${p(e.label)}</span>
        <small>${p(e.detail||"")}</small>
      </button>
    `).join(""):'<div class="sqlite-empty-note">No row edits yet.</div>',t.querySelectorAll("[data-undo-index]").forEach(e=>{e.addEventListener("click",()=>qe(Number(e.dataset.undoIndex)))}),me())}async function qe(t){const e=k[t];e&&(await E(e.statement.sql,e.statement.params,{includeMetadata:!0}),k.splice(t,1),X(),await g(),H("Undo applied.","success"))}async function Fe(){if(!n||!h||!$||$==="__rowid__")return;const t=c(),e=h[$],l=t.cellEditValue.value,a=P({tableName:n,rowid:h.__rowid__,values:{[$]:l}});await E(a.sql,a.params,{includeMetadata:!0}),ee({label:`Cell ${$} rowid ${h.__rowid__}`,detail:n,statement:P({tableName:n,rowid:h.__rowid__,values:{[$]:e}})}),t.cellValue.textContent=l,h[$]=l,await g(),j("results"),H("Cell updated.","success")}async function fe(){var l,a;if(!f)return;const t=f.getValue(),e=r.querySelector("#btn-run-query");e.disabled=!0,S("Executing query...");try{const s=await E(t,[],{includeMetadata:!0});U((l=s.result)==null?void 0:l[0]),Ve(t),M(),V(),R(),C(),j("results"),S((a=s.result)!=null&&a[0]?`${s.result[0].values.length} rows returned.`:`Command complete. ${s.changes||0} rows changed.`,"success")}catch(s){S(s.message,"danger"),c().resultsBody.innerHTML=`<tr><td class="tool-table-state-cell is-danger">${p(s.message)}</td></tr>`}finally{e.disabled=!1}}async function Pe(){const t=Te({tableName:n,values:ue()});await E(t.sql,t.params,{includeMetadata:!0}),d=null,await g(),j("edit"),H("Row inserted.","success")}async function Qe(){if(!d)return;const t={...d},e=P({tableName:n,rowid:d.__rowid__,values:ue()});await E(e.sql,e.params,{includeMetadata:!0}),ee({label:`Row update rowid ${t.__rowid__}`,detail:n,statement:P({tableName:n,rowid:t.__rowid__,values:t})}),d=null,await g(),j("edit"),H("Row updated.","success")}async function Ue(){if(!d)return;const t={...d},e=Ne({tableName:n,rowid:d.__rowid__});await E(e.sql,e.params,{includeMetadata:!0}),ee({label:`Row delete rowid ${t.__rowid__}`,detail:n,statement:xe({tableName:n,row:t})}),d=null,await g(),j("edit"),H("Row deleted.","success")}function Ke(){w&&G(ke(w),`${n||"query"}_export.csv`,"text/csv")}function Xe(){const t=u.objects.map(e=>re(e.sql)).filter(Boolean).join(`;

`);G(`${t}${t?`;
`:""}`,`${O||"database"}_schema.sql`,"application/sql")}function ze(){_&&G(_,O||`database_${Date.now()}.sqlite`,"application/x-sqlite3")}async function tt(t){r=document.createElement("div"),r.className="tool-sqlite",r.innerHTML=`
    <div class="sqlite-shell">
      <section class="card sqlite-open-card">
        <div id="db-drop-zone" class="tool-dropzone sqlite-dropzone">
          <div class="tool-dropzone-icon">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="5" rx="7.5" ry="2.5"></ellipse><path d="M4.5 5v14c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5V5"></path><path d="M4.5 12c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5"></path></svg>
          </div>
          <div class="tool-dropzone-title">Drop .sqlite / .db or click to open</div>
          <div id="active-db-name" class="tool-dropzone-meta">No database loaded</div>
          <input type="file" id="db-input" class="hidden" accept=".sqlite,.db,.sqlite3">
        </div>
        <div class="sqlite-file-actions">
          <button id="btn-sqlite-new-db" type="button">New Database</button>
          <button id="btn-sqlite-download-db" type="button" class="btn-secondary" disabled>Download Database</button>
          <button id="btn-sqlite-export-sql" type="button" class="btn-secondary">Export Schema SQL</button>
        </div>
      </section>

      <div id="db-explorer-ui" class="sqlite-workspace hidden">
        <aside class="sqlite-sidebar">
          <div class="sqlite-sidebar-head">
            <label for="sqlite-object-filter">Objects</label>
            <input id="sqlite-object-filter" placeholder="Filter objects">
          </div>
          <div id="sqlite-object-list" class="sqlite-object-list"></div>
          <div class="sqlite-schema-panel sqlite-workspace-panel" data-sqlite-workspace-panel="schema">
            <div id="sqlite-schema-title" class="sqlite-schema-title">Schema</div>
            <div id="sqlite-schema-body" class="sqlite-schema-body"></div>
          </div>
        </aside>

        <main class="sqlite-main">
          <div id="sqlite-workspace-tabs" class="sqlite-workspace-tabs">
            <button type="button" class="btn-secondary is-active" data-sqlite-workspace-tab="browse">Browse</button>
            <button type="button" class="btn-secondary" data-sqlite-workspace-tab="edit">Edit</button>
            <button type="button" class="btn-secondary" data-sqlite-workspace-tab="query">Query</button>
            <button type="button" class="btn-secondary" data-sqlite-workspace-tab="schema">Schema</button>
            <button type="button" class="btn-secondary" data-sqlite-workspace-tab="results">Results</button>
          </div>
          <section class="sqlite-panel sqlite-workspace-panel is-active" data-sqlite-workspace-panel="browse">
            <div class="sqlite-panel-title">Browse</div>
            <div class="sqlite-browse-controls">
              <div class="sqlite-control-group">
                <span>Table</span>
                <select id="sqlite-browse-table"></select>
              </div>
              <div class="sqlite-control-group sqlite-control-wide">
                <span>Filter</span>
                <input id="sqlite-browse-filter" placeholder="Filter visible columns">
              </div>
              <div class="sqlite-control-group">
                <span>Order</span>
                <select id="sqlite-browse-order"></select>
              </div>
              <div class="sqlite-control-group">
                <span>Direction</span>
                <select id="sqlite-browse-direction">
                  <option value="ASC">Ascending</option>
                  <option value="DESC">Descending</option>
                </select>
              </div>
              <div class="sqlite-control-group">
                <span>Rows</span>
                <input id="sqlite-browse-limit" type="number" min="1" max="1000" value="100">
              </div>
              <div class="sqlite-control-group">
                <span>Offset</span>
                <input id="sqlite-browse-offset" type="number" min="0" value="0">
              </div>
              <button id="btn-sqlite-browse" type="button">Refresh</button>
            </div>
            <div class="sqlite-browse-footer">
              <div id="sqlite-browse-page" class="sqlite-browse-page">No rows loaded</div>
              <div class="sqlite-browse-pagination">
                <button id="sqlite-browse-first" type="button" class="btn-secondary" disabled>First</button>
                <button id="sqlite-browse-prev" type="button" class="btn-secondary" disabled>Previous</button>
                <input id="sqlite-browse-page-index" type="number" min="1" value="1">
                <button id="sqlite-browse-next" type="button" class="btn-secondary" disabled>Next</button>
                <button id="sqlite-browse-last" type="button" class="btn-secondary" disabled>Last</button>
              </div>
            </div>
          </section>

          <section class="sqlite-panel sqlite-create-panel sqlite-workspace-panel" data-sqlite-workspace-panel="edit">
            <div class="sqlite-panel-title">Create Table</div>
            <div class="sqlite-create-table-controls">
              <input id="sqlite-create-table" placeholder="Table name">
              <button id="btn-sqlite-add-column" type="button" class="btn-secondary">Add Column</button>
              <button id="btn-sqlite-create-table" type="button">Create Table</button>
            </div>
            <div id="sqlite-create-columns" class="sqlite-create-columns"></div>
          </section>

          <section class="sqlite-panel sqlite-row-panel sqlite-workspace-panel" data-sqlite-workspace-panel="edit">
            <div id="sqlite-row-editor-title" class="sqlite-panel-title">Row Editor</div>
            <div id="sqlite-row-editor" class="sqlite-row-editor"></div>
            <div class="sqlite-undo-panel">
              <div class="sqlite-panel-title">Undo</div>
              <div id="sqlite-undo-log" class="sqlite-undo-log"></div>
            </div>
          </section>

          <section class="sqlite-panel sqlite-query-panel sqlite-workspace-panel" data-sqlite-workspace-panel="query">
            <div class="sqlite-panel-title">SQL Query</div>
            <div id="monaco-sql-editor" class="tool-editor-host-compact sqlite-editor"></div>
            <div class="tool-action-row tool-action-row-top">
              <button id="btn-run-query" class="tool-grow-2" type="button">Run Query</button>
              <button id="btn-export-csv" class="btn-secondary tool-grow-1" type="button">Export CSV</button>
            </div>
            <div id="sqlite-query-history" class="sqlite-query-history"></div>
          </section>

          <section class="sqlite-results-panel sqlite-workspace-panel" data-sqlite-workspace-panel="results">
            <div class="sqlite-results-head">
              <div class="sqlite-panel-title">Results</div>
              <div id="sqlite-status" class="sqlite-status" data-tone="muted">Open or create a database.</div>
            </div>
            <div id="results-grid-container" class="tool-table-shell sqlite-results-shell">
              <table id="results-table" class="tool-table">
                <thead id="results-head" class="tool-table-head"></thead>
                <tbody id="results-body"></tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      <div id="sqlite-error-modal" class="sqlite-error-modal hidden">
        <div class="sqlite-error-card">
          <div class="sqlite-error-title">Database Open Failed</div>
          <p id="sqlite-error-detail" class="sqlite-error-detail"></p>
          <div class="sqlite-error-actions">
            <button type="button" data-close-sqlite-error>OK</button>
          </div>
        </div>
      </div>

      <div id="sqlite-cell-modal" class="sqlite-cell-modal hidden">
        <div class="sqlite-cell-card">
          <div class="sqlite-cell-head">
            <div>
              <div id="sqlite-cell-title" class="sqlite-cell-title">Cell Detail</div>
              <div id="sqlite-cell-meta" class="sqlite-cell-meta"></div>
            </div>
            <button type="button" class="btn-secondary" data-close-sqlite-cell>Close</button>
          </div>
          <pre id="sqlite-cell-value" class="sqlite-cell-value"></pre>
          <textarea id="sqlite-cell-edit-value" class="sqlite-cell-edit-value" spellcheck="false"></textarea>
          <div class="sqlite-cell-undo-row">
            <button id="btn-sqlite-undo-latest" type="button" class="btn-secondary" disabled>Undo Last Edit</button>
          </div>
          <div class="sqlite-cell-actions">
            <button id="btn-sqlite-apply-cell" type="button">Apply Cell Edit</button>
          </div>
        </div>
      </div>
    </div>
  `,t.appendChild(r);const e=c();L=te(r.querySelector("#sqlite-error-modal"),{closeSelectors:["[data-close-sqlite-error]"],closeOnBackdrop:!1}),B.push(()=>{L==null||L.destroy(),L=null}),N=te(r.querySelector("#sqlite-cell-modal"),{closeSelectors:["[data-close-sqlite-cell]"]}),B.push(()=>{N==null||N.destroy(),N=null}),B.push(ve(e.dropZone,ae)),m(e.dropZone,"click",()=>e.fileInput.click()),m(e.fileInput,"change",l=>ae(l.target.files)),m(r.querySelector("#btn-sqlite-new-db"),"click",Ie),m(r.querySelector("#btn-sqlite-download-db"),"click",ze),m(r.querySelector("#btn-sqlite-export-sql"),"click",Xe),r.querySelectorAll("[data-sqlite-workspace-tab]").forEach(l=>{m(l,"click",()=>j(l.dataset.sqliteWorkspaceTab))}),m(r.querySelector("#btn-run-query"),"click",fe),m(r.querySelector("#btn-export-csv"),"click",Ke),m(r.querySelector("#btn-sqlite-browse"),"click",g),m(e.browseFirst,"click",()=>W("first")),m(e.browsePrev,"click",()=>se(-1)),m(e.browseNext,"click",()=>se(1)),m(e.browseLast,"click",()=>W("last")),m(e.browsePageIndex,"keydown",l=>{l.key==="Enter"&&W("page")}),m(e.cellApply,"click",Fe),m(e.latestUndo,"click",()=>qe(0)),m(r.querySelector("#btn-sqlite-create-table"),"click",Oe),m(r.querySelector("#btn-sqlite-add-column"),"click",()=>{J(),x.push({name:"",type:"TEXT",primaryKey:!1,notNull:!1,unique:!1,defaultValue:""}),Q()}),m(e.browseTable,"change",()=>{n=e.browseTable.value,d=null,K(),g()}),m(e.objectFilter,"input",M),[e.browseFilter,e.browseOrder,e.browseDirection,e.browseLimit,e.browseOffset].forEach(l=>{m(l,"keydown",a=>{a.key==="Enter"&&g()})}),Q(),pe(),X()}function lt(){var t;B.forEach(e=>e==null?void 0:e()),B=[],(t=f==null?void 0:f.dispose)==null||t.call(f),f=null,_=null,O="",u={objects:[],tables:[],views:[],indexes:[],triggers:[]},b=null,n=null,d=null,h=null,$=null,w=null,I=[],k=[],x=[{name:"id",type:"INTEGER",primaryKey:!0,notNull:!1,unique:!1,defaultValue:""},{name:"name",type:"TEXT",primaryKey:!1,notNull:!1,unique:!1,defaultValue:""}],r&&r.remove(),r=null,L=null,N=null}export{tt as mount,lt as unmount};
