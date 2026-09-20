const nav=document.querySelector(".nav"),menu=document.querySelector(".menu-btn");
menu.addEventListener("click",()=>{const open=nav.classList.toggle("open");menu.setAttribute("aria-expanded",open)});
document.querySelectorAll(".nav-links a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));
const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add("show")}),{threshold:.12});
document.querySelectorAll(".reveal").forEach(el=>io.observe(el));
window.addEventListener("scroll",()=>{const h=document.documentElement.scrollHeight-innerHeight;document.querySelector(".progress").style.width=(scrollY/h*100)+"%"});
document.getElementById("year").textContent=new Date().getFullYear();