import{a as N,d as u}from"./auth-YTXLyXWo.js";/* empty css                       */import{getDoc as U,doc as p,updateDoc as b,arrayRemove as C,arrayUnion as O,getDocs as W,collection as A}from"https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";import{onAuthStateChanged as z}from"https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";import"./profile_banner-20qet_68.js";import"https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";import"https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";import"https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";const F=document.getElementById("exploreWidgetList"),r=document.getElementById("widgetSearch"),w=document.getElementById("sortSelect"),h=document.getElementById("categorySelect"),m=document.getElementById("refreshBtn"),T=document.getElementById("loadMoreBtn"),$=document.getElementById("loadMoreContainer"),B=document.getElementById("emptyState"),D=document.getElementById("clearFiltersBtn");let l=null,f=new Set,d=[],g=[],E=[],P=0;const k=12;async function S(){try{console.log("[EXPLORE] Fetching widgets from database"),console.log("[EXPLORE] Firebase db instance:",!!u);const e=await W(A(u,"widgets")),o=[];return e.forEach(t=>{const n=t.data();console.log("[EXPLORE] Processing widget",{id:t.id,title:n.title,userId:n.userId,fileCount:n.files?.length||0}),o.push({...n,id:t.id,userId:n.userId})}),console.log("[EXPLORE] Total widgets found:",o.length),o}catch(e){return console.error("[EXPLORE] Error fetching widgets:",e),i("Failed to load widgets","error"),[]}}function G(e){for(let o=e.length-1;o>0;o--){const t=Math.floor(Math.random()*(o+1));[e[o],e[t]]=[e[t],e[o]]}return e}function q(e,o,t){let n=[...e];if(o){const s=o.toLowerCase();n=n.filter(a=>a.title?.toLowerCase().includes(s)||a.description?.toLowerCase().includes(s)||a.userName?.toLowerCase().includes(s))}return t!=="all"&&(n=n.filter(s=>s.category===t||s.tags?.includes(t))),n}function H(e,o){const t=[...e];switch(o){case"recent":return t.sort((n,s)=>new Date(s.createdAt||0)-new Date(n.createdAt||0));case"popular":return t.sort((n,s)=>(s.likes||0)-(n.likes||0));case"name":return t.sort((n,s)=>(n.title||"").localeCompare(s.title||""));case"random":return G(t);default:return t}}function K(e,o){const t=o*k,n=t+k;return e.slice(t,n)}function I(e){if(!Array.isArray(e)||e.length===0)return null;const o=e.find(t=>t.fileName&&/index\.html?$/i.test(t.fileName));return o||e.find(t=>t.fileName&&/\.html?$/i.test(t.fileName))}async function V(){if(l)try{console.log("[EXPLORE DEBUG] Loading user following list",{userId:l.uid});const e=await U(p(u,"users",l.uid));if(e.exists()){const o=e.data();f=new Set(o.following||[]),console.log("[EXPLORE DEBUG] Following list loaded",{count:f.size})}}catch(e){console.error("[EXPLORE DEBUG] Error loading following list:",e)}}async function Y(e,o){if(!l){i("Please log in to follow users","warning");return}if(l.uid===e){i("You can't follow yourself","warning");return}try{const t=f.has(e);console.log("[EXPLORE DEBUG] Toggling follow",{targetUserId:e,isFollowing:t,currentUserId:l.uid}),t?(await b(p(u,"users",l.uid),{following:C(e)}),await b(p(u,"users",e),{followers:C(l.uid)}),f.delete(e),o.textContent="Follow",o.classList.remove("following"),i("Unfollowed user","info")):(await b(p(u,"users",l.uid),{following:O(e)}),await b(p(u,"users",e),{followers:O(l.uid)}),f.add(e),o.textContent="Following",o.classList.add("following"),i("Now following user!","success"))}catch(t){console.error("[EXPLORE DEBUG] Error toggling follow:",t),i("Error updating follow status","error")}}function _(e,o){if(!l){i("Please log in to message users","warning");return}if(l.uid===e){i("You can't message yourself","warning");return}console.log("[EXPLORE DEBUG] Opening message modal",{targetUserId:e,targetUserName:o});const t=document.createElement("div");t.className="message-modal",t.innerHTML=`
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
  `,document.body.appendChild(t),t.style.display="flex";const n=t.querySelector(".message-modal-close"),s=t.querySelector(".message-cancel-btn"),a=t.querySelector(".message-send-btn"),v=t.querySelector("#messageText"),y=()=>{document.body.removeChild(t)};n.addEventListener("click",y),s.addEventListener("click",y),t.addEventListener("click",L=>{L.target===t&&y()}),a.addEventListener("click",async()=>{const L=v.value.trim();if(!L){i("Please enter a message","warning");return}try{console.log("[EXPLORE DEBUG] Sending message",{to:e,from:l.uid,message:L}),i(`Message sent to ${o}!`,"success"),y()}catch(X){console.error("[EXPLORE DEBUG] Error sending message:",X),i("Error sending message","error")}}),setTimeout(()=>v.focus(),100)}function i(e,o="info"){const t=document.createElement("div");t.className=`explore-toast explore-toast-${o}`,t.textContent=e;const n=document.getElementById("toastContainer");n?n.appendChild(t):document.body.appendChild(t),t.classList.add("fade-in"),setTimeout(()=>{t.parentNode&&(t.style.opacity="0",t.style.transform="translateX(100%)",setTimeout(()=>{t.parentNode&&t.parentNode.removeChild(t)},300))},4e3)}function j(e,o){console.log("[EXPLORE] Opening fullscreen demo for widget:",e.title);const t=document.createElement("div");t.className="widget-fullscreen-modal active",t.innerHTML=`
    <div class="fullscreen-content">
      <div class="fullscreen-header">
        <h3 class="fullscreen-title">🎮 ${e.title||"Widget Demo"}</h3>
        <button class="fullscreen-close" title="Close fullscreen demo">&times;</button>
      </div>
      <div class="fullscreen-body">
        <iframe 
          src="${o.downloadURL}" 
          class="fullscreen-iframe"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          loading="eager"
          title="Fullscreen widget demo"
        ></iframe>
      </div>
    </div>
  `,document.body.appendChild(t);const n=a=>{a.key==="Escape"&&R(t,n)};t.querySelector(".fullscreen-close").addEventListener("click",()=>R(t,n)),t.addEventListener("click",a=>{a.target===t&&R(t,n)}),document.addEventListener("keydown",n),i(`Opened fullscreen demo: ${e.title}`,"success"),setTimeout(()=>{const a=t.querySelector(".fullscreen-iframe");a&&a.focus()},100)}function R(e,o){console.log("[EXPLORE] Closing fullscreen demo"),e.classList.remove("active"),o&&document.removeEventListener("keydown",o),setTimeout(()=>{e.parentNode&&document.body.removeChild(e)},200),i("Closed fullscreen demo","info")}async function J(){try{if(console.log("[EXPLORE] Initializing explore page with Firebase integration"),d=await S(),!d.length){x("No widgets found yet. Check back later!");return}if(d=d.filter(e=>{const o=I(e.files);return o&&o.downloadURL}),!d.length){x("No widgets with previews available yet.");return}c(),Z(),console.log("[EXPLORE] Explore page initialized successfully")}catch(e){console.error("[EXPLORE] Error initializing explore page:",e),x("Failed to load widgets. Please refresh the page.")}}function c(){const e=r?.value||"",o=h?.value||"all",t=w?.value||"recent";g=q(d,e,o),g=H(g,t),P=0,E=[],M()}function M(){if(!g.length){x("No widgets match your current filters.");return}const e=K(g,P);P===0&&(F.innerHTML=""),e.forEach(t=>{const n=Q(t);F.appendChild(n)}),E=[...E,...e];const o=E.length<g.length;$.style.display=o?"flex":"none",B.style.display=g.length===0?"flex":"none"}function Q(e){const o=I(e.files),t=f.has(e.userId),n=l&&l.uid===e.userId,s=document.createElement("div");return s.className="explore-widget-card",s.innerHTML=`
    <div class="explore-widget-header">
      <h3 class="explore-widget-title">${e.title||"Untitled Widget"}</h3>
      <div class="explore-widget-user">by ${e.userName||"Unknown User"}</div>
    </div>

    <div class="explore-widget-preview">
      ${o&&o.downloadURL?`<iframe src="${o.downloadURL}" sandbox="allow-scripts allow-same-origin" loading="lazy"></iframe>
             <div class="preview-overlay">
               <button class="fullscreen-demo-btn" 
                       data-widget-id="${e.id}"
                       data-widget-title="${e.title||"Untitled Widget"}"
                       data-widget-url="${o.downloadURL}"
                       title="Open fullscreen demo">
                 🖥️ Fullscreen Demo
               </button>
             </div>`:'<div class="no-preview">📦 No Preview Available</div>'}
    </div>

    <div class="explore-widget-actions">
      ${o&&o.downloadURL?`<button class="explore-demo-btn"
                     data-widget-id="${e.id}"
                     data-widget-title="${e.title||"Untitled Widget"}"
                     data-widget-url="${o.downloadURL}"
                     title="Try widget in fullscreen">
               🎮 Try Demo
             </button>`:""}
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
  `,s}function x(e){F.innerHTML="",$.style.display="none",B.style.display="flex";const o=B.querySelector("p");o&&(o.textContent=e)}function Z(){if(r){let e;r.addEventListener("input",o=>{clearTimeout(e),e=setTimeout(()=>{c()},300)})}w&&w.addEventListener("change",c),h&&h.addEventListener("change",c),m&&m.addEventListener("click",async()=>{m.disabled=!0,m.innerHTML='<span>🔄</span><span class="btn-text">Loading...</span>';try{d=await S(),c(),i("Widgets refreshed!","success")}catch{i("Failed to refresh widgets","error")}finally{m.disabled=!1,m.innerHTML='<span>🔄</span><span class="btn-text">Refresh</span>'}}),T&&T.addEventListener("click",()=>{P++,M(),E.length>k&&F.lastElementChild.scrollIntoView({behavior:"smooth",block:"end"})}),D&&D.addEventListener("click",()=>{r&&(r.value=""),w&&(w.value="recent"),h&&(h.value="all"),c()})}J().catch(e=>{console.error("[EXPLORE] Failed to initialize explore page:",e);const o=document.getElementById("exploreWidgetList");o&&(o.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Failed to load widgets</h3>
        <p>There was an error loading the explore page. Please refresh the page to try again.</p>
        <button class="empty-action-btn" onclick="window.location.reload()">Refresh Page</button>
      </div>
    `)});z(N,async e=>{console.log("[EXPLORE] Firebase auth state changed",{userId:e?.uid,isAuthenticated:!!e}),l=e,e?(await V(),d.length>0&&c()):(f.clear(),d.length>0&&c())});document.addEventListener("click",e=>{if(e.target.matches(".explore-follow-btn")){e.preventDefault();const o=e.target.dataset.userId;Y(o,e.target)}if(e.target.matches(".explore-message-btn")){e.preventDefault();const o=e.target.dataset.userId,t=e.target.dataset.userName;_(o,t)}if(e.target.matches(".explore-demo-btn")||e.target.matches(".fullscreen-demo-btn")){e.preventDefault();const o=e.target.dataset.widgetId,t=e.target.dataset.widgetTitle,n=e.target.dataset.widgetUrl;if(n){const s=d.find(v=>v.id===o)||{title:t};j(s,{downloadURL:n})}}if(e.target.matches(".explore-widget-preview iframe")){e.preventDefault();const o=e.target.closest(".explore-widget-card");if(o){const t=o.querySelector(".explore-demo-btn");t&&t.click()}}});document.addEventListener("DOMContentLoaded",()=>{console.log("[EXPLORE] Initializing enhanced features"),ee()});function ee(){document.documentElement.style.scrollBehavior="smooth",document.addEventListener("keydown",te),oe(),ne()}function te(e){(e.ctrlKey||e.metaKey)&&e.key==="k"&&(e.preventDefault(),r&&(r.focus(),r.select())),e.key==="Escape"&&document.activeElement===r&&(r.value="",c())}function oe(){document.addEventListener("keydown",e=>{e.key==="Tab"&&document.body.classList.add("keyboard-navigation")}),document.addEventListener("mousedown",()=>{document.body.classList.remove("keyboard-navigation")})}function ne(){const e={threshold:.1,rootMargin:"0px 0px -50px 0px"},o=new IntersectionObserver(t=>{t.forEach(n=>{n.isIntersecting&&(n.target.classList.add("fade-in"),o.unobserve(n.target))})},e);document.querySelectorAll(".explore-widget-card").forEach(t=>{o.observe(t)})}
