import { startScene } from "./scene.js";

// Навигация становится плотной при прокрутке
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("is-solid", scrollY > 40);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

document.getElementById("year").textContent = new Date().getFullYear();

startScene(document.getElementById("scene"));
