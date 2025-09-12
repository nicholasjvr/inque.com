/**
 * Profile Hub State Management - Usage Examples
 *
 * This file demonstrates how to use the ProfileHub state management system
 * to handle position changes and modal accessibility.
 */

// ===== BASIC USAGE =====

// Listen for position changes
const unsubscribePosition = window.ProfileHubEvents.onPositionChange(
  (event) => {
    console.log("Profile hub moved to:", event.position);
    console.log("Previous position was:", event.previousPosition);

    // Update your UI based on the new position
    updateMyUIForPosition(event.position);
  }
);

// Listen for state changes (expanded, minimized, etc.)
const unsubscribeState = window.ProfileHubEvents.onStateChange((event) => {
  console.log("Profile hub state changed:", event.changes);

  // React to state changes
  if (event.changes.ui?.hubState === "expanded") {
    console.log("Hub is now expanded");
  }
});

// ===== ADVANCED USAGE =====

// Check current state
const currentPosition = window.ProfileHubEvents.getCurrentPosition();
const currentState = window.ProfileHubEvents.getCurrentState();
const isExpandedOpen = window.ProfileHubEvents.isModalOpen("expanded");

console.log("Current position:", currentPosition);
console.log("Current state:", currentState);
console.log("Is expanded modal open:", isExpandedOpen);

// ===== CUSTOM COMPONENT INTEGRATION =====

class MyCustomComponent {
  constructor() {
    this.setupPositionListener();
  }

  setupPositionListener() {
    // Listen for position changes
    this.positionUnsubscribe = window.ProfileHubEvents.onPositionChange(
      (event) => {
        this.handlePositionChange(event.position);
      }
    );

    // Listen for modal state changes
    this.stateUnsubscribe = window.ProfileHubEvents.onStateChange((event) => {
      this.handleStateChange(event.changes);
    });
  }

  handlePositionChange(newPosition) {
    console.log("[MyCustomComponent] Position changed to:", newPosition);

    // Update component based on position
    switch (newPosition) {
      case "top-left":
        this.positionForTopLeft();
        break;
      case "top-right":
        this.positionForTopRight();
        break;
      case "bottom-left":
        this.positionForBottomLeft();
        break;
      case "bottom-right":
        this.positionForBottomRight();
        break;
    }
  }

  handleStateChange(changes) {
    if (changes.ui?.hubState) {
      console.log(
        "[MyCustomComponent] Hub state changed to:",
        changes.ui.hubState
      );

      // React to modal openings/closings
      if (changes.ui.hubState === "expanded") {
        this.onHubExpanded();
      } else if (changes.ui.hubState === "minimized") {
        this.onHubMinimized();
      }
    }
  }

  positionForTopLeft() {
    // Adjust your component for top-left position
    console.log("Positioning component for top-left hub");
  }

  positionForTopRight() {
    // Adjust your component for top-right position
    console.log("Positioning component for top-right hub");
  }

  positionForBottomLeft() {
    // Adjust your component for bottom-left position
    console.log("Positioning component for bottom-left hub");
  }

  positionForBottomRight() {
    // Adjust your component for bottom-right position
    console.log("Positioning component for bottom-right hub");
  }

  onHubExpanded() {
    // Handle when hub expands
    console.log("Hub expanded - adjusting component visibility");
  }

  onHubMinimized() {
    // Handle when hub minimizes
    console.log("Hub minimized - restoring component state");
  }

  destroy() {
    // Clean up listeners
    if (this.positionUnsubscribe) {
      this.positionUnsubscribe();
    }
    if (this.stateUnsubscribe) {
      this.stateUnsubscribe();
    }
  }
}

// ===== UTILITY FUNCTIONS =====

function updateMyUIForPosition(position) {
  // Example: Update a custom element based on hub position
  const myElement = document.getElementById("myCustomElement");
  if (myElement) {
    myElement.className = myElement.className.replace(/position-\w+/g, "");
    myElement.classList.add(`position-${position}`);
  }
}

function adjustModalForPosition(modalElement, position) {
  // Example: Adjust a custom modal based on hub position
  if (!modalElement) return;

  const configs = {
    "top-left": { top: "100%", left: "0", right: "auto", bottom: "auto" },
    "top-right": { top: "100%", right: "0", left: "auto", bottom: "auto" },
    "bottom-left": { top: "auto", left: "0", right: "auto", bottom: "100%" },
    "bottom-right": { top: "auto", right: "0", left: "auto", bottom: "100%" },
  };

  const config = configs[position];
  if (config) {
    Object.keys(config).forEach((property) => {
      modalElement.style[property] = config[property];
    });
  }
}

// ===== CLEANUP =====

// Don't forget to clean up listeners when your component is destroyed
function cleanup() {
  unsubscribePosition();
  unsubscribeState();
}

// ===== DEBUGGING =====

// Debug function to test position changes
function testPositionChanges() {
  const positions = ["top-left", "top-right", "bottom-left", "bottom-right"];
  let currentIndex = 0;

  const interval = setInterval(() => {
    const position = positions[currentIndex];
    console.log("Testing position:", position);

    // Use the debug function to change position
    window.resetProfileBannerPosition(position);

    currentIndex = (currentIndex + 1) % positions.length;
  }, 2000);

  // Stop after one cycle
  setTimeout(() => {
    clearInterval(interval);
    console.log("Position testing complete");
  }, 8000);
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    MyCustomComponent,
    updateMyUIForPosition,
    adjustModalForPosition,
    testPositionChanges,
  };
}
