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
    const MAX_NOTES_PER_USER = 10; // Limit notes per user
    const MAX_STORAGE_SIZE = 50000; // 50KB limit per note
    const CANVAS_COMPRESSION_RATIO = 0.5; // Reduce canvas size for storage

    // NEW: Spatial drawing limits - much more user-friendly!
    const DRAWING_AREA_PADDING = 50; // Padding from canvas edges
    const MIN_DRAWING_AREA_SIZE = 200; // Minimum drawing area size
    let DRAWING_AREA_TYPE = "rectangle"; // "rectangle" or "circle" - made mutable
    let drawingArea = null; // Will be set when canvas opens
    let savedLines = [];
    let currentUserNotes = 0;

    // UI elements
    const canvasControls = document.createElement("div");
    canvasControls.className = "canvas-controls";
    canvasControls.innerHTML = `
      <div class="canvas-info">
        <span class="drawing-area-info">Drawing Area: <span id="drawingAreaInfo">Calculating...</span></span>
        <span class="mode-indicator">Mode: <span id="drawMode">Draw</span></span>
        <span class="storage-info">Storage: <span id="storageInfo">Optimized</span></span>
        <span class="user-limit">Notes: <span id="userNoteCount">0</span>/${MAX_NOTES_PER_USER}</span>
      </div>
      <div class="canvas-actions">
        <button id="saveCanvasBtn" class="canvas-btn save-btn" title="Save your note">💾 Save</button>
        <button id="resetCanvasBtn" class="canvas-btn reset-btn" title="Clear canvas">🗑️ Reset</button>
        <button id="toggleModeBtn" class="canvas-btn mode-btn" title="Toggle draw/erase mode">✏️ Draw</button>
        <button id="toggleAreaBtn" class="canvas-btn area-btn" title="Toggle drawing area shape">⬜ Rectangle</button>
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

    // NEW: Spatial drawing area functions
    const calculateDrawingArea = () => {
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      if (DRAWING_AREA_TYPE === "circle") {
        // Circular drawing area - more natural for signatures/doodles
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const radius = Math.min(
          (canvasWidth - DRAWING_AREA_PADDING * 2) / 2,
          (canvasHeight - DRAWING_AREA_PADDING * 2) / 2,
          Math.max(MIN_DRAWING_AREA_SIZE / 2, 100)
        );

        drawingArea = {
          type: "circle",
          centerX: centerX,
          centerY: centerY,
          radius: radius,
          radiusSquared: radius * radius, // For efficient distance checking
        };
      } else {
        // Rectangular drawing area - more traditional
        const areaWidth = Math.max(
          canvasWidth - DRAWING_AREA_PADDING * 2,
          MIN_DRAWING_AREA_SIZE
        );
        const areaHeight = Math.max(
          canvasHeight - DRAWING_AREA_PADDING * 2,
          MIN_DRAWING_AREA_SIZE
        );

        const areaX = (canvasWidth - areaWidth) / 2;
        const areaY = (canvasHeight - areaHeight) / 2;

        drawingArea = {
          type: "rectangle",
          x: areaX,
          y: areaY,
          width: areaWidth,
          height: areaHeight,
        };
      }

      console.log("Canvas.js: Drawing area calculated:", drawingArea);
      return drawingArea;
    };

    const drawDrawingAreaBoundary = () => {
      if (!drawingArea) return;

      // Draw a subtle boundary around the drawing area
      ctx.save();
      ctx.strokeStyle = "rgba(0, 150, 255, 0.3)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      if (drawingArea.type === "circle") {
        ctx.beginPath();
        ctx.arc(
          drawingArea.centerX,
          drawingArea.centerY,
          drawingArea.radius,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      } else {
        ctx.strokeRect(
          drawingArea.x,
          drawingArea.y,
          drawingArea.width,
          drawingArea.height
        );
      }
      ctx.restore();

      console.log("Canvas.js: Drawing area boundary drawn");
    };

    const highlightDrawingAreaBoundary = () => {
      if (!drawingArea) return;

      // Temporarily highlight the boundary in red to show it's restricted
      ctx.save();
      ctx.strokeStyle = "rgba(255, 0, 0, 0.6)";
      ctx.lineWidth = 3;
      ctx.setLineDash([3, 3]);
      if (drawingArea.type === "circle") {
        ctx.beginPath();
        ctx.arc(
          drawingArea.centerX,
          drawingArea.centerY,
          drawingArea.radius,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      } else {
        ctx.strokeRect(
          drawingArea.x,
          drawingArea.y,
          drawingArea.width,
          drawingArea.height
        );
      }
      ctx.restore();

      // Reset to normal boundary after a short delay
      setTimeout(() => {
        drawDrawingAreaBoundary();
      }, 1000);

      console.log("Canvas.js: Drawing area boundary highlighted (restricted)");
    };

    const isPointInDrawingArea = (x, y) => {
      if (!drawingArea) return true; // Allow drawing if area not set yet

      if (drawingArea.type === "circle") {
        const dx = x - drawingArea.centerX;
        const dy = y - drawingArea.centerY;
        const distanceSquared = dx * dx + dy * dy;
        const isInside = distanceSquared <= drawingArea.radiusSquared;

        if (!isInside) {
          console.log(
            `Canvas.js: Drawing blocked at (${x}, ${y}) - outside circular area:`,
            drawingArea
          );
        }

        return isInside;
      } else {
        const isInside =
          x >= drawingArea.x &&
          x <= drawingArea.x + drawingArea.width &&
          y >= drawingArea.y &&
          y <= drawingArea.y + drawingArea.height;

        if (!isInside) {
          console.log(
            `Canvas.js: Drawing blocked at (${x}, ${y}) - outside drawing area:`,
            drawingArea
          );
        }

        return isInside;
      }
    };

    const updateDrawingAreaInfo = () => {
      const drawingAreaInfoElement = document.getElementById("drawingAreaInfo");
      if (drawingAreaInfoElement && drawingArea) {
        if (lineBuffer.length === 0) {
          drawingAreaInfoElement.textContent = "Empty";
          drawingAreaInfoElement.style.color = "#888888";
        } else {
          let areaPercent = 0;
          if (drawingArea.type === "circle") {
            const area = Math.PI * drawingArea.radius * drawingArea.radius;
            const canvasArea = canvas.width * canvas.height;
            areaPercent = Math.round((area / canvasArea) * 100);
          } else {
            const area = drawingArea.width * drawingArea.height;
            const canvasArea = canvas.width * canvas.height;
            areaPercent = Math.round((area / canvasArea) * 100);
          }
          drawingAreaInfoElement.textContent = `${areaPercent}% of canvas`;
          drawingAreaInfoElement.style.color =
            areaPercent < 50 ? "#ff8800" : "#00ff00";
        }
      }
    };

    const drawLine = (startX, startY, endX, endY, erase = false) => {
      if (erase) {
        // Enhanced eraser with multiple passes for better effectiveness
        ctx.save(); // Save current context state
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.strokeStyle = "rgba(0,0,0,1)";
        ctx.lineWidth = 30;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Second pass with smaller width for precision
        ctx.lineWidth = 15;
        ctx.stroke();

        // Third pass for complete erasing
        ctx.lineWidth = 8;
        ctx.stroke();
        ctx.closePath();
        ctx.restore(); // Restore context state
      } else {
        // Normal drawing
        ctx.save(); // Save current context state
        ctx.globalCompositeOperation = "source-over";
        ctx.beginPath();
        ctx.strokeStyle = "black";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.closePath();
        ctx.restore(); // Restore context state
      }
    };

    const startDrawing = (e) => {
      isDrawing = true;
      [lastX, lastY] = [e.offsetX, e.offsetY];
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
        if (lineBuffer.length === 0) {
          storageInfoElement.textContent = "Ready";
          storageInfoElement.style.color = "#00ff00";
        } else {
          const currentSize = calculateStorageSize(lineBuffer);
          const sizeKB = (currentSize / 1024).toFixed(1);
          storageInfoElement.textContent = `${sizeKB}KB`;
          storageInfoElement.style.color =
            currentSize > MAX_STORAGE_SIZE ? "#ff4444" : "#00ff00";

          console.log(
            `Canvas.js: Storage updated - ${sizeKB}KB (${lineBuffer.length} lines)`
          );
        }
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

      const currentX = e.offsetX;
      const currentY = e.offsetY;

      // NEW: Check if drawing point is within allowed area
      if (!isPointInDrawingArea(currentX, currentY)) {
        const areaType =
          drawingArea?.type === "circle" ? "circular" : "rectangular";
        showTooltip(
          `Drawing outside allowed ${areaType} area! Stay within the boundary.`
        );
        highlightDrawingAreaBoundary(); // Highlight boundary temporarily
        return;
      }

      // Check storage size limit (keep this as a safety)
      const currentSize = calculateStorageSize(lineBuffer);
      if (currentSize > MAX_STORAGE_SIZE) {
        showTooltip(
          `Storage limit reached (${(MAX_STORAGE_SIZE / 1024).toFixed(
            1
          )}KB). Please save or reset.`
        );
        return;
      }

      // Debug logging for eraser state
      if (isErasing) {
        console.log("Canvas.js: Erasing at", currentX, currentY);
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
      updateDrawingAreaInfo();
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
        updateDrawingAreaInfo();
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

      // Reset to draw mode
      isErasing = false;
      canvas.style.cursor = "crosshair";
      canvas.style.border = "1px solid #ccc";
      canvas.style.boxShadow = "none";

      // Redraw drawing area boundary
      drawDrawingAreaBoundary();

      // Reset counters and buffers
      lineBuffer.length = 0;
      updateDrawingAreaInfo();
      updateStorageInfo();

      // Update mode indicator and button
      updateModeIndicator();
      const toggleBtn = document.getElementById("toggleModeBtn");
      if (toggleBtn) {
        toggleBtn.textContent = "🧽 Erase";
        toggleBtn.title = "Switch to erase mode";
        toggleBtn.style.background = "transparent";
        toggleBtn.style.borderColor = "#ff9800";
        toggleBtn.style.color = "#ff9800";
      }

      showTooltip("Canvas reset! Back to draw mode.");
      console.log("Canvas.js: Canvas reset completed");
    };

    const toggleDrawMode = () => {
      console.log(
        "Canvas.js: Toggling draw mode from",
        isErasing ? "erase" : "draw",
        "to",
        isErasing ? "draw" : "erase"
      );

      isErasing = !isErasing;

      // Update cursor based on mode
      if (isErasing) {
        canvas.style.cursor = "crosshair";
        canvas.style.border = "2px solid #ff4444";
        canvas.style.boxShadow = "0 0 10px rgba(255, 68, 68, 0.3)";
      } else {
        canvas.style.cursor = "crosshair";
        canvas.style.border = "1px solid #ccc";
        canvas.style.boxShadow = "none";
      }

      updateModeIndicator();

      const toggleBtn = document.getElementById("toggleModeBtn");
      if (toggleBtn) {
        if (isErasing) {
          toggleBtn.textContent = "✏️ Draw";
          toggleBtn.title = "Switch to draw mode";
          toggleBtn.style.background = "rgba(255, 0, 0, 0.2)";
          toggleBtn.style.borderColor = "#ff4444";
          toggleBtn.style.color = "#ff4444";
        } else {
          toggleBtn.textContent = "🧽 Erase";
          toggleBtn.title = "Switch to erase mode";
          toggleBtn.style.background = "transparent";
          toggleBtn.style.borderColor = "#ff9800";
          toggleBtn.style.color = "#ff9800";
        }

        console.log(
          "Canvas.js: Updated toggle button text to:",
          toggleBtn.textContent
        );
      } else {
        console.warn("Canvas.js: Toggle button not found for mode update");
      }

      showTooltip(
        isErasing
          ? "🧽 Eraser mode active - Click and drag to erase"
          : "✏️ Draw mode active - Click and drag to draw"
      );
      console.log("Canvas.js: Draw mode toggled successfully");
    };

    const toggleDrawingAreaType = () => {
      console.log("Canvas.js: Toggling drawing area type");

      // Clear current canvas and redraw boundary
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Toggle the drawing area type
      if (DRAWING_AREA_TYPE === "rectangle") {
        DRAWING_AREA_TYPE = "circle";
      } else {
        DRAWING_AREA_TYPE = "rectangle";
      }

      // Recalculate and redraw
      calculateDrawingArea();
      drawDrawingAreaBoundary();
      updateDrawingAreaInfo();

      // Update button text
      const toggleAreaBtn = document.getElementById("toggleAreaBtn");
      if (toggleAreaBtn) {
        const isCircle = DRAWING_AREA_TYPE === "circle";
        toggleAreaBtn.textContent = isCircle ? "⭕ Circle" : "⬜ Rectangle";
        toggleAreaBtn.title = isCircle
          ? "Switch to rectangular drawing area"
          : "Switch to circular drawing area";
      }

      showTooltip(`Switched to ${DRAWING_AREA_TYPE} drawing area!`);
      console.log(
        "Canvas.js: Drawing area type toggled to:",
        DRAWING_AREA_TYPE
      );
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

    // Keyboard shortcuts for eraser
    document.addEventListener("keydown", (e) => {
      if (
        e.key.toLowerCase() === "e" &&
        canvasModal.style.display === "block"
      ) {
        e.preventDefault();
        console.log("Canvas.js: E key pressed - toggling eraser mode");
        toggleDrawMode();
      } else if (
        e.key.toLowerCase() === "d" &&
        canvasModal.style.display === "block"
      ) {
        e.preventDefault();
        console.log("Canvas.js: D key pressed - toggling draw mode");
        if (isErasing) {
          toggleDrawMode();
        }
      }
    });

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

    // Canvas control button event listeners will be set up in openCanvas()

    const openCanvas = () => {
      console.log("Canvas.js: Opening canvas modal");
      canvasModal.style.display = "block";

      // Add controls to modal
      const modalBody = canvasModal.querySelector(".modal-body");
      if (modalBody && !modalBody.querySelector(".canvas-controls")) {
        modalBody.insertBefore(canvasControls, modalBody.firstChild);
      }

      // Set up canvas control button event listeners AFTER buttons are in DOM
      const saveCanvasBtn = document.getElementById("saveCanvasBtn");
      const resetCanvasBtn = document.getElementById("resetCanvasBtn");
      const toggleModeBtn = document.getElementById("toggleModeBtn");
      const toggleAreaBtn = document.getElementById("toggleAreaBtn");

      console.log("Canvas.js: Found buttons:", {
        saveCanvasBtn: !!saveCanvasBtn,
        resetCanvasBtn: !!resetCanvasBtn,
        toggleModeBtn: !!toggleModeBtn,
        toggleAreaBtn: !!toggleAreaBtn,
      });

      if (saveCanvasBtn) {
        console.log("Canvas.js: Setting up save button listener");
        saveCanvasBtn.addEventListener("click", (e) => {
          console.log("Canvas.js: Save button clicked");
          e.preventDefault();
          e.stopPropagation();
          saveCanvasToNotes();
        });
        // Add visual feedback
        saveCanvasBtn.style.boxShadow = "0 0 10px rgba(76, 175, 80, 0.5)";
      } else {
        console.warn("Canvas.js: Save button not found");
      }

      if (resetCanvasBtn) {
        console.log("Canvas.js: Setting up reset button listener");
        resetCanvasBtn.addEventListener("click", (e) => {
          console.log("Canvas.js: Reset button clicked");
          e.preventDefault();
          e.stopPropagation();
          resetCanvas();
        });
        // Add visual feedback
        resetCanvasBtn.style.boxShadow = "0 0 10px rgba(244, 67, 54, 0.5)";
      } else {
        console.warn("Canvas.js: Reset button not found");
      }

      if (toggleModeBtn) {
        console.log("Canvas.js: Setting up toggle mode button listener");
        toggleModeBtn.addEventListener("click", (e) => {
          console.log("Canvas.js: Toggle mode button clicked");
          e.preventDefault();
          e.stopPropagation();
          toggleDrawMode();
        });
        // Add visual feedback
        toggleModeBtn.style.boxShadow = "0 0 10px rgba(255, 152, 0, 0.5)";
      } else {
        console.warn("Canvas.js: Toggle mode button not found");
      }

      if (toggleAreaBtn) {
        console.log("Canvas.js: Setting up toggle area button listener");
        toggleAreaBtn.addEventListener("click", (e) => {
          console.log("Canvas.js: Toggle area button clicked");
          e.preventDefault();
          e.stopPropagation();
          toggleDrawingAreaType();
        });
        // Add visual feedback
        toggleAreaBtn.style.boxShadow = "0 0 10px rgba(156, 39, 176, 0.5)";
      } else {
        console.warn("Canvas.js: Toggle area button not found");
      }

      resizeCanvas();

      // NEW: Initialize drawing area and draw boundary
      calculateDrawingArea();
      drawDrawingAreaBoundary();
      updateDrawingAreaInfo();

      // Ensure proper initial state
      isErasing = false;
      canvas.style.cursor = "crosshair";
      canvas.style.border = "1px solid #ccc";
      canvas.style.boxShadow = "none";

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

      console.log("Canvas.js: Spatial drawing limits active:");
      console.log(`- Drawing area padding: ${DRAWING_AREA_PADDING}px`);
      console.log(`- Min drawing area size: ${MIN_DRAWING_AREA_SIZE}px`);
      console.log(`- Max notes per user: ${MAX_NOTES_PER_USER}`);
      console.log(
        `- Max storage size: ${(MAX_STORAGE_SIZE / 1024).toFixed(1)}KB`
      );
      console.log(
        `- Canvas compression ratio: ${CANVAS_COMPRESSION_RATIO * 100}%`
      );
      console.log(`- Line width: ${isErasing ? 25 : 6}px`);

      showTooltip(
        "Draw within the blue boundary! Use buttons, double-click, or press E/D keys to toggle modes."
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
