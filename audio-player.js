'use strict';
const playIcon='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 3.5 16 10 6 16.5z"/></svg>';
const pauseIcon='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 4h3v12H5zm7 0h3v12h-3z"/></svg>';
const status=document.getElementById('status');
let activePlayer=null;
function time(value){return Number.isFinite(value)?Math.floor(value/60)+':'+String(Math.floor(value%60)).padStart(2,'0'):'0:00'}
function signalPath(data){
 const top=[],bottom=[],count=data.peaks.length,gain=32/data.scale;
 data.peaks.forEach(([hi,lo],i)=>{const x=(i/(count-1)*1600).toFixed(2);top.push(x+','+(35-hi*gain).toFixed(2));bottom.push(x+','+(35-lo*gain).toFixed(2))});
 return 'M'+top.join(' L')+' L'+bottom.reverse().join(' L')+' Z';
}
const waveObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){waveObserver.unobserve(entry.target);entry.target.loadWave()}},{rootMargin:'0px'});
function createPlayer(track,index){
 const id='track-'+index,host=document.createElement('article');host.className='player';
 // Entrance starts with the catalog, independently of audio and peak requests.
 if(index<5&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
  host.classList.add('player-entering');host.style.setProperty('--entry-delay',index*110+'ms');
  host.addEventListener('animationend',event=>{if(event.target===host&&event.animationName==='player-enter')host.classList.remove('player-entering')});
 }
 host.innerHTML='<button class="play" aria-label="Воспроизвести">'+playIcon+'</button><h2 class="track-title"></h2><div class="time"><span class="current">0:00</span> / <span class="duration"></span></div><div class="wave"><svg viewBox="0 0 1600 70" preserveAspectRatio="none" aria-hidden="true"><defs><clipPath id="'+id+'"><rect width="0" height="70"/></clipPath></defs><path class="base"/><path class="played" clip-path="url(#'+id+')"/><line class="cursor" x1="0" x2="0" y1="0" y2="70"/></svg><input type="range" min="0" max="1000" value="0" step="1" aria-label="Позиция воспроизведения"></div><p class="track-status" role="status"></p>';
 host.querySelector('h2').textContent=track.title;host.querySelector('.duration').textContent=time(track.duration);
 // No src until a user presses Play. preload alone is not the lazy-loading guard.
 const audio=document.createElement('audio');audio.preload='none';audio.hidden=true;host.append(audio);
 const button=host.querySelector('.play'),range=host.querySelector('input'),clip=host.querySelector('rect'),cursor=host.querySelector('.cursor'),current=host.querySelector('.current'),trackStatus=host.querySelector('.track-status');
 let frame=0,pendingTime=null,wantsPlay=false,waveLoaded=false;
 function setStatus(message,loading=false){trackStatus.classList.toggle('is-loading',loading);button.setAttribute('aria-busy',String(loading));trackStatus.textContent=message}
 function duration(){return Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:track.duration}
 function position(){return pendingTime===null?audio.currentTime:pendingTime}
 function paint(){
  cancelAnimationFrame(frame);const d=duration(),t=position(),progress=Math.max(0,Math.min(1,t/d||0));clip.setAttribute('width',progress*1600);cursor.setAttribute('x1',progress*1600);cursor.setAttribute('x2',progress*1600);range.value=progress*1000;current.textContent=time(t);range.setAttribute('aria-valuetext',time(t)+' из '+time(d));
  if(!audio.paused)frame=requestAnimationFrame(paint);
 }
 function showButton(playing){host.classList.toggle('is-playing',playing);button.innerHTML=playing?pauseIcon:playIcon;button.setAttribute('aria-label',playing?'Пауза':'Воспроизвести')}
 const controller={pause(){wantsPlay=false;audio.pause();showButton(false);setStatus('');paint()}};
 button.addEventListener('click',async()=>{
  if(wantsPlay){controller.pause();return}
  activePlayer?.pause();activePlayer=controller;wantsPlay=true;showButton(true);setStatus('Загрузка аудио…',true);
  try{
   if(!audio.hasAttribute('src'))audio.src=track.url;
   else if(audio.error)audio.load();
   await audio.play();
   if(!wantsPlay)audio.pause();
  }catch(error){if(error.name!=='AbortError'&&wantsPlay){wantsPlay=false;showButton(false);setStatus('Не удалось воспроизвести трек. Нажмите Play, чтобы повторить.')}}
 });
 audio.addEventListener('loadedmetadata',()=>{host.querySelector('.duration').textContent=time(duration());if(pendingTime!==null){audio.currentTime=Math.min(pendingTime,Math.max(0,duration()-.01));pendingTime=null}paint()});
 audio.addEventListener('play',()=>{if(!wantsPlay){audio.pause();return}showButton(true);paint()});
 audio.addEventListener('playing',()=>{setStatus('');paint()});
 audio.addEventListener('waiting',()=>{if(wantsPlay)setStatus('Загрузка аудио…',true)});
 audio.addEventListener('pause',()=>{showButton(false);paint()});
 audio.addEventListener('ended',()=>{wantsPlay=false;showButton(false);setStatus('');paint()});
 audio.addEventListener('timeupdate',()=>{if(audio.paused)paint()});audio.addEventListener('seeked',paint);
 audio.addEventListener('error',()=>{if(audio.hasAttribute('src')){wantsPlay=false;showButton(false);setStatus('Не удалось загрузить аудио. Нажмите Play, чтобы повторить.')}});
 range.addEventListener('input',()=>{const t=Number(range.value)/1000*duration();if(audio.readyState>0){pendingTime=null;audio.currentTime=Math.min(t,Math.max(0,duration()-.01))}else pendingTime=t;paint()});
 host.loadWave=async()=>{
  if(waveLoaded)return;waveLoaded=true;
  try{const response=await fetch(track.peaks);if(!response.ok)throw Error('peaks');const data=await response.json();if(!data.peaks?.length||!data.scale)throw Error('peaks');const path=signalPath(data);host.querySelectorAll('path.base,path.played').forEach(p=>p.setAttribute('d',path));host.dataset.waveformReady='true';host.dataset.waveformReadyMs=Math.round(performance.now());paint()}
  catch(error){waveLoaded=false;setStatus('Не удалось загрузить волну. Аудио можно слушать.')}
 };
 waveObserver.observe(host);return host;
}
async function init(){
 const parent=document.getElementById('players');let nextPage='music-tracks.json',loading=false,index=0;
 const sentinel=document.createElement('div');sentinel.setAttribute('aria-hidden','true');sentinel.style.height='1px';parent.after(sentinel);
 async function appendPage(){
  if(loading||!nextPage)return;loading=true;
  try{const response=await fetch(nextPage);if(!response.ok)throw Error('manifest');const page=await response.json();if(!Array.isArray(page.tracks))throw Error('manifest');const batch=document.createDocumentFragment();for(const track of page.tracks)batch.append(createPlayer(track,index++));parent.append(batch);nextPage=page.next;status.textContent='';if(!nextPage){sentinel.remove();batchObserver.disconnect()}}
  catch(error){status.textContent='Не удалось загрузить список работ. Обновите страницу.'}
  finally{loading=false}
 }
 const batchObserver=new IntersectionObserver(entries=>{if(window.scrollY>0&&entries.some(e=>e.isIntersecting))appendPage()},{rootMargin:'0px'});
 function requestMore(){if(nextPage&&sentinel.getBoundingClientRect().top<window.innerHeight)appendPage()}
 window.addEventListener('scroll',requestMore,{passive:true});window.addEventListener('wheel',event=>{if(event.deltaY>0)requestMore()},{passive:true});window.addEventListener('touchmove',requestMore,{passive:true});window.addEventListener('keydown',event=>{if(['PageDown','ArrowDown','End',' '].includes(event.key)&&!event.target.matches('input,button'))requestMore()});
 await appendPage();if(nextPage)batchObserver.observe(sentinel);
}
init();
