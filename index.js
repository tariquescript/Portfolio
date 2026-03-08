
const texts = [
  "hi, i'm tarique.",
  "Frontend developer.",
  "React developer."
];

let textIndex = 0;
let charIndex = 0;
let deleting = false;

const element = document.getElementById("typewriter");

function typeEffect() {
  const currentText = texts[textIndex];

  if (!deleting) {
    element.textContent = currentText.substring(0, charIndex + 1);
    charIndex++;

    if (charIndex === currentText.length) {
      deleting = true;
      setTimeout(typeEffect, 1200); // pause before deleting
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

  const speed = deleting ? 50 : 90;
  setTimeout(typeEffect, speed);
}

typeEffect();
