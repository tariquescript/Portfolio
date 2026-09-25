const texts = [
  "hi, i'm tarique.",
  "frontend developer.",
  "react developer."
];

const element = document.getElementById("typewriter");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let textIndex = 0;
let charIndex = 0;
let deleting = false;
let timer = null;

function schedule(delay) {
  clearTimeout(timer);
  timer = setTimeout(typeEffect, delay);
}

function typeEffect() {
  if (document.hidden) return;
  const currentText = texts[textIndex];

  if (!deleting) {
    element.textContent = currentText.substring(0, charIndex + 1);
    charIndex++;

    if (charIndex === currentText.length) {
      deleting = true;
      schedule(1200); // pause before deleting
      return;
    }
  } else {
    element.textContent = currentText.substring(0, charIndex - 1);
    charIndex--;

    if (charIndex === 0) {
      deleting = false;
      textIndex = (textIndex + 1) % texts.length;
    }
  }

  schedule(deleting ? 50 : 90);
}

function start() {
  if (!element) return;

  if (reduceMotion.matches) {
    clearTimeout(timer);
    element.textContent = texts[0];
    return;
  }

  schedule(0);
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) clearTimeout(timer);
  else start();
});

reduceMotion.addEventListener("change", start);
start();
