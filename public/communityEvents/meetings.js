const params = new URLSearchParams(window.location.search);
const roomUrl = params.get("room");
const meetingId = params.get("meetingId");
const hostToken = params.get("token");
if (!roomUrl) {
  alert("No meeting URL provided");
  throw new Error("Missing room URL");
}

const meRes = await fetch("/me", { credentials: "include" });
const { id: currentUserId } = await meRes.json();


const dataRes = await fetch(`/meetings/${meetingId}/data`, {
  credentials: "include",
});
const { hostId } = await dataRes.json();



const callFrame = window.DailyIframe.createFrame({
  showLeaveButton: true,
  iframeStyle: {
    width: "100%",
    height: "100%",
  },
});

const container = document.getElementById("callFrame");
container.innerHTML = "";
container.appendChild(callFrame.iframe());

// Join the call (with hostToken if any)
if (hostToken) {
  callFrame.join({ url: roomUrl, token: hostToken }).catch(console.error);
} else {
  callFrame.join({ url: roomUrl }).catch(console.error);
}

// Participant list rendering
function renderParticipants(participants) {
  const list = document.getElementById("participantList");
  list.innerHTML = "";
  Object.values(participants).forEach((p) => {
    const li = document.createElement("li");
    li.className = "flex justify-between items-center";
    li.textContent = p.user_name || p.session_id;
    if (currentUserId === hostId && !p.local) {
      const btn = document.createElement("button");
      btn.textContent = "Kick";
      btn.className = "ml-2 px-2 py-1 text-sm bg-red-500 text-white rounded";
      btn.onclick = () => callFrame.updateParticipant(p.session_id, { eject: true });
      li.appendChild(btn);
    }
    list.appendChild(li);
  });
}

callFrame.on("joined-meeting", () => {
  renderParticipants(callFrame.participants());
});
callFrame.on("participant-joined", () => {
  renderParticipants(callFrame.participants());
});
callFrame.on("participant-left", () => {
  renderParticipants(callFrame.participants());
});
callFrame.on("participant-updated", () => {
  renderParticipants(callFrame.participants());
});

const qrButton = document.getElementById("qrButton");
const qrPopup = document.getElementById("qrPopupCanvas");
qrButton.addEventListener("click", () => {
  if (qrPopup.classList.contains("hidden")) {
    QRCode.toCanvas(qrPopup, roomUrl, { width: 200 }).catch(console.error);
    qrPopup.classList.remove("hidden");
    qrButton.textContent = "Hide QR Code";
  } else {
    qrPopup.classList.add("hidden");
    qrButton.textContent = "Show QR Code";
  }
});

document.getElementById("backButton").addEventListener("click", () => {
  window.location.href = "/events.html";
});