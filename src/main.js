import { startScene } from "./scene.js";

// Навигация становится плотной при прокрутке
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("is-solid", scrollY > 40);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

document.getElementById("year").textContent = new Date().getFullYear();

// Постеры: если в data-poster указан файл — показываем фото вместо заставки
document.querySelectorAll(".poster[data-poster]").forEach((el) => {
  const src = el.dataset.poster;
  if (!src) return;
  const art = el.querySelector(".poster__art");
  art.style.backgroundImage = `url("${src}")`;
  el.classList.add("has-image");
});

startScene(document.getElementById("scene"));
