import{a as ee,d as S}from"./auth-DH_qk2Bl.js";/* empty css              */import{getDocs as te,collection as L,query as ne,orderBy as se,limit as oe,onSnapshot as ie,addDoc as ae,serverTimestamp as re}from"https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";import{onAuthStateChanged as le}from"https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";import"./profile_banner-CjLez_F2.js";import"https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";import"https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";import"https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";document.addEventListener("DOMContentLoaded",()=>{console.log("🚀 [USERS PAGE] Initializing Users Explore Page");const d=document.getElementById("users-container"),C=document.getElementById("chatModal"),A=document.getElementById("chat-with-user"),R=document.getElementById("closeChat"),g=document.getElementById("chat-messages"),f=document.getElementById("chat-message-input"),u=document.getElementById("chat-send-btn"),U=document.getElementById("errorModal"),I=document.getElementById("errorTitle"),B=document.getElementById("errorMessage"),M=document.getElementById("errorRetryBtn"),x=document.getElementById("errorCloseBtn");let i=null,p=null,m=null,v=[],$=[];G(),H();function G(){console.log("🔧 [USERS PAGE] Setting up modular components and event listeners"),initializeSearchAndFilters(),q(),F(),x.addEventListener("click",w),M.addEventListener("click",()=>{w(),T()}),R.addEventListener("click",X),u.addEventListener("click",P),f.addEventListener("keypress",e=>{e.key==="Enter"&&P()}),le(ee,e=>{i=e,e?(console.log("✅ [USERS PAGE] User authenticated:",e.uid),T()):(console.log("❌ [USERS PAGE] No user authenticated"),y("Please log in to view users"))})}function h(e,t,n=null){I.textContent=e,B.textContent=t,U.classList.add("show"),n&&(M.onclick=()=>{w(),n()})}function w(){U.classList.remove("show")}function c(e,t="Unknown"){console.error(`Error in ${t}:`,e);let n="Error",s="An unexpected error occurred.";e.code==="permission-denied"?(n="Access Denied",s="You don't have permission to access this feature. Please log in."):e.code==="unavailable"?(n="Connection Error",s="Unable to connect to the server. Please check your internet connection."):e.code==="not-found"?(n="Not Found",s="The requested resource was not found."):e.message.includes("recaptcha")&&(n="Security Check Failed",s="The security verification failed. Please try again."),h(n,s)}function N(){d.innerHTML=`
      <div class="users-loading">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading Users...</div>
      </div>
    `}function y(e){d.innerHTML=`
      <div class="users-empty">
        <h3>No Users Found</h3>
        <p>${e}</p>
      </div>
    `}function q(){console.log("📊 [USERS PAGE] Initializing user stats component");const e=document.querySelector(".page-header"),t=document.createElement("div");t.className="user-stats-bar",t.innerHTML=`
      <div class="stat-item">
        <span class="stat-number" id="total-users">0</span>
        <span class="stat-label">Total Users</span>
      </div>
      <div class="stat-item">
        <span class="stat-number" id="online-users">0</span>
        <span class="stat-label">Online Now</span>
      </div>
      <div class="stat-item">
        <span class="stat-number" id="active-today">0</span>
        <span class="stat-label">Active Today</span>
      </div>
    `,e.appendChild(t)}function F(){console.log("🎨 [USERS PAGE] Initializing theme toggle component");const e=document.querySelector(".page-header"),t=document.createElement("button");t.className="theme-toggle-btn",t.innerHTML="🌙",t.title="Toggle Dark/Light Theme",t.addEventListener("click",j),e.appendChild(t)}function H(){console.log("📱 [USERS PAGE] Initializing mobile menu functionality");const e=()=>{if(window.innerWidth<=480){const t=document.querySelector(".page-header"),n=document.querySelector(".header-actions");if(t&&n&&!document.querySelector(".mobile-menu-toggle")){const s=document.createElement("button");s.className="mobile-menu-toggle",s.innerHTML="☰",s.setAttribute("aria-label","Toggle navigation menu"),t.appendChild(s),s.addEventListener("click",()=>{console.log("📱 [USERS PAGE] Mobile menu toggled"),n.classList.toggle("show"),s.innerHTML=n.classList.contains("show")?"✕":"☰"}),document.addEventListener("click",o=>{!t.contains(o.target)&&n.classList.contains("show")&&(n.classList.remove("show"),s.innerHTML="☰")})}}};e(),window.addEventListener("resize",()=>{const t=document.querySelector(".mobile-menu-toggle");t&&window.innerWidth>480?(t.remove(),document.querySelector(".header-actions").classList.remove("show")):window.innerWidth<=480&&e()})}function z(){console.log("📈 [USERS PAGE] Updating user statistics");const e=v.length,t=v.filter(s=>s.isOnline).length,n=v.filter(s=>{if(!s.lastActive)return!1;const o=new Date(Date.now()-1440*60*1e3);return new Date(s.lastActive)>o}).length;b("total-users",e),b("online-users",t),b("active-today",n)}function b(e,t){const n=document.getElementById(e);if(!n)return;const s=parseInt(n.textContent)||0,o=1e3,r=performance.now();function l(E){const a=E-r,k=Math.min(a/o,1),Z=Math.round(s+(t-s)*k);n.textContent=Z,k<1&&requestAnimationFrame(l)}requestAnimationFrame(l)}function j(){console.log("🎨 [USERS PAGE] Toggling theme");const e=document.body;e.classList.contains("light-theme")?(e.classList.remove("light-theme"),e.classList.add("dark-theme")):(e.classList.remove("dark-theme"),e.classList.add("light-theme"))}const T=async()=>{if(d){console.log("📡 [USERS PAGE] Fetching users from database"),N();try{const e=await te(L(S,"users")),t=[];if(e.forEach(n=>{if(i&&n.id===i.uid)return;const s={id:n.id,...n.data()};s.isOnline=Math.random()>.7,s.projectCount=Math.floor(Math.random()*10),s.lastActive=new Date(Date.now()-Math.random()*7*24*60*60*1e3),s.bio=s.bio||"Creative developer exploring the digital universe! 🚀",s.skills=s.skills||["JavaScript","React","Design","Innovation"],t.push(s)}),t.length===0){y("No other users found. Be the first to join!");return}v=t,$=[...t],console.log(`✅ [USERS PAGE] Loaded ${t.length} users`),O(t),z()}catch(e){console.error("❌ [USERS PAGE] Error fetching users:",e),c(e,"fetchUsers"),y("Failed to load users. Please try again.")}}};function O(e){d.innerHTML="",e.forEach(t=>{const n=W(t);d.appendChild(n)})}function W(e){console.log("🎨 [USERS PAGE] Creating enhanced user card for:",e.name);const t=document.createElement("div");t.className="user-card",t.dataset.uid=e.id,t.dataset.name=e.name;const n=e.isOnline?'<div class="online-indicator"></div>':"",s=e.skills?e.skills.slice(0,3).map(a=>`<span class="skill-badge">${a}</span>`).join(""):"",o=V(e.lastActive);t.innerHTML=`
      <div class="user-card-header">
        <div class="user-card-pic" style="background-image: url(${e.photoURL||"assets/imgs/portal_placeholder.gif"})"></div>
        ${n}
      </div>
      
      <div class="user-card-content">
        <h3 class="user-card-name">${e.name||"Anonymous User"}</h3>
        <p class="user-card-bio">${e.bio||"Creative developer exploring the digital universe! 🚀"}</p>
        
        <div class="user-card-stats">
          <div class="stat">
            <span class="stat-icon">📊</span>
            <span class="stat-value">${e.projectCount||0}</span>
            <span class="stat-label">Projects</span>
          </div>
          <div class="stat">
            <span class="stat-icon">🕐</span>
            <span class="stat-value">${o}</span>
          </div>
        </div>
        
        <div class="user-card-skills">
          ${s}
        </div>
      </div>
      
      <div class="user-card-hover">
        <button class="chat-btn">
          <span class="btn-icon">💬</span>
          <span class="btn-text">Chat</span>
        </button>
        <a href="/?user=${e.id}" class="view-profile-btn">
          <span class="btn-icon">👤</span>
          <span class="btn-text">View Profile</span>
        </a>
        <button class="follow-btn">
          <span class="btn-icon">➕</span>
          <span class="btn-text">Follow</span>
        </button>
      </div>
    `;const r=t.querySelector(".chat-btn"),l=t.querySelector(".follow-btn");return r.addEventListener("click",a=>{a.stopPropagation(),Y(e)}),l.addEventListener("click",a=>{a.stopPropagation(),J(e)}),t.querySelector(".view-profile-btn").addEventListener("click",a=>{a.stopPropagation(),_(e)}),t.addEventListener("click",()=>{t.style.transform="scale(0.98)",setTimeout(()=>{t.style.transform=""},150)}),t}function V(e){if(!e)return"Unknown";const s=(new Date-new Date(e))/(1e3*60*60),o=s/24;return s<1?"Just now":s<24?`${Math.floor(s)}h ago`:o<7?`${Math.floor(o)}d ago`:`${Math.floor(o/7)}w ago`}function _(e){console.log("👤 [USERS PAGE] View Profile button clicked for:",e.name,"("+e.id+")");const t=`/?user=${e.id}`;console.log("🔗 [USERS PAGE] Navigating to profile URL:",t),window.location.href=t}function J(e){if(console.log("➕ [USERS PAGE] Follow button clicked for:",e.name),!i){h("Login Required","Please log in to follow other users.",()=>{window.location.href="/"});return}D(`Now following ${e.name}! 🎉`,"success")}function D(e,t="info"){console.log("🔔 [USERS PAGE] Showing notification:",e);const n=document.createElement("div");n.className=`notification notification-${t}`,n.textContent=e,document.body.appendChild(n),setTimeout(()=>{n.classList.add("show")},100),setTimeout(()=>{n.classList.remove("show"),setTimeout(()=>{document.body.removeChild(n)},300)},3e3)}function Y(e){if(!i){h("Login Required","Please log in to start a chat with other users.",()=>{window.location.href="/"});return}K(e.id,e.name)}function K(e,t){try{A.textContent=`Chat with ${t}`;const n=[i.uid,e].sort();m=`chat_${n[0]}_${n[1]}`,g.innerHTML="",C.style.display="flex";const s=L(S,"chats",m,"messages"),o=ne(s,se("timestamp","asc"),oe(50));p=ie(o,r=>{r.docChanges().forEach(l=>{if(l.type==="added"){const E=l.doc.data();Q(E)}}),g.scrollTop=g.scrollHeight},r=>{c(r,"chatListener")})}catch(n){c(n,"openChat")}}function Q(e){const t=document.createElement("div");t.className="message",t.classList.add(e.senderId===i.uid?"sent":"received"),t.textContent=e.text,g.appendChild(t)}async function P(){const e=f.value.trim();if(!(e===""||!m||!i))try{u.disabled=!0,u.textContent="Sending...";const t=L(S,"chats",m,"messages");await ae(t,{text:e,senderId:i.uid,timestamp:re()}),f.value=""}catch(t){c(t,"sendMessage"),h("Send Failed","Failed to send message. Please try again.")}finally{u.disabled=!1,u.textContent="Send"}}function X(){C.style.display="none",p&&(p(),p=null),m=null,f.value=""}window.addEventListener("error",e=>{c(e.error,"Global Error")}),window.addEventListener("unhandledrejection",e=>{c(e.reason,"Unhandled Promise Rejection")}),window.addEventListener("message",e=>{e.data&&e.data.type==="recaptcha-error"&&h("Security Check Failed","The security verification failed. Please refresh the page and try again.")})});
