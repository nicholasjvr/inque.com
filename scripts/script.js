document.addEventListener("DOMContentLoaded", function () {
  const img = document.getElementById("header-img");
  const slowGif = () => {
    img.style.animation = "none";
    setTimeout(() => {
      img.style.animation = "";
    }, 0);
  };
  img.addEventListener("load", slowGif);
});

const canvas = document.getElementById("gameCanvas");
if (canvas) {
  const ctx = canvas.getContext("2d");
  let x = 10,
    y = 90,
    dx = 3;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#00FF00";
    ctx.fillRect(x, y, 30, 30);
    x += dx;
    if (x + 30 > canvas.width || x < 0) dx *= -1;
    requestAnimationFrame(draw);
  }

  draw();
}

document.addEventListener("mousemove", function (e) {
  const light = document.querySelector(".light-cursor");
  light.style.left = e.clientX + "px";
  light.style.top = e.clientY + "px";
});

window.addEventListener("scroll", () => {
  const animatedElements = document.querySelectorAll(".scroll-animate");

  animatedElements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 100) {
      el.classList.add("active");
    }
  });
  console.log("Scroll animation triggered");
});

window.dispatchEvent(new Event("scroll"));
