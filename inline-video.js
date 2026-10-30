/* Native inline playback shared by mobile galleries and Sound Design. */
window.createInlineVideoGallery = function (buttons, works) {
 const records=[];let generation=0;
 const playIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 11 7-11 7z"/></svg>';
 const pauseIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>';
 buttons.forEach(button=>{
  const work=works[Number(button.dataset.work)];if(!work?.src)return;
  const container=document.createElement('div');container.className='inline-work';
  const cover=document.createElement('div');cover.className='cover';container.append(cover);
  container.append(...[...button.children].filter(e=>!e.classList.contains('cover')).map(e=>e.cloneNode(true))); 
  const video=document.createElement('video');video.preload='none';video.setAttribute('aria-hidden','true');video.playsInline=true;
  video.setAttribute('playsinline','');video.poster=work.poster;video.setAttribute('aria-label',work.title);
  const poster=document.createElement('img');poster.className='inline-poster';poster.src=work.poster;poster.alt='';
  const surface=document.createElement('button');surface.type='button';surface.className='inline-surface';
  const toggle=document.createElement('button');toggle.type='button';toggle.className='inline-toggle';
  const error=document.createElement('p');error.className='inline-error';error.setAttribute('role','status');container.append(error);
  cover.append(video,poster,surface,toggle);button.replaceWith(container);
  const record={video,toggle,pending:0,overlayTimer:0,chromeVisible:true,fullscreen:false,button,container};records.push(record);
  function sync(){
   const playing=!video.paused&&!video.ended;
   cover.classList.toggle('is-playing',playing);
   toggle.innerHTML=playing?pauseIcon:playIcon;
   const label=(playing?'Пауза: ':'Воспроизвести: ')+work.title;
   toggle.setAttribute('aria-label',label);
   surface.setAttribute('aria-label',record.chromeVisible?'Скрыть управление: '+work.title:'Показать управление: '+work.title);
   toggle.tabIndex=0;toggle.removeAttribute('aria-hidden');
   cover.classList.toggle('controls-visible',record.chromeVisible);
  }
  async function togglePlayback(){
   if(!video.paused||record.pending){generation++;record.pending=0;video.pause();sync();return}
   showControls();
   const token=++generation;record.pending=token;
   records.forEach(other=>{if(other!==record)other.video.pause()});error.textContent='';
   if(!video.getAttribute('src')){video.removeAttribute('aria-hidden');video.src=work.src;video.controls=true}
   try{await video.play();if(token!==generation)video.pause()}
   catch(e){if(token===generation&&e.name!=='AbortError')error.textContent='Не удалось начать воспроизведение. Нажмите Play ещё раз.'}
   finally{if(record.pending===token)record.pending=0;sync()}
  }
  toggle.addEventListener('click',togglePlayback);
  surface.addEventListener('click',()=>record.chromeVisible?hideControls():showControls());
  const mobile=()=>matchMedia('(max-width:600px), (hover:none) and (pointer:coarse)').matches;
  function clearTimer(){clearTimeout(record.overlayTimer)}
  function hideControls(){
   clearTimer();if(!mobile()||record.fullscreen)return;
   record.chromeVisible=false;video.controls=false;sync();
  }
  function showControls(){
   clearTimer();record.chromeVisible=true;
   if(video.getAttribute('src'))video.controls=true;
   sync();
   if(mobile()&&!video.paused&&!record.fullscreen)record.overlayTimer=setTimeout(hideControls,1000);
  }
  // Do not hide native controls while the visitor is dragging the seek bar.
  ['pointerdown','touchstart'].forEach(event=>video.addEventListener(event,()=>{if(mobile())clearTimer()},{passive:true}));
  ['pointerup','pointercancel','touchend','touchcancel'].forEach(event=>video.addEventListener(event,()=>{if(mobile())showControls()},{passive:true}));
  video.addEventListener('playing',()=>cover.classList.add('has-frame'));
  // Keep system controls available throughout optional native fullscreen playback.
  video.addEventListener('webkitbeginfullscreen',()=>{record.fullscreen=true;clearTimer();video.controls=true});
  video.addEventListener('webkitendfullscreen',()=>{record.fullscreen=false;showControls()});
  record.fullscreenChange=()=>{
   if(document.fullscreenElement===video){record.fullscreen=true;clearTimer();video.controls=true}
   else if(record.fullscreen){record.fullscreen=false;showControls()}
  };
  document.addEventListener('fullscreenchange',record.fullscreenChange);
  video.addEventListener('play',()=>{
   if(record.pending&&record.pending!==generation){video.pause();return}
   if(!record.pending)generation++;
   records.forEach(other=>{if(other!==record)other.video.pause()});showControls();
  });
  ['pause','ended'].forEach(event=>video.addEventListener(event,showControls));
  function describeVolume(){video.setAttribute('aria-description','Громкость: '+Math.round(video.volume*100)+'%'+(video.muted?' · Звук выключен':''))}
  video.addEventListener('volumechange',describeVolume);describeVolume();
  video.addEventListener('error',()=>{error.textContent='Не удалось загрузить видео. Попробуйте ещё раз.'});sync();
 });
 return ()=>{
  generation++;
  records.forEach(({video,container,button,overlayTimer,fullscreenChange})=>{clearTimeout(overlayTimer);document.removeEventListener('fullscreenchange',fullscreenChange);video.pause();video.removeAttribute('src');video.load();container.replaceWith(button)});
 };
};
