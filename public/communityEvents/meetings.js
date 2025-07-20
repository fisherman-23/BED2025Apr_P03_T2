const params = new URLSearchParams(window.location.search);
const roomUrl = params.get("room");
if (!roomUrl) {
  alert("No meeting URL provided");
  throw new Error("Missing room URL");
}

const linkEl = document.getElementById("meetingLink");
linkEl.href = roomUrl;
linkEl.textContent = roomUrl;

//generate qrcode with cdn
const canvas = document.getElementById("qrCanvas");
QRCode.toCanvas(canvas, roomUrl).catch((err) => {
  console.error("QR code generation failed:", err);
});

// init daily call frame
const callFrame = window.DailyIframe.createFrame({
  parentElement: document.getElementById("callFrame"),
  showLeaveButton: true,
  iframeStyle: { width: "100%", height: "100%" },
});


callFrame.join({ url: roomUrl }).catch(console.error); // joins the room
