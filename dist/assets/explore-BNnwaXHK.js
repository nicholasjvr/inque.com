import{a as N,d}from"./auth-YTXLyXWo.js";/* empty css                       */import{getDoc as $,doc as p,updateDoc as L,arrayRemove as C,arrayUnion as k,getDocs as W,collection as A}from"https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";import{onAuthStateChanged as U}from"https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";import"./profile_banner-s0IkmVks.js";import"https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";import"https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";import"https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";const x=document.getElementById("exploreWidgetList"),a=document.getElementById("widgetSearch"),h=document.getElementById("sortSelect"),E=document.getElementById("categorySelect"),f=document.getElementById("refreshBtn"),M=document.getElementById("loadMoreBtn"),I=document.getElementById("loadMoreContainer"),B=document.getElementById("emptyState"),O=document.getElementById("clearFiltersBtn");let i=null,g=new Set,r=[],u=[],w=[],P=0;const F=12;async function S(){try{console.log("[EXPLORE] Fetching widgets from database"),console.log("[EXPLORE] Firebase db instance:",!!d);const e=await W(A(d,"widgets")),o=[];return e.forEach(t=>{const n=t.data();console.log("[EXPLORE] Processing widget",{id:t.id,title:n.title,userId:n.userId,fileCount:n.files?.length||0}),o.push({...n,id:t.id,userId:n.userId})}),console.log("[EXPLORE] Total widgets found:",o.length),o}catch(e){return console.error("[EXPLORE] Error fetching widgets:",e),l("Failed to load widgets","error"),[]}}function z(e){for(let o=e.length-1;o>0;o--){const t=Math.floor(Math.random()*(o+1));[e[o],e[t]]=[e[t],e[o]]}return e}function G(e,o,t){let n=[...e];if(o){const s=o.toLowerCase();n=n.filter(m=>m.title?.toLowerCase().includes(s)||m.description?.toLowerCase().includes(s)||m.userName?.toLowerCase().includes(s))}return t!=="all"&&(n=n.filter(s=>s.category===t||s.tags?.includes(t))),n}function H(e,o){const t=[...e];switch(o){case"recent":return t.sort((n,s)=>new Date(s.createdAt||0)-new Date(n.createdAt||0));case"popular":return t.sort((n,s)=>(s.likes||0)-(n.likes||0));case"name":return t.sort((n,s)=>(n.title||"").localeCompare(s.title||""));case"random":return z(t);default:return t}}function q(e,o){const t=o*F,n=t+F;return e.slice(t,n)}function D(e){if(!Array.isArray(e)||e.length===0)return null;const o=e.find(t=>t.fileName&&/index\.html?$/i.test(t.fileName));return o||e.find(t=>t.fileName&&/\.html?$/i.test(t.fileName))}async function K(){if(i)try{console.log("[EXPLORE DEBUG] Loading user following list",{userId:i.uid});const e=await $(p(d,"users",i.uid));if(e.exists()){const o=e.data();g=new Set(o.following||[]),console.log("[EXPLORE DEBUG] Following list loaded",{count:g.size})}}catch(e){console.error("[EXPLORE DEBUG] Error loading following list:",e)}}async function V(e,o){if(!i){l("Please log in to follow users","warning");return}if(i.uid===e){l("You can't follow yourself","warning");return}try{const t=g.has(e);console.log("[EXPLORE DEBUG] Toggling follow",{targetUserId:e,isFollowing:t,currentUserId:i.uid}),t?(await L(p(d,"users",i.uid),{following:C(e)}),await L(p(d,"users",e),{followers:C(i.uid)}),g.delete(e),o.textContent="Follow",o.classList.remove("following"),l("Unfollowed user","info")):(await L(p(d,"users",i.uid),{following:k(e)}),await L(p(d,"users",e),{followers:k(i.uid)}),g.add(e),o.textContent="Following",o.classList.add("following"),l("Now following user!","success"))}catch(t){console.error("[EXPLORE DEBUG] Error toggling follow:",t),l("Error updating follow status","error")}}function Y(e,o){if(!i){l("Please log in to message users","warning");return}if(i.uid===e){l("You can't message yourself","warning");return}console.log("[EXPLORE DEBUG] Opening message modal",{targetUserId:e,targetUserName:o});const t=document.createElement("div");t.className="message-modal",t.innerHTML=`
    <div class="message-modal-content">
      <div class="message-modal-header">
        <h3>💬 Message ${o}</h3>
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
  `,document.body.appendChild(t),t.style.display="flex";const n=t.querySelector(".message-modal-close"),s=t.querySelector(".message-cancel-btn"),m=t.querySelector(".message-send-btn"),R=t.querySelector("#messageText"),y=()=>{document.body.removeChild(t)};n.addEventListener("click",y),s.addEventListener("click",y),t.addEventListener("click",v=>{v.target===t&&y()}),m.addEventListener("click",async()=>{const v=R.value.trim();if(!v){l("Please enter a message","warning");return}try{console.log("[EXPLORE DEBUG] Sending message",{to:e,from:i.uid,message:v}),l(`Message sent to ${o}!`,"success"),y()}catch(X){console.error("[EXPLORE DEBUG] Error sending message:",X),l("Error sending message","error")}}),setTimeout(()=>R.focus(),100)}function l(e,o="info"){const t=document.createElement("div");t.className=`explore-toast explore-toast-${o}`,t.textContent=e;const n=document.getElementById("toastContainer");n?n.appendChild(t):document.body.appendChild(t),t.classList.add("fade-in"),setTimeout(()=>{t.parentNode&&(t.style.opacity="0",t.style.transform="translateX(100%)",setTimeout(()=>{t.parentNode&&t.parentNode.removeChild(t)},300))},4e3)}async function _(){try{if(console.log("[EXPLORE] Initializing explore page with Firebase integration"),r=await S(),!r.length){b("No widgets found yet. Check back later!");return}if(r=r.filter(e=>{const o=D(e.files);return o&&o.downloadURL}),!r.length){b("No widgets with previews available yet.");return}c(),J(),console.log("[EXPLORE] Explore page initialized successfully")}catch(e){console.error("[EXPLORE] Error initializing explore page:",e),b("Failed to load widgets. Please refresh the page.")}}function c(){const e=a?.value||"",o=E?.value||"all",t=h?.value||"recent";u=G(r,e,o),u=H(u,t),P=0,w=[],T()}function T(){if(!u.length){b("No widgets match your current filters.");return}const e=q(u,P);P===0&&(x.innerHTML=""),e.forEach(t=>{const n=j(t);x.appendChild(n)}),w=[...w,...e];const o=w.length<u.length;I.style.display=o?"flex":"none",B.style.display=u.length===0?"flex":"none"}function j(e){const o=D(e.files),t=g.has(e.userId),n=i&&i.uid===e.userId,s=document.createElement("div");return s.className="explore-widget-card",s.innerHTML=`
    <div class="explore-widget-header">
      <h3 class="explore-widget-title">${e.title||"Untitled Widget"}</h3>
      <div class="explore-widget-user">by ${e.userName||"Unknown User"}</div>
    </div>

    <div class="explore-widget-preview">
      ${o&&o.downloadURL?`<iframe src="${o.downloadURL}" sandbox="allow-scripts allow-same-origin" loading="lazy"></iframe>`:'<div class="no-preview">📦 No Preview Available</div>'}
    </div>

    <div class="explore-widget-actions">
      <a href="/?user=${e.userId}" class="explore-profile-link" title="View ${e.userName||"User"}'s profile">👤 Profile</a>
      ${n?"":`
        <button class="explore-follow-btn ${t?"following":""}"
                data-user-id="${e.userId}"
                title="${t?"Unfollow user":"Follow user"}">
          ${t?"✓ Following":"+ Follow"}
        </button>
        <button class="explore-message-btn"
                data-user-id="${e.userId}"
                data-user-name="${e.userName||"Unknown User"}"
                title="Send message">
          💬 Message
        </button>
      `}
    </div>
  `,s}function b(e){x.innerHTML="",I.style.display="none",B.style.display="flex";const o=B.querySelector("p");o&&(o.textContent=e)}function J(){if(a){let e;a.addEventListener("input",o=>{clearTimeout(e),e=setTimeout(()=>{c()},300)})}h&&h.addEventListener("change",c),E&&E.addEventListener("change",c),f&&f.addEventListener("click",async()=>{f.disabled=!0,f.innerHTML='<span>🔄</span><span class="btn-text">Loading...</span>';try{r=await S(),c(),l("Widgets refreshed!","success")}catch{l("Failed to refresh widgets","error")}finally{f.disabled=!1,f.innerHTML='<span>🔄</span><span class="btn-text">Refresh</span>'}}),M&&M.addEventListener("click",()=>{P++,T(),w.length>F&&x.lastElementChild.scrollIntoView({behavior:"smooth",block:"end"})}),O&&O.addEventListener("click",()=>{a&&(a.value=""),h&&(h.value="recent"),E&&(E.value="all"),c()})}_().catch(e=>{console.error("[EXPLORE] Failed to initialize explore page:",e);const o=document.getElementById("exploreWidgetList");o&&(o.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Failed to load widgets</h3>
        <p>There was an error loading the explore page. Please refresh the page to try again.</p>
        <button class="empty-action-btn" onclick="window.location.reload()">Refresh Page</button>
      </div>
    `)});U(N,async e=>{console.log("[EXPLORE] Firebase auth state changed",{userId:e?.uid,isAuthenticated:!!e}),i=e,e?(await K(),r.length>0&&c()):(g.clear(),r.length>0&&c())});document.addEventListener("click",e=>{if(e.target.matches(".explore-follow-btn")){e.preventDefault();const o=e.target.dataset.userId;V(o,e.target)}if(e.target.matches(".explore-message-btn")){e.preventDefault();const o=e.target.dataset.userId,t=e.target.dataset.userName;Y(o,t)}e.target.matches(".explore-widget-preview iframe")&&e.preventDefault()});document.addEventListener("DOMContentLoaded",()=>{console.log("[EXPLORE] Initializing enhanced features"),Q()});function Q(){document.documentElement.style.scrollBehavior="smooth",document.addEventListener("keydown",Z),ee(),te()}function Z(e){(e.ctrlKey||e.metaKey)&&e.key==="k"&&(e.preventDefault(),a&&(a.focus(),a.select())),e.key==="Escape"&&document.activeElement===a&&(a.value="",c())}function ee(){document.addEventListener("keydown",e=>{e.key==="Tab"&&document.body.classList.add("keyboard-navigation")}),document.addEventListener("mousedown",()=>{document.body.classList.remove("keyboard-navigation")})}function te(){const e={threshold:.1,rootMargin:"0px 0px -50px 0px"},o=new IntersectionObserver(t=>{t.forEach(n=>{n.isIntersecting&&(n.target.classList.add("fade-in"),o.unobserve(n.target))})},e);document.querySelectorAll(".explore-widget-card").forEach(t=>{o.observe(t)})}
