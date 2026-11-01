'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)'), narrow=matchMedia('(max-width:560px)');
let motion=true,themeId='plum',paper='dark',selectedBookmark='cat',mode='read';
let bookmarkSerial=0;const globeControllers=new Map(), visible=new WeakMap();
const bookmarkInfo=[{id:'cat',name:'Sleeping cat',description:'A slow breath. A lazy tail. A tiny ear twitch.'},{id:'crane',name:'Blossom crane',description:'Folded paper, falling petals, and a touch of gold.'},{id:'earth',name:'Library Earth',description:'A wooden world, turning quietly in its brass frame.'},{id:'raven',name:'Moonlit raven',description:'Violet, emerald, and blue shift across the feather.'}];
function remember(){try{localStorage.setItem('origami-website-appearance',JSON.stringify({themeId,paper,motion}));}catch{}}
try{const p=JSON.parse(localStorage.getItem('origami-website-appearance')||'null');if(p){themeId=p.themeId||themeId;paper=p.paper||paper;motion=p.motion!==false;}}catch{}
function applyTheme(id){const t=ORIGAMI_THEMES.find(v=>v.id===id)||ORIGAMI_THEMES[0];themeId=t.id;for(const k of ['bg','panel','ink','muted','accent','contrast','line'])document.documentElement.style.setProperty('--'+k,t[k]);const hex=t.bg.slice(1),h=hex.length===3?[...hex].map(x=>x+x).join(''):hex;const bright=[0,2,4].map((n,i)=>parseInt(h.slice(n,n+2),16)*[.2126,.7152,.0722][i]).reduce((a,b)=>a+b);document.body.classList.toggle('light-theme',bright>=140);document.documentElement.style.colorScheme=bright>=140?'light':'dark';$('#current-theme').textContent=t.name;$$('.theme-choice').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.theme===id)));remember();}
for(const t of ORIGAMI_THEMES){const b=document.createElement('button');b.className='theme-choice';b.dataset.theme=t.id;b.innerHTML=`<i style="--swatch-bg:${t.bg};--swatch-accent:${t.accent}" aria-hidden="true"></i><span>${t.name}</span>`;b.onclick=()=>applyTheme(t.id);$('#theme-grid').append(b);}
const paperLabels={dark:'Dark',paper:'Paper',light:'White',parchment:'Parchment',grid:'Grid',blueprint:'Blueprint'};
function applyPaper(value){paper=Object.hasOwn(paperLabels,value)?value:'dark';$('#spread').dataset.paper=paper;$('#paper-select').value=paper;$$('[data-paper-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.paperChoice===paper)));remember();}
for(const [value,label]of Object.entries(paperLabels)){const b=document.createElement('button');b.textContent=label;b.dataset.paperChoice=value;b.onclick=()=>applyPaper(value);$('#paper-options').append(b);}
$('#paper-select').onchange=e=>applyPaper(e.target.value);
$('.appearance-dialog').addEventListener('click',e=>{if(e.target===$('.appearance-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$$('.appearance-open').forEach(b=>b.onclick=()=>$('#appearance-dialog').showModal());
$$('[data-close-dialog]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
$('#reset-appearance').onclick=()=>{applyTheme('plum');applyPaper('dark');motion=true;syncMotion();remember();};
applyTheme(themeId);applyPaper(paper);
for(let i=0;i<17;i++){const p=document.createElement('i');p.className='petal';p.style.cssText=`--x:${(i*37+11)%100}%;--size:${7+i%4*3}px;--duration:${24+i%7*4}s;--delay:-${i*4}s;--opacity:${.15+i%4*.07};--blur:${i%3===0?1:0}px`;$('.petals').append(p);}
const observer=new IntersectionObserver(entries=>{for(const entry of entries)visible.set(entry.target,entry.isIntersecting);syncMotion();},{rootMargin:'70px'});
function syncMotion(){const paused=!motion||reduced.matches;document.body.classList.toggle('paused',paused);$('#motion').textContent=reduced.matches?'Reduced motion':motion?'Pause motion':'Resume motion';$('#motion').setAttribute('aria-pressed',String(paused));$('#motion').disabled=reduced.matches;$('#motion-setting').checked=motion&&!reduced.matches;$('#motion-setting').disabled=reduced.matches;
 $$('[data-animated]').forEach(el=>{const stop=paused||document.hidden||visible.get(el)===false;el.dataset.animated=String(!reduced.matches);el.dataset.paused=String(stop);el.querySelectorAll('svg').forEach(svg=>{if(svg.pauseAnimations)stop?svg.pauseAnimations():svg.unpauseAnimations();});});
 for(const [canvas,controller]of globeControllers)controller.setRunning(!paused&&!document.hidden&&visible.get(canvas.closest('[data-animated]'))!==false);
}
$('#motion').onclick=()=>{motion=!motion;syncMotion();remember();};$('#motion-setting').onchange=e=>{motion=e.target.checked;syncMotion();remember();};reduced.addEventListener('change',syncMotion);document.addEventListener('visibilitychange',()=>{syncMotion();if(document.hidden){readerAudio.pause();voiceAudio.pause();}});
function disposeMount(mount){for(const el of mount.querySelectorAll('[data-animated]'))observer.unobserve(el);for(const canvas of mount.querySelectorAll('canvas')){globeControllers.get(canvas)?.destroy();globeControllers.delete(canvas);}}
function mountBookmark(mount,id){disposeMount(mount);const prefix='site-bookmark-'+(++bookmarkSerial)+'-';let markup=BOOKMARK_ART[id];const ids=[...markup.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);for(const old of ids)markup=markup.replaceAll(old,prefix+old);mount.innerHTML=markup;const button=mount.querySelector('button');button.removeAttribute('data-bookmark-id');button.title=bookmarkInfo.find(b=>b.id===id).name;button.onclick=()=>selectBookmark(id);mount.querySelectorAll('[data-animated]').forEach(el=>observer.observe(el));const canvas=mount.querySelector('canvas');if(canvas){delete canvas.dataset.ready;OrigamiGlobe.createGlobeRenderer(canvas,'earth',GLOBE_TEXTURES.earth,48,GLOBE_TEXTURES.wood).then(c=>{if(!canvas.isConnected){c.destroy();return;}globeControllers.set(canvas,c);syncMotion();}).catch(()=>{canvas.hidden=true;});}syncMotion();}
function selectBookmark(id){selectedBookmark=id;mountBookmark($('#reader-bookmark'),id);$$('.bookmark-card').forEach(card=>{const selected=card.dataset.bookmark===id;card.classList.toggle('chosen',selected);const b=card.querySelector('[data-choose]');b.textContent=selected?'✓ Beside your book':'Try this bookmark';b.setAttribute('aria-pressed',String(selected));});}
for(const info of bookmarkInfo){const card=document.createElement('article');card.className='bookmark-card';card.dataset.bookmark=info.id;card.innerHTML=`<div class="artifact-space"></div><h3>${info.name}</h3><p>${info.description}</p><button class="button" data-choose>Try this bookmark</button>`;$('#bookmark-gallery').append(card);mountBookmark(card.querySelector('.artifact-space'),info.id);card.querySelector('[data-choose]').onclick=()=>{selectBookmark(info.id);$('#reader').scrollIntoView({behavior:reduced.matches?'instant':'smooth'});};}
mountBookmark($('#hero-bookmark'),'cat');selectBookmark('cat');
// Same proximity falloff and stationary anchor used by the app's useCoverTilt.
let point=null,tiltFrame=0;
function clearTilt(){point=null;cancelAnimationFrame(tiltFrame);tiltFrame=0;$$('.tilt-object').forEach(el=>{for(const k of ['pointer-x','pointer-y','sheen-x','sheen-y','sheen'])el.style.removeProperty('--'+k);});}
window.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||e.buttons||!motion||reduced.matches||$('dialog[open]')){clearTilt();return;}point={x:e.clientX,y:e.clientY};if(tiltFrame)return;tiltFrame=requestAnimationFrame(()=>{tiltFrame=0;if(!point)return;$$('.tilt-anchor').forEach(anchor=>{const r=anchor.getBoundingClientRect(),el=anchor.querySelector('.tilt-object');const distance=Math.hypot(Math.max(r.left-point.x,0,point.x-r.right),Math.max(r.top-point.y,0,point.y-r.bottom));const strength=Math.max(0,1-distance/72)**2;const sx=Math.max(0,Math.min(1,(point.x-r.left)/r.width)),sy=Math.max(0,Math.min(1,(point.y-r.top)/r.height));el.style.setProperty('--pointer-x',(sx*2-1)*strength);el.style.setProperty('--pointer-y',(sy*2-1)*strength);el.style.setProperty('--sheen',strength);el.style.setProperty('--sheen-x',sx*100+'%');el.style.setProperty('--sheen-y',sy*100+'%');});});},{passive:true});document.documentElement.addEventListener('pointerleave',clearTilt);window.addEventListener('blur',clearTilt);window.addEventListener('scroll',clearTilt,{passive:true});
const readerAudio=$('#reader-audio'),voiceAudio=$('#voice-audio');let segment=0,pageIndex=0,readerEnded=false,auditionIndex=-1;
function setMode(next){mode=next;$$('[data-mode]').forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.mode===mode));b.tabIndex=b.dataset.mode===mode?0:-1;});for(const id of ['read','work','studio'])$('#'+id+'-panel').hidden=id!==mode;if(mode!=='read')readerAudio.pause();}
$$('[data-mode]').forEach((b,i,all)=>{b.onclick=()=>setMode(b.dataset.mode);b.onkeydown=e=>{let n;if(e.key==='ArrowRight')n=(i+1)%all.length;else if(e.key==='ArrowLeft')n=(i+all.length-1)%all.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=all.length-1;else return;e.preventDefault();setMode(all[n].dataset.mode);all[n].focus();};});
function pageForSegment(index){return READER_DATA.pages.findIndex(p=>p.includes(index));}
function renderPages(animate=false){const start=narrow.matches?pageIndex:Math.floor(pageIndex/2)*2;const count=narrow.matches?1:2;const spread=$('#spread');spread.innerHTML='';for(let page=start;page<Math.min(4,start+count);page++){const leaf=document.createElement('article');leaf.className='reading-page';leaf.setAttribute('aria-label','Page '+(page+1));const head=document.createElement('div');head.className='running-head';head.innerHTML=`<span>${page%2?'Jonathan Harker’s Journal':'Dracula'}</span><span>II</span>`;leaf.append(head);for(const index of READER_DATA.pages[page]){const p=document.createElement('p');p.className='passage';p.dataset.segment=index;p.textContent=READER_DATA.segments[index].text;p.tabIndex=0;p.setAttribute('role','button');p.setAttribute('aria-label','Read passage: '+READER_DATA.segments[index].text);p.onclick=()=>playSegment(index);p.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();playSegment(index);}};leaf.append(p);}const number=document.createElement('span');number.className='page-num';number.textContent=page+1;leaf.append(number);spread.append(leaf);}
 $('#page-counter').textContent=narrow.matches?`Page ${start+1} of 4`:`Pages ${start+1}–${start+2} of 4`;$('#previous-page').disabled=start===0;$('#next-page').disabled=start+count>=4;spread.classList.remove('turning');if(animate&&!reduced.matches&&motion){void spread.offsetWidth;spread.classList.add('turning');}highlight();}
