// Keep native hash links and smooth scrolling, including keyboard navigation.
{
 const links=[...document.querySelectorAll('.navigation-links a')];
 const sections=['top','works','about','contacts'].map(id=>document.getElementById(id));
 const update=()=>{
  const threshold=innerHeight*.35;
  let active='top';
  sections.slice(1).forEach(section=>{if(section.getBoundingClientRect().top<=threshold)active=section.id});
  if(scrollY+innerHeight>=document.documentElement.scrollHeight-12)active='contacts';
  if(scrollY<80)active='top';
  links.forEach(link=>{if(link.hash==='#'+active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current')});
 };
 let pending=false;
 addEventListener('scroll',()=>{if(!pending){pending=true;requestAnimationFrame(()=>{pending=false;update()})}},{passive:true});
 update();
}
