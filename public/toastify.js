function toastError(message) {
  Toastify({
    node: createToastNode(message, "#f56565"),
    duration: 3000,
    gravity: "top",
    position: "right",
    stopOnFocus: true,
    close: true,
    style: {
      borderRadius: "12px",
      paddingBottom: "6px",
      zIndex: 9999,
    },
    className: "toastify-with-timer",
  }).showToast();
}

function toastSuccess(message) {
  Toastify({
    node: createToastNode(message, "#48bb78"),
    duration: 3000,
    gravity: "top",
    position: "right",
    stopOnFocus: true,
    close: true,
    style: {
      borderRadius: "12px",
      paddingBottom: "6px",
      zIndex: 9999,
    },
    className: "toastify-with-timer",
  }).showToast();
}

// Helper function to create toast content with timer bar
function createToastNode(message, bgColor) {
  const container = document.createElement("div");
  container.style.position = "relative";

  const text = document.createElement("div");
  text.textContent = message;
  container.appendChild(text);

  return container;
}



window.toastError = toastError;
window.toastSuccess = toastSuccess;
