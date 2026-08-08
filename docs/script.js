const $=(s,c=document)=>c.querySelector(s);const $$=(s,c=document)=>[...c.querySelectorAll(s)];

// ------------------------- LANGUAGE SYSTEM -------------------------
const TRANSLATIONS=window.LAB_TRANSLATIONS||{en:{}};
const LANG_CODES=window.LAB_LANG_CODES||{en:'EN'};
const LANG_LOCALES=window.LAB_LANG_LOCALES||{en:'en-GB'};
const SUPPORTED_LANGS=Object.keys(TRANSLATIONS);
let activeLang='en';
function t(key){return (TRANSLATIONS[activeLang]&&TRANSLATIONS[activeLang][key])||(TRANSLATIONS.en&&TRANSLATIONS.en[key])||key}
function normalizeLanguage(raw=''){
  const v=String(raw).replace('_','-');
  if(SUPPORTED_LANGS.includes(v))return v;
  const lower=v.toLowerCase();
  if(lower.startsWith('zh-tw')||lower.startsWith('zh-hk')||lower.startsWith('zh-hant'))return 'zh-TW';
  if(lower.startsWith('zh'))return 'zh-CN';
  const base=lower.split('-')[0];
  return SUPPORTED_LANGS.includes(base)?base:'en';
}
function preferredLanguage(){
  try{const saved=localStorage.getItem('biominingLabLanguage');if(saved)return normalizeLanguage(saved)}catch{}
  return normalizeLanguage((navigator.languages&&navigator.languages[0])||navigator.language||'en');
}
function applyStaticTranslations(){
  $$('[data-i18n]').forEach(el=>{el.textContent=t(el.dataset.i18n)});
  $$('[data-i18n-placeholder]').forEach(el=>{el.setAttribute('placeholder',t(el.dataset.i18nPlaceholder))});
  $$('[data-i18n-aria]').forEach(el=>{el.setAttribute('aria-label',t(el.dataset.i18nAria))});
  const button=$('#langButton');if(button)button.setAttribute('aria-label',t('lang_aria'));
  const code=$('#currentLangCode');if(code)code.textContent=LANG_CODES[activeLang]||activeLang.toUpperCase();
  $$('#langMenu [data-lang]').forEach(btn=>{const on=btn.dataset.lang===activeLang;btn.classList.toggle('active',on);btn.setAttribute('aria-checked',String(on))});
  document.title=t('page_title');
  const metaDesc=document.querySelector('meta[name="description"]');if(metaDesc)metaDesc.setAttribute('content',t('page_description'));
}

function setLanguage(lang,{persist=true,rerender=true}={}){
  activeLang=normalizeLanguage(lang);
  document.documentElement.lang=LANG_LOCALES[activeLang]||activeLang;
  document.documentElement.dataset.language=activeLang;
  if(persist){try{localStorage.setItem('biominingLabLanguage',activeLang)}catch{}}
  applyStaticTranslations();
  if(rerender){renderPublications(filteredPublications());renderUpdates();updatePublicationMeta()}
}
function initLanguageSwitcher(){
  const switcher=$('#languageSwitcher'),button=$('#langButton'),menu=$('#langMenu');
  if(!switcher||!button||!menu)return;
  const close=()=>{switcher.classList.remove('open');button.setAttribute('aria-expanded','false')};
  button.addEventListener('click',e=>{e.stopPropagation();const open=switcher.classList.toggle('open');button.setAttribute('aria-expanded',String(open))});
  $$('[data-lang]',menu).forEach(btn=>btn.addEventListener('click',()=>{setLanguage(btn.dataset.lang);close()}));
  document.addEventListener('click',e=>{if(!switcher.contains(e.target))close()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
}

// ------------------------- GLOBAL UI -------------------------
const header=$('#siteHeader'),progress=$('#progress');
function scrollUI(){
  const y=window.scrollY||0,max=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
  if(progress) progress.style.width=`${Math.min(100,y/max*100)}%`;
  if(header) header.classList.toggle('scrolled',y>45);
}
addEventListener('scroll',scrollUI,{passive:true});scrollUI();

const revealEls=$$('.reveal');
if('IntersectionObserver' in window){
  const io=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('visible');io.unobserve(entry.target)}
  }),{threshold:.08,rootMargin:'0px 0px -4% 0px'});
  revealEls.forEach(el=>io.observe(el));
}else{revealEls.forEach(el=>el.classList.add('visible'))}

const menuButton=$('#menuButton'),mobileNav=$('#mobileNav');
if(menuButton&&mobileNav){
  menuButton.addEventListener('click',()=>{const open=mobileNav.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open))});
  $$('a',mobileNav).forEach(a=>a.addEventListener('click',()=>{mobileNav.classList.remove('open');menuButton.setAttribute('aria-expanded','false')}));
}
const year=$('#year');if(year)year.textContent=new Date().getFullYear();

