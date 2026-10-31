'use strict';
// The site's 20 languages, matching the app. English is written in the page;
// every other language comes from lang/<code>.js (window.SITE_LANG), loaded
// before the page is drawn. Browser language stands in for the system language.
const SITE_LANGUAGES=[['en','English'],['fr','Français'],['de','Deutsch'],['es','Español'],['it','Italiano'],['pt-BR','Português (Brasil)'],['nl','Nederlands'],['pl','Polski'],['ru','Русский'],['uk','Українська'],['tr','Türkçe'],['ar','العربية'],['hi','हिन्दी'],['bn','বাংলা'],['zh-CN','中文（简体）'],['ja','日本語'],['ko','한국어'],['vi','Tiếng Việt'],['id','Bahasa Indonesia'],['th','ไทย']];
const siteCodes=SITE_LANGUAGES.map(l=>l[0]);
let siteLanguageChoice='auto';
try{siteLanguageChoice=localStorage.getItem('origami-site-language')||'auto';}catch{}
const browserLanguages=navigator.languages?.length?navigator.languages:[navigator.language||'en'];
const matchSiteLanguage=tag=>{const t=tag.toLowerCase();return siteCodes.find(c=>c.toLowerCase()===t)||(t.startsWith('pt')?'pt-BR':t.startsWith('zh')&&!/hant|tw|hk|mo/.test(t)?'zh-CN':siteCodes.find(c=>c===t.split('-')[0]));};
const detectedSiteLanguage=browserLanguages.map(matchSiteLanguage).find(Boolean)||'en';
window.SITE_LANGUAGE=siteCodes.includes(siteLanguageChoice)?siteLanguageChoice:detectedSiteLanguage;
document.documentElement.lang=SITE_LANGUAGE;
if(SITE_LANGUAGE==='ar')document.documentElement.dir='rtl';
window.SITE_LANG=null;
if(SITE_LANGUAGE!=='en')document.write('<script src="lang/'+SITE_LANGUAGE+'.js"><\/script>');
const fill=(t,v)=>t.replace(/\{(\w+)\}/g,(m,k)=>v[k]);
function translateSiteText(text){
 const L=window.SITE_LANG;if(!L)return text;
 const key=text.trim();let value=L.text[key]||L.text[text];
 if(!value&&/^Listen to /.test(key))value=key.replace(/^Listen to /,L.listen+' ');
 {let m=key.match(/^Pages (\d+)–(\d+) of (\d+)$/);if(!value&&m)value=fill(L.pagesOf,{a:m[1],b:m[2],t:m[3]});}
 {let m=key.match(/^Page (\d+) of (\d+)$/);if(!value&&m)value=fill(L.pageOf,{n:m[1],t:m[2]});}
 {let m=key.match(/^([^·]+) · (Reading|Paused) · Passage (\d+) of (\d+)$/);if(!value&&m)value=m[1]+' · '+(m[2]==='Reading'?L.reading:L.paused)+' · '+fill(L.passageOf,{n:m[3],t:m[4]});}
 if(!value&&/^[^·]+ · Ready to read$/.test(key))value=key.replace('Ready to read',L.ready);
 if(!value&&/^Narrated by /.test(key))value=key.replace(/^Narrated by /,L.narratedBy+' ');
 return value?text.replace(key,value.trim()):text;
}
document.addEventListener('DOMContentLoaded',()=>{
 const choice=document.querySelector('#site-language');
 for(const[code,name]of SITE_LANGUAGES)if(!choice.querySelector(`option[value="${code}"]`)){const o=document.createElement('option');o.value=code;o.textContent=name;o.lang=code;choice.append(o);}
 choice.value=siteCodes.includes(siteLanguageChoice)?siteLanguageChoice:'auto';
 choice.addEventListener('change',()=>{try{localStorage.setItem('origami-site-language',choice.value);}catch{}location.reload();});
 if(!window.SITE_LANG)return;
 document.title=window.SITE_LANG.title;
 const translate=root=>{
  if(root.nodeType===Node.TEXT_NODE){if(!root.parentElement?.closest('script,style,textarea,.passage,#creator-transcript,#audition-text,.voice-identity,.voice-topic')){const next=translateSiteText(root.nodeValue);if(next!==root.nodeValue)root.nodeValue=next;}return;}
  if(root.nodeType!==Node.ELEMENT_NODE)return;
  for(const attr of ['aria-label','title'])if(root.hasAttribute(attr)){const old=root.getAttribute(attr),next=translateSiteText(old);if(old!==next)root.setAttribute(attr,next);}
  for(const child of root.childNodes)translate(child);
 };
 translate(document.body);
 new MutationObserver(records=>{for(const r of records){if(r.type==='characterData')translate(r.target);else if(r.type==='attributes')translate(r.target);else for(const n of r.addedNodes)translate(n);}}).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-label','title']});
});
