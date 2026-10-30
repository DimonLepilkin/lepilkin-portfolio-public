// Shared restrained entrance; each gallery keeps its layout and playback mode.
{
 const gallery=document.querySelector('.experiment-gallery, [data-gallery-entrance]');
 if(gallery&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&!matchMedia('(max-width:600px)').matches){
  const bounds=gallery.getBoundingClientRect();
  const zoom=bounds.width/gallery.offsetWidth||1;
  const centerX=bounds.left+bounds.width/2;
  const centerY=Math.max(bounds.top+100*zoom,Math.min(bounds.top+bounds.height*.35,innerHeight*.52));
  gallery.querySelectorAll('.work').forEach((card,index)=>{
   const rect=card.getBoundingClientRect();
   const x=(centerX-rect.left-rect.width/2)/zoom+(index-1)*24;
   const y=(centerY-rect.top-rect.height/2)/zoom+(index-1)*18;
   card.animate([
    {transform:`translate(${x}px,${y}px) scale(.94)`,opacity:.65},
    {transform:'translate(0,0) scale(1)',opacity:1}
   ],{duration:650,easing:'cubic-bezier(.16,1,.3,1)'});
  });
 }
}
