// Add banner activation button for minimized state
function addBannerActivationButton() {
  DEBUG.log("Adding banner activation button");

  try {
    // Check if activation button already exists
    if (document.getElementById("bannerActivationBtn")) {
      return;
    }

    const header = document.querySelector("header");
    if (!header) {
      DEBUG.warn("Header not found for activation button");
      return;
    }

    // Create activation button
    const activationBtn = document.createElement("button");
    activationBtn.id = "bannerActivationBtn";
    activationBtn.innerHTML = "🔗";
    activationBtn.title = "Expand Profile Banner";
    activationBtn.style.cssText = `
      width: 40px;
      height: 40px;
      background: rgba(0, 255, 255, 0.2);
      border: 2px solid var(--primary-neon);
      border-radius: 50%;
      color: var(--primary-neon);
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      animation: pulse 2s infinite;
      margin-left: 20px;
    `;

    // Add hover effects
    activationBtn.addEventListener("mouseenter", () => {
      activationBtn.style.background = "rgba(0, 255, 255, 0.3)";
      activationBtn.style.transform = "scale(1.1)";
      activationBtn.style.boxShadow = "0 0 20px rgba(0, 255, 255, 0.5)";
    });

    activationBtn.addEventListener("mouseleave", () => {
      activationBtn.style.background = "rgba(0, 255, 255, 0.2)";
      activationBtn.style.transform = "scale(1)";
      activationBtn.style.boxShadow = "none";
    });

    // Add click handler
    activationBtn.addEventListener("click", () => {
      DEBUG.log("Activating banner from minimized state");

      updateBannerState("visible", false);

      // Remove activation button
      activationBtn.remove();

      // Show success message
      if (window.showToast) {
        window.showToast("Profile banner expanded! 🔗", "success", 2000);
      }
    });

    // Add to header navigation area (middle section)
    const headerContent = header.querySelector('div[style*="display: flex"]');
    if (headerContent) {
      const nav = headerContent.querySelector("nav");
      if (nav) {
        nav.appendChild(activationBtn);
      } else {
        const titleSection = headerContent.querySelector(
          'div[style*="display: flex"][style*="align-items: center"]'
        );
        if (titleSection) {
          titleSection.appendChild(activationBtn);
        } else {
          headerContent.appendChild(activationBtn);
        }
      }
    } else {
      header.appendChild(activationBtn);
    }

    DEBUG.log("Banner activation button added successfully");
  } catch (error) {
    DEBUG.error("Error adding banner activation button", error);
  }
}
