// The single-video dialog, native controls and playback toggle reuse Sound Design's pattern.
// FLIP transforms add opening from each card and the matching reverse transition.
const works=JSON.parse(document.getElementById('video-works').textContent);
const dialog=document.querySelector('dialog'),viewer=document.querySelector('.viewer'),screen=document.querySelector('.screen'),video=document.querySelector('video'),toggle=document.querySelector('.center-toggle'),error=document.querySelector('.error');
const playIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 11 7-11 7z"/></svg>',pauseIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>';
let session=0,origin=null,opening=null,closing=false;
const duration=()=>matchMedia('(prefers-reduced-motion: reduce)').matches?0:220;
function sync(){screen.classList.toggle('paused',video.paused);toggle.setAttribute('aria-label',video.paused?'Воспроизвести видео':'Пауза');toggle.innerHTML=video.paused?playIcon:pauseIcon}
async function play(){const token=session;try{await video.play()}catch(e){if(token===session&&dialog.open&&!closing&&e.name!=='AbortError')error.textContent='Нажмите Play, чтобы начать воспроизведение.'}}
function cardTransform(rect,target){const zoom=target.width/screen.offsetWidth||1;return `translate(${(rect.left-target.left)/zoom}px,${(rect.top-target.top)/zoom}px) scale(${rect.width/target.width},${rect.height/target.height})`}
document.querySelectorAll('.open-work').forEach(button=>button.addEventListener('click',()=>{
 if(dialog.open||closing)return;
 const work=works[Number(button.dataset.work)];if(!work.src)return;
 origin=button;const from=button.querySelector('.cover').getBoundingClientRect();session++;
 document.getElementById('video-title').textContent=work.title;document.getElementById('video-role').textContent=work.role;error.textContent='';video.poster=work.poster;
 if(video.getAttribute('src')!==work.src){video.src=work.src}else{video.currentTime=0}
 sync();document.documentElement.classList.add('video-open');dialog.showModal();
 const target=screen.getBoundingClientRect();opening=screen.animate([{transform:cardTransform(from,target)},{transform:'none'}],{duration:duration(),easing:'ease'});
 play();
}));
async function closePlayer(){
 if(!dialog.open||closing)return;closing=true;session++;video.pause();
 if(opening)await opening.finished.catch(()=>{});
 dialog.classList.add('closing');
 const target=screen.getBoundingClientRect(),to=origin.querySelector('.cover').getBoundingClientRect();
 const animation=screen.animate([{transform:'none'},{transform:cardTransform(to,target)}],{duration:duration(),easing:'ease',fill:'forwards'});
 await animation.finished.catch(()=>{});dialog.close();animation.cancel();
}
toggle.addEventListener('click',()=>video.paused?play():video.pause());['play','pause','ended'].forEach(event=>video.addEventListener(event,sync));
video.addEventListener('error',()=>{if(dialog.open&&!closing)error.textContent='Не удалось загрузить видео. Попробуйте открыть его ещё раз.'});
document.querySelector('.close').addEventListener('click',closePlayer);dialog.addEventListener('cancel',event=>{event.preventDefault();closePlayer()});dialog.addEventListener('click',event=>{if(event.target===dialog)closePlayer()});
dialog.addEventListener('close',()=>{session++;video.pause();document.documentElement.classList.remove('video-open');dialog.classList.remove('closing');closing=false;error.textContent='';sync();origin?.focus({preventScroll:true})});
