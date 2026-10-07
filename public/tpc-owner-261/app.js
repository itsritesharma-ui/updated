const app = document.getElementById('app')
const ADMIN_USERNAME = 'meritesharma'
const ADMIN_EMAIL = 'meritesharma-admin@thepagecraft.in'
const SITE_URL = 'https://www.thepagecraft.in'
const SUPABASE_URL = 'https://plzlvgdlscwhbfrpcjtp.supabase.co'
const SUPABASE_KEY = 'sb_publishable_aI6w8Ve5aFrYxfG9b9Gi4w_Ste7yc5K'
const IDLE_LIMIT_MS = 5 * 60 * 1000
const LAST_ACTIVE_KEY = 'TPC_OWNER_LAST_ACTIVE'
const THEME_KEY = 'TPC_OWNER_THEME'
let idleTimer = null

const state = {
  sb: null, user: null, role: 'none', view: 'dashboard',
  posts: [], products: [], users: [], orders: [], settings: [], admins: [], audit: [], media: [],
  coupons: [], redemptions: [], campaigns: [], campaignRecipients: [], campaignViews: [],
  tickets: [], homepageVersions: [],
  mediaBucket: 'site-media', loading: false
}

const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))
const cfg=()=>({url:SUPABASE_URL,key:SUPABASE_KEY})
const formatDate=v=>v?new Date(v).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—'
const slugify=s=>String(s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
const img=u=>u||'logo.jpg'
const money=v=>`₹${Number(v||0).toFixed(0)}`
const userById=id=>state.users.find(u=>u.user_id===id)
const productById=id=>state.products.find(p=>Number(p.id)===Number(id))
const roleLabel=r=>({owner:'Owner / Super Admin',super_admin:'Super Admin',admin:'Admin',editor:'Editor'}[r]||r)
const ordAmt=o=>{const v=(getOv().o||{})[o.id];return v===undefined?o.amount:v}
const cOv=(uid,k,d)=>{const v=((getOv().c||{})[uid]||{})[k];return v===undefined?d:v}
const xOv=(k,d)=>{const v=(getOv().x||{})[k];return v===undefined?d:v}
const avatarHtml=u=>{const ch=esc((u?.display_name||u?.email||'?').slice(0,1).toUpperCase());return u?.avatar_url?`<img src="${esc(u.avatar_url)}" alt="" referrerpolicy="no-referrer" loading="lazy" onerror="this.replaceWith(document.createTextNode('${ch}'))">`:ch}
const dateInput=v=>v?new Date(new Date(v).getTime()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16):''

const settingValue=(key,fallback='')=>state.settings.find(item=>item.key===key)?.value??fallback
const parseJson=(value,fallback={})=>{try{return value?JSON.parse(value):fallback}catch{return fallback}}
function applyAdminPalette(){
  // The admin UI keeps its own fixed design; website theme colours only affect the public site.
  ['--gold','--gold2','--violet','--bg','--panel','--panel2','--text','--muted','--admin-button','--line','--admin-button-text','--admin-header-footer'].forEach(k=>document.documentElement.style.removeProperty(k))
}
function applyTheme(next=localStorage.getItem(THEME_KEY)||'light'){
  document.documentElement.dataset.theme=next
  localStorage.setItem(THEME_KEY,next)
  applyAdminPalette()
  const meta=document.querySelector('meta[name="theme-color"]')
  if(meta)meta.content=next==='light'?'#f4f5f7':'#070707'
}
function toggleTheme(){const next=document.documentElement.dataset.theme==='light'?'dark':'light';applyTheme(next);toast(`${next==='light'?'Light':'Dark'} dashboard preview is active`)}
function toast(message,type='ok'){
  let region=document.getElementById('toastRegion')
  if(!region){region=document.createElement('div');region.id='toastRegion';region.className='toastRegion';region.setAttribute('aria-live','polite');document.body.appendChild(region)}
  const item=document.createElement('div');item.className=`toast ${type}`;item.innerHTML=`<span>${type==='error'?'!':'✓'}</span><p>${esc(message)}</p>`
  region.appendChild(item);requestAnimationFrame(()=>item.classList.add('show'))
  setTimeout(()=>{item.classList.remove('show');setTimeout(()=>item.remove(),250)},3200)
}

function setupScreen(msg=''){
  app.innerHTML=`<div class="authWrap"><section class="card authCard premiumCard"><div class="brand"><img class="logo" src="logo.jpg"><div><div class="eyebrow">OWNER CONNECTION</div><h1>ThePageCraft Admin</h1></div></div><p class="muted">The owner console could not connect to ThePageCraft services.</p>${msg?`<div class="notice error">${esc(msg)}</div>`:''}<button class="btn primary wide" onclick="location.reload()">Try Again</button></section></div>`
}

function loginScreen(msg=''){
  clearIdleWatch()
  const I={
    user:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>',
    lock:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="3"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>',
    eye:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>'
  }
  app.innerHTML=`<div class="loginScene"><main class="loginSide"><div class="loginFormWrap"><img class="loginLogo" src="logo.jpg" alt="The Pagecraft"><span class="loginBrandName">The Pagecraft</span><h1 class="loginTitle">Sign in</h1>${msg?`<div class="notice error">${esc(msg)}</div>`:''}<form id="loginForm" class="loginForm" autocomplete="on"><label class="loginLabel">Owner ID<span class="loginField readonly"><i>${I.user}</i><input id="ownerId" value="${esc(ADMIN_USERNAME)}" readonly tabindex="-1" aria-label="Owner ID"></span></label><label class="loginLabel">Password<span class="loginField"><i>${I.lock}</i><input id="password" type="password" required autocomplete="current-password" placeholder="Enter your password"><button type="button" id="togglePw" class="pwToggle" aria-label="Show password">${I.eye}</button></span></label><button id="loginBtn" class="loginSubmit">Sign in</button></form><div class="loginWelcome"><span class="welcomeAvatar"><img src="logo.jpg" alt=""></span><div><small>Welcome</small><strong>Ritesh Sharma</strong></div></div><p class="loginLock">Auto-locks after 5 minutes of inactivity</p></div></main><aside class="loginArt"><div class="artCard"><img class="artImg" src="login-art.svg" alt=""><div class="artText"><span class="artBrand">The Pagecraft</span><h2>Welcome to ThePageCraft Admin</h2><p>Manage your books, stories, readers and orders from one calm, secure place.</p><p class="artLine">Your readers are waiting, Ritesh.</p></div><div class="artNotch"><h3>Write. Publish. Grow.</h3><p>Be among the first to see how your latest book is doing today.</p><span class="artAvatars"><img src="logo.jpg" alt=""><b>RS</b></span></div></div></aside></div>`
  togglePw.onclick=()=>{const t=password.type==='password';password.type=t?'text':'password';togglePw.classList.toggle('on',t)}
  password.focus()
  loginForm.onsubmit=async e=>{
    e.preventDefault(); const b=loginBtn
    b.disabled=true;b.textContent='Checking…'
    let {error}=await state.sb.auth.signInWithPassword({email:ADMIN_EMAIL,password:password.value})
    if(error){
      b.textContent='Activating owner account…'
      const created=await state.sb.auth.signUp({email:ADMIN_EMAIL,password:password.value,options:{data:{username:ADMIN_USERNAME,role:'owner'}}})
      if(created.error){b.disabled=false;return loginScreen('Invalid password, or the owner account already exists with a different password.')}
      if(!created.data?.session){b.disabled=false;return loginScreen('Owner account was created, but Supabase email confirmation is ON. Turn Confirm email OFF, then sign in again.')}
    }
  }
}

async function loadData(){
  const calls = await Promise.all([
    state.sb.from('daily_posts').select('*').order('published_at',{ascending:false}),
    state.sb.from('products').select('*').order('sort_order',{ascending:true}),
    state.sb.rpc('admin_list_customer_profiles'),
    state.sb.from('purchases').select('*').order('created_at',{ascending:false}).limit(500),
    state.sb.from('site_settings').select('*').order('category').order('key'),
    state.sb.from('admin_audit_log').select('*').order('created_at',{ascending:false}).limit(100),
    state.sb.from('coupons').select('*').order('created_at',{ascending:false}),
    state.sb.from('coupon_redemptions').select('*').order('redeemed_at',{ascending:false}).limit(500),
    state.sb.from('campaigns').select('*').order('created_at',{ascending:false}),
    state.sb.from('campaign_recipients').select('*'),
    state.sb.from('campaign_views').select('*'),
    state.sb.from('support_tickets').select('*,support_messages(*)').order('updated_at',{ascending:false}),
    state.sb.from('homepage_versions').select('*').order('created_at',{ascending:false}).limit(30)
  ])
  for(const x of calls) if(x.error) throw x.error
  state.posts=calls[0].data||[]; state.products=calls[1].data||[]; state.users=calls[2].data||[]
  state.orders=calls[3].data||[]; state.settings=calls[4].data||[]; state.audit=calls[5].data||[]
  state.coupons=calls[6].data||[];state.redemptions=calls[7].data||[];state.campaigns=calls[8].data||[]
  state.campaignRecipients=calls[9].data||[];state.campaignViews=calls[10].data||[]
  state.tickets=calls[11].data||[];state.homepageVersions=calls[12].data||[]
  applyAdminPalette()
  {const sub=await state.sb.from('book_launch_subscribers').select('*').order('created_at',{ascending:false}).limit(2000);state.subs=sub.error?null:(sub.data||[])}
  if(['owner','super_admin'].includes(state.role)){
    const a=await state.sb.rpc('admin_list_admins'); if(!a.error) state.admins=a.data||[]
  }
}

async function logAction(action, entityType='', entityId='', details={}){
  try{await state.sb.from('admin_audit_log').insert({admin_id:state.user.id,action,entity_type:entityType||null,entity_id:String(entityId||''),details})}catch{}
}

const NAV=[
  ['dashboard','⌂','Dashboard'],['posts','✎','Daily Posts'],['products','▣','Books / Products'],
  ['orders','₹','Orders & Payments'],['coupons','%','Coupons & Offers'],['campaigns','✦','Promotions & Alerts'],
  ['customers','◉','Customers & Profiles'],['subscribers','🔔','Launch Subscribers'],['support','?','Support Tickets'],['media','▧','Media & Book Files'],
  ['homepage','⌂','Homepage Editor'],['appearance','◐','Theme & Appearance'],['ai','✦','AI Content Helper'],
  ['site','⚙','Website Settings'],['team','♛','Admin Team'],['activity','↻','Activity Log'],['dataedit','✐','Edit Dashboard Data']
]

function navButtons(){return NAV.map(([v,i,l])=>`<button data-view="${v}" class="${state.view===v?'active':''}"><span>${i}</span>${l}</button>`).join('')}
function mobileNav(){return [['dashboard','Home'],['posts','Posts'],['products','Books'],['orders','Orders'],['more','More']].map(([v,l])=>`<button data-view="${v}" class="${state.view===v?'active':''}">${l}</button>`).join('')}
function pageLabel(){return Object.fromEntries(NAV.map(([v,,l])=>[v,l]))[state.view]||'More Controls'}

function shell(){
  const metaName=state.user?.user_metadata?.full_name||state.user?.user_metadata?.name||''
  const ownerName=(metaName&&!/owner/i.test(metaName))?metaName:'Ritesh Sharma'
  const ownerInitials=ownerName.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'RS'
  const isLight=document.documentElement.dataset.theme!=='dark'
  const subtitle=state.view==='dashboard'?`Welcome back, ${ownerName}`:'ThePageCraft owner control'
  app.innerHTML=`<div class="appShell"><button class="sideTab" id="sideTab" aria-label="Open menu" title="Menu">›</button><aside class="sidebar"><div class="sideBrand"><span class="sideLogo"><img src="logo.jpg" alt=""></span><div><strong>ThePageCraft</strong><span>Publishing Studio</span></div></div><nav class="nav">${navButtons()}</nav><div class="sideFoot"><a class="sideLink" href="${SITE_URL}" target="_blank" rel="noreferrer"><span>◎</span> Open live website</a><button id="logout" class="sideLink"><span>↪</span> Sign out</button><div class="idleBadge"><span class="pulseDot"></span><span>Secure auto-lock active</span></div><div class="modeLabel">${isLight?'Light':'Dark'} Mode</div><div class="modeLabel" style="opacity:.55;font-size:10px">Admin build V13.9</div><div class="modeToggle" role="group" aria-label="Colour mode"><button id="modeLight" class="${isLight?'on':''}" aria-label="Light mode">☀</button><button id="modeDark" class="${isLight?'':'on'}" aria-label="Dark mode">☾</button></div></div></aside><main class="main"><header class="topbar"><div class="pageTitleBlock"><h1>${esc(state.view==='dashboard'?'Overview':pageLabel())}</h1><p>${esc(subtitle)}</p></div><div class="topUtility"><button id="commandSearch" class="searchPill" aria-label="Search everything"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg><span>Search</span></button><button id="quickAddBook" class="btn primary topPrimary">+ Add New Book</button><span class="adminAvatar" title="${esc(ownerName)}">${esc(ownerInitials)}</span><div class="actions" id="topActions"></div></div></header><div id="view" class="viewReveal"></div></main><nav class="mobileNav">${mobileNav()}</nav></div>`
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{state.view=b.dataset.view;shell()})
  logout.onclick=()=>state.sb.auth.signOut()
  commandSearch.onclick=globalSearch
  modeLight.onclick=()=>{applyTheme('light');shell()}
  modeDark.onclick=()=>{applyTheme('dark');shell()}
  quickAddBook.onclick=()=>{state.view='products';shell();productModal()}
  setupSidebarHide()
  renderView()
}

function renderView(){
  topActions.innerHTML=''
  if(state.view==='dashboard')renderDashboard()
  else if(state.view==='dataedit')renderDataEditor()
  else if(state.view==='subscribers')renderSubscribers()
  else if(state.view==='posts')renderPosts()
  else if(state.view==='products')renderProducts()
  else if(state.view==='orders')renderOrders()
  else if(state.view==='coupons')renderCoupons()
  else if(state.view==='campaigns')renderCampaigns()
  else if(state.view==='customers')renderCustomers()
  else if(state.view==='support')renderSupportTickets()
  else if(state.view==='media')renderMedia()
  else if(state.view==='homepage')renderHomepageEditor()
  else if(state.view==='appearance')renderAppearance()
  else if(state.view==='ai')renderAiHelper()
  else if(state.view==='site')renderSiteSettings()
  else if(state.view==='team')renderTeam()
  else if(state.view==='activity')renderActivity()
  else renderMore()
}

