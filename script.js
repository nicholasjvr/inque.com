document.addEventListener("DOMContentLoaded", function() {
    const img = document.getElementById("header-img");
    const slowGif = () => {
      img.style.animation = "none";
      setTimeout(() => {
        img.style.animation = "";
      }, 0);
    };
    img.addEventListener("load", slowGif);
  });