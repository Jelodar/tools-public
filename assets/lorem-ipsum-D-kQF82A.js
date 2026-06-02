import{c as v,d as g}from"./ui-utils-CG6aKAAj.js";let e=null;const u=["lorem","ipsum","dolor","sit","amet","consectetur","adipiscing","elit","curabitur","vel","hendrerit","libero","eleifend","blandit","nunc","ornare","odio","ut","orci","gravida","imperdiet","nullam","purus","lacinia","a","pretium","quis","congue","praesent","sagittis","laoreet","auctor","mauris","non","velit","eros","dictum","proin","accumsan","sapien","nec","massa","volutpat","venenatis","sed","eu","molestie","lacus","quisque","porttitor","ligula","dui","mollis","tempus","at","magna","vestibulum","turpis","ac","diam","tincidunt","id","condimentum","enim","sodales","in","hac","habitasse","platea","dictumst","aenean","neque","fusce","augue","leo","eget","semper","mattis","tortor","scelerisque","nulla","interdum","tellus","malesuada","rhoncus","accusantium","ut","facilis","nihil","quidem","illum","facere"];async function y(c){e=document.createElement("div"),e.className="tool-lorem",e.innerHTML=`
    <div class="card">
      <div class="settings-grid">
        <div class="form-group">
          <label>Content Type</label>
          <select id="lorem-type">
            <option value="paras">Paragraphs</option>
            <option value="words">Individual Words</option>
            <option value="lists">Unordered List</option>
          </select>
        </div>
        <div class="form-group">
          <label>Quantity</label>
          <input type="number" id="lorem-amount" value="3" min="1" max="100">
        </div>
      </div>
      
      <button id="btn-lorem-gen" class="lorem-generate-button">Generate Text</button>
      
      <div class="form-group lorem-output-group">
        <label>Resulting Text</label>
        <div id="lorem-output" class="lorem-output"></div>
      </div>

      <div class="lorem-actions">
        <button id="btn-copy-lorem" class="lorem-action">Copy Text</button>
        <button id="btn-dl-lorem" class="btn-secondary lorem-action">Download .txt</button>
      </div>
    </div>
  `,c.appendChild(e);const m=e.querySelector("#lorem-type"),d=e.querySelector("#lorem-amount"),o=e.querySelector("#lorem-output"),r=()=>{const n=parseInt(d.value)||1,a=m.value;let t="";const l=()=>u[Math.floor(Math.random()*u.length)],i=()=>{const p=8+Math.floor(Math.random()*10),s=Array.from({length:p},l).join(" ");return s.charAt(0).toUpperCase()+s.slice(1)+"."};a==="words"?t=Array.from({length:n},l).join(" "):a==="paras"?t=Array.from({length:n},()=>Array.from({length:4+Math.floor(Math.random()*4)},i).join(" ")).join(`

`):t=Array.from({length:n},()=>"• "+i()).join(`
`),o.textContent=t};e.querySelector("#btn-lorem-gen").addEventListener("click",r),e.querySelector("#btn-copy-lorem").addEventListener("click",()=>v(o.textContent)),e.querySelector("#btn-dl-lorem").addEventListener("click",()=>g(o.textContent,"lorem_ipsum.txt")),r()}function f(){e&&e.remove()}export{y as mount,f as unmount};