function renderDashboard(){
  const G=getOv().g||{}, N=(k,d)=>(G[k]===undefined||G[k]===''||G[k]===null)?d:Number(G[k])
  const live=N('live',state.posts.filter(x=>x.published).length), active=N('active',state.products.filter(x=>x.active).length)
  const paid=state.orders.filter(x=>x.status==='paid'&&x.source!=='admin_grant'), grants=state.orders.filter(x=>x.source==='admin_grant'&&x.status==='paid').length
  const revenue=paid.reduce((s,o)=>s+Number(o.amount||0),0)
  const topBooks=state.products.map(p=>({p,count:(G.books&&G.books[p.id]!==undefined&&G.books[p.id]!=='')?Number(G.books[p.id]):paid.filter(o=>Number(o.product_id)===Number(p.id)).length})).sort((a,b)=>b.count-a.count).slice(0,4)
  const max=Math.max(1,...topBooks.map(x=>x.count)), recent=state.orders.slice(0,5)
  const allCustomerOrders=state.orders.filter(x=>x.source!=='admin_grant')
  const orderRate=allCustomerOrders.length?Math.round(paid.length/allCustomerOrders.length*100):0
  const campaignCount=state.campaigns.filter(x=>x.active).length
  const couponCount=state.coupons.filter(x=>x.active).length
  const healthSignals=[Boolean(state.user),active>0,live>0,state.users.length>0,state.settings.length>0]
  const health=Math.min(99,84+healthSignals.filter(Boolean).length*3)
  const R=[3,7,30].includes(state.range)?state.range:7, DAY=864e5, now=ovNow()
  const within=(d,from,to)=>{const t=new Date(d).getTime();return t>=from&&t<to}
  const cur=paid.filter(o=>within(o.created_at,now-R*DAY,now+DAY)), prev=paid.filter(o=>within(o.created_at,now-2*R*DAY,now-R*DAY))
  const curRev=cur.reduce((n,o)=>n+Number(o.amount||0),0)
  const RV=(getOv().r||{})[R]||{}, rn=(v,d)=>(v===undefined||v===null||v==='')?d:Number(v)
  const BK=Array.isArray(RV.buckets)&&RV.buckets.length?RV.buckets.map(Number).filter(Number.isFinite):null, bkSum=BK?BK.reduce((a,b)=>a+b,0):null
  const curN=rn(RV.paid,bkSum!==null?bkSum:cur.length), prevN=rn(RV.prev,prev.length), revV=rn(RV.revenue,curRev), ORATE=Math.min(100,Math.max(0,rn(RV.rate,orderRate))), totalPaid=N('totalPaid',paid.length)
  const pct=(a,b)=>b?Math.round((a-b)/b*100):(a?100:0)
  const orderDelta=pct(curN,prevN), chip=v=>`<em class="chip ${v<0?'down':'up'}">${v<0?'':'+'}${v}%</em>`
  const BARS=40, step=R*DAY/BARS, buckets=Array(BARS).fill(0)
  cur.forEach(o=>{const i=Math.min(BARS-1,Math.max(0,Math.floor((new Date(o.created_at).getTime()-(now-R*DAY))/step)));buckets[i]++})
  const realSum=buckets.reduce((a,b)=>a+b,0)
  let series=buckets
  if(BK&&BK.length)series=ovSmooth(BK,BARS,R*7919+Math.round(bkSum*31)+BK.length)
  else if(Array.isArray(RV.trend)&&RV.trend.length)series=RV.trend
  else if(RV.paid!==undefined&&RV.paid!==''&&curN!==cur.length){const rg=ovRng(R*104729+Math.round(curN));series=realSum?buckets.map(b=>b*curN/realSum):buckets.map(()=>curN/BARS*(.35+rg()*1.3))}
  const bMax=Math.max(1,...series)
  const barsHtml=series.map((n,i)=>{const r=n/bMax;return `<i style="height:${Math.max(8,Math.round(r*100))}%;background:hsl(${Math.round(8+r*112)} 78% ${n?54:72}%);opacity:${n?1:.45};--d:${i*14}ms"></i>`}).join('')
  const lbl=t=>new Date(t).toLocaleDateString('en-IN',R<=3?{weekday:'short'}:{day:'numeric',month:'short'})
  const labels=[lbl(now-R*DAY),lbl(now-R*DAY/2),lbl(now)]
  const buyers=N('buyers',new Set(paid.map(o=>o.user_id)).size), CU=N('customers',state.users.length), TB=N('totalBooks',state.products.length), TP=N('posts',state.posts.length)
  const newUsers=N('newUsers',state.users.filter(u=>u.created_at&&within(u.created_at,now-R*DAY,now+DAY)).length)
  const top3=topBooks.slice(0,3), best5=topBooks.slice(0,5)
  const metric=(icon,name,num,badge,sub,percent)=>`<article class="metricCard"><header><span>${name}</span><b class="metricGlyph">${icon}</b></header><div class="metricNum"><strong>${num}</strong>${badge}</div><small>${sub}</small><div class="metricBar"><i style="width:${Math.min(100,percent)}%"></i><span>${Math.min(100,percent)}%</span></div></article>`
  view.innerHTML=`<section class="ovHead"><p class="ovSub">Showing the last ${R} days of ThePageCraft activity${hasOv()?` · <b>Custom data active</b> · data date ${esc(new Date(now).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}))}`:''}</p><div class="rangePills" role="group" aria-label="Date range">${[[3,'Last 3 days'],[7,'Last Week'],[30,'Last Month']].map(([d,l])=>`<button data-range="${d}" class="${R===d?'on':''}">${l}</button>`).join('')}</div></section><section class="ovGrid"><article class="ovCard salesCard"><div class="ovCardHead"><h2>Sales</h2><span class="okText">${ORATE}% Orders Completed</span></div><div class="salesTop"><div><strong class="bigNum">${curN}</strong><small>Paid orders · ${esc(labels[0])} – ${esc(labels[2])}</small></div>${chip(orderDelta)}</div><div class="gradTrack"><div class="gradFill" style="width:${Math.max(18,ORATE)}%"><span>Order success</span></div><b>${money(revV)}</b></div><div class="trendLabels">${labels.map(l=>`<span>${esc(l)}</span>`).join('')}</div><div class="trendWrap"><h3>Trends<br>Over Time</h3><div class="trendBars">${barsHtml}</div></div></article><article class="ovCard bestCard"><div class="ovCardHead"><h2>Best Selling Books</h2></div><div class="podium">${top3.map((x,i)=>`<div class="podiumItem p${i}"><span class="podiumImg"><img src="${esc(x.p.image||'logo.jpg')}" alt=""><b>${i+1}</b></span><small>${x.count} sold</small></div>`).join('')||'<div class="empty compact">No books yet.</div>'}</div><div class="bestList">${best5.map(x=>`<button data-jump="products"><img src="${esc(x.p.image||'logo.jpg')}" alt=""><span class="grow"><b>${esc(x.p.title)}</b><small>${esc(x.p.category||'eBook')}</small></span><em>${x.count} sold</em></button>`).join('')}</div></article></section><h2 class="ovSection">Metrics</h2><section class="metricRow">${metric('₹','Paid Orders',curN,chip(orderDelta),`${prevN} in the previous ${R} days`,totalPaid?Math.round(curN/Math.max(curN,totalPaid)*100):0)}${metric('◉','Customers',CU,newUsers?`<em class="chip up">+${newUsers}</em>`:'',`${buyers} have bought a book`,CU?Math.round(buyers/CU*100):0)}${metric('▣','Active Books',active,'',`${TB} books in total`,TB?Math.round(active/TB*100):0)}${metric('✎','Posts Live',live,'',`${TP} posts in total`,TP?Math.round(live/TP*100):0)}</section><div class="insightGrid referenceInsights single"><section class="panel"><div class="panelTitle"><div><div class="eyebrow">RECENT ACTIVITY</div><h2>Latest orders</h2></div><button class="textBtn" data-jump="activity">Activity log →</button></div><div class="recentList">${recent.length?recent.map(o=>{const u=userById(o.user_id),p=productById(o.product_id);return `<div class="recentRow"><div class="activityIcon">${o.status==='paid'?'✓':'•'}</div><div class="grow"><b>${esc(p?.title||`Product #${o.product_id}`)}</b><span>${esc(u?.email||'Customer')} · ${formatDate(o.created_at)}</span></div><strong>${o.source==='admin_grant'?'Bought':'Paid · '+money(ordAmt(o))}</strong></div>`}).join(''):'<div class="empty compact">No recent orders.</div>'}</div></section></div><section class="panel quickControlPanel"><div><div class="eyebrow">QUICK ACTIONS</div><h2>Manage ThePageCraft</h2><p class="muted">Everything important is one click away.</p></div><div class="quickGrid"><button class="quick" data-jump="campaigns"><span>✦</span> Send poster / alert</button><button class="quick" data-jump="coupons"><span>%</span> Create coupon</button><button class="quick" data-jump="customers"><span>◉</span> Customer profiles</button><button class="quick" data-jump="products"><span>▣</span> Edit book / PDF</button><button class="quick" data-jump="orders"><span>₹</span> Check payments</button><button class="quick" data-jump="media"><span>▧</span> Upload files</button></div><div class="ownerAccessStrip"><div><b>${esc(state.user.email)}</b><span>Signed in as ${esc(roleLabel(state.role))}</span></div><button id="ownerAccessBtn" class="btn primary">Give my account all books</button></div></section>`
  view.insertAdjacentHTML('beforeend',`<section class="panel dashboardNotifyPanel"><div class="dashboardNotifyHead"><div><div class="eyebrow">QUICK CUSTOMER MESSAGE</div><h2>Send a notification from Dashboard</h2><p class="muted">The selected customer receives it as a popup and inside My Notifications on the website homepage.</p></div><button id="openAdvancedCampaigns" class="btn secondary">Advanced Promotion Studio</button></div><form id="dashboardNotifyForm" class="dashboardNotifyForm"><label>Send to<select id="dashboardNotifyRecipient"><option value="">All signed-in customer accounts</option>${state.users.map(u=>`<option value="${u.user_id}">${esc(u.display_name||u.email)} — ${esc(u.email)}</option>`).join('')}</select></label><label>Type<select id="dashboardNotifyType"><option value="notification">Notification</option><option value="poster">Promotion poster</option><option value="coupon">Coupon offer</option></select></label><label class="notifyTitle">Title<input id="dashboardNotifyTitle" required maxlength="90" placeholder="A new update for you"></label><label class="notifyMessage">Message<textarea id="dashboardNotifyMessage" required maxlength="600" placeholder="Write the customer message here..."></textarea></label><label>Attach coupon<select id="dashboardNotifyCoupon"><option value="">No coupon</option>${state.coupons.filter(c=>c.active).map(c=>`<option value="${c.id}">${esc(c.code)} — ${esc(couponValue(c))}</option>`).join('')}</select></label><label>Poster image URL<input id="dashboardNotifyPoster" placeholder="Optional public image URL"></label><button id="dashboardNotifySend" class="btn primary notifySend">Send Now</button></form><div class="deliveryHint"><span></span>Customer must be logged in with the selected account. Delivery refreshes automatically within about 8 seconds.</div></section>`)
  document.querySelectorAll('[data-range]').forEach(b=>b.onclick=()=>{state.range=Number(b.dataset.range);renderDashboard()})
  document.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>{state.view=b.dataset.jump;shell()})
  ownerAccessBtn.onclick=()=>ownerAccessModal()
  openAdvancedCampaigns.onclick=()=>{state.view='campaigns';shell()}
  dashboardNotifyForm.onsubmit=async e=>{
    e.preventDefault()
    const recipient=dashboardNotifyRecipient.value,type=dashboardNotifyType.value,couponId=dashboardNotifyCoupon.value||null
    if(type==='coupon'&&!couponId)return alert('Choose a coupon for a coupon notification.')
    dashboardNotifySend.disabled=true;dashboardNotifySend.textContent='Sending…'
    let campaignId=null
    try{
      const row={campaign_type:type,title:dashboardNotifyTitle.value.trim(),message:dashboardNotifyMessage.value.trim(),poster_url:dashboardNotifyPoster.value.trim()||null,button_text:type==='coupon'?'Copy Coupon & Explore':'Open Website',button_url:'/ebooks',coupon_id:couponId,audience_type:recipient?'selected':'all',priority:10,active:true,starts_at:new Date().toISOString(),ends_at:null,created_by:state.user.id,updated_at:new Date().toISOString()}
      const created=await state.sb.from('campaigns').insert(row).select().single();if(created.error)throw created.error;campaignId=created.data.id
      if(recipient){const delivery=await state.sb.from('campaign_recipients').insert({campaign_id:campaignId,user_id:recipient});if(delivery.error)throw delivery.error}
      const target=recipient?userById(recipient)?.email:'all customer accounts'
      await logAction('quick_notification_sent','campaign',campaignId,{target,type})
      toast(`Notification sent to ${target}`)
      await reload();state.view='dashboard';shell()
    }catch(err){if(campaignId)await state.sb.from('campaigns').delete().eq('id',campaignId);alert(err.message);dashboardNotifySend.disabled=false;dashboardNotifySend.textContent='Send Now'}
  }
}

function globalSearch(){
  const entries=[
    ...state.products.map(x=>({type:'Book',title:x.title||`Book #${x.id}`,meta:`${money(x.price)} · ${x.active?'Published':'Hidden'}`,view:'products'})),
    ...state.users.map(x=>({type:'Customer',title:x.display_name||x.email,meta:x.email||'',view:'customers'})),
    ...state.posts.map(x=>({type:'Post',title:x.title||'Untitled post',meta:x.published?'Published':'Draft',view:'posts'})),
    ...state.orders.slice(0,100).map(x=>({type:'Order',title:`Order ${x.id}`,meta:`${money(x.amount)} · ${x.status}`,view:'orders'})),
    ...state.coupons.map(x=>({type:'Coupon',title:x.code,meta:`${x.title} · ${x.active?'Active':'Disabled'}`,view:'coupons'})),
    ...state.campaigns.map(x=>({type:'Campaign',title:x.title,meta:`${x.campaign_type} · ${x.active?'Live':'Paused'}`,view:'campaigns'}))
  ]
  modal(`<div class="modalHead"><div><div class="eyebrow">COMMAND SEARCH</div><h2>Find anything</h2></div><button id="closeModal" class="btn ghost">Close</button></div><input id="globalQuery" class="globalQuery" autocomplete="off" placeholder="Search books, customers, posts or orders…"><div id="globalResults" class="searchResults"></div><p class="small muted searchHint">Tip: press Ctrl/⌘ + K from anywhere to open search.</p>`)
  closeModal.onclick=closeModalFn
  const draw=()=>{
    const q=globalQuery.value.toLowerCase().trim()
    const rows=entries.filter(x=>!q||`${x.title} ${x.meta} ${x.type}`.toLowerCase().includes(q)).slice(0,12)
    globalResults.innerHTML=rows.length?rows.map((x,i)=>`<button class="searchResult" data-result="${i}"><span class="resultType">${esc(x.type)}</span><span class="grow"><b>${esc(x.title)}</b><small>${esc(x.meta)}</small></span><span>→</span></button>`).join(''):'<div class="empty compact">No matching result found.</div>'
    document.querySelectorAll('[data-result]').forEach((b,i)=>b.onclick=()=>{state.view=rows[i].view;closeModalFn();shell()})
  }
  globalQuery.oninput=draw;draw();setTimeout(()=>globalQuery.focus(),20)
}

function renderPosts(){
  topActions.innerHTML='<button id="newPost" class="btn primary">+ New Post</button>'; newPost.onclick=()=>postModal()
  view.innerHTML=state.posts.length?`<div class="grid">${state.posts.map(p=>`<article class="item"><img src="${esc(img(p.cover_image))}" onerror="this.src='logo.jpg'"><div class="itemBody"><div class="itemMeta">${esc(p.category)} · ${formatDate(p.published_at)}</div><h3>${esc(p.title)}</h3><span class="pill ${p.published?'live':'draft'}">${p.published?'Published':'Draft'}</span><p class="muted small">${esc(p.excerpt||'No excerpt')}</p><div class="itemActions"><button class="btn secondary" data-edit-post="${p.id}">Edit</button><button class="btn danger" data-del-post="${p.id}">Delete</button></div></div></article>`).join('')}</div>`:'<div class="empty">No Daily Posts yet.</div>'
  document.querySelectorAll('[data-edit-post]').forEach(b=>b.onclick=()=>postModal(state.posts.find(x=>String(x.id)===b.dataset.editPost)))
  document.querySelectorAll('[data-del-post]').forEach(b=>b.onclick=()=>deleteRow('daily_posts',b.dataset.delPost,'post'))
}

function postModal(p=null){
  const content=Array.isArray(p?.content)?p.content.join('\n\n'):''
  modal(`<div class="modalHead"><h2>${p?'Edit Post':'New Daily Post'}</h2><button id="closeModal" class="btn ghost">Close</button></div><form id="postForm" class="formGrid"><div class="two"><label>Title<input id="ptitle" required value="${esc(p?.title||'')}"></label><label>Category<input id="pcategory" value="${esc(p?.category||"Author's Journal")}"></label></div><div class="two"><label>Slug<input id="pslug" value="${esc(p?.slug||'')}"></label><label>Read time<input id="pread" value="${esc(p?.read_time||'3 min read')}"></label></div><label>Short description<textarea id="pexcerpt">${esc(p?.excerpt||'')}</textarea></label><label>Full article <span class="small muted">Separate paragraphs with a blank line</span><textarea id="pcontent" style="min-height:230px">${esc(content)}</textarea></label><div class="two"><label>Cover image URL<input id="pcover" value="${esc(p?.cover_image||'')}"></label><label>Or upload image<input id="pfile" type="file" accept="image/*"></label></div><div class="two"><label>Publication date<input id="pdate" type="datetime-local" value="${p?.published_at?new Date(new Date(p.published_at).getTime()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16):new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)}"></label><label>Author<input id="pauthor" value="${esc(p?.author||'Ritesh Sharma')}"></label></div><label class="check"><input id="ppublished" type="checkbox" ${p?.published?'checked':''}> Publish this post</label><button id="savePost" class="btn primary">${p?'Save Changes':'Create Post'}</button></form>`)
  closeModal.onclick=closeModalFn
  postForm.onsubmit=async e=>{e.preventDefault();savePost.disabled=true;savePost.textContent='Saving…';try{let cover=pcover.value.trim();if(pfile.files[0])cover=await uploadMedia(pfile.files[0],'site-media');const title=ptitle.value.trim();const row={title,slug:pslug.value.trim()||slugify(title),category:pcategory.value.trim()||"Author's Journal",read_time:pread.value.trim()||'3 min read',excerpt:pexcerpt.value.trim(),content:pcontent.value.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean),cover_image:cover,author:pauthor.value.trim()||'Ritesh Sharma',published_at:new Date(pdate.value).toISOString(),published:ppublished.checked};const q=p?state.sb.from('daily_posts').update(row).eq('id',p.id):state.sb.from('daily_posts').insert(row);const {data,error}=await q.select();if(error)throw error;await logAction(p?'post_updated':'post_created','daily_post',p?.id||data?.[0]?.id,{title});await refreshAndShow('posts')}catch(err){alert(err.message);savePost.disabled=false;savePost.textContent='Save'}}
}

function renderProducts(){
  topActions.innerHTML='<button id="newProduct" class="btn primary">+ New Book</button>';newProduct.onclick=()=>productModal()
  view.innerHTML=state.products.length?`<div class="grid">${state.products.map(p=>`<article class="item"><img src="${esc(img(p.image))}" onerror="this.src='logo.jpg'"><div class="itemBody"><div class="itemMeta">${esc(p.category)} · Product #${p.id}</div><h3>${esc(p.title)}</h3><div class="priceLine"><b>${money(p.price)}</b>${p.mrp?` <span class="muted"><s>${money(p.mrp)}</s></span>`:''}</div><span class="pill ${p.active?'live':'draft'}">${p.active?'Visible':'Hidden'}</span><span class="pill">${esc(p.status)}</span><span class="pill ${p.pdf_path?'live':'draft'}">${p.pdf_path?'PDF attached':'PDF missing'}</span><span class="pill ${payLinkOf(p)?'live':'draft'}">${payLinkOf(p)?'Pay link set':'No pay link'}</span><div class="itemActions">${p.pdf_path?`<button class="btn secondary" data-preview-product="${p.id}">Read PDF</button>`:''}<button class="btn secondary" data-edit-product="${p.id}">Edit</button><button class="btn danger" data-del-product="${p.id}">Delete</button></div></div></article>`).join('')}</div>`:'<div class="empty">No books/products yet.</div>'
  document.querySelectorAll('[data-preview-product]').forEach(b=>b.onclick=()=>previewProductPdf(state.products.find(x=>String(x.id)===b.dataset.previewProduct)))
  document.querySelectorAll('[data-edit-product]').forEach(b=>b.onclick=()=>productModal(state.products.find(x=>String(x.id)===b.dataset.editProduct)))
  document.querySelectorAll('[data-del-product]').forEach(b=>b.onclick=()=>deleteRow('products',b.dataset.delProduct,'product'))
}

