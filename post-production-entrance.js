{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const mobile=matchMedia('(max-width:600px), (hover:none) and (pointer:coarse)');
 function enter(gallery){if(reduced.matches||mobile.matches)return;
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
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){observer.unobserve(entry.target);enter(entry.target)}}),{threshold:.08});
 document.querySelectorAll('.experiment-gallery, [data-gallery-entrance]').forEach(gallery=>observer.observe(gallery));
}

// Resolve an incoming category fragment after inline cards have been installed.
// The native initial jump can otherwise run before the gallery's final layout.
{
 let untouched=true;
 ['pointerdown','wheel','touchstart','keydown'].forEach(type=>addEventListener(type,()=>{untouched=false},{once:true,passive:true}));
 function alignIncomingCategory(){
  const id=location.hash.slice(1);
  if(!['cinema','trailers','sound-design'].includes(id)||!untouched)return;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(untouched)document.getElementById(id)?.scrollIntoView({behavior:'instant',block:'start'});
  }));
 }
 addEventListener('pageshow',alignIncomingCategory);
 alignIncomingCategory();
}
