import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css              */import{getDocs as re,collection as k,query as ce,orderBy as le,limit as de,onSnapshot as ue,addDoc as me,serverTimestamp as he}from"https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";import{auth as pe,db as P}from"./firebase-core-BO8UvLyb.js";import{onAuthStateChanged as ge}from"https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";import"https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";import"https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";import"https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";document.addEventListener("DOMContentLoaded",()=>{console.log("🚀 [USERS PAGE] Initializing Users Explore Page");const u=document.getElementById("users-container"),M=document.getElementById("chatModal"),$=document.getElementById("chat-with-user"),N=document.getElementById("closeChat"),f=document.getElementById("chat-messages"),v=document.getElementById("chat-message-input"),m=document.getElementById("chat-send-btn"),R=document.getElementById("errorModal"),F=document.getElementById("errorTitle"),j=document.getElementById("errorMessage"),I=document.getElementById("errorRetryBtn"),q=document.getElementById("errorCloseBtn");let a=null,E=null,h=null,c=[],p=[],y="all",b="name";H();function H(){console.log("🔧 [USERS PAGE] Setting up modular components and event listeners"),D(),O(),V(),q.addEventListener("click",C),I.addEventListener("click",()=>{C(),T()}),N.addEventListener("click",ae),m.addEventListener("click",x),v.addEventListener("keypress",e=>{e.key==="Enter"&&x()}),ge(pe,e=>{a=e,e?(console.log("✅ [USERS PAGE] User authenticated:",e.uid),T()):(console.log("❌ [USERS PAGE] No user authenticated"),L("Please log in to view users"))})}function g(e,t,n=null){F.textContent=e,j.textContent=t,R.classList.add("show"),n&&(I.onclick=()=>{C(),n()})}function C(){R.classList.remove("show")}function d(e,t="Unknown"){console.error(`Error in ${t}:`,e);let n="Error",s="An unexpected error occurred.";e.code==="permission-denied"?(n="Access Denied",s="You don't have permission to access this feature. Please log in."):e.code==="unavailable"?(n="Connection Error",s="Unable to connect to the server. Please check your internet connection."):e.code==="not-found"?(n="Not Found",s="The requested resource was not found."):e.message.includes("recaptcha")&&(n="Security Check Failed",s="The security verification failed. Please try again."),g(n,s)}function z(){u.innerHTML=`
      <div class="users-loading">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading Users...</div>
      </div>
    `}function L(e){u.innerHTML=`
      <div class="users-empty">
        <h3>No Users Found</h3>
        <p>${e}</p>
      </div>
    `}function D(){console.log("🔍 [USERS PAGE] Initializing search and filters component");const e=document.querySelector(".page-header"),t=document.createElement("div");t.className="search-filter-bar",t.innerHTML=`
      <div class="search-container">
        <input type="text" id="user-search" placeholder="🔍 Search users..." class="search-input">
        <button id="clear-search" class="clear-search-btn">✕</button>
      </div>
      <div class="filter-container">
        <select id="user-filter" class="filter-select">
          <option value="all">👥 All Users</option>
          <option value="online">🟢 Online Now</option>
          <option value="recent">🕐 Recently Active</option>
          <option value="creators">🎨 Content Creators</option>
        </select>
        <select id="user-sort" class="sort-select">
          <option value="name">📝 Name (A-Z)</option>
          <option value="recent">⏰ Recent Activity</option>
          <option value="projects">📊 Most Projects</option>
          <option value="random">🎲 Random</option>
        </select>
      </div>
    `,e.appendChild(t);const n=document.getElementById("user-search"),s=document.getElementById("clear-search"),o=document.getElementById("user-filter"),i=document.getElementById("user-sort");n.addEventListener("input",_),s.addEventListener("click",J),o.addEventListener("change",W),i.addEventListener("change",Y)}function O(){console.log("📊 [USERS PAGE] Initializing user stats component");const e=document.querySelector(".page-header"),t=document.createElement("div");t.className="user-stats-bar",t.innerHTML=`
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
    `,e.appendChild(t)}function V(){console.log("🎨 [USERS PAGE] Initializing theme toggle component");const e=document.querySelector(".page-header"),t=document.createElement("button");t.className="theme-toggle-btn",t.innerHTML="🌙",t.title="Toggle Dark/Light Theme",t.addEventListener("click",Z),e.appendChild(t)}function _(e){const t=e.target.value.toLowerCase();console.log("🔍 [USERS PAGE] Searching for:",t),t===""?p=[...c]:p=c.filter(n=>n.name?.toLowerCase().includes(t)||n.email?.toLowerCase().includes(t)||n.bio?.toLowerCase().includes(t)),S(),A()}function J(){console.log("🧹 [USERS PAGE] Clearing search"),document.getElementById("user-search").value="",p=[...c],S(),A()}function W(e){y=e.target.value,console.log("🔧 [USERS PAGE] Filter changed to:",y),S()}function Y(e){b=e.target.value,console.log("📊 [USERS PAGE] Sort changed to:",b),S()}function S(){let e=[...p];switch(y){case"online":e=e.filter(n=>n.isOnline);break;case"recent":const t=new Date(Date.now()-1440*60*1e3);e=e.filter(n=>n.lastActive&&new Date(n.lastActive)>t);break;case"creators":e=e.filter(n=>n.projectCount>0);break}switch(b){case"name":e.sort((t,n)=>(t.name||"").localeCompare(n.name||""));break;case"recent":e.sort((t,n)=>new Date(n.lastActive||0)-new Date(t.lastActive||0));break;case"projects":e.sort((t,n)=>(n.projectCount||0)-(t.projectCount||0));break;case"random":e=e.sort(()=>Math.random()-.5);break}B(e)}function A(){console.log("📈 [USERS PAGE] Updating user statistics");const e=c.length,t=c.filter(s=>s.isOnline).length,n=c.filter(s=>{if(!s.lastActive)return!1;const o=new Date(Date.now()-1440*60*1e3);return new Date(s.lastActive)>o}).length;U("total-users",e),U("online-users",t),U("active-today",n)}function U(e,t){const n=document.getElementById(e);if(!n)return;const s=parseInt(n.textContent)||0,o=1e3,i=performance.now();function l(w){const r=w-i,G=Math.min(r/o,1),ie=Math.round(s+(t-s)*G);n.textContent=ie,G<1&&requestAnimationFrame(l)}requestAnimationFrame(l)}function Z(){console.log("🎨 [USERS PAGE] Toggling theme");const e=document.body;e.classList.contains("light-theme")?(e.classList.remove("light-theme"),e.classList.add("dark-theme")):(e.classList.remove("dark-theme"),e.classList.add("light-theme"))}const T=async()=>{if(u){console.log("📡 [USERS PAGE] Fetching users from database"),z();try{const e=await re(k(P,"users")),t=[];if(e.forEach(n=>{if(a&&n.id===a.uid)return;const s={id:n.id,...n.data()};s.isOnline=Math.random()>.7,s.projectCount=Math.floor(Math.random()*10),s.lastActive=new Date(Date.now()-Math.random()*7*24*60*60*1e3),s.bio=s.bio||"Creative developer exploring the digital universe! 🚀",s.skills=s.skills||["JavaScript","React","Design","Innovation"],t.push(s)}),t.length===0){L("No other users found. Be the first to join!");return}c=t,p=[...t],console.log(`✅ [USERS PAGE] Loaded ${t.length} users`),B(t),A()}catch(e){console.error("❌ [USERS PAGE] Error fetching users:",e),d(e,"fetchUsers"),L("Failed to load users. Please try again.")}}};function B(e){u.innerHTML="",e.forEach(t=>{const n=K(t);u.appendChild(n)})}function K(e){console.log("🎨 [USERS PAGE] Creating enhanced user card for:",e.name);const t=document.createElement("div");t.className="user-card",t.dataset.uid=e.id,t.dataset.name=e.name;const n=e.isOnline?'<div class="online-indicator"></div>':"",s=e.skills?e.skills.slice(0,3).map(r=>`<span class="skill-badge">${r}</span>`).join(""):"",o=Q(e.lastActive);t.innerHTML=`
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
    `;const i=t.querySelector(".chat-btn"),l=t.querySelector(".follow-btn");return i.addEventListener("click",r=>{r.stopPropagation(),ne(e)}),l.addEventListener("click",r=>{r.stopPropagation(),ee(e)}),t.querySelector(".view-profile-btn").addEventListener("click",r=>{r.stopPropagation(),X(e)}),t.addEventListener("click",()=>{t.style.transform="scale(0.98)",setTimeout(()=>{t.style.transform=""},150)}),t}function Q(e){if(!e)return"Unknown";const s=(new Date-new Date(e))/(1e3*60*60),o=s/24;return s<1?"Just now":s<24?`${Math.floor(s)}h ago`:o<7?`${Math.floor(o)}d ago`:`${Math.floor(o/7)}w ago`}function X(e){console.log("👤 [USERS PAGE] View Profile button clicked for:",e.name,"("+e.id+")");const t=`/?user=${e.id}`;console.log("🔗 [USERS PAGE] Navigating to profile URL:",t),window.location.href=t}function ee(e){if(console.log("➕ [USERS PAGE] Follow button clicked for:",e.name),!a){g("Login Required","Please log in to follow other users.",()=>{window.location.href="/"});return}te(`Now following ${e.name}! 🎉`,"success")}function te(e,t="info"){console.log("🔔 [USERS PAGE] Showing notification:",e);const n=document.createElement("div");n.className=`notification notification-${t}`,n.textContent=e,document.body.appendChild(n),setTimeout(()=>{n.classList.add("show")},100),setTimeout(()=>{n.classList.remove("show"),setTimeout(()=>{document.body.removeChild(n)},300)},3e3)}function ne(e){if(!a){g("Login Required","Please log in to start a chat with other users.",()=>{window.location.href="/"});return}se(e.id,e.name)}function se(e,t){try{$.textContent=`Chat with ${t}`;const n=[a.uid,e].sort();h=`chat_${n[0]}_${n[1]}`,f.innerHTML="",M.style.display="flex";const s=k(P,"chats",h,"messages"),o=ce(s,le("timestamp","asc"),de(50));E=ue(o,i=>{i.docChanges().forEach(l=>{if(l.type==="added"){const w=l.doc.data();oe(w)}}),f.scrollTop=f.scrollHeight},i=>{d(i,"chatListener")})}catch(n){d(n,"openChat")}}function oe(e){const t=document.createElement("div");t.className="message",t.classList.add(e.senderId===a.uid?"sent":"received"),t.textContent=e.text,f.appendChild(t)}async function x(){const e=v.value.trim();if(!(e===""||!h||!a))try{m.disabled=!0,m.textContent="Sending...";const t=k(P,"chats",h,"messages");await me(t,{text:e,senderId:a.uid,timestamp:he()}),v.value=""}catch(t){d(t,"sendMessage"),g("Send Failed","Failed to send message. Please try again.")}finally{m.disabled=!1,m.textContent="Send"}}function ae(){M.style.display="none",E&&(E(),E=null),h=null,v.value=""}window.addEventListener("error",e=>{d(e.error,"Global Error")}),window.addEventListener("unhandledrejection",e=>{d(e.reason,"Unhandled Promise Rejection")}),window.addEventListener("message",e=>{e.data&&e.data.type==="recaptcha-error"&&g("Security Check Failed","The security verification failed. Please refresh the page and try again.")})});
