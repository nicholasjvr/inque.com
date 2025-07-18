import { db } from "../script.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const leaveNoteBtn = document.getElementById("leaveNoteBtn");
  const leaveNoteActionBtn = document.getElementById("leaveNoteActionBtn");
  const canvasModal = document.getElementById("canvasModal");

  if (canvasModal) {
    const canvasCloseBtn = canvasModal.querySelector(".canvas-close-button");
    const canvas = document.getElementById("collabCanvas");
    const tooltip = canvasModal.querySelector(".canvas-tooltip-text");
    const ctx = canvas.getContext("2d");

    let isDrawing = false;
    let isErasing = false;
    let lastX = 0;
    let lastY = 0;
    let unsubscribeFromFirestore = null;
    let clickTimer = null;
    let clickCount = 0;
    const lineBuffer = [];

    const resizeCanvas = () => {
      const modalBody = canvas.parentElement;
      if (modalBody.clientWidth > 0 && modalBody.clientHeight > 0) {
        canvas.width = modalBody.clientWidth;
        canvas.height = modalBody.clientHeight;
      }
    };

    const showTooltip = (message) => {
      if (!tooltip) return;
      tooltip.textContent = message;
      tooltip.classList.add("show");
      setTimeout(() => {
        tooltip.classList.remove("show");
      }, 3000);
    };

    const drawLine = (startX, startY, endX, endY, erase = false) => {
      ctx.globalCompositeOperation = erase ? "destination-out" : "source-over";
      ctx.beginPath();
      ctx.strokeStyle = erase ? "rgba(0,0,0,1)" : "black";
      ctx.lineWidth = erase ? 20 : 3;
      ctx.lineCap = "round";
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.closePath();
      ctx.globalCompositeOperation = "source-over";
    };

    const startDrawing = (e) => {
      isDrawing = true;
      [lastX, lastY] = [e.offsetX, e.offsetY];
    };

    const bufferDrawingAction = (e) => {
      if (!isDrawing) return;
      const currentX = e.offsetX;
      const currentY = e.offsetY;

      drawLine(lastX, lastY, currentX, currentY, isErasing);

      lineBuffer.push({
        startX: lastX / canvas.width,
        startY: lastY / canvas.height,
        endX: currentX / canvas.width,
        endY: currentY / canvas.height,
        isErasing: isErasing,
      });

      [lastX, lastY] = [currentX, currentY];
    };

    const stopDrawing = () => {
      isDrawing = false;
    };

    const sendBufferToFirestore = () => {
      if (!db || lineBuffer.length === 0) return;

      const batchPromises = lineBuffer.map((line) => {
        return addDoc(collection(db, "canvas-lines"), {
          ...line,
          timestamp: serverTimestamp(),
        });
      });

      Promise.all(batchPromises)
        .then(() => {
          lineBuffer.length = 0; // Clear buffer on success
        })
        .catch((err) => {
          console.error("Error sending buffer to Firestore:", err);
        });
    };

    const handleCanvasClick = (e) => {
      clickCount++;

      if (clickCount === 1) {
        clickTimer = setTimeout(() => {
          clickCount = 0;
        }, 400);
      } else if (clickCount === 2) {
        clearTimeout(clickTimer);
        isErasing = !isErasing;
        canvas.style.cursor = isErasing ? "cell" : "crosshair";
        showTooltip(isErasing ? "Eraser mode on" : "Draw mode on");
        clickCount = 0;
      } else if (clickCount === 3) {
        clearTimeout(clickTimer);
        sendBufferToFirestore();
        showTooltip("Canvas saved!");
        clickCount = 0;
      }
    };

    const fetchAndDrawLines = () => {
      if (unsubscribeFromFirestore) unsubscribeFromFirestore();

      const q = query(
        collection(db, "canvas-lines"),
        orderBy("timestamp", "asc")
      );

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      unsubscribeFromFirestore = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const line = change.doc.data();
            const w = canvas.width;
            const h = canvas.height;
            drawLine(
              line.startX * w,
              line.startY * h,
              line.endX * w,
              line.endY * h,
              line.isErasing
            );
          }
        });
      });
    };

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", bufferDrawingAction);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseout", stopDrawing);
    canvas.addEventListener("click", handleCanvasClick);

    const openCanvas = () => {
      canvasModal.style.display = "block";
      resizeCanvas();
      fetchAndDrawLines();
      showTooltip("Double-click to erase. Triple-click to save.");
    };

    if (leaveNoteBtn) {
      leaveNoteBtn.addEventListener("click", openCanvas);
    }
    if (leaveNoteActionBtn) {
      leaveNoteActionBtn.addEventListener("click", openCanvas);
    }

    if (canvasCloseBtn) {
      canvasCloseBtn.addEventListener("click", () => {
        canvasModal.style.display = "none";
        if (unsubscribeFromFirestore) {
          unsubscribeFromFirestore();
          unsubscribeFromFirestore = null;
        }
      });
    }

    new ResizeObserver(resizeCanvas).observe(canvasModal);
  }
});
