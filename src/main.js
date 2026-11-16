import { startScene } from "./scene.js";

// Навигация становится плотной при прокрутке
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("is-solid", scrollY > 40);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

document.getElementById("year").textContent = new Date().getFullYear();

// Фильмография: крупный постер всплывает рядом с курсором
const preview = document.querySelector(".films__preview");
const previewImg = preview?.querySelector("img");
if (preview && matchMedia("(hover: hover)").matches) {
  document.querySelectorAll(".films__list li[data-has-poster]").forEach((li) => {
    const src = li.querySelector("img")?.currentSrc || li.querySelector("img")?.src;
    li.addEventListener("pointerenter", () => {
      previewImg.src = src;
      preview.classList.add("is-on");
    });
    li.addEventListener("pointerleave", () => preview.classList.remove("is-on"));
  });
  addEventListener("pointermove", (e) => {
    const w = preview.offsetWidth, h = preview.offsetHeight || 320;
    const x = e.clientX + 28 + w < innerWidth - 16 ? e.clientX + 28 : e.clientX - w - 28;
    const y = Math.max(16, Math.min(e.clientY - h / 2, innerHeight - h - 16));
    preview.style.setProperty("--x", `${x}px`);
    preview.style.setProperty("--y", `${y}px`);
  }, { passive: true });
}

// 3D-сцену запускаем после появления текста, чтобы анимация имени шла плавно
const boot = () => startScene(document.getElementById("scene"));
setTimeout(() => ("requestIdleCallback" in window ? requestIdleCallback(boot, { timeout: 800 }) : boot()), 700);