function productModal(p=null){
  modal(`<div class="modalHead"><h2>${p?'Edit Book / Product':'New Book / Product'}</h2><button id="closeModal" class="btn ghost">Close</button></div><form id="productForm" class="formGrid"><div class="two"><label>Title<input id="btitle" required value="${esc(p?.title||'')}"></label><label>Subtitle<input id="bsubtitle" value="${esc(p?.subtitle||'')}"></label></div><div class="two"><label>Price ₹<input id="bprice" type="number" min="0" step="0.01" required value="${esc(p?.price??0)}"></label><label>MRP ₹<input id="bmrp" type="number" min="0" step="0.01" value="${esc(p?.mrp??'')}"></label></div><label style="border:1px solid #ff9933;border-radius:14px;padding:12px;background:rgba(255,153,51,.07)"><b>💳 Payment link (optional, old fixed-price link) for this book</b><input id="bpaylink" value="${esc(payLinkOf(p))}" placeholder="https://u.payu.in/..."><span class="small muted">Paste the link and press Save. A "Buy Now" button appears on the website for this book automatically. Works for new books too.</span></label><div class="two"><label>Category<input id="bcategory" value="${esc(p?.category||'General')}"></label><label>Status<select id="bstatus"><option value="available">Available</option><option value="coming_soon">Coming Soon</option><option value="unavailable">Unavailable</option></select></label></div><label>Short description<textarea id="bdesc">${esc(p?.description||'')}</textarea></label><label>Full description<textarea id="bfull" style="min-height:170px">${esc(p?.full_description||'')}</textarea></label><div class="two"><label>Cover image URL<input id="bimage" value="${esc(p?.image||'')}"></label><label>Or upload cover<input id="bfile" type="file" accept="image/*"></label></div><div class="two"><label>Author<input id="bauthor" value="${esc(p?.author||'Ritesh Sharma')}"></label><label>Badge<input id="bbadge" value="${esc(p?.badge||'')}"></label></div><label>Amazon link<input id="bamazon" value="${esc(p?.amazon_link||'')}"></label><div class="two"><label>Sort order<input id="bsort" type="number" value="${esc(p?.sort_order??0)}"></label><label>Visibility<select id="bactive"><option value="true">Show on website</option><option value="false">Hide from website</option></select></label></div><div class="pdfManager"><div class="eyebrow">PRIVATE BOOK PDF</div><div class="two"><label>PDF storage path<input id="bpdfpath" value="${esc(p?.pdf_path||'')}" placeholder="echoes-of-freedom.pdf"></label><label>Page count (optional)<input id="bpdfpages" type="number" min="1" value="${esc(p?.pdf_pages??'')}"></label></div><label>Upload / replace PDF<input id="bpdffile" type="file" accept="application/pdf"></label><p class="small muted">PDF is stored privately in Supabase Storage bucket <b>books</b>. Uploading here also links it to this product automatically.</p>${p?.pdf_path?`<button type="button" id="previewCurrentPdf" class="btn secondary">📖 Preview current PDF</button>`:''}</div><button id="saveProduct" class="btn primary">${p?'Save Changes':'Create Product'}</button></form>`)
  {const sv=p?.status||'available';if(![...bstatus.options].some(o=>o.value===sv))bstatus.add(new Option(sv,sv));bstatus.value=sv};bactive.value=String(p?.active??true);closeModal.onclick=closeModalFn
  if(typeof previewCurrentPdf!=='undefined' && previewCurrentPdf) previewCurrentPdf.onclick=()=>previewProductPdf(p)
  productForm.onsubmit=async e=>{e.preventDefault();saveProduct.disabled=true;saveProduct.textContent='Saving…';try{
    let image=bimage.value.trim();if(bfile.files[0])image=await uploadMedia(bfile.files[0],'site-media')
    let pdfPath=bpdfpath.value.trim()
    const pdfFile=bpdffile.files[0]
    if(pdfFile){
      pdfPath=(pdfPath||`${slugify(btitle.value)||'book'}.pdf`).replace(/[^a-zA-Z0-9._\/-]/g,'-')
      if(!pdfPath.toLowerCase().endsWith('.pdf'))pdfPath+='.pdf'
      const {error:pdfErr}=await state.sb.storage.from('books').upload(pdfPath,pdfFile,{upsert:true,contentType:'application/pdf'});if(pdfErr)throw pdfErr
      await logAction('book_pdf_uploaded','storage',pdfPath,{title:btitle.value.trim()})
    }
    const row={title:btitle.value.trim(),subtitle:bsubtitle.value.trim(),price:Number(bprice.value),mrp:bmrp.value?Number(bmrp.value):null,category:bcategory.value.trim()||'General',status:bstatus.value,description:bdesc.value.trim(),full_description:bfull.value.trim(),image,author:bauthor.value.trim()||'Ritesh Sharma',badge:bbadge.value.trim()||null,amazon_link:bamazon.value.trim()||null,sort_order:Number(bsort.value||0),active:bactive.value==='true',pdf_path:pdfPath||null,pdf_pages:bpdfpages.value?Number(bpdfpages.value):null}
    {const pl=bpaylink.value.trim();if(pl&&!/^https?:\/\//i.test(pl))throw new Error('Payment link must start with https://')}
    const q=p?state.sb.from('products').update(row).eq('id',p.id):state.sb.from('products').insert(row);const {data,error}=await q.select();if(error)throw error;await savePayLink(p?.id||data?.[0]?.id,bpaylink.value.trim());await logAction(p?'product_updated':'product_created','product',p?.id||data?.[0]?.id,{title:row.title,price:row.price,pdf_path:row.pdf_path});await refreshAndShow('products')
  }catch(err){alert(err.message);saveProduct.disabled=false;saveProduct.textContent='Save'}}
}

function renderOrders(){
  topActions.innerHTML='<button id="refreshOrders" class="btn secondary">Refresh</button>'; refreshOrders.onclick=async()=>{await reload();state.view='orders';shell()}
  const rows=state.orders
  view.innerHTML=`<div class="panel"><div class="toolbar"><div><h2>Orders & Payments</h2><p class="muted small">Paid purchases, refunds and manual book-access grants.</p></div></div>${rows.length?`<div class="tableWrap"><table><thead><tr><th>Customer</th><th>Book</th><th>Amount</th><th>Source</th><th>Status</th><th>Date</th></tr></thead><tbody>${rows.map(o=>{const u=userById(o.user_id),p=productById(o.product_id);return `<tr><td><div style="display:flex;gap:10px;align-items:center"><span class="avatar sm">${avatarHtml(u)}</span><div><b>${esc(u?.display_name||u?.email||'Unknown')}</b><div class="small muted">${esc(u?.email||o.user_id)}</div></div></div></td><td>${esc(p?.title||`Product #${o.product_id}`)}</td><td>${o.source==='admin_grant'?'Bought':money(ordAmt(o))}</td><td><span class="pill ${o.source==='admin_grant'?'draft':'live'}">${o.source==='admin_grant'?'Bought':'Paid'}</span></td><td><select data-order-status="${o.id}" class="miniSelect"><option value="paid" ${o.status==='paid'?'selected':''}>paid</option><option value="refunded" ${o.status==='refunded'?'selected':''}>refunded</option><option value="pending" ${o.status==='pending'?'selected':''}>pending</option></select></td><td>${formatDate(o.created_at)}</td></tr>`}).join('')}</tbody></table></div>`:'<div class="empty">No purchase records yet.</div>'}</div>`
  document.querySelectorAll('[data-order-status]').forEach(s=>s.onchange=()=>updateOrderStatus(s.dataset.orderStatus,s.value))
}

async function updateOrderStatus(id,status){
  const {error}=await state.sb.from('purchases').update({status,updated_at:new Date().toISOString()}).eq('id',id);if(error)return alert(error.message)
  await logAction('order_status_changed','purchase',id,{status});await reload();state.view='orders';shell()
}

function couponValue(c){return c.discount_type==='percent'?`${Number(c.discount_value)}% OFF`:`${money(c.discount_value)} OFF`}
function couponStatus(c){const now=Date.now();if(!c.active)return ['Paused','draft'];if(new Date(c.starts_at).getTime()>now)return ['Scheduled','draft'];if(c.expires_at&&new Date(c.expires_at).getTime()<now)return ['Expired','danger'];return ['Live','live']}

function renderCoupons(){
  topActions.innerHTML='<button id="newCoupon" class="btn primary">+ Create Coupon</button>';newCoupon.onclick=()=>couponModal()
  view.innerHTML=`<section class="panel offerIntro"><div><div class="eyebrow">DISCOUNT CONTROL</div><h2>Coupons & Offers</h2><p class="muted">Create percentage or fixed-value coupons, set limits, choose a book and schedule the offer.</p></div><div class="offerMetric"><b>${xOv('redemptions',state.redemptions.length)}</b><span>Total redemptions</span></div></section>${state.coupons.length?`<div class="couponGrid">${state.coupons.map(c=>{const uses=state.redemptions.filter(r=>r.coupon_id===c.id).length,[label,klass]=couponStatus(c),target=productById(c.target_product_id);return `<article class="couponCard"><div class="couponCut left"></div><div class="couponCut right"></div><div class="couponTop"><span class="pill ${klass}">${label}</span><span class="couponValue">${esc(couponValue(c))}</span></div><div class="couponCode">${esc(c.code)}</div><h3>${esc(c.title)}</h3><p class="muted small">${esc(c.description||'No description')}</p><div class="couponFacts"><span>Minimum ${money(c.min_order)}</span><span>${target?esc(target.title):'All books'}</span><span>${uses}${c.usage_limit?` / ${c.usage_limit}`:''} used</span><span>${c.expires_at?`Ends ${formatDate(c.expires_at)}`:'No expiry'}</span></div><div class="itemActions"><button class="btn secondary" data-edit-coupon="${c.id}">Edit</button><button class="btn secondary" data-toggle-coupon="${c.id}">${c.active?'Pause':'Activate'}</button>${uses===0?`<button class="btn danger" data-del-coupon="${c.id}">Delete</button>`:''}</div></article>`}).join('')}</div>`:'<div class="empty">No coupon yet. Create your first offer from the button above.</div>'}`
  document.querySelectorAll('[data-edit-coupon]').forEach(b=>b.onclick=()=>couponModal(state.coupons.find(c=>c.id===b.dataset.editCoupon)))
  document.querySelectorAll('[data-toggle-coupon]').forEach(b=>b.onclick=async()=>{const c=state.coupons.find(x=>x.id===b.dataset.toggleCoupon);const {error}=await state.sb.from('coupons').update({active:!c.active,updated_at:new Date().toISOString()}).eq('id',c.id);if(error)return alert(error.message);await logAction('coupon_status_changed','coupon',c.id,{active:!c.active});await refreshAndShow('coupons')})
  document.querySelectorAll('[data-del-coupon]').forEach(b=>b.onclick=()=>deleteCoupon(b.dataset.delCoupon))
}

function couponModal(c=null){
  modal(`<div class="modalHead"><div><div class="eyebrow">${c?'EDIT OFFER':'NEW OFFER'}</div><h2>${c?'Edit Coupon':'Create Coupon'}</h2></div><button id="closeModal" class="btn ghost">Close</button></div><form id="couponForm" class="formGrid"><div class="two"><label>Coupon code<input id="ccode" required maxlength="24" value="${esc(c?.code||'')}" placeholder="READ20"></label><label>Offer title<input id="ctitle" required value="${esc(c?.title||'')}" placeholder="Reader Welcome Offer"></label></div><label>Description<textarea id="cdesc" placeholder="Short offer description">${esc(c?.description||'')}</textarea></label><div class="three"><label>Discount type<select id="ctype"><option value="percent">Percentage</option><option value="fixed">Fixed ₹ amount</option></select></label><label>Discount value<input id="cvalue" required type="number" min="0.01" step="0.01" value="${esc(c?.discount_value||20)}"></label><label>Maximum discount<input id="cmax" type="number" min="0" step="0.01" value="${esc(c?.max_discount||'')}" placeholder="Optional"></label></div><div class="three"><label>Minimum order<input id="cminimum" type="number" min="0" step="0.01" value="${esc(c?.min_order||0)}"></label><label>Total usage limit<input id="climit" type="number" min="1" value="${esc(c?.usage_limit||'')}" placeholder="Unlimited"></label><label>Per-account limit<input id="cperuser" type="number" min="1" value="${esc(c?.per_user_limit||1)}"></label></div><label>Applicable book<select id="cproduct"><option value="">All books in cart</option>${state.products.map(p=>`<option value="${p.id}">${esc(p.title)}</option>`).join('')}</select></label><div class="two"><label>Starts at<input id="cstart" type="datetime-local" required value="${dateInput(c?.starts_at||new Date())}"></label><label>Expires at<input id="cexpiry" type="datetime-local" value="${dateInput(c?.expires_at)}"></label></div><label class="check"><input id="cactive" type="checkbox" ${c?.active===false?'':'checked'}> Coupon active</label><div class="notice">The discount is recalculated securely before Razorpay opens. Customers cannot change the payable amount from the browser.</div><button id="saveCoupon" class="btn primary">${c?'Save Coupon':'Create Coupon'}</button></form>`)
  ctype.value=c?.discount_type||'percent';cproduct.value=c?.target_product_id||'';closeModal.onclick=closeModalFn
  couponForm.onsubmit=async e=>{e.preventDefault();const value=Number(cvalue.value);if(ctype.value==='percent'&&value>100)return alert('Percentage discount cannot be more than 100%.');if(cexpiry.value&&new Date(cexpiry.value)<=new Date(cstart.value))return alert('Expiry must be after the start time.');saveCoupon.disabled=true;const row={code:ccode.value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g,''),title:ctitle.value.trim(),description:cdesc.value.trim(),discount_type:ctype.value,discount_value:value,min_order:Number(cminimum.value||0),max_discount:cmax.value?Number(cmax.value):null,usage_limit:climit.value?Number(climit.value):null,per_user_limit:Number(cperuser.value||1),target_product_id:cproduct.value?Number(cproduct.value):null,starts_at:new Date(cstart.value).toISOString(),expires_at:cexpiry.value?new Date(cexpiry.value).toISOString():null,active:cactive.checked,updated_at:new Date().toISOString()};if(!c)row.created_by=state.user.id;const q=c?state.sb.from('coupons').update(row).eq('id',c.id):state.sb.from('coupons').insert(row);const {data,error}=await q.select();if(error){saveCoupon.disabled=false;return alert(error.message)}await logAction(c?'coupon_updated':'coupon_created','coupon',c?.id||data?.[0]?.id,{code:row.code,value:row.discount_value,type:row.discount_type});await refreshAndShow('coupons')}
}
async function deleteCoupon(id){if(!confirm('Delete this unused coupon?'))return;const {error}=await state.sb.from('coupons').delete().eq('id',id);if(error)return alert(error.message);await logAction('coupon_deleted','coupon',id,{});await refreshAndShow('coupons')}

function renderCampaigns(){
  topActions.innerHTML='<button id="newCampaign" class="btn primary">+ Send Promotion</button>';newCampaign.onclick=()=>campaignModal()
  view.innerHTML=`<section class="panel offerIntro"><div><div class="eyebrow">DIRECT AUDIENCE TOOLS</div><h2>Promotions, Posters & Notifications</h2><p class="muted">Send to every signed-in reader or select individual accounts. Messages open as premium website popups.</p></div><div class="offerMetric"><b>${xOv('clicks',state.campaignViews.filter(v=>v.clicked_at).length)}</b><span>Total clicks</span></div></section>${state.campaigns.length?`<div class="campaignGrid">${state.campaigns.map(c=>{const recipients=state.campaignRecipients.filter(r=>r.campaign_id===c.id).length,views=state.campaignViews.filter(v=>v.campaign_id===c.id),coupon=state.coupons.find(x=>x.id===c.coupon_id);return `<article class="campaignCard">${c.poster_url?`<img src="${esc(c.poster_url)}" alt="" onerror="this.style.display='none'">`:`<div class="campaignArt">${c.campaign_type==='coupon'?'%':c.campaign_type==='poster'?'▧':'✦'}</div>`}<div class="campaignBody"><div class="campaignMeta"><span class="pill ${c.active?'live':'draft'}">${c.active?'Active':'Paused'}</span><span class="pill">${esc(c.campaign_type)}</span></div><h3>${esc(c.title)}</h3><p class="muted small">${esc(c.message)}</p>${coupon?`<div class="miniCoupon">${esc(coupon.code)} · ${esc(couponValue(coupon))}</div>`:''}<div class="campaignStats"><span><b>${c.audience_type==='all'?'All':recipients}</b> recipients</span><span><b>${views.length}</b> opened</span><span><b>${views.filter(v=>v.clicked_at).length}</b> clicked</span></div><div class="itemActions"><button class="btn secondary" data-preview-campaign="${c.id}">Preview</button><button class="btn secondary" data-edit-campaign="${c.id}">Edit</button><button class="btn danger" data-del-campaign="${c.id}">Delete</button></div></div></article>`}).join('')}</div>`:'<div class="empty">No campaign yet. Send a notification, promotion poster or coupon to your readers.</div>'}`
  document.querySelectorAll('[data-preview-campaign]').forEach(b=>b.onclick=()=>campaignPreview(state.campaigns.find(c=>c.id===b.dataset.previewCampaign)))
  document.querySelectorAll('[data-edit-campaign]').forEach(b=>b.onclick=()=>campaignModal(state.campaigns.find(c=>c.id===b.dataset.editCampaign)))
  document.querySelectorAll('[data-del-campaign]').forEach(b=>b.onclick=()=>deleteCampaign(b.dataset.delCampaign))
}

function campaignPreview(c){const coupon=state.coupons.find(x=>x.id===c.coupon_id);modal(`<div class="promoPreview ${c.poster_url?'hasPoster':''}">${c.poster_url?`<img src="${esc(c.poster_url)}" alt="${esc(c.title)}">`:''}<div class="promoPreviewBody"><div class="eyebrow">${esc(c.campaign_type.toUpperCase())}</div><h2>${esc(c.title)}</h2><p>${esc(c.message)}</p>${coupon?`<div class="previewCoupon"><span>${esc(coupon.code)}</span><b>${esc(couponValue(coupon))}</b></div>`:''}<button class="btn primary wide">${esc(c.button_text||'Explore Now')}</button><button id="closeModal" class="btn ghost wide">Close Preview</button></div></div>`);closeModal.onclick=closeModalFn}

function campaignModal(c=null,targetUser=null){
  const selected=new Set(targetUser?[targetUser.user_id]:state.campaignRecipients.filter(r=>r.campaign_id===c?.id).map(r=>r.user_id))
  modal(`<div class="modalHead"><div><div class="eyebrow">CAMPAIGN STUDIO</div><h2>${c?'Edit Campaign':targetUser?`Send to ${esc(targetUser.display_name||targetUser.email)}`:'Send Promotion'}</h2></div><button id="closeModal" class="btn ghost">Close</button></div><form id="campaignForm" class="formGrid"><div class="two"><label>Campaign type<select id="mtype"><option value="notification">Notification popup</option><option value="poster">Promotion poster</option><option value="coupon">Coupon popup</option></select></label><label>Audience<select id="maudience"><option value="all">All signed-in accounts</option><option value="selected">Selected accounts only</option></select></label></div><label>Title<input id="mtitle" required maxlength="90" value="${esc(c?.title||'')}"></label><label>Message<textarea id="mmessage" required maxlength="600">${esc(c?.message||'')}</textarea></label><div class="two"><label>Poster image URL<input id="mposter" value="${esc(c?.poster_url||'')}" placeholder="Optional"></label><label>Or upload poster<input id="mposterfile" type="file" accept="image/*"></label></div><div class="two"><label>Button text<input id="mbutton" value="${esc(c?.button_text||'Explore Now')}"></label><label>Button link<input id="mlink" value="${esc(c?.button_url||'/ebooks')}" placeholder="/ebooks"></label></div><label>Attach coupon<select id="mcoupon"><option value="">No coupon attached</option>${state.coupons.map(x=>`<option value="${x.id}">${esc(x.code)} — ${esc(couponValue(x))}</option>`).join('')}</select></label><div id="audienceBlock"><label>Select one or more accounts<select id="campaignUsers" multiple size="8">${state.users.map(u=>`<option value="${u.user_id}" ${selected.has(u.user_id)?'selected':''}>${esc(u.display_name||u.email)} — ${esc(u.email)}</option>`).join('')}</select></label><p class="small muted">Use Ctrl/⌘ to select multiple accounts.</p></div><div class="three"><label>Starts at<input id="mstart" type="datetime-local" required value="${dateInput(c?.starts_at||new Date())}"></label><label>Ends at<input id="mend" type="datetime-local" value="${dateInput(c?.ends_at)}"></label><label>Priority<input id="mpriority" type="number" value="${esc(c?.priority||0)}"></label></div><label class="check"><input id="mactive" type="checkbox" ${c?.active===false?'':'checked'}> Campaign active</label><button id="saveCampaign" class="btn primary">${c?'Save Campaign':'Send Campaign'}</button></form>`)
  mtype.value=c?.campaign_type||'notification';maudience.value=targetUser?'selected':c?.audience_type||'all';mcoupon.value=c?.coupon_id||'';closeModal.onclick=closeModalFn
  const audienceToggle=()=>audienceBlock.style.display=maudience.value==='selected'?'block':'none';maudience.onchange=audienceToggle;audienceToggle()
  campaignForm.onsubmit=async e=>{e.preventDefault();const recipients=Array.from(campaignUsers.selectedOptions).map(o=>o.value);if(maudience.value==='selected'&&!recipients.length)return alert('Select at least one account.');if(mend.value&&new Date(mend.value)<=new Date(mstart.value))return alert('End time must be after start time.');saveCampaign.disabled=true;try{let poster=mposter.value.trim();if(mposterfile.files[0])poster=await uploadMedia(mposterfile.files[0],'site-media');const row={campaign_type:mtype.value,title:mtitle.value.trim(),message:mmessage.value.trim(),poster_url:poster||null,button_text:mbutton.value.trim()||null,button_url:mlink.value.trim()||null,coupon_id:mcoupon.value||null,audience_type:maudience.value,priority:Number(mpriority.value||0),active:mactive.checked,starts_at:new Date(mstart.value).toISOString(),ends_at:mend.value?new Date(mend.value).toISOString():null,updated_at:new Date().toISOString()};if(!c)row.created_by=state.user.id;let campaignId=c?.id;if(c){const {error}=await state.sb.from('campaigns').update(row).eq('id',c.id);if(error)throw error;await state.sb.from('campaign_recipients').delete().eq('campaign_id',c.id)}else{const {data,error}=await state.sb.from('campaigns').insert(row).select().single();if(error)throw error;campaignId=data.id}if(maudience.value==='selected'){const {error}=await state.sb.from('campaign_recipients').insert(recipients.map(user_id=>({campaign_id:campaignId,user_id})));if(error)throw error}await logAction(c?'campaign_updated':'campaign_sent','campaign',campaignId,{type:row.campaign_type,audience:row.audience_type,recipients:recipients.length});await refreshAndShow('campaigns')}catch(err){alert(err.message);saveCampaign.disabled=false}}
}
async function deleteCampaign(id){if(!confirm('Delete this campaign and its popup history?'))return;const {error}=await state.sb.from('campaigns').delete().eq('id',id);if(error)return alert(error.message);await logAction('campaign_deleted','campaign',id,{});await refreshAndShow('campaigns')}

function renderCustomers(){
  topActions.innerHTML='<input id="customerSearch" class="search" placeholder="Search profile, email, phone or city">'
  const draw=()=>{const q=(customerSearch?.value||'').toLowerCase().trim();const users=state.users.filter(u=>!q||`${u.email} ${u.display_name} ${u.phone} ${u.city} ${(u.tags||[]).join(' ')}`.toLowerCase().includes(q));view.innerHTML=users.length?`<div class="customerGrid">${users.map(u=>{const owned=new Set(state.orders.filter(o=>o.user_id===u.user_id&&o.status==='paid').map(o=>Number(o.product_id))).size,spent=state.orders.filter(o=>o.user_id===u.user_id&&o.status==='paid'&&o.source!=='admin_grant').reduce((s,o)=>s+Number(o.amount||0),0);return `<article class="customerCard profileCard"><div class="avatar">${avatarHtml(u)}</div><div class="grow"><div class="profileTitle"><h3>${esc(u.display_name||'Reader')}</h3><span class="pill ${u.customer_tier==='VIP'?'live':''}">${esc(u.customer_tier||'Reader')}</span></div><p class="small muted">${esc(u.email||'No email')} ${u.phone?`· ${esc(u.phone)}`:''}</p><div class="tags"><span class="pill">${esc(u.provider||'email')}</span><span class="pill live">${cOv(u.user_id,'books',owned)} book${cOv(u.user_id,'books',owned)===1?'':'s'}</span><span class="pill">${money(cOv(u.user_id,'spent',spent))} spent</span>${u.city?`<span class="pill">${esc(u.city)}</span>`:''}</div><p class="small muted">Joined ${formatDate(u.created_at)} · Last login ${formatDate(u.last_sign_in_at)}</p></div><div class="customerActions"><button class="btn primary" data-profile-user="${u.user_id}">View Full Profile</button><button class="btn secondary" data-send-user="${u.user_id}">Send Promotion</button><button class="btn secondary" data-access-user="${u.user_id}">Book Access</button></div></article>`}).join('')}</div>`:'<div class="empty">No customers found.</div>';document.querySelectorAll('[data-profile-user]').forEach(b=>b.onclick=()=>customerProfileModal(userById(b.dataset.profileUser)));document.querySelectorAll('[data-send-user]').forEach(b=>b.onclick=()=>campaignModal(null,userById(b.dataset.sendUser)));document.querySelectorAll('[data-access-user]').forEach(b=>b.onclick=()=>accessModal(userById(b.dataset.accessUser)))}
  draw(); customerSearch.oninput=draw
}

function customerProfileModal(u){
  if(!u)return
  const orders=state.orders.filter(o=>o.user_id===u.user_id),paid=orders.filter(o=>o.status==='paid'),spent=paid.filter(o=>o.source!=='admin_grant').reduce((s,o)=>s+Number(o.amount||0),0)
  modal(`<div class="modalHead"><div><div class="eyebrow">COMPLETE CUSTOMER PROFILE</div><h2>${esc(u.display_name||u.email)}</h2><p class="small muted">Account ID · ${esc(u.user_id)}</p></div><button id="closeModal" class="btn ghost">Close</button></div><div class="profileSummary"><div class="avatar profileAvatar">${avatarHtml(u)}</div><div><b>${esc(u.email)}</b><span>${esc(u.provider||'email')} login · ${u.email_confirmed_at?'Email verified':'Email not verified'}</span></div><div><b>${cOv(u.user_id,'books',paid.length)}</b><span>book records</span></div><div><b>${money(cOv(u.user_id,'spent',spent))}</b><span>total spent</span></div></div><form id="profileForm" class="formGrid"><div class="two"><label>Display name<input id="uprofileName" value="${esc(u.display_name||'')}"></label><label>Phone<input id="uprofilePhone" value="${esc(u.phone||'')}"></label></div><div class="three"><label>City<input id="uprofileCity" value="${esc(u.city||'')}"></label><label>State<input id="uprofileState" value="${esc(u.state||'')}"></label><label>Country<input id="uprofileCountry" value="${esc(u.country||'India')}"></label></div><div class="two"><label>Language<input id="uprofileLanguage" value="${esc(u.language||'English')}"></label><label>Customer tier<select id="uprofileTier"><option>Reader</option><option>Premium</option><option>VIP</option></select></label></div><label>Tags <span class="small muted">Comma separated</span><input id="uprofileTags" value="${esc((u.tags||[]).join(', '))}" placeholder="loyal, newsletter, reviewer"></label><label>Private admin notes<textarea id="uprofileNotes" placeholder="Visible only inside owner control">${esc(u.admin_notes||'')}</textarea></label><div class="accountFacts"><span><b>Joined</b>${formatDate(u.created_at)}</span><span><b>Last sign-in</b>${formatDate(u.last_sign_in_at)}</span><span><b>Profile updated</b>${formatDate(u.updated_at)}</span></div><button id="saveProfile" class="btn primary">Save Profile Changes</button></form><div class="profileActions"><button id="profileSend" class="btn secondary">Send Poster / Notification / Coupon</button><button id="profileAccess" class="btn secondary">Manage Book Access</button>${['owner','super_admin'].includes(state.role)?'<button id="profileRole" class="btn secondary">Admin Role</button>':''}</div><section class="profileOrders"><h3>Recent account activity</h3>${orders.slice(0,6).map(o=>`<div><span>${esc(productById(o.product_id)?.title||`Product #${o.product_id}`)}</span><b>${o.source==='admin_grant'?'Bought':'Paid · '+money(ordAmt(o))}</b></div>`).join('')||'<p class="muted small">No order or access records.</p>'}</section>`)
  uprofileTier.value=u.customer_tier||'Reader';closeModal.onclick=closeModalFn;profileSend.onclick=()=>{closeModalFn();campaignModal(null,u)};profileAccess.onclick=()=>{closeModalFn();accessModal(u)};if(document.getElementById('profileRole'))profileRole.onclick=()=>{closeModalFn();roleModal(u)}
  profileForm.onsubmit=async e=>{e.preventDefault();saveProfile.disabled=true;const params={target_user:u.user_id,new_display_name:uprofileName.value,new_phone:uprofilePhone.value,new_city:uprofileCity.value,new_state:uprofileState.value,new_country:uprofileCountry.value,new_language:uprofileLanguage.value,new_customer_tier:uprofileTier.value,new_tags:uprofileTags.value.split(',').map(x=>x.trim()).filter(Boolean),new_admin_notes:uprofileNotes.value};const {error}=await state.sb.rpc('admin_update_customer_profile',params);if(error){saveProfile.disabled=false;return alert(error.message)}await logAction('customer_profile_updated','user',u.user_id,{tier:params.new_customer_tier,tags:params.new_tags});await refreshAndShow('customers')}
}

function ownerAccessModal(){
  modal(`<div class="modalHead"><h2>Give your website account all books</h2><button id="closeModal" class="btn ghost">Close</button></div><p class="muted">Choose the account/email you personally use on the public ThePageCraft website. This is separate from the private admin identity.</p><label>Website account<select id="ownerUserSelect">${state.users.map(u=>`<option value="${u.user_id}">${esc(u.display_name||u.email)} — ${esc(u.email)}</option>`).join('')}</select></label><button id="grantOwnerAll" class="btn primary wide">Grant ALL books to this account</button>`)
  closeModal.onclick=closeModalFn;grantOwnerAll.onclick=async()=>{if(!ownerUserSelect.value)return;grantOwnerAll.disabled=true;const {data,error}=await state.sb.rpc('admin_grant_all_books',{target_user:ownerUserSelect.value,access_note:'All books granted to owner website account'});if(error){grantOwnerAll.disabled=false;return alert(error.message)}await logAction('all_books_granted','user',ownerUserSelect.value,{added:data});alert(`Done. ${data} new book access record(s) added.`);await refreshAndShow('customers')}
}

function accessModal(u){
  const owned=state.orders.filter(o=>o.user_id===u.user_id&&o.status==='paid')
  modal(`<div class="modalHead"><div><div class="eyebrow">BOOK ACCESS</div><h2>${esc(u.display_name||u.email)}</h2><p class="small muted">${esc(u.email)}</p></div><button id="closeModal" class="btn ghost">Close</button></div><button id="grantAll" class="btn primary">Grant ALL Books</button><div class="notice">Owner control can revoke access to any individual book, including a paid purchase. The order record is preserved for accounting; only reading access is disabled.</div><div class="accessList">${state.products.map(p=>{const o=owned.find(x=>Number(x.product_id)===Number(p.id));return `<div class="accessRow"><div><b>${esc(p.title)}</b><div class="small muted">Product #${p.id} · ${money(p.price)}</div></div><div class="actions">${o?`<span class="pill live">✓ ${o.source==='admin_grant'?'Bought':'Paid'}</span><button class="btn danger" data-revoke="${p.id}">Revoke Access</button>`:`<button class="btn secondary" data-grant="${p.id}">Grant Access</button>`}</div></div>`}).join('')}</div>`)
  closeModal.onclick=closeModalFn
  grantAll.onclick=async()=>{grantAll.disabled=true;const {data,error}=await state.sb.rpc('admin_grant_all_books',{target_user:u.user_id,access_note:'All books granted from owner control'});if(error){grantAll.disabled=false;return alert(error.message)}await logAction('all_books_granted','user',u.user_id,{added:data});await reload();accessModal(userById(u.user_id))}
  document.querySelectorAll('[data-grant]').forEach(b=>b.onclick=async()=>{b.disabled=true;const {error}=await state.sb.rpc('admin_grant_book_access',{target_user:u.user_id,target_product:Number(b.dataset.grant),access_note:'Book access granted from owner control'});if(error)return alert(error.message);await logAction('book_access_granted','user',u.user_id,{product_id:Number(b.dataset.grant)});await reload();accessModal(userById(u.user_id))})
  document.querySelectorAll('[data-revoke]').forEach(b=>b.onclick=async()=>{const pid=Number(b.dataset.revoke);const p=productById(pid);if(!confirm(`Revoke ${p?.title||'this book'} access for ${u.email}? The purchase/order history will remain.`))return;b.disabled=true;const {data,error}=await state.sb.rpc('admin_revoke_book_access',{target_user:u.user_id,target_product:pid});if(error){b.disabled=false;return alert(error.message)}await logAction('book_access_revoked','user',u.user_id,{product_id:pid,records:data});await reload();accessModal(userById(u.user_id))})
}

async function loadMedia(bucket=state.mediaBucket){
  state.mediaBucket=bucket
  const path=bucket==='site-media'?'admin':''
  const {data,error}=await state.sb.storage.from(bucket).list(path,{limit:100,sortBy:{column:'created_at',order:'desc'}})
  if(error){state.media=[];return error}
  state.media=(data||[]).filter(x=>x.name!=='.emptyFolderPlaceholder').map(x=>({...x,path:path?`${path}/${x.name}`:x.name}))
  return null
}

async function renderMedia(){
  topActions.innerHTML='<button id="uploadFile" class="btn primary">+ Upload File</button>'
  view.innerHTML=`<div class="tabs"><button class="tab ${state.mediaBucket==='site-media'?'active':''}" data-bucket="site-media">Site Media</button><button class="tab ${state.mediaBucket==='books'?'active':''}" data-bucket="books">Private Book Files</button></div><div id="mediaBody"><div class="empty">Loading files…</div></div>`
  const err=await loadMedia(state.mediaBucket)
  if(err){mediaBody.innerHTML=`<div class="notice error">${esc(err.message)}</div>`;return}
  const bucket=state.mediaBucket
  mediaBody.innerHTML=state.media.length?`<div class="mediaGrid">${state.media.map(f=>{const url=bucket==='site-media'?state.sb.storage.from(bucket).getPublicUrl(f.path).data.publicUrl:'';return `<article class="mediaCard"><div class="mediaIcon">${/\.(png|jpe?g|webp|gif)$/i.test(f.name)?'🖼️':/\.pdf$/i.test(f.name)?'📕':'📄'}</div><div class="grow"><b>${esc(f.name)}</b><div class="small muted">${bucket} · ${f.metadata?.size?Math.round(f.metadata.size/1024)+' KB':'file'}</div>${url?`<input readonly value="${esc(url)}" onclick="this.select()">`:''}</div>${bucket==='books'&&/\.pdf$/i.test(f.name)?`<button class="btn secondary" data-preview-media="${esc(f.path)}">Read PDF</button>`:''}<button class="btn danger" data-del-media="${esc(f.path)}">Delete</button></article>`}).join('')}</div>`:'<div class="empty">No files in this bucket yet.</div>'
  uploadFile.onclick=()=>mediaUploadModal(bucket)
  document.querySelectorAll('[data-bucket]').forEach(b=>b.onclick=()=>{state.mediaBucket=b.dataset.bucket;renderMedia()})
  document.querySelectorAll('[data-preview-media]').forEach(b=>b.onclick=()=>openAdminPdf(b.dataset.previewMedia,b.dataset.previewMedia.split('/').pop()))
  document.querySelectorAll('[data-del-media]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this file?'))return;const {error}=await state.sb.storage.from(bucket).remove([b.dataset.delMedia]);if(error)return alert(error.message);await logAction('media_deleted','storage',b.dataset.delMedia,{bucket});renderMedia()})
}

function mediaUploadModal(bucket){
  modal(`<div class="modalHead"><h2>Upload to ${esc(bucket)}</h2><button id="closeModal" class="btn ghost">Close</button></div><form id="mediaForm" class="formGrid"><label>Choose file<input id="mediaFile" type="file" required ${bucket==='site-media'?'accept="image/*"':'accept="application/pdf,image/*"'}></label><label>File name / path (optional)<input id="mediaName" placeholder="Leave blank to use original filename"></label><div class="notice">${bucket==='books'?'This bucket is private. Use the exact PDF filename expected by your reader, for example echoes-of-freedom.pdf.':'Images uploaded here can be used as public cover/post URLs.'}</div><button id="mediaSave" class="btn primary">Upload</button></form>`)
  closeModal.onclick=closeModalFn
  mediaForm.onsubmit=async e=>{e.preventDefault();mediaSave.disabled=true;try{const f=mediaFile.files[0];let name=(mediaName.value.trim()||f.name).replace(/[^a-zA-Z0-9._\/-]/g,'-');let path=bucket==='site-media'?`admin/${Date.now()}-${name}`:name;const {error}=await state.sb.storage.from(bucket).upload(path,f,{upsert:true});if(error)throw error;await logAction('media_uploaded','storage',path,{bucket});closeModalFn();renderMedia()}catch(err){alert(err.message);mediaSave.disabled=false}}
}

function renderSiteSettings(){
  topActions.innerHTML='<button id="newSetting" class="btn primary">+ Add Setting</button>';newSetting.onclick=()=>settingModal()
  view.innerHTML=`<div class="notice">These values are stored centrally in Supabase. Settings only affect public pages that are wired to read the matching key. Books and Daily Posts are already wired separately.</div>${state.settings.length?`<div class="settingsGrid">${state.settings.map(s=>`<article class="settingCard"><div><span class="pill">${esc(s.category)}</span><h3>${esc(s.key)}</h3><p>${esc(s.value)}</p><p class="small muted">${esc(s.description||'')}</p></div><div class="itemActions"><button class="btn secondary" data-edit-setting="${esc(s.key)}">Edit</button>${['owner','super_admin'].includes(state.role)?`<button class="btn danger" data-del-setting="${esc(s.key)}">Delete</button>`:''}</div></article>`).join('')}</div>`:'<div class="empty">No settings yet.</div>'}`
  document.querySelectorAll('[data-edit-setting]').forEach(b=>b.onclick=()=>settingModal(state.settings.find(s=>s.key===b.dataset.editSetting)))
  document.querySelectorAll('[data-del-setting]').forEach(b=>b.onclick=()=>deleteSetting(b.dataset.delSetting))
}

function settingModal(s=null){
  modal(`<div class="modalHead"><h2>${s?'Edit Setting':'New Setting'}</h2><button id="closeModal" class="btn ghost">Close</button></div><form id="settingForm" class="formGrid"><label>Key<input id="skey" required ${s?'readonly':''} value="${esc(s?.key||'')}"></label><label>Value<textarea id="svalue">${esc(s?.value||'')}</textarea></label><div class="two"><label>Category<input id="scategory" value="${esc(s?.category||'general')}"></label><label>Visibility<select id="spublic"><option value="true">Public-readable</option><option value="false">Admin only</option></select></label></div><label>Description<textarea id="sdesc">${esc(s?.description||'')}</textarea></label><button id="saveSetting" class="btn primary">Save Setting</button></form>`)
  spublic.value=String(s?.public??true);closeModal.onclick=closeModalFn
  settingForm.onsubmit=async e=>{e.preventDefault();saveSetting.disabled=true;const row={key:skey.value.trim(),value:svalue.value,category:scategory.value.trim()||'general',description:sdesc.value.trim(),public:spublic.value==='true',updated_at:new Date().toISOString(),updated_by:state.user.id};const q=s?state.sb.from('site_settings').update(row).eq('key',s.key):state.sb.from('site_settings').insert(row);const {error}=await q;if(error){saveSetting.disabled=false;return alert(error.message)}await logAction(s?'setting_updated':'setting_created','site_setting',row.key,{value:row.value});await refreshAndShow('site')}
}
async function deleteSetting(key){if(!confirm(`Delete setting ${key}?`))return;const {error}=await state.sb.from('site_settings').delete().eq('key',key);if(error)return alert(error.message);await logAction('setting_deleted','site_setting',key,{});await refreshAndShow('site')}

const DEFAULT_LIGHT_PALETTE={primary:'#ff9933',accent:'#8b7cf6',background:'#faf9f7',surface:'#ffffff',text:'#2b2a28',muted:'#6b6863',button:'#ff9933',buttonText:'#1a1308',border:'#ead8c0',headerFooter:'#ffffff'}
const DEFAULT_DARK_PALETTE={primary:'#ff9933',accent:'#8b7cf6',background:'#070707',surface:'#0d0d18',text:'#ccc9c0',muted:'#888480',button:'#ff9933',buttonText:'#1a1308',border:'#39291c',headerFooter:'#070707'}
const PALETTE_LABELS={primary:'Primary colour',accent:'Secondary / accent',background:'Background',surface:'Surface / cards',text:'Text',muted:'Muted text',button:'Button',buttonText:'Button text',border:'Borders',headerFooter:'Header / footer'}
function contrastRatio(a,b){const lum=hex=>{const value=String(hex||'#000000').replace('#','').padEnd(6,'0').slice(0,6);const rgb=[0,2,4].map(i=>parseInt(value.slice(i,i+2),16)/255).map(x=>x<=.03928?x/12.92:((x+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]};const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
function paletteFields(mode,palette){return Object.entries(PALETTE_LABELS).map(([key,label])=>`<label class="colourField"><span>${label}</span><div><input type="color" data-palette="${mode}" data-colour="${key}" value="${esc(palette[key])}"><input class="hexInput" data-hex="${mode}:${key}" value="${esc(palette[key])}" maxlength="7" pattern="#[0-9A-Fa-f]{6}"></div></label>`).join('')}
function renderAppearance(){
  const light={...DEFAULT_LIGHT_PALETTE,...parseJson(settingValue('site_theme_light'),{})},dark={...DEFAULT_DARK_PALETTE,...parseJson(settingValue('site_theme_dark'),{})}
  view.innerHTML=`<div class="notice">Set separate colours for Light Mode and Dark Mode. Changes are previewed here and become live across the website after Save & Publish.</div><form id="appearanceForm" class="formGrid"><div class="themeEditorGrid"><section class="panel"><div class="panelTitle"><div><div class="eyebrow">LIGHT MODE</div><h2>Light palette</h2></div><button type="button" class="btn ghost" data-reset-palette="light">Reset</button></div><div class="colourGrid">${paletteFields('light',light)}</div><div id="lightContrast" class="contrastCheck"></div></section><section class="panel darkPreview"><div class="panelTitle"><div><div class="eyebrow">DARK MODE</div><h2>Dark palette</h2></div><button type="button" class="btn ghost" data-reset-palette="dark">Reset</button></div><div class="colourGrid">${paletteFields('dark',dark)}</div><div id="darkContrast" class="contrastCheck"></div></section></div><section class="panel liveThemePreview"><div><div class="eyebrow">LIVE PREVIEW</div><h2>Website colour preview</h2><p>Cards, text, border and button contrast update before publishing.</p></div><article id="themePreviewCard"><span>FEATURED BOOK</span><h3>ThePageCraft</h3><p>Books that matter. Stories that last.</p><button type="button">Explore Books</button></article></section><button id="saveAppearance" class="btn primary">Save & Publish Theme</button></form>`
  const collect=mode=>Object.fromEntries(Object.keys(PALETTE_LABELS).map(key=>[key,document.querySelector(`[data-hex="${mode}:${key}"]`).value]))
  const draw=()=>{const mode=document.documentElement.dataset.theme==='dark'?'dark':'light',p=collect(mode),card=themePreviewCard;card.style.cssText=`--preview-bg:${p.background};--preview-surface:${p.surface};--preview-text:${p.text};--preview-muted:${p.muted};--preview-border:${p.border};--preview-button:${p.button};--preview-button-text:${p.buttonText}`;for(const name of ['light','dark']){const x=collect(name),ratio=contrastRatio(x.text,x.background),buttonRatio=contrastRatio(x.buttonText,x.button);document.getElementById(`${name}Contrast`).innerHTML=`<b class="${ratio>=4.5?'contrastOk':'contrastWarn'}">Text ${ratio.toFixed(2)}:1</b><b class="${buttonRatio>=4.5?'contrastOk':'contrastWarn'}">Button ${buttonRatio.toFixed(2)}:1</b><span>${ratio>=4.5&&buttonRatio>=4.5?'Readable contrast':'Warning: improve colour contrast before publishing'}</span>`}}
  document.querySelectorAll('[data-colour]').forEach(input=>input.oninput=()=>{const hex=document.querySelector(`[data-hex="${input.dataset.palette}:${input.dataset.colour}"]`);hex.value=input.value;draw()})
  document.querySelectorAll('[data-hex]').forEach(input=>input.oninput=()=>{if(/^#[0-9a-f]{6}$/i.test(input.value)){const [mode,key]=input.dataset.hex.split(':');document.querySelector(`[data-palette="${mode}"][data-colour="${key}"]`).value=input.value;draw()}})
  document.querySelectorAll('[data-reset-palette]').forEach(button=>button.onclick=()=>{const mode=button.dataset.resetPalette,defaults=mode==='light'?DEFAULT_LIGHT_PALETTE:DEFAULT_DARK_PALETTE;for(const [key,value] of Object.entries(defaults)){document.querySelector(`[data-hex="${mode}:${key}"]`).value=value;document.querySelector(`[data-palette="${mode}"][data-colour="${key}"]`).value=value}draw()})
  appearanceForm.onsubmit=async e=>{e.preventDefault();const lightValue=collect('light'),darkValue=collect('dark');if(contrastRatio(lightValue.text,lightValue.background)<3||contrastRatio(darkValue.text,darkValue.background)<3)return alert('Text contrast is too low. Choose more readable text/background colours.');saveAppearance.disabled=true;const rows=[{key:'site_theme_light',value:JSON.stringify(lightValue),category:'appearance',description:'Public website and admin light-mode palette.',public:true,updated_by:state.user.id,updated_at:new Date().toISOString()},{key:'site_theme_dark',value:JSON.stringify(darkValue),category:'appearance',description:'Public website and admin dark-mode palette.',public:true,updated_by:state.user.id,updated_at:new Date().toISOString()}];const {error}=await state.sb.from('site_settings').upsert(rows,{onConflict:'key'});if(error){saveAppearance.disabled=false;return alert(error.message)}await logAction('site_theme_published','appearance','light-dark',{});await refreshAndShow('appearance')}
  draw()
}

const DEFAULT_HOME={hero:{eyebrow:'New Release Out Now',headingTop:'Stories that',headingAccent:'echo through',headingBottom:'history.',subheading:"Powerful books on India's history, politics, and nature — written by Ritesh Sharma to challenge what you think you know.",backgroundImage:'',ctaText:'Explore Books',ctaUrl:'/ebooks',secondaryCtaText:'Read Thoughts',secondaryCtaUrl:'#thoughts'},banner:{enabled:false,title:'A new chapter is coming',text:'Watch this space for the next ThePageCraft announcement.',buttonText:'Explore Books',buttonUrl:'/ebooks',image:''},featured:{enabled:true,eyebrow:'The Signature Collection',heading:'Books made to stay with you.',productIds:[]},manifesto:{enabled:true,eyebrow:'Our Point of View',heading:'Not more content. More meaning.',text:'ThePageCraft is an independent home for books that look beneath familiar headlines.'},stats:{readers:'5K+',titles:'',rating:'4.9',copies:'1,200+'},announcement:{enabled:false,text:'Festive sale: 30% off on all eBooks',code:'',linkText:'Shop now',linkUrl:'/ebooks'},testimonials:{enabled:false,heading:'Readers say it best',items:[]},header:{floating:true,brandName:'The Pagecraft',brandSub:'by Ritesh Sharma'},sections:{impactStats:true,notifications:true,journal:true,journey:true,readerPromise:true,faq:true,about:true},about:{eyebrow:'About the Author',heading:'Ritesh Sharma',text:'Ritesh Sharma is a NEET aspirant by ambition and a storyteller by heart.',text2:'His books explore history, identity and the ideas that shape India.'},footer:{brand:'The Pagecraft',tagline:'Books that matter. Stories that last.',text:'Independent stories on history, identity and the ideas that shape India.'}}
function currentHome(){const saved=parseJson(settingValue('homepage_config'),{});return {...DEFAULT_HOME,...saved,hero:{...DEFAULT_HOME.hero,...saved.hero},banner:{...DEFAULT_HOME.banner,...saved.banner},featured:{...DEFAULT_HOME.featured,...saved.featured},manifesto:{...DEFAULT_HOME.manifesto,...saved.manifesto},stats:{...DEFAULT_HOME.stats,...saved.stats},announcement:{...DEFAULT_HOME.announcement,...saved.announcement},testimonials:{...DEFAULT_HOME.testimonials,...saved.testimonials,items:Array.isArray(saved.testimonials?.items)?saved.testimonials.items:[]},header:{...DEFAULT_HOME.header,...saved.header},sections:{...DEFAULT_HOME.sections,...saved.sections},about:{...DEFAULT_HOME.about,...saved.about},footer:{...DEFAULT_HOME.footer,...saved.footer}}}
function renderHomepageEditor(){
  const c=currentHome(),selected=new Set((c.featured.productIds||[]).map(Number))
  topActions.innerHTML='<button id="openHomepage" class="btn secondary">Open Live Homepage ↗</button>';openHomepage.onclick=()=>window.open(SITE_URL,'_blank','noopener')
  view.innerHTML=`<form id="homepageForm" class="formGrid"><section class="panel"><div class="panelTitle"><div><div class="eyebrow">NO-CODE HOMEPAGE</div><h2>Hero & primary actions</h2></div><span class="pill live">Live preview below</span></div><div class="three"><label>Eyebrow<input id="hEyebrow" value="${esc(c.hero.eyebrow)}"></label><label>Heading line 1<input id="hTop" value="${esc(c.hero.headingTop)}"></label><label>Accent line<input id="hAccent" value="${esc(c.hero.headingAccent)}"></label></div><label>Heading line 3<input id="hBottom" value="${esc(c.hero.headingBottom)}"></label><label>Subheading<textarea id="hSub">${esc(c.hero.subheading)}</textarea></label><label>Hero background image URL<input id="hBackground" value="${esc(c.hero.backgroundImage)}" placeholder="Use a public URL from Media & Book Files"></label><div class="two"><label>Primary button text<input id="hCta" value="${esc(c.hero.ctaText)}"></label><label>Primary button link<input id="hCtaUrl" value="${esc(c.hero.ctaUrl)}"></label><label>Secondary button text<input id="hSecondaryCta" value="${esc(c.hero.secondaryCtaText)}"></label><label>Secondary button link<input id="hSecondaryUrl" value="${esc(c.hero.secondaryCtaUrl)}"></label></div></section><section class="panel"><div class="eyebrow">WEBSITE NUMBERS (READERS, RATING)</div><p class="muted">Yeh numbers Hero, Impact section, About aur eBooks page par ek saath badal jaate hain.</p><div class="two"><label>Readers (e.g. 5K+, 12,000+)<input id="sReaders" value="${esc(c.stats.readers)}"></label><label>Rating (e.g. 4.9)<input id="sRating" value="${esc(c.stats.rating)}"></label><label>Titles (khali = books ki auto ginti)<input id="sTitles" value="${esc(c.stats.titles)}" placeholder="Auto"></label><label>Copies sold on Amazon<input id="sCopies" value="${esc(c.stats.copies)}"></label></div></section><section class="panel"><div class="eyebrow">TOP ANNOUNCEMENT BAR</div><label class="check"><input id="anEnabled" type="checkbox" ${c.announcement.enabled?'checked':''}> Show announcement bar at the very top of the website</label><label>Message<input id="anText" value="${esc(c.announcement.text)}" placeholder="Diwali Sale: 30% off on all eBooks"></label><div class="three"><label>Coupon code (optional)<input id="anCode" value="${esc(c.announcement.code)}" placeholder="DIWALI30"></label><label>Link text<input id="anLinkText" value="${esc(c.announcement.linkText)}"></label><label>Link (e.g. /ebooks)<input id="anLinkUrl" value="${esc(c.announcement.linkUrl)}"></label></div></section><section class="panel"><div class="eyebrow">READER TESTIMONIALS</div><label class="check"><input id="tmEnabled" type="checkbox" ${c.testimonials.enabled?'checked':''}> Show testimonials slider on homepage</label><label>Section heading<input id="tmHeading" value="${esc(c.testimonials.heading)}"></label><label>Reviews - ek line me ek review, format: Naam | Role / City | Review text<textarea id="tmItems" rows="6" placeholder="Aman Verma | Student, Patna | Bahut hi gehri research hai, ek hi baithak me padh gaya.">${esc((c.testimonials.items||[]).map(i=>[i.name,i.role,i.text].join(' | ')).join('\n'))}</textarea></label><p class="muted">Sirf asli reader reviews hi daalein. Khali chhodoge to section dikhega nahi.</p></section><section class="panel"><div class="eyebrow">HEADER / NAVIGATION BAR</div><label class="check"><input id="hdFloating" type="checkbox" ${c.header.floating?'checked':''}> Floating rounded box header (band karoge to purana full-width bar)</label><div class="two"><label>Brand name<input id="hdBrand" value="${esc(c.header.brandName)}"></label><label>Small line under brand<input id="hdSub" value="${esc(c.header.brandSub)}"></label></div></section><section class="panel"><div class="eyebrow">BANNER / ANNOUNCEMENT</div><label class="check"><input id="bEnabled" type="checkbox" ${c.banner.enabled?'checked':''}> Show banner on homepage</label><div class="two"><label>Banner title<input id="bTitle" value="${esc(c.banner.title)}"></label><label>Image URL<input id="bImage" value="${esc(c.banner.image)}"></label></div><label>Banner message<textarea id="bText">${esc(c.banner.text)}</textarea></label><div class="two"><label>Button text<input id="bButton" value="${esc(c.banner.buttonText)}"></label><label>Button link<input id="bUrl" value="${esc(c.banner.buttonUrl)}"></label></div></section><section class="panel"><div class="eyebrow">FEATURED BOOKS</div><label class="check"><input id="fEnabled" type="checkbox" ${c.featured.enabled?'checked':''}> Show featured collection</label><div class="two"><label>Section label<input id="fEyebrow" value="${esc(c.featured.eyebrow)}"></label><label>Heading<input id="fHeading" value="${esc(c.featured.heading)}"></label></div><label>Select up to three books<select id="fProducts" multiple size="${Math.min(6,Math.max(3,state.products.length))}">${state.products.map(p=>`<option value="${p.id}" ${selected.has(Number(p.id))?'selected':''}>${esc(p.title)}</option>`).join('')}</select></label></section><section class="panel"><div class="eyebrow">TEXT SECTIONS</div><div class="two"><label>Manifesto heading<input id="mHeading" value="${esc(c.manifesto.heading)}"></label><label>Manifesto label<input id="mEyebrow" value="${esc(c.manifesto.eyebrow)}"></label></div><label>Manifesto text<textarea id="mText">${esc(c.manifesto.text)}</textarea></label><div class="two"><label>About heading<input id="aHeading" value="${esc(c.about.heading)}"></label><label>About label<input id="aEyebrow" value="${esc(c.about.eyebrow)}"></label></div><label>About paragraph 1<textarea id="aText">${esc(c.about.text)}</textarea></label><label>About paragraph 2<textarea id="aText2">${esc(c.about.text2)}</textarea></label></section><section class="panel"><div class="eyebrow">SHOW / HIDE HOMEPAGE SECTIONS</div><div class="sectionToggles">${Object.entries({impactStats:'Impact statistics',notifications:'Notifications',journal:'Text posts / journal',journey:'Journey',readerPromise:'Reader promise',faq:'FAQ',about:'About author'}).map(([key,label])=>`<label class="check"><input type="checkbox" data-home-section="${key}" ${c.sections[key]?'checked':''}> ${label}</label>`).join('')}</div><div class="three"><label>Footer brand<input id="footBrand" value="${esc(c.footer.brand)}"></label><label>Footer tagline<input id="footTag" value="${esc(c.footer.tagline)}"></label><label>Footer text<input id="footText" value="${esc(c.footer.text)}"></label></div></section><section class="panel homepagePreview"><div class="eyebrow">PREVIEW</div><h2 id="homePreviewHeading"></h2><p id="homePreviewText"></p><button type="button" id="homePreviewButton"></button></section><div class="publishBar"><button type="button" id="saveHomeDraft" class="btn secondary">Save Draft</button><button type="button" id="previewHome" class="btn secondary">Refresh Preview</button><button id="publishHome" class="btn primary">Publish Homepage</button></div></form><section class="panel versionPanel"><div class="panelTitle"><div><div class="eyebrow">VERSION HISTORY</div><h2>Recent homepage versions</h2></div></div>${state.homepageVersions.length?state.homepageVersions.map(v=>`<div class="versionRow"><span><b>${esc(v.status)}</b><small>${formatDate(v.created_at)}</small></span><button class="btn ghost" data-restore-home="${v.id}">Load Version</button></div>`).join(''):'<div class="empty compact">No saved homepage versions yet.</div>'}</section>`
  const collect=()=>({hero:{eyebrow:hEyebrow.value.trim(),headingTop:hTop.value.trim(),headingAccent:hAccent.value.trim(),headingBottom:hBottom.value.trim(),subheading:hSub.value.trim(),backgroundImage:hBackground.value.trim(),ctaText:hCta.value.trim(),ctaUrl:hCtaUrl.value.trim(),secondaryCtaText:hSecondaryCta.value.trim(),secondaryCtaUrl:hSecondaryUrl.value.trim()},banner:{enabled:bEnabled.checked,title:bTitle.value.trim(),text:bText.value.trim(),buttonText:bButton.value.trim(),buttonUrl:bUrl.value.trim(),image:bImage.value.trim()},featured:{enabled:fEnabled.checked,eyebrow:fEyebrow.value.trim(),heading:fHeading.value.trim(),productIds:Array.from(fProducts.selectedOptions).slice(0,3).map(o=>Number(o.value))},manifesto:{enabled:true,eyebrow:mEyebrow.value.trim(),heading:mHeading.value.trim(),text:mText.value.trim()},stats:{readers:sReaders.value.trim(),rating:sRating.value.trim(),titles:sTitles.value.trim(),copies:sCopies.value.trim()},announcement:{enabled:anEnabled.checked,text:anText.value.trim(),code:anCode.value.trim(),linkText:anLinkText.value.trim(),linkUrl:anLinkUrl.value.trim()},testimonials:{enabled:tmEnabled.checked,heading:tmHeading.value.trim(),items:tmItems.value.split('\n').map(l=>l.split('|').map(x=>x.trim())).filter(a=>a.length>=3&&a.slice(2).join('|').trim()).map(a=>({name:a[0],role:a[1],text:a.slice(2).join(' | ')}))},header:{floating:hdFloating.checked,brandName:hdBrand.value.trim(),brandSub:hdSub.value.trim()},sections:Object.fromEntries(Array.from(document.querySelectorAll('[data-home-section]')).map(x=>[x.dataset.homeSection,x.checked])),about:{eyebrow:aEyebrow.value.trim(),heading:aHeading.value.trim(),text:aText.value.trim(),text2:aText2.value.trim()},footer:{brand:footBrand.value.trim(),tagline:footTag.value.trim(),text:footText.value.trim()}})
  const draw=()=>{const x=collect();homePreviewHeading.textContent=`${x.hero.headingTop} ${x.hero.headingAccent} ${x.hero.headingBottom}`;homePreviewText.textContent=x.hero.subheading;homePreviewButton.textContent=x.hero.ctaText||'Explore Books'}
  homepageForm.addEventListener('input',draw);previewHome.onclick=draw;draw()
  saveHomeDraft.onclick=async()=>{saveHomeDraft.disabled=true;const {error}=await state.sb.from('homepage_versions').insert({content:collect(),status:'draft',created_by:state.user.id});if(error){saveHomeDraft.disabled=false;return alert(error.message)}await logAction('homepage_draft_saved','homepage','draft',{});await refreshAndShow('homepage')}
  homepageForm.onsubmit=async e=>{e.preventDefault();publishHome.disabled=true;const content=collect(),value=JSON.stringify(content),now=new Date().toISOString();const {error}=await state.sb.from('site_settings').upsert({key:'homepage_config',value,category:'homepage',description:'Published no-code homepage configuration.',public:true,updated_at:now,updated_by:state.user.id},{onConflict:'key'});if(error){publishHome.disabled=false;return alert(error.message)}await state.sb.from('homepage_versions').insert({content,status:'published',created_by:state.user.id});await logAction('homepage_published','homepage','homepage_config',{});await refreshAndShow('homepage')}
  document.querySelectorAll('[data-restore-home]').forEach(button=>button.onclick=()=>{const version=state.homepageVersions.find(v=>String(v.id)===button.dataset.restoreHome);if(!version)return;const content=version.content||{};state.settings=state.settings.filter(x=>x.key!=='homepage_config').concat({key:'homepage_config',value:JSON.stringify(content)});renderHomepageEditor();toast('Version loaded into editor. Publish to make it live.')})
}

function ticketStatusLabel(value){return ({open:'Open',in_progress:'In Progress',waiting_customer:'Waiting for Customer',resolved:'Resolved',closed:'Closed'}[value]||value)}
function renderSupportTickets(){
  const active=state.tickets.filter(t=>!['resolved','closed'].includes(t.status)).length
  const unread=state.tickets.reduce((total,ticket)=>total+Number(ticket.admin_unread_count||0),0)
  view.innerHTML=`<div class="supportStats"><article><b>${state.tickets.length}</b><span>Total tickets</span></article><article><b>${active}</b><span>Needs attention</span></article><article><b>${unread}</b><span>Unread customer replies</span></article><article><b>${state.tickets.filter(t=>t.priority==='high').length}</b><span>High priority</span></article></div><section class="panel"><div class="toolbar"><input id="ticketSearch" class="search" placeholder="Search ticket, customer or email"><select id="ticketStatus"><option value="">All statuses</option><option value="open">Open</option><option value="in_progress">In Progress</option><option value="waiting_customer">Waiting for Customer</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select><select id="ticketPriority"><option value="">All priorities</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select><select id="ticketCategory"><option value="">All categories</option><option value="payment">Payment</option><option value="book_access">Book access</option><option value="technical">Technical issue</option><option value="account">Account</option><option value="refund">Refund</option><option value="other">Other</option></select><input id="ticketDate" type="date" aria-label="Filter by created date"></div><div id="ticketRows"></div></section>`
  const draw=()=>{const q=ticketSearch.value.toLowerCase(),status=ticketStatus.value,priority=ticketPriority.value,category=ticketCategory.value,date=ticketDate.value,rows=state.tickets.filter(t=>(!q||`${t.ticket_number} ${t.customer_name} ${t.customer_email} ${t.subject}`.toLowerCase().includes(q))&&(!status||t.status===status)&&(!priority||t.priority===priority)&&(!category||t.category===category)&&(!date||String(t.created_at||'').slice(0,10)===date));ticketRows.innerHTML=rows.length?rows.map(t=>`<button class="ticketAdminRow" data-ticket="${t.id}"><span class="ticketNumber">#${esc(t.ticket_number)}</span><span class="grow"><b>${esc(t.subject)}</b><small>${esc(t.customer_name||t.customer_email)} · ${esc(t.customer_email)}</small><small>${esc(t.category)} · Created ${formatDate(t.created_at)}</small></span>${Number(t.admin_unread_count||0)>0?`<span class="pill unread">${Number(t.admin_unread_count)} new</span>`:''}<span class="pill ${t.priority==='high'?'danger':t.status==='resolved'?'live':'draft'}">${esc(t.priority)} priority</span><span><b>${esc(ticketStatusLabel(t.status))}</b><small>Last reply ${formatDate(t.updated_at)}</small></span></button>`).join(''):'<div class="empty">No matching support tickets.</div>';document.querySelectorAll('[data-ticket]').forEach(button=>button.onclick=()=>supportTicketModal(state.tickets.find(t=>String(t.id)===button.dataset.ticket)))}
  ticketSearch.oninput=draw;ticketStatus.onchange=draw;ticketPriority.onchange=draw;ticketCategory.onchange=draw;ticketDate.onchange=draw;draw()
}
async function notifySupport(event,ticketId){try{const {data:{session}}=await state.sb.auth.getSession();if(!session)return;await fetch('/api/support-notify',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({event,ticketId})})}catch{}}
async function uploadAdminSupportAttachment(ticket,file,internal){
  if(!file)return []
  if(file.size>5*1024*1024)throw new Error('Attachment must be 5 MB or smaller.')
  const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'-'),ownerPath=internal?state.user.id:ticket.user_id,path=`${ownerPath}/${ticket.id}/${Date.now()}-${safeName}`
  const {error}=await state.sb.storage.from('support-attachments').upload(path,file,{upsert:false})
  if(error)throw error
  return [{path,name:file.name,type:file.type,size:file.size}]
}
async function openSupportAttachment(path){
  const {data,error}=await state.sb.storage.from('support-attachments').createSignedUrl(path,120)
  if(error||!data?.signedUrl)return alert(error?.message||'Could not open attachment.')
  window.open(data.signedUrl,'_blank','noopener,noreferrer')
}
function supportTicketModal(ticket){
  const messages=[...(ticket.support_messages||[])].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at))
  modal(`<div class="modalHead"><div><div class="eyebrow">SUPPORT #${esc(ticket.ticket_number)}</div><h2>${esc(ticket.subject)}</h2><p class="small muted">${esc(ticket.customer_name)} · ${esc(ticket.customer_email)} · ${esc(ticket.category)}</p></div><button id="closeModal" class="btn ghost">Close</button></div><div class="adminThread">${messages.length?messages.map(m=>`<article class="adminThreadMessage ${m.internal?'internalNote':m.sender_role==='admin'?'fromAdmin':'fromCustomer'}"><header><b>${m.internal?'Internal note':m.sender_role==='admin'?'ThePageCraft Admin':'Customer'}</b><span>${formatDate(m.created_at)}</span></header><p>${esc(m.body)}</p>${(m.attachments||[]).map(f=>`<button type="button" class="supportFile" data-support-file="${esc(f.path)}">Open attachment: ${esc(f.name)}</button>`).join('')}</article>`).join(''):'<div class="empty compact">No conversation messages.</div>'}</div><form id="ticketReplyForm" class="formGrid"><div class="three"><label>Status<select id="supportStatus"><option value="open">Open</option><option value="in_progress">In Progress</option><option value="waiting_customer">Waiting for Customer</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></label><label>Priority<select id="supportPriority"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label>Message type<select id="supportInternal"><option value="false">Reply to customer</option><option value="true">Internal admin note</option></select></label></div><label>Message (optional when only changing status)<textarea id="supportReply" placeholder="Write a helpful reply or private internal note..."></textarea></label><label>Attachment (optional, max 5 MB)<input id="supportFile" type="file" accept="image/png,image/jpeg,image/webp,application/pdf"></label><button id="sendSupportReply" class="btn primary">Save Reply / Update Ticket</button></form>`)
  closeModal.onclick=closeModalFn;supportStatus.value=ticket.status;supportPriority.value=ticket.priority
  document.querySelectorAll('[data-support-file]').forEach(button=>button.onclick=()=>openSupportAttachment(button.dataset.supportFile))
  if(Number(ticket.admin_unread_count||0)>0){ticket.admin_unread_count=0;state.sb.from('support_tickets').update({admin_unread_count:0}).eq('id',ticket.id)}
  ticketReplyForm.onsubmit=async e=>{e.preventDefault();sendSupportReply.disabled=true;const internal=supportInternal.value==='true',body=supportReply.value.trim(),file=supportFile.files?.[0]||null;let attachments=[];try{attachments=await uploadAdminSupportAttachment(ticket,file,internal);const {error}=await state.sb.rpc('admin_update_support_ticket',{target_ticket:ticket.id,new_status:supportStatus.value,new_priority:supportPriority.value,reply_body:body,make_internal:internal,reply_attachments:attachments});if(error)throw error;await logAction(body||attachments.length?(internal?'support_internal_note_added':'support_ticket_replied'):'support_ticket_updated','support_ticket',ticket.id,{status:supportStatus.value,priority:supportPriority.value});if(!internal&&(body||attachments.length))await notifySupport('admin_reply',ticket.id);else if(ticket.status!==supportStatus.value)await notifySupport('status_changed',ticket.id);await refreshAndShow('support')}catch(error){if(attachments[0]?.path)await state.sb.storage.from('support-attachments').remove([attachments[0].path]);sendSupportReply.disabled=false;alert(error.message||'Could not update ticket.')}}
}

function renderAiHelper(){
  view.innerHTML=`<section class="panel aiStudio"><div class="panelTitle"><div><div class="eyebrow">AI CONTENT HELPER</div><h2>Create a polished first draft</h2><p class="muted">Generated content always stays editable and is never published automatically.</p></div><span class="pill live">Admin approval required</span></div><form id="aiForm" class="formGrid"><div class="three"><label>Content type<select id="aiType"><option value="product_description">Book / product description</option><option value="blog_post">Blog post</option><option value="banner">Homepage banner</option><option value="announcement">Announcement</option><option value="notification">Notification</option><option value="coupon">Coupon promotion</option><option value="email">Email subject & copy</option><option value="social_caption">Social-media caption</option><option value="faq">FAQ answer</option></select></label><label>Tone<select id="aiTone"><option>Professional</option><option>Simple</option><option>Premium</option><option>Friendly</option><option>Educational</option><option>Promotional</option><option>Concise</option></select></label><label>Approx. words<input id="aiWords" type="number" min="20" max="1800" value="180"></label></div><div class="two"><label>Topic<input id="aiTopic" required placeholder="What should the content be about?"></label><label>Target audience<input id="aiAudience" placeholder="Readers, students, parents..."></label></div><label>Key points<textarea id="aiPoints" placeholder="Facts, offer details, book highlights or must-use phrases..."></textarea></label><button id="aiGenerate" class="btn primary">Generate Draft</button></form><div class="aiResult"><div class="aiToolbar"><button data-ai-action="regenerate">Regenerate</button><button data-ai-action="improve">Improve</button><button data-ai-action="shorten">Shorten</button><button data-ai-action="expand">Expand</button><button id="aiCopy">Copy</button><button id="aiSaveDraft">Save as Draft</button></div><textarea id="aiOutput" placeholder="Your generated draft will appear here. You can edit it before saving or copying."></textarea><p id="aiStatus" class="small muted"></p></div></section>`
  const generate=async action=>{aiGenerate.disabled=true;aiStatus.textContent='Generating secure admin draft…';try{const {data:{session}}=await state.sb.auth.getSession();if(!session)throw new Error('Admin session expired. Please sign in again.');const response=await fetch('/api/ai-content-helper',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({type:aiType.value,tone:aiTone.value,audience:aiAudience.value.trim(),wordCount:Number(aiWords.value),topic:aiTopic.value.trim(),keyPoints:aiPoints.value.trim(),action,currentText:aiOutput.value.trim()})});const data=await response.json();if(!response.ok)throw new Error(data.error||'AI request failed');aiOutput.value=data.text;aiStatus.textContent=`Draft generated with ${data.model}. Review before use.`}catch(error){aiStatus.textContent=error.message}finally{aiGenerate.disabled=false}}
  aiForm.onsubmit=e=>{e.preventDefault();generate('generate')};document.querySelectorAll('[data-ai-action]').forEach(button=>button.onclick=()=>{if(!aiOutput.value.trim())return alert('Generate or paste a draft first.');generate(button.dataset.aiAction)})
  aiCopy.onclick=async()=>{await navigator.clipboard.writeText(aiOutput.value);toast('Draft copied')}
  aiSaveDraft.onclick=async()=>{if(!aiOutput.value.trim())return alert('There is no draft to save.');aiSaveDraft.disabled=true;const {error}=await state.sb.from('ai_content_drafts').insert({admin_id:state.user.id,content_type:aiType.value,tone:aiTone.value,topic:aiTopic.value.trim(),content:aiOutput.value});if(error){aiSaveDraft.disabled=false;return alert(error.message)}await logAction('ai_content_draft_saved','ai_content','draft',{type:aiType.value});toast('AI draft saved');aiSaveDraft.disabled=false}
}

function renderTeam(){
  if(!['owner','super_admin'].includes(state.role)){view.innerHTML='<div class="notice error">Only the Owner / Super Admin can manage admin roles.</div>';return}
  topActions.innerHTML='<button id="addTeam" class="btn primary">+ Add Admin</button>';addTeam.onclick=()=>teamPickerModal()
  view.innerHTML=state.admins.length?`<div class="customerGrid">${state.admins.map(a=>`<article class="customerCard"><div class="avatar crown">♛</div><div class="grow"><h3>${esc(a.display_name||a.email)}</h3><p class="small muted">${esc(a.email)}</p><span class="pill live">${esc(roleLabel(a.role))}</span></div><div class="customerActions">${a.role==='owner'?'<span class="small muted">Primary owner</span>':`<button class="btn secondary" data-edit-admin="${a.user_id}">Change Role</button><button class="btn danger" data-remove-admin="${a.user_id}">Remove</button>`}</div></article>`).join('')}</div>`:'<div class="empty">No admin team records.</div>'
  document.querySelectorAll('[data-edit-admin]').forEach(b=>b.onclick=()=>roleModal(state.users.find(u=>u.user_id===b.dataset.editAdmin)))
  document.querySelectorAll('[data-remove-admin]').forEach(b=>b.onclick=()=>removeAdmin(b.dataset.removeAdmin))
}
function teamPickerModal(){modal(`<div class="modalHead"><h2>Add Admin Team Member</h2><button id="closeModal" class="btn ghost">Close</button></div><label>Choose existing website user<select id="teamUser">${state.users.map(u=>`<option value="${u.user_id}">${esc(u.display_name||u.email)} — ${esc(u.email)}</option>`).join('')}</select></label><button id="chooseTeam" class="btn primary wide">Choose role</button>`);closeModal.onclick=closeModalFn;chooseTeam.onclick=()=>{const u=userById(teamUser.value);closeModalFn();roleModal(u)}}
function roleModal(u){if(!u)return;const current=state.admins.find(a=>a.user_id===u.user_id)?.role||'admin';modal(`<div class="modalHead"><h2>Admin Role</h2><button id="closeModal" class="btn ghost">Close</button></div><p><b>${esc(u.display_name||u.email)}</b><br><span class="small muted">${esc(u.email)}</span></p><label>Role<select id="roleSelect"><option value="editor">Editor — posts/products</option><option value="admin">Admin — operational control</option><option value="super_admin">Super Admin — owner-level admin management</option></select></label><button id="saveRole" class="btn primary wide">Save Role</button>`);roleSelect.value=current==='owner'?'super_admin':current;closeModal.onclick=closeModalFn;saveRole.onclick=async()=>{saveRole.disabled=true;const {error}=await state.sb.rpc('admin_set_role',{target_user:u.user_id,new_role:roleSelect.value,display:u.display_name||null});if(error){saveRole.disabled=false;return alert(error.message)}await logAction('admin_role_set','user',u.user_id,{role:roleSelect.value});await reload();state.view='team';closeModalFn();shell()}}
async function removeAdmin(id){if(!confirm('Remove this user from the admin team? Their normal customer account will remain.'))return;const {error}=await state.sb.rpc('admin_remove_role',{target_user:id});if(error)return alert(error.message);await logAction('admin_role_removed','user',id,{});await reload();state.view='team';shell()}

function renderActivity(){
  view.innerHTML=state.audit.length?`<div class="timeline">${state.audit.map(a=>{const u=userById(a.admin_id);return `<div class="timelineItem"><div class="dot"></div><div><b>${esc(a.action.replaceAll('_',' '))}</b><div class="small muted">${esc(a.entity_type||'system')} ${a.entity_id?`· ${esc(a.entity_id)}`:''} · ${formatDate(a.created_at)}</div><div class="small muted">${esc(u?.email||'Admin')}</div></div></div>`}).join('')}</div>`:'<div class="empty">No admin activity logged yet.</div>'
}

function renderMore(){
  view.innerHTML=`<div class="moreGrid">${[['subscribers','Launch Subscribers','Emails of readers waiting for upcoming books'],['support','Support Tickets','Reply, prioritise, resolve and close customer issues'],['homepage','Homepage Editor','Edit homepage content and publish without code'],['appearance','Theme & Appearance','Control light and dark website colours'],['ai','AI Content Helper','Draft product, blog, coupon and notification text'],['coupons','Coupons & Offers','Create, schedule and limit discount codes'],['campaigns','Promotions & Alerts','Send popup posters, notifications and coupons'],['customers','Customers & Profiles','View, edit and contact complete account profiles'],['media','Media & Book Files','Upload covers, images and private PDFs'],['site','Website Settings','Manage central site settings'],['team','Admin Team','Owner roles and permissions'],['activity','Activity Log','See recent admin actions']].map(([v,t,d])=>`<button class="moreCard" data-more="${v}"><b>${t}</b><span>${d}</span></button>`).join('')}</div>`
  document.querySelectorAll('[data-more]').forEach(b=>b.onclick=()=>{state.view=b.dataset.more;shell()})
}

async function previewProductPdf(p){
  if(!p?.pdf_path)return alert('No PDF is linked to this book yet. Edit the book and upload a PDF first.')
  await openAdminPdf(p.pdf_path,p.title)
}
async function openAdminPdf(path,title='Book PDF'){
  try{
    const {data,error}=await state.sb.storage.from('books').createSignedUrl(path,3600);if(error||!data?.signedUrl)throw error||new Error('Could not create PDF link')
    adminPdfReader(data.signedUrl,title,path)
  }catch(err){alert(`Could not open PDF: ${err?.message||err}`)}
}
function adminPdfReader(url,title,path){
  closeModalFn()
  const back=document.createElement('div');back.id='modalBack';back.className='pdfReaderBack';back.innerHTML=`<section class="adminPdfReader"><header class="pdfTop"><div><div class="eyebrow">PRIVATE BOOK READER</div><b>${esc(title)}</b><div class="small muted">${esc(path)}</div></div><div class="pdfTools"><button id="pdfMinus" class="btn secondary">−</button><span id="pdfZoom">120%</span><button id="pdfPlus" class="btn secondary">+</button><button id="pdfPrev" class="btn secondary">‹</button><span id="pdfPages">Loading…</span><button id="pdfNext" class="btn secondary">›</button><button id="pdfClose" class="btn danger">✕ Close</button></div></header><div class="pdfStage"><div id="pdfLoading" class="empty">Loading protected PDF…</div><canvas id="adminPdfCanvas"></canvas><div class="pdfWatermarks" aria-hidden="true">${Array.from({length:18}).map(()=>'<span>ThePageCraft · Owner Preview</span>').join('')}</div></div></section>`;document.body.appendChild(back)
  pdfClose.onclick=()=>back.remove()
  let doc=null,page=1,scale=1.2,task=null
  const render=async()=>{if(!doc)return;pdfLoading.style.display='none';if(task)try{task.cancel()}catch{};const pg=await doc.getPage(page);const vp=pg.getViewport({scale});adminPdfCanvas.width=vp.width;adminPdfCanvas.height=vp.height;task=pg.render({canvasContext:adminPdfCanvas.getContext('2d'),viewport:vp});try{await task.promise}catch(e){if(e?.name!=='RenderingCancelledException')throw e}pdfPages.textContent=`${page} / ${doc.numPages}`;pdfZoom.textContent=`${Math.round(scale*100)}%`;pdfPrev.disabled=page<=1;pdfNext.disabled=page>=doc.numPages}
  const load=()=>{if(!window.pdfjsLib){const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';s.onload=load;document.head.appendChild(s);return}window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';window.pdfjsLib.getDocument({url}).promise.then(d=>{doc=d;render()}).catch(e=>{pdfLoading.textContent='Could not load PDF: '+e.message})};load()
  pdfPrev.onclick=()=>{if(page>1){page--;render()}};pdfNext.onclick=()=>{if(doc&&page<doc.numPages){page++;render()}};pdfMinus.onclick=()=>{scale=Math.max(.6,scale-.2);render()};pdfPlus.onclick=()=>{scale=Math.min(2.8,scale+.2);render()}
}

async function uploadMedia(file,bucket='site-media'){
  const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'-'), path=`admin/${Date.now()}-${safe}`
  const {error}=await state.sb.storage.from(bucket).upload(path,file,{upsert:false});if(error)throw error
  const {data}=state.sb.storage.from(bucket).getPublicUrl(path);return data.publicUrl
}

async function deleteRow(table,id,label){
  if(!confirm(`Delete this ${label}?`))return
  const {error}=await state.sb.from(table).delete().eq('id',id);if(error)return alert(error.message)
  await logAction(`${label}_deleted`,label,id,{});await refreshAndShow(state.view)
}

async function reload(){await loadData()}
async function refreshAndShow(viewName){closeModalFn();await reload();state.view=viewName;shell()}
function modal(html){closeModalFn();const d=document.createElement('div');d.id='modalBack';d.className='modalBack';d.innerHTML=`<section class="modal">${html}</section>`;document.body.appendChild(d)}
function closeModalFn(){document.getElementById('modalBack')?.remove()}


function clearIdleWatch(){
  if(idleTimer){clearTimeout(idleTimer);idleTimer=null}
  for(const e of ['pointerdown','keydown','touchstart','scroll']) window.removeEventListener(e,markActive,true)
}
function markActive(){
  if(!state.user)return
  localStorage.setItem(LAST_ACTIVE_KEY,String(Date.now()))
  if(idleTimer)clearTimeout(idleTimer)
  idleTimer=setTimeout(()=>secureIdleLogout(),IDLE_LIMIT_MS)
}
async function secureIdleLogout(){
  clearIdleWatch()
  localStorage.removeItem(LAST_ACTIVE_KEY)
  try{await state.sb?.auth.signOut()}catch{}
  state.user=null
  loginScreen('For your security, Owner Control was locked after 5 minutes of inactivity.')
}
function startIdleWatch(){
  clearIdleWatch()
  const last=Number(localStorage.getItem(LAST_ACTIVE_KEY)||0)
  if(last && Date.now()-last>=IDLE_LIMIT_MS){secureIdleLogout();return false}
  localStorage.setItem(LAST_ACTIVE_KEY,String(Date.now()))
  for(const e of ['pointerdown','keydown','touchstart','scroll']) window.addEventListener(e,markActive,true)
  idleTimer=setTimeout(()=>secureIdleLogout(),IDLE_LIMIT_MS)
  return true
}
async function authorize(){
  try{
    const role=await state.sb.rpc('admin_role')
    if(role.error)return loginScreen('Owner database upgrade is incomplete. Run RUN_THIS_OWNER_UPGRADE.sql in Supabase SQL Editor first.')
    state.role=role.data||'none'
    if(!['owner','super_admin','admin','editor'].includes(state.role)){await state.sb.auth.signOut();return loginScreen('This account is not authorized for ThePageCraft Admin.')}
    await loadData();if(startIdleWatch())shell()
  }catch(e){
    const needsV9=/support_tickets|support_messages|homepage_versions|ai_content_drafts/i.test(e?.message||'')
    const needsV8=/admin_list_customer_profiles|coupons|campaigns|coupon_redemptions/i.test(e?.message||'')
    setupScreen(needsV9?'Run RUN_THIS_V9_ADMIN_TOOLS.sql in Supabase SQL Editor, then reload this page.':needsV8?'Run RUN_THIS_V8_COUPONS_CAMPAIGNS.sql in Supabase SQL Editor, then reload this page.':e.message)
  }
}

async function boot(){
  applyTheme(localStorage.getItem(THEME_KEY)||'light')
  const c=cfg()
  if(!window.supabase)return setupScreen('Supabase library could not load. Check your internet connection and reopen the app.')
  try{
    state.sb=window.supabase.createClient(c.url,c.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}})
    const {data:{session},error}=await state.sb.auth.getSession();if(error)throw error
    const last=Number(localStorage.getItem(LAST_ACTIVE_KEY)||0)
    if(session && last && Date.now()-last>=IDLE_LIMIT_MS){await state.sb.auth.signOut();localStorage.removeItem(LAST_ACTIVE_KEY)}
    const fresh=await state.sb.auth.getSession()
    state.user=fresh.data.session?.user||null
    state.sb.auth.onAuthStateChange(async(_e,s)=>{
      state.user=s?.user||null
      if(!state.user){clearIdleWatch();return loginScreen()}
      await authorize()
    })
    if(!state.user)return loginScreen();await authorize()
  }catch(e){setupScreen(e.message)}
}

if('serviceWorker' in navigator && location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{})
window.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'&&state.user){e.preventDefault();globalSearch()}
  if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==='e'&&state.user){e.preventDefault();state.view='dataedit';shell()}
  if(e.key==='Escape')closeModalFn()
})

