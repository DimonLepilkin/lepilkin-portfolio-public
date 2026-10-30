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
  const toggle=document.createElement('button');toggle.type='button';toggle.className='inline-toggle';
  const error=document.createElement('p');error.className='inline-error';error.setAttribute('role','status');container.append(error);
  cover.append(video,toggle);button.replaceWith(container);
  const record={video,toggle,pending:0,button,container};records.push(record);
  function sync(){
   const playing=!video.paused&&!video.ended;
   cover.classList.toggle('is-playing',playing);
   toggle.innerHTML=playing?pauseIcon:playIcon;
   toggle.setAttribute('aria-label',(playing?'Пауза: ':'Воспроизвести: ')+work.title);
  }
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
 return ()=>{
  generation++;
  records.forEach(({video,container,button})=>{video.pause();video.removeAttribute('src');video.load();container.replaceWith(button)});
 };
};
