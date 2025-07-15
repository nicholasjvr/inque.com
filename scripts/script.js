document.addEventListener("DOMContentLoaded", function () {
  // Timeline Event Card Data (placeholder)
  const timelineCardData = [
    {
      title: "Quote Builder",
      desc: "Interactive quote generation tool with real-time calculations",
      iframe: "widgets/app-widget-1/widget.html",
      hasWidget: true,
      placeholder: "assets/imgs/portal_placeholder.gif",
    },
    {
      title: "Category 2",
      desc: "Advanced analytics dashboard with customizable widgets",
      iframe: "widgets/widget2/index.html",
      hasWidget: true,
      placeholder: "assets/imgs/portal_placeholder.gif",
    },
    {
      title: "Category 3",
      desc: "This is a description for Category 3. More details coming soon!",
      hasWidget: false,
      placeholder: "assets/imgs/portal_placeholder.gif",
    },
    {
      title: "Category 4",
      desc: "This is a description for Category 4. More details coming soon!",
      hasWidget: false,
      placeholder: "assets/imgs/portal_placeholder.gif",
    },
    {
      title: "Category 5",
      desc: "This is a description for Category 5. More details coming soon!",
      hasWidget: false,
      placeholder: "assets/imgs/portal_placeholder.gif",
    },
  ];

  // Inject cards into each timeline-event
  const timelineEvents = document.querySelectorAll(".timeline-event");
  timelineEvents.forEach((event, idx) => {
    // Remove any previous card
    const oldCard = event.querySelector(".timeline-event-card");
    if (oldCard) oldCard.remove();

    // Create card
    const card = document.createElement("div");
    card.className = "timeline-event-card";

    // Prevent any default click behavior on the card itself
    card.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
    });

    const widgetData = timelineCardData[idx];

    if (widgetData?.hasWidget && widgetData?.iframe) {
      // Widget with preview image and portal overlay
      card.innerHTML = `
        <h3>${widgetData.title}</h3>
        <p>${widgetData.desc}</p>
        <div class="widget-preview-container">
          <div class="portal-overlay"></div>
          <img src="assets/imgs/portal_placeholder.gif" class="widget-placeholder-img" />
        </div>
        <button class="widget-preview-btn" data-widget-path="${widgetData.iframe}">
          Open Full View
        </button>
      `;
    }

    event.appendChild(card);

    // Add click handlers for preview buttons
    const previewBtn = card.querySelector(".widget-preview-btn");
    if (previewBtn && !previewBtn.disabled) {
      previewBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        const widgetPath = this.dataset.widgetPath;
        if (widgetPath) {
          openWidgetModal(widgetPath, widgetData.title);
        }
      });
    }

    // Accessibility: show card on focus
    event.setAttribute("tabindex", "0");
    event.addEventListener("focus", () => (card.style.display = "block"));
    event.addEventListener("blur", () => (card.style.display = ""));
  });

  // Widget Modal Function
  function openWidgetModal(widgetPath, widgetTitle) {
    const modal = document.getElementById("widgetModal");
    const widgetFrame = document.getElementById("widgetFrame");
    const modalTitle = document.querySelector(".modal-title");

    if (modal && widgetFrame) {
      // Add loading state
      modal.classList.add("loading");

      // Set modal title if available
      if (modalTitle) {
        modalTitle.textContent = widgetTitle || "Widget Preview";
      }

      // Load widget
      widgetFrame.src = widgetPath;
      modal.style.display = "block";

      // Remove loading state when iframe loads
      widgetFrame.onload = function () {
        modal.classList.remove("loading");
      };

      // Handle iframe load errors
      widgetFrame.onerror = function () {
        modal.classList.remove("loading");
        console.error("Failed to load widget:", widgetPath);
      };
    }
  }

  // Ensure close button always works for widget modal
  const widgetModal = document.getElementById("widgetModal");
  const widgetFrame = document.getElementById("widgetFrame");
  const closeButton = document.querySelector(".close-button");
  if (closeButton && widgetModal && widgetFrame) {
    closeButton.addEventListener("click", function () {
      widgetModal.style.display = "none";
      widgetFrame.src = "";
    });
  }

  // --- Category Modal Logic ---
  const categoryModal = document.getElementById("categoryModal");
  const categoryModalBody = document.getElementById("categoryModalBody");
  const categoryModalClose = document.querySelector(".category-modal-close");

  const widgetPaths = [
    "widgets/app-widget-1/widget.html",
    "widgets/widget2/index.html",
    "widgets/widget3/index.html",
    "widgets/widget4/index.html",
    "widgets/widget5/index.html",
  ];

  if (categoryModalClose) {
    categoryModalClose.addEventListener("click", function () {
      categoryModal.classList.remove("show");
      categoryModalBody.innerHTML = "";
    });
  }
  // Close modal if clicking outside content
  if (categoryModal) {
    categoryModal.addEventListener("click", function (e) {
      if (e.target === categoryModal) {
        categoryModal.classList.remove("show");
        categoryModalBody.innerHTML = "";
      }
    });
  }
  // --- END Category Modal Logic ------

  // --- Timeline Track Scroll Carousel Feature ---
  const timelineTrack = document.querySelector(".timeline-track");
  const topRow = document.querySelector(".timeline-row.top");
  const bottomRow = document.querySelector(".timeline-row.bottom");
  const scrollbar = document.querySelector(".timeline-scrollbar");
  const handle = document.querySelector(".timeline-scrollbar-handle");

  if (timelineTrack && topRow && bottomRow && scrollbar && handle) {
    let topOffset = 0;
    let bottomOffset = 0;
    let maxOffset = 0;
    let isLocked = false;
    let isDragging = false;

    const getScrollLimits = () => {
      const containerWidth = topRow.parentElement.clientWidth;
      const contentWidth = topRow.scrollWidth;
      const maxScroll = Math.max(0, contentWidth - containerWidth);
      maxOffset = maxScroll / 2; // Allow scrolling half left, half right from center
    };

    const updatePositions = (smooth = false) => {
      topRow.style.transition = smooth
        ? "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
        : "none";
      bottomRow.style.transition = smooth
        ? "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
        : "none";

      topOffset = Math.max(-maxOffset, Math.min(maxOffset, topOffset));
      bottomOffset = -topOffset;

      topRow.style.transform = `translateX(${topOffset}px)`;
      bottomRow.style.transform = `translateX(${bottomOffset}px)`;

      const scrollPercentage =
        maxOffset > 0 ? (topOffset + maxOffset) / (2 * maxOffset) : 0.5;
      const handleMaxMove = scrollbar.clientWidth - handle.clientWidth;
      handle.style.left = `${scrollPercentage * handleMaxMove}px`;
    };

    // Initial calculation
    getScrollLimits();
    updatePositions();

    // Double-click to lock/unlock
    handle.addEventListener("dblclick", () => {
      isLocked = !isLocked;
      handle.classList.toggle("locked", isLocked);
      if (isLocked) {
        showNotification("Timeline scroll is now LOCKED.");
      } else {
        showNotification("Timeline scroll is UNLOCKED.");
      }
    });

    timelineTrack.addEventListener(
      "wheel",
      (e) => {
        if (isLocked) return;
        e.preventDefault();
        const delta = e.deltaY || e.detail || e.wheelDelta;
        topOffset -= delta > 0 ? 40 : -40;
        updatePositions(true);
      },
      { passive: false }
    );

    handle.addEventListener("mousedown", () => {
      if (isLocked) return;
      isDragging = true;
      handle.style.cursor = "grabbing";
    });

    window.addEventListener("mouseup", () => {
      isDragging = false;
      handle.style.cursor = "grab";
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDragging || isLocked) return;
      const scrollbarRect = scrollbar.getBoundingClientRect();
      const handleMaxMove = scrollbarRect.width - handle.clientWidth;
      let newLeft = e.clientX - scrollbarRect.left - handle.clientWidth / 2;
      newLeft = Math.max(0, Math.min(handleMaxMove, newLeft));

      const scrollPercentage = newLeft / handleMaxMove;
      topOffset = scrollPercentage * 2 * maxOffset - maxOffset;
      updatePositions();
    });

    window.addEventListener("resize", () => {
      getScrollLimits();
      updatePositions();
    });
  }

  // --- Notification Modal Logic ---
  const notificationModal = document.getElementById("notificationModal");
  const notificationMessage = document.getElementById("notificationMessage");
  const notificationCloseBtn = document.querySelector(
    ".notification-close-btn"
  );
  const testNotificationBtn = document.getElementById("testNotificationBtn");

  let notificationTimer;

  function showNotification(message) {
    if (notificationTimer) clearTimeout(notificationTimer);

    notificationMessage.textContent = message;
    notificationModal.classList.add("show");

    notificationTimer = setTimeout(() => {
      hideNotification();
    }, 5000);
  }

  function hideNotification() {
    notificationModal.classList.remove("show");
  }

  if (notificationCloseBtn) {
    notificationCloseBtn.addEventListener("click", hideNotification);
  }

  if (testNotificationBtn) {
    testNotificationBtn.addEventListener("click", () => {
      showNotification("This is a test notification!");
    });
  }
});