// ------------------------- PUBLICATIONS -------------------------
const data=window.LAB_PUBLICATION_DATA||{metrics:{},publications:[],last_updated:null,source:'embedded snapshot'};
let pubs=Array.isArray(data.publications)?data.publications:[];
const PUBLICATION_PREVIEW_LIMIT=8;
function locale(){return LANG_LOCALES[activeLang]||'en-GB'}
function fmtDate(s){
  if(!s)return t('sync_embedded');
  const d=new Date(s);if(Number.isNaN(d.getTime()))return t('snapshot_loaded');
  return `${t('synced')} ${d.toLocaleDateString(locale(),{day:'2-digit',month:'short',year:'numeric'})}`;
}
function fillTemplate(str,vars={}){return String(str||'').replace(/\{(\w+)\}/g,(_,k)=>vars[k]??'')}
function cleanDisplayTitle(v=''){return String(v||'').trim().replace(/[\.。．]+\s*$/u,'').trim()}
function translatedTitle(p={}){
  const tr=p.title_translations||p.translations||{};
  const candidate=activeLang==='en'?(p.title||''):(tr[activeLang]||p.title||'');
  return cleanDisplayTitle(candidate);
}
function originalTitle(p={}){return cleanDisplayTitle(p.title||'')}
function badgeClass(q=''){return String(q).toUpperCase()==='Q1'?'q1':''}
function safeText(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function safeUrl(v=''){try{const u=new URL(v,location.href);return ['http:','https:'].includes(u.protocol)?u.href:'#'}catch{return '#'}}
function safeImageSrc(v=''){
  const s=String(v||'').trim();if(!s)return '';
  if(/^(?:assets\/publications\/)[A-Za-z0-9._\/-]+$/.test(s) && !s.includes('..')) return s;
  try{const u=new URL(s,location.href);return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return ''}
}
function visualFor(p={}){
  const raw=p.graphical_abstract||p.graphical_abstract_url||'';
  const src=safeImageSrc(raw);const kind=(p.graphical_abstract_kind||'').toLowerCase();
  return {src,kind,isGA:!!src&&kind!=='publisher_preview',isPreview:!!src&&kind==='publisher_preview'};
}
function removeBrokenVisual(img){
  const media=img.closest('.pub-thumb,.update-visual');const parent=img.closest('.pub-row,.update-card');
  if(parent)parent.classList.add('no-visual');if(media)media.remove();
}
function installImageFallbacks(root=document){
  $$('img[data-publication-visual]',root).forEach(img=>{
    if(img.dataset.fallbackReady)return;img.dataset.fallbackReady='1';
    img.addEventListener('error',()=>removeBrokenVisual(img),{once:true});
  });
}
function searchQuery(){return String($('#pubSearch')?.value||'').toLowerCase().trim()}
function publicationHaystack(p={}){
  const tr=Object.values(p.title_translations||p.translations||{}).join(' ');
  return `${p.title||''} ${tr} ${p.journal||''} ${p.authors||''} ${p.year||''} ${p.doi||''}`.toLowerCase();
}
function filteredPublications(){
  const q=searchQuery();
  if(!q)return pubs;
  return pubs.filter(p=>publicationHaystack(p).includes(q));
}
function updateSearchStatus(totalMatches=null){
  const host=$('#pubSearchStatus');if(!host)return;
  const total=pubs.length;const q=searchQuery();
  if(q){host.textContent=fillTemplate(t('pub_search_results'),{count:totalMatches??filteredPublications().length,total});}
  else{host.textContent=fillTemplate(t('pub_search_hint'),{shown:Math.min(PUBLICATION_PREVIEW_LIMIT,total),total});}
}
function renderPublications(list){
  const host=$('#pubList');if(!host)return;
  const q=searchQuery();const completeList=q?list:list.slice(0,PUBLICATION_PREVIEW_LIMIT);
  updateSearchStatus(q?list.length:null);
  if(!completeList.length){host.innerHTML=`<div class="empty">${safeText(t('pub_no_match'))}</div>`;return}
  host.innerHTML=completeList.map(p=>{
    const qtile=p.quartile||'Q —';
    const iff=p.impact_factor?`IF ${p.impact_factor}${p.impact_factor_year?` · ${p.impact_factor_year}`:''}`:(p.type||'').toLowerCase().includes('conference')?t('no_jif'):'IF —';
    const ifClass=p.impact_factor?'if':'na';
    const cite=Number.isFinite(+p.citations)?`<b class="badge">${+p.citations} ${safeText(t('cited'))}</b>`:'';
    const v=visualFor(p);const title=translatedTitle(p);const original=originalTitle(p);
    const showOriginal=activeLang!=='en'&&title&&original&&title!==original;
    const alt=v.isGA?t('graphical_abstract_alt'):t('publisher_visual_alt');
    const media=v.src?`<span class="pub-thumb ${v.isGA?'has-ga':'publisher-preview'}"><img src="${v.src}" data-publication-visual alt="${safeText(alt)} — ${safeText(original||'publication')}">${v.isGA?`<em>${safeText(t('graphical_abstract'))}</em>`:''}</span>`:'';
    const originalLine=showOriginal?`<small class="pub-original"><b>${safeText(t('pub_original_title'))}:</b> ${safeText(original)}</small>`:'';
    return `<a class="pub-row ${v.src?'has-visual':'no-visual'}" href="${safeUrl(p.url||'#')}" target="_blank" rel="noopener">${media}<span class="pub-year">${safeText(p.year||'—')}</span><span class="pub-title">${safeText(title)}${originalLine}</span><span class="pub-journal">${safeText(p.journal||'')}</span><span class="badges"><b class="badge ${badgeClass(qtile)}">${safeText(qtile)}</b><b class="badge ${ifClass}" title="${safeText(p.impact_factor_source||'')}">${safeText(iff)}</b>${cite}</span><span class="pub-arrow">↗</span></a>`
  }).join('');
  installImageFallbacks(host);
}
function renderUpdates(){
  const host=$('#updateGrid');if(!host)return;
  const latest=[...pubs].sort((a,b)=>(b.year||0)-(a.year||0)).slice(0,3);
  if(!latest.length){host.innerHTML=`<article class="update-card no-visual"><div class="update-body"><span class="date">${safeText(t('news_kicker'))}</span><h3>${safeText(cleanDisplayTitle(t('pub_future')))}</h3></div></article>`;return}
  host.innerHTML=latest.map(p=>{
    const v=visualFor(p);const alt=v.isGA?t('graphical_abstract_alt'):t('publisher_visual_alt');const title=translatedTitle(p);
    const media=v.src?`<a class="update-visual ${v.isGA?'has-ga':'publisher-preview'}" href="${safeUrl(p.url||'#')}" target="_blank" rel="noopener"><img src="${v.src}" data-publication-visual alt="${safeText(alt)} — ${safeText(originalTitle(p)||'publication')}">${v.isGA?`<em>${safeText(t('graphical_abstract'))}</em>`:''}</a>`:'';
    return `<article class="update-card ${v.src?'has-visual':'no-visual'} reveal visible">${media}<div class="update-body"><span class="date">${safeText(p.year||'')} · ${safeText(t('pub_new'))}</span><h3>${safeText(title)}</h3><p>${safeText(p.journal||'')}${p.details?` · ${safeText(p.details)}`:''}</p><a class="update-link" href="${safeUrl(p.url||'#')}" target="_blank" rel="noopener">${safeText(t('pub_read'))}</a></div></article>`
  }).join('');
  installImageFallbacks(host);
}
function updatePublicationMeta(){
  const m=data.metrics||{};Object.entries(m).forEach(([k,v])=>{const el=document.querySelector(`[data-metric="${k}"]`);if(el&&v!==undefined&&v!==null)el.textContent=Number(v).toLocaleString(locale())});
  const last=$('#lastUpdated');if(last)last.textContent=fmtDate(data.last_updated);
  updateSearchStatus();
}
function initPublicationData(){updatePublicationMeta();renderPublications(filteredPublications());renderUpdates()}
const search=$('#pubSearch');if(search)search.addEventListener('input',()=>renderPublications(filteredPublications()));

// Apply the visitor's saved/browser language, then render dynamic content in the same language.
initLanguageSwitcher();
setLanguage(preferredLanguage(),{persist:false,rerender:false});
initPublicationData();

// ------------------------- MOTION -------------------------
if(matchMedia('(pointer:fine)').matches){
  const center=$('.hero-center'),hero=$('#hero');
  if(center&&hero){
    hero.addEventListener('pointermove',e=>{
      const r=hero.getBoundingClientRect();const x=((e.clientX-r.left)/r.width-.5)*10;const y=((e.clientY-r.top)/r.height-.5)*8;
      center.style.setProperty('--hero-x',`${x}px`);center.style.setProperty('--hero-y',`${y}px`);
    });
    hero.addEventListener('pointerleave',()=>{center.style.setProperty('--hero-x','0px');center.style.setProperty('--hero-y','0px')});
  }
  $$('.story-art').forEach(card=>{
    const doodle=$('.story-doodle',card);if(!doodle)return;
    card.addEventListener('pointermove',e=>{
      const r=card.getBoundingClientRect();const x=((e.clientX-r.left)/r.width-.5)*18;const y=((e.clientY-r.top)/r.height-.5)*14;
      doodle.style.translate=`${x}px ${y}px`;
    });
    card.addEventListener('pointerleave',()=>{doodle.style.translate='0 0'});
  });
}