function highlight(){$$('.passage').forEach(p=>{const active=Number(p.dataset.segment)===segment;p.classList.toggle('active',active);if(active)p.setAttribute('aria-current','true');else p.removeAttribute('aria-current');});}
function setReaderSource(){readerAudio.src=READER_DATA.segments[segment].audio;readerAudio.playbackRate=Number($('#read-speed').value);readerEnded=false;$('#read-seek').value=0;updateReadButton();}
async function playSegment(index){voiceAudio.pause();$('#creator-audio').pause();segment=index;const newPage=pageForSegment(index);const changed=(narrow.matches?pageIndex:Math.floor(pageIndex/2))!==(narrow.matches?newPage:Math.floor(newPage/2));pageIndex=newPage;setMode('read');if(changed)renderPages(true);else highlight();setReaderSource();try{await readerAudio.play();}catch{ $('#play-status').textContent='Playback unavailable. Press play to retry.';}}
function changePage(direction){readerAudio.pause();pageIndex=narrow.matches?Math.max(0,Math.min(3,pageIndex+direction)):Math.max(0,Math.min(2,Math.floor(pageIndex/2)*2+direction*2));segment=READER_DATA.pages[pageIndex][0];setReaderSource();renderPages(true);}
$('#previous-page').onclick=()=>changePage(-1);$('#next-page').onclick=()=>changePage(1);$('#chapter-start').onclick=()=>{readerAudio.pause();pageIndex=0;segment=0;setReaderSource();renderPages(true);};
$('#read-play').onclick=async()=>{setMode('read');if(!readerAudio.paused){readerAudio.pause();return;}if(readerEnded){segment=0;pageIndex=0;setReaderSource();renderPages(true);}voiceAudio.pause();$('#creator-audio').pause();try{await readerAudio.play();}catch{$('#play-status').textContent='Unable to play this sample.';}};
readerAudio.onended=()=>{if(segment+1<READER_DATA.segments.length)playSegment(segment+1);else{readerEnded=true;$('#play-status').textContent='End of excerpt · Play again';updateReadButton();}};
function updateReadButton(){const playing=!readerAudio.paused;$('#read-play').textContent=playing?'Ⅱ':'▶';$('#read-play').setAttribute('aria-label',playing?'Pause Dracula':'Play Dracula');if(!readerEnded)$('#play-status').textContent=`${READER_DATA.voice} · ${playing?'Reading':'Paused'} · Passage ${segment+1} of 9`;}
readerAudio.onplay=updateReadButton;readerAudio.onpause=updateReadButton;readerAudio.onerror=()=>{$('#play-status').textContent='This recording could not be loaded.';};
const time=n=>Number.isFinite(n)?Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0'):'0:00';
function updateTime(){$('#read-time').textContent=time(readerAudio.currentTime)+' / '+time(readerAudio.duration);$('#read-seek').value=Number.isFinite(readerAudio.duration)?readerAudio.currentTime/readerAudio.duration*100:0;}
readerAudio.ontimeupdate=updateTime;readerAudio.onloadedmetadata=updateTime;$('#read-seek').oninput=e=>{if(Number.isFinite(readerAudio.duration))readerAudio.currentTime=Number(e.target.value)/100*readerAudio.duration;};$('#read-speed').onchange=e=>readerAudio.playbackRate=Number(e.target.value);
narrow.addEventListener('change',()=>renderPages());setReaderSource();renderPages();
function openReader(play=false){setMode('read');$('#reader').scrollIntoView({behavior:reduced.matches?'instant':'smooth'});if(play)playSegment(segment);}
$('.book-scene').onclick=()=>openReader(false);$('#hero-listen').onclick=()=>openReader(true);$('#show-source').onclick=()=>setMode('read');$('#demo-note').oninput=()=>$('#note-status').textContent='Edited in this preview. No account or upload.';
for(let i=0;i<65;i++){const bar=document.createElement('i');bar.style.cssText=`--h:${5+(i*19)%24}px;--d:-${i*.07}s`;$('.studio-wave').append(bar);}
for(const [i,v]of VOICE_DATA.entries()){const card=document.createElement('button');card.className='voice-card';card.dataset.voice=i;card.dataset.language=v.language||"en";card.setAttribute('aria-label','Listen to '+v.name);card.setAttribute('aria-pressed','false');const top=document.createElement('div');top.className='voice-top';top.innerHTML=`<img class="voice-portrait" src="${v.portrait}" alt="" loading="lazy" width="88" height="88"><div class="voice-identity"><strong>${v.name}</strong><small>${v.accent||'English'}</small></div><span class="voice-play" aria-hidden="true">▶</span>`;card.append(top);const desc=document.createElement('p');desc.textContent=(v.description||'Included narrator').split(' · ')[0].replace(/^./,c=>c.toUpperCase());card.append(desc);const topic=document.createElement('span');topic.className='voice-topic';topic.textContent=v.topic;card.append(topic);card.onclick=()=>audition(i);$('#voice-grid').append(card);for(const select of [$('#narrator-cast'),$('#dracula-cast')]){const option=document.createElement('option');option.value=i;option.textContent=v.name;select.append(option);}}
$('#narrator-cast').value=VOICE_DATA.findIndex(v=>v.name==='Alistair');$('#dracula-cast').value=VOICE_DATA.findIndex(v=>v.name==='Dorian');
async function audition(index){readerAudio.pause();$('#creator-audio').pause();if(index===auditionIndex&&!voiceAudio.paused){voiceAudio.pause();return;}const v=VOICE_DATA[index];if(index!==auditionIndex){auditionIndex=index;voiceAudio.src=v.audio;}$('#audition-bar').hidden=false;$('#audition-name').textContent=v.name+' · '+v.topic;$('#audition-text').textContent=v.text;voiceAudio.playbackRate=Number($('#voice-speed').value);try{await voiceAudio.play();}catch{$('#audition-name').textContent=v.name+' · Unable to play this sample';}}
function updateAudition(){const playing=!voiceAudio.paused;document.body.classList.toggle('audition-playing',playing);$$('.voice-card').forEach(c=>{const active=Number(c.dataset.voice)===auditionIndex&&playing;c.setAttribute('aria-pressed',String(active));c.querySelector('.voice-play').textContent=active?'Ⅱ':'▶';});$$('[data-audition]').forEach(b=>b.textContent=playing&&Number($('#'+b.dataset.audition).value)===auditionIndex?'Ⅱ Pause':'▶ Audition');$('#audition-toggle').textContent=playing?'Ⅱ':'▶';$('#audition-toggle').setAttribute('aria-label',playing?'Pause voice sample':'Play voice sample');}
voiceAudio.onplay=updateAudition;voiceAudio.onpause=updateAudition;voiceAudio.onended=updateAudition;voiceAudio.onerror=()=>{$('#audition-name').textContent='This voice sample could not be loaded.';};$('#audition-toggle').onclick=()=>{if(auditionIndex>=0)audition(auditionIndex);};$('#audition-close').onclick=()=>{voiceAudio.pause();$('#audition-bar').hidden=true;};$$('[data-audition]').forEach(b=>b.onclick=()=>audition(Number($('#'+b.dataset.audition).value)));
$$('[data-download]').forEach(b=>b.onclick=()=>{$('#dialog-copy').textContent='This is a local website mockup. The Windows download will be connected to the release before publication. Linux and macOS will be available in a later release.';$('#preview-dialog').showModal();});$$('[data-support]').forEach(b=>b.onclick=()=>{$('#dialog-copy').textContent='The live website will link to Sov3ryn’s Ko-fi. Donate what you want. Every Origami feature stays free.';$('#preview-dialog').showModal();});
syncMotion();

