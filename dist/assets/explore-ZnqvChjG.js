import"./modulepreload-polyfill-B5Qt9EMX.js";import{initializeApp as b}from"https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";import{getFirestore as U,getDocs as R,collection as $,getDoc as D,doc as f,updateDoc as p,arrayRemove as v,arrayUnion as y}from"https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";import{getAuth as P,onAuthStateChanged as B}from"https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";const F={apiKey:"AIzaSyBIZcD-L5jD84hEYLxWOwHTE2iTY6EJ0zI",authDomain:"inque-31cb5.firebaseapp.com",projectId:"inque-31cb5",storageBucket:"inque-31cb5.firebasestorage.app",messagingSenderId:"338722493567",appId:"1:338722493567:web:4c46ecdfe92ddf2a5d5b4a",measurementId:"G-KQT58LWVSK"},T=b(F),g=U(T),I=P(),a=document.getElementById("exploreWidgetList");a.innerHTML='<div style="color:#fff">Loading widgets...</div>';let n=null,d=new Set;async function h(){try{console.log("[EXPLORE DEBUG] Fetching widgets from widgets collection");const o=await R($(g,"widgets")),e=[];return o.forEach(t=>{const s=t.data();console.log("[EXPLORE DEBUG] Processing widget",{id:t.id,title:s.title,userId:s.userId,fileCount:s.files?.length||0}),e.push({...s,id:t.id,userId:s.userId})}),console.log("[EXPLORE DEBUG] Total widgets found:",e.length),e}catch(o){return console.error("[EXPLORE DEBUG] Error fetching widgets:",o),[]}}function E(o){for(let e=o.length-1;e>0;e--){const t=Math.floor(Math.random()*(e+1));[o[e],o[t]]=[o[t],o[e]]}return o}function w(o){if(!Array.isArray(o)||o.length===0)return null;const e=o.find(t=>t.fileName&&/index\.html?$/i.test(t.fileName));return e||o.find(t=>t.fileName&&/\.html?$/i.test(t.fileName))}async function N(){if(n)try{console.log("[EXPLORE DEBUG] Loading user following list",{userId:n.uid});const o=await D(f(g,"users",n.uid));if(o.exists()){const e=o.data();d=new Set(e.following||[]),console.log("[EXPLORE DEBUG] Following list loaded",{count:d.size})}}catch(o){console.error("[EXPLORE DEBUG] Error loading following list:",o)}}async function M(o,e){if(!n){r("Please log in to follow users","warning");return}if(n.uid===o){r("You can't follow yourself","warning");return}try{const t=d.has(o);console.log("[EXPLORE DEBUG] Toggling follow",{targetUserId:o,isFollowing:t,currentUserId:n.uid}),t?(await p(f(g,"users",n.uid),{following:v(o)}),await p(f(g,"users",o),{followers:v(n.uid)}),d.delete(o),e.textContent="Follow",e.classList.remove("following"),r("Unfollowed user","info")):(await p(f(g,"users",n.uid),{following:y(o)}),await p(f(g,"users",o),{followers:y(n.uid)}),d.add(o),e.textContent="Following",e.classList.add("following"),r("Now following user!","success"))}catch(t){console.error("[EXPLORE DEBUG] Error toggling follow:",t),r("Error updating follow status","error")}}function O(o,e){if(!n){r("Please log in to message users","warning");return}if(n.uid===o){r("You can't message yourself","warning");return}console.log("[EXPLORE DEBUG] Opening message modal",{targetUserId:o,targetUserName:e});const t=document.createElement("div");t.className="message-modal",t.innerHTML=`
    <div class="message-modal-content">
      <div class="message-modal-header">
        <h3>💬 Message ${e}</h3>
        <button class="message-modal-close">&times;</button>
      </div>
      <div class="message-modal-body">
        <textarea 
          id="messageText" 
          placeholder="Type your message here..." 
          maxlength="500"
          rows="4"
        ></textarea>
        <div class="message-modal-actions">
          <button class="message-send-btn">Send Message</button>
          <button class="message-cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  `,document.body.appendChild(t),t.style.display="flex";const s=t.querySelector(".message-modal-close"),i=t.querySelector(".message-cancel-btn"),l=t.querySelector(".message-send-btn"),u=t.querySelector("#messageText"),c=()=>{document.body.removeChild(t)};s.addEventListener("click",c),i.addEventListener("click",c),t.addEventListener("click",m=>{m.target===t&&c()}),l.addEventListener("click",async()=>{const m=u.value.trim();if(!m){r("Please enter a message","warning");return}try{console.log("[EXPLORE DEBUG] Sending message",{to:o,from:n.uid,message:m}),r(`Message sent to ${e}!`,"success"),c()}catch(x){console.error("[EXPLORE DEBUG] Error sending message:",x),r("Error sending message","error")}}),setTimeout(()=>u.focus(),100)}function r(o,e="info"){const t=document.createElement("div");t.className=`explore-toast explore-toast-${e}`,t.textContent=o,document.body.appendChild(t),setTimeout(()=>{t.parentNode&&t.parentNode.removeChild(t)},3e3)}(async function(){try{let e=await h();if(!e.length){a.innerHTML='<div style="color:#fff">No widgets found yet.</div>';return}const t=e.filter(s=>{const i=w(s.files);return i&&i.downloadURL});if(!t.length){a.innerHTML='<div style="color:#fff">No widgets with HTML files found.</div>';return}e=E(t).slice(0,12),a.innerHTML="";for(const s of e){const i=w(s.files);console.log("[EXPLORE DEBUG] Rendering widget",{id:s.id,title:s.title,htmlFile:i?.fileName,downloadURL:i?.downloadURL});const l=document.createElement("div");l.className="explore-widget-card";const u=d.has(s.userId),c=n&&n.uid===s.userId;l.innerHTML=`
        <div class="explore-widget-title">${s.title||"Untitled Widget"}</div>
        <div class="explore-widget-user">by ${s.userName||"Unknown User"}</div>
        ${i&&i.downloadURL?`<iframe class='explore-widget-preview' src='${i.downloadURL}' sandbox='allow-scripts allow-same-origin'></iframe>`:"<div style='height:200px;display:flex;align-items:center;justify-content:center;background:#111;border-radius:6px;color:#888;'>No Preview</div>"}
        <div class="explore-widget-actions">
          <a href='/?user=${s.userId}' class="explore-profile-link">👤 View Profile</a>
          ${c?"":`
            <button class="explore-follow-btn ${u?"following":""}" 
                    data-user-id="${s.userId}">
              ${u?"✓ Following":"+ Follow"}
            </button>
            <button class="explore-message-btn" 
                    data-user-id="${s.userId}" 
                    data-user-name="${s.userName||"Unknown User"}">
              💬 Message
            </button>
          `}
        </div>
      `,a.appendChild(l)}}catch(e){console.error("[EXPLORE DEBUG] Error loading widgets:",e),a.innerHTML=`<div style='color:#f66'>Error loading widgets: ${e.message}</div>`}})();B(I,async o=>{if(console.log("[EXPLORE DEBUG] Auth state changed",{userId:o?.uid}),n=o,o){await N();const e=await h();if(e.length>0){const t=e.filter(i=>{const l=w(i.files);return l&&l.downloadURL}),s=E(t).slice(0,12);L(s)}}else{d.clear();const e=await h();if(e.length>0){const t=e.filter(i=>{const l=w(i.files);return l&&l.downloadURL}),s=E(t).slice(0,12);L(s)}}});document.addEventListener("click",o=>{if(o.target.matches(".explore-follow-btn")){o.preventDefault();const e=o.target.dataset.userId;M(e,o.target)}if(o.target.matches(".explore-message-btn")){o.preventDefault();const e=o.target.dataset.userId,t=o.target.dataset.userName;O(e,t)}});async function L(o){a.innerHTML="";for(const e of o){const t=w(e.files);console.log("[EXPLORE DEBUG] Rendering widget",{id:e.id,title:e.title,htmlFile:t?.fileName,downloadURL:t?.downloadURL});const s=document.createElement("div");s.className="explore-widget-card";const i=d.has(e.userId),l=n&&n.uid===e.userId;s.innerHTML=`
      <div class="explore-widget-title">${e.title||"Untitled Widget"}</div>
      <div class="explore-widget-user">by ${e.userName||"Unknown User"}</div>
      ${t&&t.downloadURL?`<iframe class='explore-widget-preview' src='${t.downloadURL}' sandbox='allow-scripts allow-same-origin'></iframe>`:"<div style='height:200px;display:flex;align-items:center;justify-content:center;background:#111;border-radius:6px;color:#888;'>No Preview</div>"}
      <div class="explore-widget-actions">
        <a href='/?user=${e.userId}' class="explore-profile-link">👤 View Profile</a>
        ${l?"":`
          <button class="explore-follow-btn ${i?"following":""}" 
                  data-user-id="${e.userId}">
            ${i?"✓ Following":"+ Follow"}
          </button>
          <button class="explore-message-btn" 
                  data-user-id="${e.userId}" 
                  data-user-name="${e.userName||"Unknown User"}">
            💬 Message
          </button>
        `}
      </div>
    `,a.appendChild(s)}}document.querySelectorAll(".quick-action-btn").forEach(o=>{o.querySelector(".quick-action-text")?.textContent.includes("Add Project to Showcase")&&o.addEventListener("click",()=>{const e=document.getElementById("widgetSlotUploadContainer");e&&(e.scrollIntoView({behavior:"smooth",block:"center"}),e.style.boxShadow="0 0 16px 4px #4caf50",setTimeout(()=>e.style.boxShadow="",1200))})});