boot()

// ===== Dashboard data overrides (display only; real database records are never touched) =====
const OV_KEY='dashboard_overrides'
const OV_BAK_KEY='dashboard_overrides_backup'
// Dashboard date: once custom data is saved, the Overview stays frozen at the saved "data date" instead of moving with today's date.
function ovNow(){const o=getOv();return(hasOv()&&Number.isFinite(Number(o.asOf))&&Number(o.asOf)>0)?Number(o.asOf):Date.now()}
function getBackup(){const fromDb=state.settings.find(x=>x.key===OV_BAK_KEY)?.value;return parseJson(fromDb,null)||parseJson(localStorage.getItem('TPC_DASH_OV_BAK'),null)}
async function saveBackup(ov){
  const pack={savedAt:Date.now(),ov};const v=JSON.stringify(pack);try{localStorage.setItem('TPC_DASH_OV_BAK',v)}catch{}
  const row={key:OV_BAK_KEY,value:v,category:'admin',description:'Last dashboard data saved before Reset (private). Restored by the O data button.',public:false,updated_at:new Date().toISOString(),updated_by:state.user.id}
  const {error}=await state.sb.from('site_settings').upsert(row,{onConflict:'key'})
  if(!error)state.settings=state.settings.filter(x=>x.key!==OV_BAK_KEY).concat(row)
  return error
}
// Reset: remove the stored data completely (database row + browser copy), no history kept.
async function clearOv(){
  state.ov={};try{localStorage.removeItem('TPC_DASH_OV')}catch{}
  let {error}=await state.sb.from('site_settings').delete().eq('key',OV_KEY)
  if(error){const r=await state.sb.from('site_settings').upsert({key:OV_KEY,value:'{}',category:'admin',description:'Admin dashboard display overrides (private).',public:false,updated_at:new Date().toISOString(),updated_by:state.user.id},{onConflict:'key'});error=r.error}
  if(!error)state.settings=state.settings.filter(x=>x.key!==OV_KEY)
  return error
}
function ovReportRows(ov){
  const rows=[];const R=ov.r||{},g=ov.g||{},x=ov.x||{}
  if(ov.asOf)rows.push(['Data date',new Date(Number(ov.asOf)).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})])
  for(const d of [3,7,30]){const r=R[d];if(!r)continue;const l={3:'Last 3 days',7:'Last Week',30:'Last Month'}[d];if(r.paid!==undefined)rows.push([l+' - paid orders',r.paid]);if(r.prev!==undefined)rows.push([l+' - previous period orders',r.prev]);if(r.revenue!==undefined)rows.push([l+' - revenue (INR)',r.revenue]);if(r.rate!==undefined)rows.push([l+' - orders completed %',r.rate]);if(r.trend)rows.push([l+' - graph bars',r.trend.join(' ')]);if(r.buckets)rows.push([l+' - graph (day-wise orders)',r.buckets.join(' / ')])}
  const names={customers:'Customers',buyers:'Customers who bought',newUsers:'New customers',active:'Active books',totalBooks:'Total books',live:'Posts live',posts:'Total posts',totalPaid:'All-time paid orders'}
  for(const k in names)if(g[k]!==undefined)rows.push([names[k],g[k]])
  for(const id in (g.books||{})){const p=productById(Number(id));rows.push(['Book sold - '+(p?.title||id),g.books[id]])}
  for(const id in (ov.o||{})){const o=state.orders.find(z=>String(z.id)===String(id));rows.push(['Order amount - '+(productById(o?.product_id)?.title||'Book')+' / '+(userById(o?.user_id)?.display_name||'Customer'),ov.o[id]])}
  for(const id in (ov.c||{})){const u=userById(id);const c=ov.c[id];if(c.books!==undefined)rows.push(['Customer books - '+(u?.display_name||id),c.books]);if(c.spent!==undefined)rows.push(['Customer spent - '+(u?.display_name||id),c.spent])}
  if(x.redemptions!==undefined)rows.push(['Coupon redemptions',x.redemptions]);if(x.clicks!==undefined)rows.push(['Promotion clicks',x.clicks])
  return rows
}
// Graph buckets: 3 days = per day, Week = per 2 days, Month = per week. Oldest -> newest.
const OV_BUCKET_SIZES={3:[1,1,1],7:[1,2,2,2],30:[2,7,7,7,7]}
function ovBuckets(R,now){
  const sizes=OV_BUCKET_SIZES[R]||OV_BUCKET_SIZES[7],DAY=864e5,out=[];let day=0
  const fmt=j=>new Date(now-(R-1-j)*DAY).toLocaleDateString('en-IN',{day:'numeric',month:'short'})
  sizes.forEach(sz=>{const a=day,b=day+sz-1;out.push({label:a===b?fmt(a):fmt(a)+' – '+fmt(b)});day+=sz})
  return out
}
function ovRng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
// Smoothly spreads a few bucket values over many bars so the graph looks natural, not blocky.
function ovSmooth(vals,bars,seed){
  const n=vals.length,rnd=ovRng(seed),out=[]
  for(let i=0;i<bars;i++){
    const pos=(i+.5)/bars*n-.5,i0=Math.floor(pos),t=pos-i0,c=k=>vals[Math.min(n-1,Math.max(0,k))]
    const e=(1-Math.cos(Math.PI*t))/2,v=c(i0)+(c(i0+1)-c(i0))*e
    out.push(Math.max(0,v*(1+(rnd()-.5)*.22)))
  }
  return out
}
function getOv(){if(!state.ov){const fromDb=state.settings.find(x=>x.key===OV_KEY)?.value;state.ov=parseJson(fromDb,null)||parseJson(localStorage.getItem('TPC_DASH_OV'),{})}return state.ov}
function hasOv(){const o=getOv();return ['g','r','o','c','x'].some(k=>Object.keys(o[k]||{}).length>0)}
async function saveOv(ov){
  state.ov=ov;const v=JSON.stringify(ov);try{localStorage.setItem('TPC_DASH_OV',v)}catch{}
  const row={key:OV_KEY,value:v,category:'admin',description:'Admin dashboard display overrides (private).',public:false,updated_at:new Date().toISOString(),updated_by:state.user.id}
  const {error}=await state.sb.from('site_settings').upsert(row,{onConflict:'key'})
  if(!error)state.settings=state.settings.filter(x=>x.key!==OV_KEY).concat(row)
  return error
}
function renderDataEditor(){
  const R=[3,7,30].includes(state.editRange)?state.editRange:7, DAY=864e5, now=ovNow(), ov=getOv(), g=ov.g||{}, r=(ov.r||{})[R]||{}
  const paid=state.orders.filter(o=>o.status==='paid'&&o.source!=='admin_grant')
  const inR=(o,a,b)=>{const t=new Date(o.created_at).getTime();return t>=a&&t<b}
  const cur=paid.filter(o=>inR(o,now-R*DAY,now+DAY)), prev=paid.filter(o=>inR(o,now-2*R*DAY,now-R*DAY))
  const real={paid:cur.length,prev:prev.length,revenue:cur.reduce((n,o)=>n+Number(o.amount||0),0),rate:(()=>{const a=state.orders.filter(x=>x.source!=='admin_grant').length;return a?Math.round(paid.length/a*100):0})(),
    customers:state.users.length,buyers:new Set(paid.map(o=>o.user_id)).size,newUsers:state.users.filter(u=>u.created_at&&inR(u,now-R*DAY,now+DAY)).length,
    active:state.products.filter(x=>x.active).length,totalBooks:state.products.length,live:state.posts.filter(x=>x.published).length,posts:state.posts.length,totalPaid:paid.length}
  const f=(id,label,val,ph,hint='')=>`<label>${label}<input data-ov="${id}" type="number" min="0" step="any" value="${esc(val??'')}" placeholder="Original: ${esc(ph)}">${hint?`<span class="small muted">${hint}</span>`:''}</label>`
  view.innerHTML=`<section class="panel"><div class="eyebrow">DASHBOARD DATA EDITOR</div><h2>Change Overview numbers</h2><p class="muted">Yahan jo value daaloge wahi Overview me dikhegi, aur graph + progress bars uske hisaab se badal jaayenge. Field khali = original (real) data. Jab tak aap <b>Reset to Original</b> nahi dabaoge, changes saved rahenge. Sirf admin dashboard ka display badalta hai; asli orders/customers database me safe rehte hain.</p><div class="rangePills" role="group">${[[3,'Last 3 days'],[7,'Last Week'],[30,'Last Month']].map(([d,l])=>`<button type="button" data-erange="${d}" class="${R===d?'on':''}">${l}</button>`).join('')}</div><label style="max-width:320px;margin-top:14px">Data date (Overview stays frozen on this date)<input id="ovAsOf" type="date" value="${esc(new Date(hasOv()&&ov.asOf?Number(ov.asOf):Date.now()).toLocaleDateString('en-CA'))}"><span class="small muted">Aaj ki date roz nahi badlegi. Jis din data banaya wahi date rahegi, jab tak aap isse khud na badlo ya Reset na karo.</span></label></section>
  <form id="ovForm" class="formGrid"><section class="panel"><div class="eyebrow">SALES CARD + GRAPH (for the selected range)</div><div class="three">${f('r.paid','Paid orders',r.paid,real.paid)}${f('r.prev','Previous period orders',r.prev,real.prev)}${f('r.revenue','Revenue ₹',r.revenue,real.revenue)}</div><div class="two">${f('r.rate','Orders completed % (gradient bar)',r.rate,real.rate+'%','0 – 100')}<div class="notice" style="margin:0">Graph ke liye neeche <b>day-wise data</b> section bharo.</div></div></section>
  <section class="panel"><div class="eyebrow">GRAPH DATA - ${R===3?'PER DAY (3 inputs)':R===7?'PER 2 DAYS (4 inputs)':'PER WEEK (5 inputs)'}</div><p class="muted small">Har box me us time-block ke paid orders daalo. Graph in numbers se bana hoga aur har range ka alag dikhega. Paid orders khali chhodoge to in sabka total apne aap ban jayega. Sab khali = graph asli data se banega.</p><div class="three">${ovBuckets(R,now).map((b,i)=>`<label>${esc(b.label)}<input data-bk="${i}" type="number" min="0" step="1" value="${esc((r.buckets||[])[i]??'')}" placeholder="orders"></label>`).join('')}</div><div class="small muted" id="ovBkTotal"></div></section>
  <section class="panel"><div class="eyebrow">METRICS + PROGRESS BARS</div><div class="three">${f('g.customers','Customers',g.customers,real.customers)}${f('g.buyers','Customers who bought',g.buyers,real.buyers)}${f('g.newUsers','New customers (chip)',g.newUsers,real.newUsers)}${f('g.active','Active books',g.active,real.active)}${f('g.totalBooks','Total books',g.totalBooks,real.totalBooks)}${f('g.live','Posts live',g.live,real.live)}${f('g.posts','Total posts',g.posts,real.posts)}${f('g.totalPaid','All-time paid orders',g.totalPaid,real.totalPaid,'Paid Orders bar = period ÷ all-time')}</div></section>
  <section class="panel"><div class="eyebrow">BEST SELLING BOOKS (sold count)</div><div class="three">${state.products.map(p=>f('b.'+p.id,esc(p.title),(g.books||{})[p.id],paid.filter(o=>Number(o.product_id)===Number(p.id)).length)).join('')||'<div class="empty compact">No books yet.</div>'}</div></section>
  <section class="panel"><div class="eyebrow">ORDERS & PAYMENTS (latest 30 - amount shown in Orders tab)</div><div class="three">${state.orders.filter(o=>o.source!=='admin_grant').slice(0,30).map(o=>f('o.'+o.id,esc((productById(o.product_id)?.title||'Book')+' · '+(userById(o.user_id)?.display_name||'Customer')),(ov.o||{})[o.id],o.amount)).join('')||'<div class="empty compact">No paid orders.</div>'}</div></section>
  <section class="panel"><div class="eyebrow">CUSTOMERS (books owned & total spent)</div><input id="ovCustFilter" class="search" placeholder="Search customer…"><div id="ovCust" style="max-height:420px;overflow:auto;display:grid;gap:10px;margin-top:12px">${state.users.map(u=>{const pu=paid.filter(o=>o.user_id===u.user_id);const real=new Set(state.orders.filter(o=>o.user_id===u.user_id&&o.status==='paid').map(o=>Number(o.product_id))).size;const c=(ov.c||{})[u.user_id]||{};return `<div class="two" data-cust="${esc((u.display_name||'')+' '+(u.email||'')).toLowerCase()}"><div style="display:flex;gap:10px;align-items:center"><span class="avatar sm">${avatarHtml(u)}</span><div><b>${esc(u.display_name||'Reader')}</b><div class="small muted">${esc(u.email||'')}</div></div></div><div class="two">${f('c.'+u.user_id+'.books','Books',c.books,real)}${f('c.'+u.user_id+'.spent','Spent ₹',c.spent,pu.reduce((n,o)=>n+Number(o.amount||0),0))}</div></div>`}).join('')||'<div class="empty compact">No customers.</div>'}</div></section>
  <section class="panel"><div class="eyebrow">OTHER COUNTERS</div><div class="two">${f('x.redemptions','Coupon total redemptions',(ov.x||{}).redemptions,state.redemptions.length)}${f('x.clicks','Promotion total clicks',(ov.x||{}).clicks,state.campaignViews.filter(v=>v.clicked_at).length)}</div></section>
  ${(()=>{const b=getBackup();if(!b||!b.ov)return '';const rows=ovReportRows(b.ov);return `<section class="panel"><div class="eyebrow">SAVED REPORT (data before last Reset)</div><p class="muted">Saved on ${esc(new Date(b.savedAt).toLocaleString('en-IN'))}. <b>O data</b> dabane par ye poora data (Overview, orders, customers, counters, graph) admin panel me wapas aa jayega.</p><div class="tableWrap" style="max-height:260px;overflow:auto"><table><tbody>${rows.map(r=>`<tr><td>${esc(r[0])}</td><td><b>${esc(r[1])}</b></td></tr>`).join('')||'<tr><td>No values</td></tr>'}</tbody></table></div><div class="publishBar"><button type="button" id="ovDownload" class="btn secondary">Download this report (CSV)</button></div></section>`})()}
  <div class="publishBar"><button type="button" id="ovOData" class="btn secondary">O data</button><button type="button" id="ovResetRange" class="btn secondary">Reset this range to Original</button><button type="button" id="ovResetAll" class="btn danger">Reset EVERYTHING to Original</button><button type="button" id="ovOpen" class="btn secondary">Open Overview</button><button id="ovSave" class="btn primary">Save Changes</button></div></form>`
  ovCustFilter.oninput=()=>document.querySelectorAll('[data-cust]').forEach(r=>r.style.display=r.dataset.cust.includes(ovCustFilter.value.toLowerCase().trim())?'':'none')
  document.querySelectorAll('[data-erange]').forEach(b=>b.onclick=()=>{state.editRange=Number(b.dataset.erange);renderDataEditor()})
  ovOpen.onclick=()=>{state.view='dashboard';shell()}
  const bkTotal=()=>{const v=[...document.querySelectorAll('[data-bk]')].map(i=>Number(i.value)||0);ovBkTotal.textContent=v.some(x=>x)?'Total of these boxes: '+v.reduce((a,b)=>a+b,0)+' orders':''}
  document.querySelectorAll('[data-bk]').forEach(i=>i.oninput=bkTotal);bkTotal()
  const done=async(next,msg)=>{ovSave.disabled=true;const err=await saveOv(next);ovSave.disabled=false;toast(err?`Saved on this browser only (${err.message})`:msg,err?'error':'ok');renderDataEditor()}
  ovForm.onsubmit=e=>{e.preventDefault();const n=JSON.parse(JSON.stringify(getOv()));n.g={};n.o={};n.c={};n.x={};n.r=n.r||{};n.r[R]={}
    document.querySelectorAll('[data-ov]').forEach(i=>{const [sec,k,k2]=i.dataset.ov.split('.');if(i.value==='')return;const v=Number(i.value);if(!Number.isFinite(v)||v<0)return
      if(sec==='r')n.r[R][k]=k==='rate'?Math.min(100,v):v;else if(sec==='g')n.g[k]=v;else if(sec==='o')n.o[k]=v;else if(sec==='x')n.x[k]=v;else if(sec==='c'){n.c[k]=n.c[k]||{};n.c[k][k2]=v}else{n.g.books=n.g.books||{};n.g.books[k]=v}})
    const bks=[...document.querySelectorAll('[data-bk]')].map(i=>i.value===''?null:Number(i.value));if(bks.some(v=>v!==null&&Number.isFinite(v)&&v>=0))n.r[R].buckets=bks.map(v=>Number.isFinite(v)&&v>=0?Math.round(v):0)
    if(!Object.keys(n.r[R]).length)delete n.r[R]
    for(const k of ['g','o','c','x','r'])if(!Object.keys(n[k]||{}).length)delete n[k]
    const dv=ovAsOf.value;n.asOf=dv?new Date(dv+'T23:59:00').getTime():(n.asOf||Date.now())
    done(n,'Saved. Overview graph & progress bars updated.')}
  ovResetRange.onclick=()=>{if(!confirm('Reset only this date range to original data?'))return;const n=JSON.parse(JSON.stringify(getOv()));if(n.r){delete n.r[R];if(!Object.keys(n.r).length)delete n.r}done(n,'This range is back to original data.')}
  ovResetAll.onclick=async()=>{
    if(!confirm('Reset ALL dashboard data to the original real data? Current data is removed from storage (a backup report is kept so the O data button can bring it back).'))return
    ovSave.disabled=true;const cur=getOv()
    if(hasOv()){const be=await saveBackup(JSON.parse(JSON.stringify(cur)));if(be&&!confirm('Backup could not be saved to the database ('+be.message+'). Continue reset anyway?')){ovSave.disabled=false;return}}
    const err=await clearOv();ovSave.disabled=false;toast(err?`Reset on this browser only (${err.message})`:'Everything is back to original data. Press O data to bring the old data back.',err?'error':'ok');renderDataEditor()
  }
  ovOData.onclick=async()=>{
    const b=getBackup();if(!b||!b.ov||!Object.keys(b.ov).length)return alert('No saved data found. O data works after you have saved custom data and pressed Reset.')
    if(hasOv()&&!confirm('Replace the current data with the saved data from before Reset?'))return
    done(JSON.parse(JSON.stringify(b.ov)),'O data restored. Old data is back everywhere in the admin panel.')
  }
  if(window.ovDownload)ovDownload.onclick=()=>{const b=getBackup();if(!b)return;const q=v=>`"${String(v??'').replace(/"/g,'""')}"`;const csv=['item,value',...ovReportRows(b.ov).map(r=>r.map(q).join(','))].join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='dashboard-data-report.csv';a.click()}
}