for(const select of [$('#narrator-cast'),$('#dracula-cast')])select.onchange=updateAudition;

readerAudio.preservesPitch=true;voiceAudio.preservesPitch=true;
$('#voice-speed').onchange=e=>voiceAudio.playbackRate=Number(e.target.value);

// These pre-generated examples demonstrate the desktop voice-design workflow.
const creatorAudio=$('#creator-audio');let creatorIndex=0;
creatorAudio.preservesPitch=true;creatorAudio.playbackRate=1;
function chooseCreatorExample(index){creatorAudio.pause();creatorIndex=index;const example=CREATOR_EXAMPLES[index];creatorAudio.src=example.audio;creatorAudio.playbackRate=1;$('#creator-prompt').value=example.prompt;$('#creator-name').textContent=example.name;$('#creator-portrait').src=example.portrait;$('#creator-transcript').textContent=example.text;$('#creator-status').textContent='Ready to listen · 1.0×';$$('[data-creator-example]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.creatorExample)===index)));}
CREATOR_EXAMPLES.forEach((example,index)=>{const b=document.createElement('button');b.textContent=example.label;b.dataset.creatorExample=index;b.onclick=()=>chooseCreatorExample(index);$('#creator-examples').append(b);});
for(let i=0;i<75;i++){const bar=document.createElement('i');bar.style.cssText=`--h:${5+(i*17)%22}px;--d:-${i*.06}s`;$('.creator-wave').append(bar);}
$('#creator-play').onclick=async()=>{if(!creatorAudio.paused){creatorAudio.pause();return;}if(creatorAudio.ended)creatorAudio.currentTime=0;readerAudio.pause();voiceAudio.pause();try{await creatorAudio.play();}catch{$('#creator-status').textContent='Unable to play this example.';}};
function syncCreatorAudio(){const playing=!creatorAudio.paused;document.body.classList.toggle('creator-playing',playing);$('#creator-play').textContent=playing?'Ⅱ':'▶';$('#creator-play').setAttribute('aria-label',playing?'Pause generated voice example':'Play generated voice example');$('#creator-status').textContent=playing?'Playing generated result · 1.0×':'Ready to listen · 1.0×';}
creatorAudio.onplay=syncCreatorAudio;creatorAudio.onpause=syncCreatorAudio;creatorAudio.onended=syncCreatorAudio;creatorAudio.onerror=()=>$('#creator-status').textContent='Unable to load this example.';
const previewAudioPlayers=[readerAudio,voiceAudio,creatorAudio];
previewAudioPlayers.forEach(player=>player.addEventListener('play',()=>previewAudioPlayers.forEach(other=>{if(other!==player)other.pause();})));
document.addEventListener('visibilitychange',()=>{if(document.hidden)creatorAudio.pause();});
chooseCreatorExample(0);

let voiceLanguage=SITE_LANGUAGE;
function filterVoiceLanguage(language){
 voiceLanguage=language;
 voiceAudio.pause();auditionIndex=-1;$('#audition-bar').hidden=true;
 $$('.voice-card').forEach(card=>card.hidden=card.dataset.language!==language);
 $$('[data-voice-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.voiceLanguage===language)));
}
$$('[data-voice-language]').forEach(button=>button.onclick=()=>filterVoiceLanguage(button.dataset.voiceLanguage));
filterVoiceLanguage(voiceLanguage);

const readerDemoPlay=$('#reader-demo-play');
function syncReaderInvitation(){
 const playing=!readerAudio.paused;
 readerDemoPlay.querySelector('.demo-play-symbol').textContent=playing?'Ⅱ':'▶';
 $('#reader-demo-label').textContent=playing?'Pause narration':readerAudio.currentTime>0&&!readerEnded?'Continue listening':'Listen to Dracula';
}
readerDemoPlay.onclick=()=>$('#read-play').click();
for(const event of ['play','pause','ended','loadedmetadata'])readerAudio.addEventListener(event,syncReaderInvitation);
$('#try-reader').onclick=event=>{
 event.preventDefault();openReader(false);
 readerDemoPlay.focus({preventScroll:true});
 const frame=$('#reader .app-window');frame.classList.remove('demo-invited');
 if(motion&&!reduced.matches){void frame.offsetWidth;frame.classList.add('demo-invited');}
 history.replaceState(null,'','#reader');
};
syncReaderInvitation();

// Visit counter: counts once per browser session; local previews only read it.
(()=>{const el=document.querySelector('.visit-counter');if(!el)return;
 const local=!/origamireader\.com$/.test(location.hostname);let seen=local;
 try{seen=seen||sessionStorage.getItem('origami-visit-counted')==='1';}catch{}
 fetch('https://abacus.jasoncameron.dev/'+(seen?'get':'hit')+'/origamireader-com/visits').then(r=>r.ok?r.json():Promise.reject()).then(d=>{
  if(typeof d.value!=='number')return;
  if(!local)try{sessionStorage.setItem('origami-visit-counted','1');}catch{}
  el.querySelector('b').textContent=d.value.toLocaleString(document.documentElement.lang||undefined);el.hidden=false;
 }).catch(()=>{});
})();

// The video loads from YouTube only when played, so the page makes no YouTube requests before then.
$('#video-play')?.addEventListener('click',()=>{
 const f=document.createElement('iframe');
 f.src='https://www.youtube-nocookie.com/embed/p1ohquY8BEk?autoplay=1&rel=0';
 f.title='I Built a Free Reader. Then I Gave Dracula a Voice!';
 f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
 f.allowFullscreen=true;f.referrerPolicy='strict-origin-when-cross-origin';
 $$('audio').forEach(a=>a.pause());
 $('#video-frame').replaceChildren(f);f.focus();
});

// Links into the page (ad sitelinks included) scroll again once the page is built, since the galleries push sections down.
// #notes and #studio also open that preview tab in the reader.
const hashTabs={'#notes':'work','#studio':'studio'};
function openHash(){const tab=hashTabs[location.hash];if(tab)setMode(tab);const el=tab?$('#reader'):location.hash.length>1&&document.getElementById(decodeURIComponent(location.hash.slice(1)));if(el)el.scrollIntoView({behavior:'instant'});}
addEventListener('hashchange',()=>{if(hashTabs[location.hash])openHash();});
openHash();{const y=scrollY;addEventListener('load',()=>{if(Math.abs(scrollY-y)<2)openHash();},{once:true});}
