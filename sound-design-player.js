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
 createInlineVideoGallery(document.querySelectorAll('.open-work'),works);
}
