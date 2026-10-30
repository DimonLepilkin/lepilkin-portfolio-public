const works=[
 {title:'Заставка в фильме',poster:'sound-work-1.png',src:'https://storage.yandexcloud.net/lepilkin-audio/Sound%20disign%20%D0%97%D0%B0%D1%81%D1%82%D0%B0%D0%B2%D0%BA%D0%B0%20%D0%BA%20%D1%84%D0%B8%D0%BB%D1%8C%D0%BC%D1%83.mp4'},
 {title:'Джингл к отбивки рекламы на тв',poster:'sound-work-2.png',src:'https://storage.yandexcloud.net/lepilkin-audio/%D1%81%D0%B0%D1%83%D0%BD%D0%B4%20%D0%B4%D0%B8%D0%B7%20%D0%9D%D0%90%D0%A8%D0%95%20%20%D0%B4%D0%BB%D1%8F%20%D0%BF%D0%BE%D1%80%D1%82%D1%84%D0%BE%D0%BB%D0%B8%D0%BE%20-14lufs.mp4'},
 {title:'Рекламный рилс крема',poster:'sound-work-3.png',portrait:true,src:'https://storage.yandexcloud.net/lepilkin-audio/Cream%20Al%20sound%20disign%2013.02.38.mp4'}
];
// Both modes share the same works, covers and gallery. The comparison UI is local-only.
const testing=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
const modeParams=new URLSearchParams(location.search);
const inlineMode=!(testing&&modeParams.get('mode')==='modal');
if(testing&&modeParams.has('compare')){
 const modes=document.createElement('nav');modes.className='mode-switch';modes.setAttribute('aria-label','Сравнить режимы воспроизведения');
 const label=document.createElement('span');label.textContent='Тест:';modes.append(label);
 for(const [mode,title] of [['modal','А · С раскрытием'],['inline','Б · В карточках']]){
  const link=document.createElement('a');link.href='?compare=1&mode='+mode;link.textContent=title;
  if((mode==='inline')===inlineMode)link.setAttribute('aria-current','true');modes.append(link);
 }
 document.body.append(modes);
}
if(!inlineMode){
const dialog=document.querySelector('dialog'),viewer=document.querySelector('.viewer'),screen=document.querySelector('.screen'),video=document.querySelector('video'),toggle=document.querySelector('.center-toggle'),error=document.querySelector('.error');
const playIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 11 7-11 7z"/></svg>',pauseIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>';
let session=0;
function sync(){screen.classList.toggle('paused',video.paused);toggle.setAttribute('aria-label',video.paused?'Воспроизвести видео':'Пауза');toggle.innerHTML=video.paused?playIcon:pauseIcon}
async function play(){const token=session;try{await video.play()}catch(e){if(token===session&&dialog.open&&e.name!=='AbortError')error.textContent='Нажмите Play, чтобы начать воспроизведение.'}}
document.querySelectorAll('.open-work').forEach(button=>button.addEventListener('click',()=>{const work=works[Number(button.dataset.work)];session++;viewer.classList.toggle('portrait',!!work.portrait);document.getElementById('video-title').textContent=work.title;video.poster=work.poster;video.src=work.src;error.textContent='';sync();dialog.showModal();play()}));
toggle.addEventListener('click',()=>video.paused?play():video.pause());['play','pause','ended'].forEach(event=>video.addEventListener(event,sync));
video.addEventListener('error',()=>{if(dialog.open)error.textContent='Не удалось загрузить видео. Попробуйте открыть его ещё раз.'});
document.querySelector('.close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
dialog.addEventListener('close',()=>{session++;video.pause();video.removeAttribute('src');video.load();error.textContent='';sync()});
} else {
 // In-place playback has no dialog and creates no audio/video requests before Play.
 const records=[];let generation=0;
 const playIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 11 7-11 7z"/></svg>';
 const pauseIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>';
 document.querySelectorAll('.open-work').forEach(button=>{
  const work=works[Number(button.dataset.work)],container=document.createElement('div');container.className='inline-work';
  container.append(...button.childNodes);button.replaceWith(container);
  const cover=container.querySelector('.cover');cover.replaceChildren();
  const video=document.createElement('video');video.preload='none';video.playsInline=true;video.poster=work.poster;video.setAttribute('aria-label',work.title);video.setAttribute('aria-hidden','true');
  const toggle=document.createElement('button');toggle.type='button';toggle.className='inline-toggle';
  const error=document.createElement('p');error.className='inline-error';error.setAttribute('role','status');container.append(error);
  cover.append(video,toggle);
  const record={video,toggle,pending:0};records.push(record);
  function sync(){cover.classList.toggle('is-playing',!video.paused);toggle.innerHTML=video.paused?playIcon:pauseIcon;toggle.setAttribute('aria-label',(video.paused?'Воспроизвести: ':'Пауза: ')+work.title)}
  toggle.addEventListener('click',async()=>{
   if(!video.paused){video.pause();return}
   const token=++generation;record.pending=token;
   records.forEach(other=>{if(other!==record)other.video.pause()});error.textContent='';
   if(!video.getAttribute('src')){video.removeAttribute('aria-hidden');video.src=work.src;video.controls=true}
   try{await video.play();if(token!==generation)video.pause()}
   catch(e){if(token===generation&&e.name!=='AbortError')error.textContent='Не удалось начать воспроизведение. Нажмите Play ещё раз.'}
   finally{if(record.pending===token)record.pending=0;sync()}
  });
  video.addEventListener('play',()=>{
   if(record.pending&&record.pending!==generation){video.pause();return}
   if(!record.pending)generation++;
   records.forEach(other=>{if(other!==record)other.video.pause()});sync();
  });
  ['pause','ended'].forEach(event=>video.addEventListener(event,sync));
  function describeVolume(){video.setAttribute('aria-description','Громкость: '+Math.round(video.volume*100)+'%'+(video.muted?' · Звук выключен':''))}
  video.addEventListener('volumechange',describeVolume);describeVolume();
  video.addEventListener('error',()=>{error.textContent='Не удалось загрузить видео. Попробуйте ещё раз.'});sync();
 });
}
