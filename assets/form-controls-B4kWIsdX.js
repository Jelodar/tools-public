function t(e){return String(e??"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function u(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function $({id:e,label:l,checked:n=!1,className:c="",inputClassName:g="",inputAttributes:r="",rootAttributes:p=""}={}){const i=t(e),a=String(c||"").trim(),s=String(g||"").trim(),o=`ui-toggle-input${s?` ${t(s)}`:""}`;return`
    <label class="ui-toggle${a?` ${t(a)}`:""}" ${p}>
      <input id="${i}" class="${o}" type="checkbox" ${n?"checked":""} ${r}>
      <span class="ui-toggle-track"><span class="ui-toggle-knob"></span></span>
      <span class="ui-toggle-label">${u(l)}</span>
    </label>
  `}export{$ as r};
