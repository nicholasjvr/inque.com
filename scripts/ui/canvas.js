import { db } from "../firebase/firebase-init.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  getDocs,
  where,
  writeBatch,
  limit,
  doc,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("Canvas.js: DOM loaded, initializing canvas functionality");

  const leaveNoteBtn = document.getElementById("leaveNoteBtn");
  const leaveNoteActionBtn = document.getElementById("leaveNoteActionBtn");
  const canvasModal = document.getElementById("canvasModal");

  console.log("Canvas.js: Found elements", {
    leaveNoteBtn: !!leaveNoteBtn,
    leaveNoteActionBtn: !!leaveNoteActionBtn,
    canvasModal: !!canvasModal,
  });

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

    // Storage optimization configuration
    const MAX_LINES = 100; // Increased from 50 - allows more detailed drawings
    const MAX_LINE_LENGTH = 150; // Increased from 100 - allows longer strokes
    const MAX_NOTES_PER_USER = 10; // Limit notes per user
    const MAX_STORAGE_SIZE = 50000; // 50KB limit per note
    const CANVAS_COMPRESSION_RATIO = 0.5; // Reduce canvas size for storage
    let currentLineCount = 0;
    let savedLines = [];
    let currentUserNotes = 0;

    // UI elements
    const canvasControls = document.createElement("div");
    canvasControls.className = "canvas-controls";
    canvasControls.innerHTML = `
      <div class="canvas-info">
        <span class="line-counter">Lines: <span id="lineCount">0</span>/${MAX_LINES}</span>
        <span class="mode-indicator">Mode: <span id="drawMode">Draw</span></span>
        <span class="storage-info">Storage: <span id="storageInfo">Optimized</span></span>
        <span class="user-limit">Notes: <span id="userNoteCount">0</span>/${MAX_NOTES_PER_USER}</span>
      </div>
      <div class="canvas-actions">
        <button id="saveCanvasBtn" class="canvas-btn save-btn" title="Save your note">💾 Save</button>
        <button id="resetCanvasBtn" class="canvas-btn reset-btn" title="Clear canvas">🗑️ Reset</button>
        <button id="toggleModeBtn" class="canvas-btn mode-btn" title="Toggle draw/erase mode">✏️ Draw</button>
      </div>
    `;

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
      ctx.lineWidth = erase ? 25 : 6; // Increased line width for better visibility
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

    const updateLineCounter = () => {
      const lineCountElement = document.getElementById("lineCount");
      if (lineCountElement) {
        lineCountElement.textContent = currentLineCount;
        lineCountElement.style.color =
          currentLineCount >= MAX_LINES ? "#ff4444" : "#00ff00";
      }
    };

    const updateModeIndicator = () => {
      const drawModeElement = document.getElementById("drawMode");
      if (drawModeElement) {
        drawModeElement.textContent = isErasing ? "Erase" : "Draw";
        drawModeElement.style.color = isErasing ? "#ff4444" : "#00ff00";
      }
    };

    // Compression and optimization functions
    const compressLineData = (lines) => {
      console.log("Canvas.js: Compressing line data");
      const originalSize = calculateStorageSize(lines);
      const compressed = lines.map((line) => ({
        sX: Math.round(line.startX * 1000) / 1000, // Round to 3 decimal places
        sY: Math.round(line.startY * 1000) / 1000,
        eX: Math.round(line.endX * 1000) / 1000,
        eY: Math.round(line.endY * 1000) / 1000,
        e: line.isErasing ? 1 : 0, // Boolean to number
      }));
      const compressedSize = calculateStorageSize(compressed);
      const savings = (
        ((originalSize - compressedSize) / originalSize) *
        100
      ).toFixed(1);
      console.log(
        `Canvas.js: Compression saved ${savings}% (${originalSize} -> ${compressedSize} bytes)`
      );
      return compressed;
    };

    const decompressLineData = (compressedLines) => {
      console.log("Canvas.js: Decompressing line data");
      return compressedLines.map((line) => ({
        startX: line.sX,
        startY: line.sY,
        endX: line.eX,
        endY: line.eY,
        isErasing: line.e === 1,
      }));
    };

    const calculateStorageSize = (data) => {
      const jsonString = JSON.stringify(data);
      return new Blob([jsonString]).size;
    };

    const updateStorageInfo = () => {
      const storageInfoElement = document.getElementById("storageInfo");
      const userNoteCountElement = document.getElementById("userNoteCount");

      if (storageInfoElement) {
        const currentSize = calculateStorageSize(lineBuffer);
        const sizeKB = (currentSize / 1024).toFixed(1);
        storageInfoElement.textContent = `${sizeKB}KB`;
        storageInfoElement.style.color =
          currentSize > MAX_STORAGE_SIZE ? "#ff4444" : "#00ff00";
      }

      if (userNoteCountElement) {
        userNoteCountElement.textContent = currentUserNotes;
        userNoteCountElement.style.color =
          currentUserNotes >= MAX_NOTES_PER_USER ? "#ff4444" : "#00ff00";
      }
    };

    const checkUserNoteLimit = async () => {
      try {
        const q = query(
          collection(db, "notes"),
          where("type", "==", "canvas-note"),
          limit(MAX_NOTES_PER_USER)
        );
        const snapshot = await getDocs(q);
        currentUserNotes = snapshot.size;
        updateStorageInfo();
        return currentUserNotes < MAX_NOTES_PER_USER;
      } catch (err) {
        console.error("Canvas.js: Error checking user note limit:", err);
        return true; // Allow if error
      }
    };

    const bufferDrawingAction = (e) => {
      if (!isDrawing) return;

      // Check line limit
      if (currentLineCount >= MAX_LINES) {
        showTooltip(`Line limit reached (${MAX_LINES}). Please save or reset.`);
        return;
      }

      // Check storage size limit
      const currentSize = calculateStorageSize(lineBuffer);
      if (currentSize > MAX_STORAGE_SIZE) {
        showTooltip(
          `Storage limit reached (${(MAX_STORAGE_SIZE / 1024).toFixed(
            1
          )}KB). Please save or reset.`
        );
        return;
      }

      const currentX = e.offsetX;
      const currentY = e.offsetY;

      // Calculate line length to prevent very long strokes
      const lineLength = Math.sqrt(
        Math.pow(currentX - lastX, 2) + Math.pow(currentY - lastY, 2)
      );

      if (lineLength > MAX_LINE_LENGTH) {
        // Skip this line segment if it's too long
        [lastX, lastY] = [currentX, currentY];
        return;
      }

      drawLine(lastX, lastY, currentX, currentY, isErasing);

      const newLine = {
        startX: lastX / canvas.width,
        startY: lastY / canvas.height,
        endX: currentX / canvas.width,
        endY: currentY / canvas.height,
        isErasing: isErasing,
      };

      lineBuffer.push(newLine);
      currentLineCount++;
      updateLineCounter();
      updateStorageInfo();

      [lastX, lastY] = [currentX, currentY];
    };

    const stopDrawing = () => {
      isDrawing = false;
    };

    const saveCanvasToNotes = async () => {
      if (!db || lineBuffer.length === 0) {
        showTooltip("Nothing to save!");
        return;
      }

      console.log("Canvas.js: Saving canvas to notes collection");

      try {
        // Check user note limit
        const canSave = await checkUserNoteLimit();
        if (!canSave) {
          showTooltip(
            `Note limit reached (${MAX_NOTES_PER_USER}). Please delete old notes first.`
          );
          return;
        }

        // Compress line data for storage
        const compressedLines = compressLineData(lineBuffer);
        const storageSize = calculateStorageSize(compressedLines);

        if (storageSize > MAX_STORAGE_SIZE) {
          showTooltip(
            `Note too large (${(storageSize / 1024).toFixed(
              1
            )}KB). Please draw less or reset.`
          );
          return;
        }

        // Create batch for efficient operations
        const batch = writeBatch(db);

        // Save compressed note data
        const noteData = {
          lines: compressedLines,
          lineCount: currentLineCount,
          createdAt: serverTimestamp(),
          type: "canvas-note",
          storageSize: storageSize,
          canvasWidth: Math.round(canvas.width * CANVAS_COMPRESSION_RATIO),
          canvasHeight: Math.round(canvas.height * CANVAS_COMPRESSION_RATIO),
        };

        const noteRef = collection(db, "notes");
        const newNoteRef = doc(noteRef);
        batch.set(newNoteRef, noteData);

        // Execute batch operation
        await batch.commit();
        console.log(
          "Canvas.js: Note saved successfully with compression",
          newNoteRef.id
        );

        // Auto-cleanup: Delete notes older than 30 days
        await cleanupOldNotes();

        // Clear buffer and reset counter
        lineBuffer.length = 0;
        currentLineCount = 0;
        updateLineCounter();
        updateStorageInfo();

        showTooltip("Note saved successfully! 🎉");

        // Clear canvas after saving
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } catch (err) {
        console.error("Canvas.js: Error saving note:", err);
        showTooltip("Failed to save note. Please try again.");
      }
    };

    // Auto-cleanup function to delete old notes
    const cleanupOldNotes = async () => {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const q = query(
          collection(db, "notes"),
          where("type", "==", "canvas-note"),
          where("createdAt", "<", thirtyDaysAgo)
        );

        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));

        if (deletePromises.length > 0) {
          await Promise.all(deletePromises);
          console.log(
            `Canvas.js: Cleaned up ${deletePromises.length} old notes`
          );
        }
      } catch (err) {
        console.error("Canvas.js: Error during cleanup:", err);
      }
    };

    const resetCanvas = () => {
      console.log("Canvas.js: Resetting canvas");

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Reset counters and buffers
      lineBuffer.length = 0;
      currentLineCount = 0;
      updateLineCounter();
      updateStorageInfo();

      showTooltip("Canvas reset!");
    };

    const toggleDrawMode = () => {
      isErasing = !isErasing;
      canvas.style.cursor = isErasing ? "cell" : "crosshair";
      updateModeIndicator();

      const toggleBtn = document.getElementById("toggleModeBtn");
      if (toggleBtn) {
        toggleBtn.textContent = isErasing ? "✏️ Draw" : "🧽 Erase";
        toggleBtn.title = isErasing
          ? "Switch to draw mode"
          : "Switch to erase mode";
      }

      showTooltip(isErasing ? "Eraser mode on" : "Draw mode on");
    };

    const handleCanvasClick = (e) => {
      clickCount++;

      if (clickCount === 1) {
        clickTimer = setTimeout(() => {
          clickCount = 0;
        }, 400);
      } else if (clickCount === 2) {
        clearTimeout(clickTimer);
        toggleDrawMode();
        clickCount = 0;
      } else if (clickCount === 3) {
        clearTimeout(clickTimer);
        saveCanvasToNotes();
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

    // Mouse events for desktop
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", bufferDrawingAction);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseout", stopDrawing);
    canvas.addEventListener("click", handleCanvasClick);

    // Touch events for mobile
    canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      startDrawing({ offsetX: x, offsetY: y });
    });

    canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      bufferDrawingAction({ offsetX: x, offsetY: y });
    });

    canvas.addEventListener("touchend", (e) => {
      e.preventDefault();
      stopDrawing();
    });

    // Add event listeners for canvas control buttons
    const saveCanvasBtn = document.getElementById("saveCanvasBtn");
    const resetCanvasBtn = document.getElementById("resetCanvasBtn");
    const toggleModeBtn = document.getElementById("toggleModeBtn");

    if (saveCanvasBtn) {
      saveCanvasBtn.addEventListener("click", (e) => {
        console.log("Canvas.js: Save button clicked");
        e.preventDefault();
        e.stopPropagation();
        saveCanvasToNotes();
      });
    }

    if (resetCanvasBtn) {
      resetCanvasBtn.addEventListener("click", (e) => {
        console.log("Canvas.js: Reset button clicked");
        e.preventDefault();
        e.stopPropagation();
        resetCanvas();
      });
    }

    if (toggleModeBtn) {
      toggleModeBtn.addEventListener("click", (e) => {
        console.log("Canvas.js: Toggle mode button clicked");
        e.preventDefault();
        e.stopPropagation();
        toggleDrawMode();
      });
    }

    const openCanvas = () => {
      console.log("Canvas.js: Opening canvas modal");
      canvasModal.style.display = "block";

      // Add controls to modal
      const modalBody = canvasModal.querySelector(".modal-body");
      if (modalBody && !modalBody.querySelector(".canvas-controls")) {
        modalBody.insertBefore(canvasControls, modalBody.firstChild);
      }

      resizeCanvas();
      updateLineCounter();
      updateModeIndicator();
      updateStorageInfo();

      // Initialize user note count with better error handling
      checkUserNoteLimit()
        .then(() => {
          console.log("Canvas.js: User note limit check completed");
        })
        .catch((error) => {
          console.warn(
            "Canvas.js: Note limit check failed, but continuing:",
            error
          );
        });

      console.log("Canvas.js: Storage optimizations active:");
      console.log(`- Max lines: ${MAX_LINES}`);
      console.log(`- Max line length: ${MAX_LINE_LENGTH}px`);
      console.log(`- Max notes per user: ${MAX_NOTES_PER_USER}`);
      console.log(
        `- Max storage size: ${(MAX_STORAGE_SIZE / 1024).toFixed(1)}KB`
      );
      console.log(
        `- Canvas compression ratio: ${CANVAS_COMPRESSION_RATIO * 100}%`
      );
      console.log(`- Line width: ${isErasing ? 25 : 6}px`);

      showTooltip(
        "Draw mode active. Use buttons or double-click to toggle modes."
      );
      console.log("Canvas.js: Canvas modal opened successfully");
    };

    if (leaveNoteBtn) {
      console.log("Canvas.js: Adding click listener to leaveNoteBtn");
      leaveNoteBtn.addEventListener("click", (e) => {
        console.log("Canvas.js: Leave Note button clicked");
        e.preventDefault();
        e.stopPropagation();
        openCanvas();
      });
    } else {
      console.warn("Canvas.js: leaveNoteBtn not found");
    }
    if (leaveNoteActionBtn) {
      console.log("Canvas.js: Adding click listener to leaveNoteActionBtn");
      leaveNoteActionBtn.addEventListener("click", (e) => {
        console.log("Canvas.js: Leave Note Action button clicked");
        e.preventDefault();
        e.stopPropagation();
        openCanvas();
      });
    } else {
      console.warn("Canvas.js: leaveNoteActionBtn not found");
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