function renderSubscribers(){
  if(state.subs===null){view.innerHTML='<div class="notice error">Subscriber list is not set up yet. Run <b>RUN_THIS_V13_NOTIFY.sql</b> once in Supabase SQL Editor, then reload.</div>';return}
  const subs=state.subs, byBook={}
  subs.forEach(x=>{const k=x.product_title||'Any upcoming book';byBook[k]=(byBook[k]||0)+1})
  topActions.innerHTML='<button id="subCopy" class="btn secondary">Copy all emails</button><button id="subCsv" class="btn primary">Download CSV</button>'
  view.innerHTML=`<section class="panel offerIntro"><div><div class="eyebrow">LAUNCH LIST</div><h2>Launch Subscribers</h2><p class="muted">Readers who tapped "Notify Me on Launch". ${Object.entries(byBook).map(([k,v])=>`${esc(k)}: <b>${v}</b>`).join(' · ')||'No signups yet.'}</p></div><div class="offerMetric"><b>${subs.length}</b><span>Total subscribers</span></div></section>${subs.length?`<div class="tableWrap"><table><thead><tr><th>Email</th><th>Book</th><th>Signed up</th><th></th></tr></thead><tbody>${subs.map(x=>`<tr><td><b>${esc(x.email)}</b></td><td>${esc(x.product_title||'—')}</td><td>${formatDate(x.created_at)}</td><td><button class="btn danger" data-del-sub="${x.id}">Remove</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No one has subscribed yet.</div>'}`
  subCopy.onclick=async()=>{await navigator.clipboard.writeText([...new Set(subs.map(x=>x.email))].join(', '));toast('Emails copied')}
  subCsv.onclick=()=>{const q=v=>`"${String(v??'').replace(/"/g,'""')}"`;const csv=['email,book,signed_up',...subs.map(x=>[x.email,x.product_title,x.created_at].map(q).join(','))].join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='launch-subscribers.csv';a.click()}
  document.querySelectorAll('[data-del-sub]').forEach(b=>b.onclick=async()=>{if(!confirm('Remove this subscriber?'))return;const {error}=await state.sb.from('book_launch_subscribers').delete().eq('id',b.dataset.delSub);if(error)return alert(error.message);await reload();renderSubscribers()})
}

// Per-book payment links live in site_settings (key book_payment_links = {bookId: url}). No SQL needed; works for every book, new or old.
function payLinkOf(p){return parseJson(settingValue('book_payment_links'),{})[p?.id]||p?.payment_link||''}
async function savePayLink(id,url){
  if(id===undefined||id===null)return
  const m=parseJson(settingValue('book_payment_links'),{}); if(url)m[id]=url; else delete m[id]
  const row={key:'book_payment_links',value:JSON.stringify(m),category:'store',description:'Per-book payment links (book id to URL).',public:true,updated_at:new Date().toISOString(),updated_by:state.user.id}
  const {error}=await state.sb.from('site_settings').upsert(row,{onConflict:'key'}); if(error)throw error
  state.settings=state.settings.filter(x=>x.key!==row.key).concat(row)
}

// Auto-hide sidebar: opens when the mouse touches the left edge (or the small tab is clicked); closes when the mouse moves away.
function setupSidebarHide(){
  if(window.__sbHide)return;window.__sbHide=true
  let t=null;const sh=()=>document.querySelector('.appShell')
  const open=()=>{clearTimeout(t);sh()?.classList.add('navOpen')}
  const close=()=>{clearTimeout(t);t=setTimeout(()=>sh()?.classList.remove('navOpen'),220)}
  document.addEventListener('mousemove',e=>{
    const el=sh();if(!el||window.innerWidth<=780)return
    if(e.clientX<=12){open();return}
    if(!el.classList.contains('navOpen'))return
    const r=el.querySelector('.sidebar').getBoundingClientRect().right
    if(e.clientX>r+24)close();else clearTimeout(t)
  })
  document.addEventListener('click',e=>{
    const el=sh();if(!el||window.innerWidth<=780)return
    if(e.target.closest('#sideTab')){el.classList.toggle('navOpen');return}
    if(el.classList.contains('navOpen')&&!e.target.closest('.sidebar'))el.classList.remove('navOpen')
  })
  document.addEventListener('keydown',e=>{if(e.key==='Escape')sh()?.classList.remove('navOpen')})
}
