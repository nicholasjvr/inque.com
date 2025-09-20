import"./modulepreload-polyfill-B5Qt9EMX.js";import{initializeApp as x}from"https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";import{getFirestore as U,getDocs as R,collection as D,getDoc as T,doc as f,updateDoc as h,arrayRemove as v,arrayUnion as L}from"https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";import{getAuth as M,onAuthStateChanged as P}from"https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";const $={apiKey:"AIzaSyBIZcD-L5jD84hEYLxWOwHTE2iTY6EJ0zI",authDomain:"inque-31cb5.firebaseapp.com",projectId:"inque-31cb5",storageBucket:"inque-31cb5.firebasestorage.app",messagingSenderId:"338722493567",appId:"1:338722493567:web:4c46ecdfe92ddf2a5d5b4a",measurementId:"G-KQT58LWVSK"},O=x($),g=U(O),B=M(),a=document.getElementById("exploreWidgetList");a.innerHTML='<div style="color:#fff">Loading widgets...</div>';let i=null,d=new Set;async function E(){try{console.log("[EXPLORE DEBUG] Fetching widgets from widgets collection");const t=await R(D(g,"widgets")),e=[];return t.forEach(o=>{const s=o.data();console.log("[EXPLORE DEBUG] Processing widget",{id:o.id,title:s.title,userId:s.userId,fileCount:s.files?.length||0}),e.push({...s,id:o.id,userId:s.userId})}),console.log("[EXPLORE DEBUG] Total widgets found:",e.length),e}catch(t){return console.error("[EXPLORE DEBUG] Error fetching widgets:",t),[]}}function p(t){for(let e=t.length-1;e>0;e--){const o=Math.floor(Math.random()*(e+1));[t[e],t[o]]=[t[o],t[e]]}return t}function m(t){if(!Array.isArray(t)||t.length===0)return null;const e=t.find(o=>o.fileName&&/index\.html?$/i.test(o.fileName));return e||t.find(o=>o.fileName&&/\.html?$/i.test(o.fileName))}async function S(){if(i)try{console.log("[EXPLORE DEBUG] Loading user following list",{userId:i.uid});const t=await T(f(g,"users",i.uid));if(t.exists()){const e=t.data();d=new Set(e.following||[]),console.log("[EXPLORE DEBUG] Following list loaded",{count:d.size})}}catch(t){console.error("[EXPLORE DEBUG] Error loading following list:",t)}}async function I(t,e){if(!i){r("Please log in to follow users","warning");return}if(i.uid===t){r("You can't follow yourself","warning");return}try{const o=d.has(t);console.log("[EXPLORE DEBUG] Toggling follow",{targetUserId:t,isFollowing:o,currentUserId:i.uid}),o?(await h(f(g,"users",i.uid),{following:v(t)}),await h(f(g,"users",t),{followers:v(i.uid)}),d.delete(t),e.textContent="Follow",e.classList.remove("following"),r("Unfollowed user","info")):(await h(f(g,"users",i.uid),{following:L(t)}),await h(f(g,"users",t),{followers:L(i.uid)}),d.add(t),e.textContent="Following",e.classList.add("following"),r("Now following user!","success"))}catch(o){console.error("[EXPLORE DEBUG] Error toggling follow:",o),r("Error updating follow status","error")}}function F(t,e){if(!i){r("Please log in to message users","warning");return}if(i.uid===t){r("You can't message yourself","warning");return}console.log("[EXPLORE DEBUG] Opening message modal",{targetUserId:t,targetUserName:e});const o=document.createElement("div");o.className="message-modal",o.innerHTML=`
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
  `,document.body.appendChild(o),o.style.display="flex";const s=o.querySelector(".message-modal-close"),n=o.querySelector(".message-cancel-btn"),l=o.querySelector(".message-send-btn"),u=o.querySelector("#messageText"),c=()=>{document.body.removeChild(o)};s.addEventListener("click",c),n.addEventListener("click",c),o.addEventListener("click",w=>{w.target===o&&c()}),l.addEventListener("click",async()=>{const w=u.value.trim();if(!w){r("Please enter a message","warning");return}try{console.log("[EXPLORE DEBUG] Sending message",{to:t,from:i.uid,message:w}),r(`Message sent to ${e}!`,"success"),c()}catch(y){console.error("[EXPLORE DEBUG] Error sending message:",y),r("Error sending message","error")}}),setTimeout(()=>u.focus(),100)}function r(t,e="info"){const o=document.createElement("div");o.className=`explore-toast explore-toast-${e}`,o.textContent=t,document.body.appendChild(o),setTimeout(()=>{o.parentNode&&o.parentNode.removeChild(o)},3e3)}(async function(){try{let e=await E();if(!e.length){a.innerHTML='<div style="color:#fff">No widgets found yet.</div>';return}const o=e.filter(s=>{const n=m(s.files);return n&&n.downloadURL});if(!o.length){a.innerHTML='<div style="color:#fff">No widgets with HTML files found.</div>';return}e=p(o).slice(0,12),a.innerHTML="";for(const s of e){const n=m(s.files);console.log("[EXPLORE DEBUG] Rendering widget",{id:s.id,title:s.title,htmlFile:n?.fileName,downloadURL:n?.downloadURL});const l=document.createElement("div");l.className="explore-widget-card";const u=d.has(s.userId),c=i&&i.uid===s.userId;l.innerHTML=`
        <div class="explore-widget-title">${s.title||"Untitled Widget"}</div>
        <div class="explore-widget-user">by ${s.userName||"Unknown User"}</div>
        ${n&&n.downloadURL?`<iframe class='explore-widget-preview' src='${n.downloadURL}' sandbox='allow-scripts allow-same-origin'></iframe>`:"<div style='height:200px;display:flex;align-items:center;justify-content:center;background:#111;border-radius:6px;color:#888;'>No Preview</div>"}
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
      `,a.appendChild(l)}}catch(e){console.error("[EXPLORE DEBUG] Error loading widgets:",e),a.innerHTML=`<div style='color:#f66'>Error loading widgets: ${e.message}</div>`}})();P(B,async t=>{if(console.log("[EXPLORE DEBUG] Auth state changed",{userId:t?.uid}),i=t,t){await S();const e=await E();if(e.length>0){const o=e.filter(n=>{const l=m(n.files);return l&&l.downloadURL}),s=p(o).slice(0,12);b(s)}}else{d.clear();const e=await E();if(e.length>0){const o=e.filter(n=>{const l=m(n.files);return l&&l.downloadURL}),s=p(o).slice(0,12);b(s)}}});document.addEventListener("click",t=>{if(t.target.matches(".explore-follow-btn")){t.preventDefault();const e=t.target.dataset.userId;I(e,t.target)}if(t.target.matches(".explore-message-btn")){t.preventDefault();const e=t.target.dataset.userId,o=t.target.dataset.userName;F(e,o)}});async function b(t){a.innerHTML="";for(const e of t){const o=m(e.files);console.log("[EXPLORE DEBUG] Rendering widget",{id:e.id,title:e.title,htmlFile:o?.fileName,downloadURL:o?.downloadURL});const s=document.createElement("div");s.className="explore-widget-card";const n=d.has(e.userId),l=i&&i.uid===e.userId;s.innerHTML=`
      <div class="explore-widget-title">${e.title||"Untitled Widget"}</div>
      <div class="explore-widget-user">by ${e.userName||"Unknown User"}</div>
      ${o&&o.downloadURL?`<iframe class='explore-widget-preview' src='${o.downloadURL}' sandbox='allow-scripts allow-same-origin'></iframe>`:"<div style='height:200px;display:flex;align-items:center;justify-content:center;background:#111;border-radius:6px;color:#888;'>No Preview</div>"}
      <div class="explore-widget-actions">
        <a href='/?user=${e.userId}' class="explore-profile-link">👤 View Profile</a>
        ${l?"":`
          <button class="explore-follow-btn ${n?"following":""}" 
                  data-user-id="${e.userId}">
            ${n?"✓ Following":"+ Follow"}
          </button>
          <button class="explore-message-btn" 
                  data-user-id="${e.userId}" 
                  data-user-name="${e.userName||"Unknown User"}">
            💬 Message
          </button>
        `}
      </div>
    `,a.appendChild(s)}}document.addEventListener("DOMContentLoaded",()=>{console.log("[EXPLORE DEBUG] Initializing mobile menu functionality");const t=()=>{if(window.innerWidth<=480){const e=document.querySelector(".explore-header"),o=document.querySelector(".header-actions");if(e&&o&&!document.querySelector(".mobile-menu-toggle")){const s=document.createElement("button");s.className="mobile-menu-toggle",s.innerHTML="☰",s.setAttribute("aria-label","Toggle navigation menu"),e.appendChild(s),s.addEventListener("click",()=>{console.log("[EXPLORE DEBUG] Mobile menu toggled"),o.classList.toggle("show"),s.innerHTML=o.classList.contains("show")?"✕":"☰"}),document.addEventListener("click",n=>{!e.contains(n.target)&&o.classList.contains("show")&&(o.classList.remove("show"),s.innerHTML="☰")})}}};t(),window.addEventListener("resize",()=>{const e=document.querySelector(".mobile-menu-toggle");e&&window.innerWidth>480?(e.remove(),document.querySelector(".header-actions").classList.remove("show")):window.innerWidth<=480&&t()}),N()});function N(){console.log("[EXPLORE DEBUG] Initializing lazy loading for mobile performance");const t={root:null,rootMargin:"50px",threshold:.1},e=new IntersectionObserver(o=>{o.forEach(s=>{if(s.isIntersecting){const n=s.target;n.dataset.src&&(n.src=n.dataset.src,n.removeAttribute("data-src"),e.unobserve(n))}})},t);document.querySelectorAll(".explore-widget-preview").forEach(o=>{o.src&&(o.dataset.src=o.src,o.src='data:text/html,<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#111;color:#888;">Loading...</div>',e.observe(o))})}document.querySelectorAll(".quick-action-btn").forEach(t=>{t.querySelector(".quick-action-text")?.textContent.includes("Add Project to Showcase")&&t.addEventListener("click",()=>{const e=document.getElementById("widgetSlotUploadContainer");e&&(e.scrollIntoView({behavior:"smooth",block:"center"}),e.style.boxShadow="0 0 16px 4px #4caf50",setTimeout(()=>e.style.boxShadow="",1200))})});
