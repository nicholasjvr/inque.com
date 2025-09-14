import{auth as T,db as U}from"./firebase-core-BO8UvLyb.js";import{doc as S,updateDoc as $,collection as I,query as R,where as N,getDocs as P}from"https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";import{p as M}from"./profile-dashboard-manager-DumQz_VG.js";import{onAuthStateChanged as C}from"https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";const A="modulepreload",W=function(n,e){return new URL(n,e).href},L={},G=function(e,a,l){let d=Promise.resolve();if(a&&a.length>0){let f=function(c){return Promise.all(c.map(m=>Promise.resolve(m).then(o=>({status:"fulfilled",value:o}),o=>({status:"rejected",reason:o}))))};const r=document.getElementsByTagName("link"),s=document.querySelector("meta[property=csp-nonce]"),u=s?.nonce||s?.getAttribute("nonce");d=f(a.map(c=>{if(c=W(c,l),c in L)return;L[c]=!0;const m=c.endsWith(".css"),o=m?'[rel="stylesheet"]':"";if(!!l)for(let p=r.length-1;p>=0;p--){const y=r[p];if(y.href===c&&(!m||y.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${c}"]${o}`))return;const g=document.createElement("link");if(g.rel=m?"stylesheet":A,m||(g.as="script"),g.crossOrigin="",g.href=c,u&&g.setAttribute("nonce",u),document.head.appendChild(g),m)return new Promise((p,y)=>{g.addEventListener("load",p),g.addEventListener("error",()=>y(new Error(`Unable to preload CSS for ${c}`)))})}))}function t(r){const s=new Event("vite:preloadError",{cancelable:!0});if(s.payload=r,window.dispatchEvent(s),!s.defaultPrevented)throw r}return d.then(r=>{for(const s of r||[])s.status==="rejected"&&t(s.reason);return e().catch(t)})},i={log:(n,e=null)=>{console.log(`[TIMELINE DEBUG] ${n}`,e||"")},error:(n,e=null)=>{console.error(`[TIMELINE DEBUG ERROR] ${n}`,e||"")},warn:(n,e=null)=>{console.warn(`[TIMELINE DEBUG WARN] ${n}`,e||"")}};let h=[],x=!1,v=null;function E(){return new URLSearchParams(window.location.search).get("user")}function q(){const n=E(),e=T.currentUser;return n&&e&&n!==e.uid}async function D(n=null){i.log("Timeline Manager: Loading timeline widgets from Firestore");try{let e=n;if(!e){const t=T.currentUser;if(!t){i.log("Timeline Manager: User not authenticated, showing guest state"),h=[];return}e=t.uid}i.log("Timeline Manager: Loading widgets for user",{uid:e});const a=I(U,"widgets"),l=R(a,N("userId","==",e)),d=await P(l);i.log("Timeline Manager: Widgets query executed",{targetUserId:e,querySnapshotSize:d.size}),h=d.docs.map(t=>{const r=t.data();return i.log("Timeline Manager: Processing widget",{id:t.id,title:r.title,slot:r.slot,userId:r.userId,fileCount:r.files?.length||0}),{id:t.id,title:r.title||"Untitled Widget",desc:r.description||"No description available",slot:r.slot,files:r.files||[],createdAt:r.createdAt}}),i.log("Timeline Manager: Widgets loaded successfully",{count:h.length,widgets:h.map(t=>({id:t.id,title:t.title,slot:t.slot}))})}catch(e){i.error("Timeline Manager: Failed to load widgets",e),e.message!=="Not logged in."&&console.error("Timeline Manager: Widget loading error",e),h=[]}}async function w(n=null){i.log("Timeline Manager: Rendering all widget cards"),await D(n);const e=document.querySelectorAll(".timeline-event");if(i.log("Timeline Manager: Found timeline events",{count:e.length}),e.length===0){i.warn("Timeline Manager: No timeline events found in DOM");return}e.forEach((a,l)=>{const d=a.querySelector(".timeline-event-card");d&&(i.log("Timeline Manager: Removing old card",{index:l}),d.remove());const t=h[l],r=document.createElement("div");if(r.className="timeline-event-card",t)if(i.log("Timeline Manager: Rendering project card",{index:l,projectId:t.id,title:t.title}),v===t.id)i.log("Timeline Manager: Rendering edit mode for card",{projectId:t.id}),r.innerHTML=`
          <input class="widget-edit-title" value="${t.title||""}" style="width:100%;margin-bottom:8px;" />
          <textarea class="widget-edit-desc" style="width:100%;margin-bottom:8px;">${t.desc||""}</textarea>
          <button class="widget-save-btn">💾 Save</button>
          <button class="widget-cancel-btn">Cancel</button>
        `,r.querySelector(".widget-save-btn").addEventListener("click",async()=>{i.log("Timeline Manager: Save button clicked",{projectId:t.id});const s=r.querySelector(".widget-edit-title").value,u=r.querySelector(".widget-edit-desc").value;try{const f=S(U,"widgets",t.id);await $(f,{title:s,description:u,updatedAt:new Date}),i.log("Timeline Manager: Widget updated successfully",{projectId:t.id}),v=null,w()}catch(f){i.error("Timeline Manager: Failed to update widget",f),alert("Failed to update widget: "+f.message)}}),r.querySelector(".widget-cancel-btn").addEventListener("click",()=>{i.log("Timeline Manager: Cancel button clicked"),v=null,w()});else{r.innerHTML=`
          <div class="quip-preview" style="margin-bottom:8px;position:relative;">
            <iframe class="quip-iframe webgl-enabled" title="Quip Preview - ${t.title||"Untitled Quip"}" style="width:100%;height:280px;border:0;border-radius:12px;background:#0a0a0a;"></iframe>
            <div class="quip-overlay" style="position:absolute;top:8px;right:8px;opacity:0.8;">
              <span class="quip-type-badge" style="background:rgba(0,240,255,0.2);color:#00f0ff;padding:4px 8px;border-radius:12px;font-size:0.8rem;font-family:JetBrains Mono;">QUIP</span>
            </div>
          </div>
          <div class="quip-info">
            <h3 style="color:#00f0ff;margin:0 0 8px 0;font-family:JetBrains Mono;">${t.title||"Untitled Quip"}</h3>
            <p style="color:#a0a0a0;margin:0 0 12px 0;line-height:1.4;">${t.desc||"No description available"}</p>
            <div class="quip-actions" style="display:flex;gap:8px;">
              <button class="quip-interact-btn" style="background:rgba(0,240,255,0.1);border:1px solid #00f0ff;color:#00f0ff;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:0.9rem;">🎮 Interact</button>
              <button class="quip-edit-btn" style="background:rgba(255,0,255,0.1);border:1px solid #ff00ff;color:#ff00ff;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:0.9rem;">✏️ Edit</button>
            </div>
          </div>
        `;const s=r.querySelector(".quip-iframe");s.setAttribute("sandbox","allow-scripts allow-same-origin allow-forms allow-webgl allow-pointer-lock"),M&&typeof M.applyDashboardSettings=="function"&&M.applyDashboardSettings(s,{borderColor:"#00f0ff",borderWidth:"2px",borderRadius:"12px",shadow:"0 0 20px rgba(0, 240, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"}),z(t,s).catch(u=>{i.error("Timeline Manager: Failed to load quip into iframe",u),s.replaceWith(Object.assign(document.createElement("div"),{className:"quip-preview-error",textContent:"Failed to load quip preview",style:"padding:20px;text-align:center;color:#ff4444;background:rgba(255,68,68,0.1);border-radius:8px;"}))}),r.querySelector(".quip-interact-btn").addEventListener("click",()=>{i.log("Timeline Manager: Quip interact button clicked",{projectId:t.id}),s.focus(),s.style.borderColor="#ffff00",setTimeout(()=>{s.style.borderColor="#00f0ff"},2e3)}),r.querySelector(".quip-edit-btn").addEventListener("click",()=>{i.log("Timeline Manager: Quip edit button clicked",{projectId:t.id}),v=t.id,w()})}else i.log("Timeline Manager: Rendering empty slot",{index:l}),r.innerHTML=`
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 3rem; margin-bottom: 10px;">+</div>
          <p style="color: #aaa; margin: 0;">Empty Slot</p>
        </div>
      `;a.appendChild(r)}),i.log("Timeline Manager: All widget cards rendered")}async function z(n,e){try{const a=Array.isArray(n.files)?n.files:[];if(a.length===0){i.warn("Timeline Manager: Quip has no files",{projectId:n.id});return}const l={};a.forEach(o=>{o&&o.fileName&&o.downloadURL&&(l[o.fileName]=o.downloadURL)}),i.log("Timeline Manager: Quip file map created",{fileCount:Object.keys(l).length,files:Object.keys(l)});const d=Object.keys(l).find(o=>/index\.html?$/i.test(o))||Object.keys(l).find(o=>/\.html?$/i.test(o));if(!d){i.warn("Timeline Manager: No HTML file found for quip",{projectId:n.id});return}i.log("Timeline Manager: Loading quip HTML",{htmlFileName:d});let t;try{if(t=await fetch(l[d]),!t.ok)throw new Error(`HTTP ${t.status}: ${t.statusText}`)}catch(o){i.error("Timeline Manager: Failed to fetch quip HTML",{url:l[d],error:o.message}),e.srcdoc=`
        <div style="padding: 20px; text-align: center; color: #ff4444; background: rgba(255,68,68,0.1); border-radius: 8px; font-family: Arial, sans-serif;">
          <h3>⚠️ Preview Unavailable</h3>
          <p>Unable to load widget preview</p>
          <small>Error: ${o.message}</small>
        </div>
      `;return}const r=await t.text(),s=o=>{if(!o)return null;const b=o.replace(/^\.\//,"").replace(/^\//,"");if(l[b])return l[b];const g=b.split("/").pop();return l[g]||null};let u=r.replace(/(href|src)=["']([^"']+)["']/gi,(o,b,g)=>{const p=s(g);return p?`${b}="${p}"`:o});const f=`
      <script>
        // WebGL context optimization
        if (typeof window !== 'undefined') {
          window.addEventListener('load', () => {
            // Enable WebGL context preservation
            const canvas = document.querySelector('canvas');
            if (canvas) {
              canvas.style.imageRendering = 'pixelated';
              canvas.style.imageRendering = 'crisp-edges';
            }
            
            // Performance monitoring for quips
            if (window.performance && window.performance.mark) {
              window.performance.mark('quip-loaded-${n.id}');
            }
          });
        }
      <\/script>
    `;u=u.replace(/<\/body>/i,`${f}</body>`);const c=new Blob([u],{type:"text/html"}),m=URL.createObjectURL(c);e.src=m,i.log("Timeline Manager: Quip iframe set with enhanced blob URL")}catch(a){i.error("Timeline Manager: Error preparing quip iframe",a),e.srcdoc=`
      <div style="padding: 20px; text-align: center; color: #ff4444; background: rgba(255,68,68,0.1); border-radius: 8px; font-family: Arial, sans-serif;">
        <h3>⚠️ Preview Error</h3>
        <p>Unable to load widget preview</p>
        <small>Error: ${a.message}</small>
      </div>
    `}}async function k(){i.log("Timeline Manager: Initializing timeline functionality");const n=document.getElementById("editProfileQuickBtn");n?(i.log("Timeline Manager: Setting up edit profile button handler"),n.addEventListener("click",async()=>{if(i.log("Timeline Manager: Edit profile button clicked, toggling widget edit mode"),!T.currentUser){i.log("Timeline Manager: User not authenticated, showing login prompt"),alert("Please log in to edit your profile and manage your widgets.");return}x=!x,i.log("Timeline Manager: Widget edit mode toggled",{widgetEditMode:x}),q()?i.log("Timeline Manager: Cannot edit other user's widgets"):w()})):i.warn("Timeline Manager: Edit profile button not found"),i.log("Timeline Manager: Performing initial render");const e=E();e&&(i.log("Timeline Manager: Loading timeline for specific user",{targetUserId:e}),q()&&console.log("👤 [TIMELINE] Viewing another user's widget timeline")),w(e),i.log("Timeline Manager: Setting up auth state listener"),C(T,a=>{if(a){i.log("Timeline Manager: User authenticated, re-rendering timeline",{uid:a.uid});const l=E();w(l)}else i.log("Timeline Manager: User signed out, clearing timeline"),h=[],w()}),i.log("Timeline Manager: Initialization complete")}document.addEventListener("DOMContentLoaded",async function(){i.log("Timeline Manager: DOM Content Loaded - Starting initialization"),await k()});function B(n,e,a){if(i.log("Timeline Manager: Rendering widget card",{slotIndex:a,projectId:e?.id,hasProject:!!e}),!n){i.warn("Timeline Manager: No event element provided for widget card");return}const l=n.querySelector(".timeline-event-card");l&&l.remove();const d=document.createElement("div");if(d.className="timeline-event-card",e&&e.files&&e.files.length>0){const t=H(e.files);t?d.innerHTML=`
        <div class="widget-preview">
          <iframe 
            src="${t.downloadURL}" 
            frameborder="0"
            loading="lazy"
            style="width: 100%; height: 200px; border-radius: 8px;"
          ></iframe>
        </div>
        <div class="widget-info">
          <h4>${e.title||"Untitled Widget"}</h4>
          <p>${e.description||"No description available"}</p>
          <div class="widget-meta">
            <span class="widget-author">by ${e.author||"Unknown"}</span>
            <span class="widget-date">${new Date(e.createdAt?.toDate?.()||e.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      `:d.innerHTML=`
        <div class="widget-placeholder">
          <div class="placeholder-icon">📦</div>
          <h4>${e.title||"Widget"}</h4>
          <p>No preview available</p>
        </div>
      `}else d.innerHTML=`
      <div class="empty-slot">
        <div class="empty-icon">➕</div>
        <h4>Empty Slot ${a+1}</h4>
        <p>Upload a widget to fill this slot</p>
      </div>
    `;n.appendChild(d),i.log("Timeline Manager: Widget card rendered successfully",{slotIndex:a})}function H(n){if(!Array.isArray(n)||n.length===0)return null;const e=n.find(a=>a.fileName&&/index\.html?$/i.test(a.fileName));return e||n.find(a=>a.fileName&&/\.html?$/i.test(a.fileName))}window.timelineManager={renderAllWidgetCards:w,renderWidgetCard:B,initializeTimeline:k};i.log("Timeline Manager: Script loaded successfully");export{G as _};
