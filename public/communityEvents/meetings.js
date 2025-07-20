const params = new URLSearchParams(window.location.search);
const roomUrl = params.get("room");
const hostToken = params.get("token");


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


function renderParticipants(participants) {
  const list = document.getElementById("participantList");   
  list.innerHTML = ""; // Clear current list

  Object.values(participants).forEach((participant) => {
    const li = document.createElement("li");
    li.textContent = participant.user_name || participant.session_id;

    // Add "Kick" button if you're the meeting owner
    if (isHost && participant.local === false) {
      const btn = document.createElement("button");
      btn.textContent = "Kick";
      btn.className = "ml-2 px-2 py-1 text-sm bg-red-500 text-white rounded";
      btn.onclick = () => {
        callFrame.updateParticipant(participant.session_id, { eject: true });
      };
      li.appendChild(btn);
    }

    list.appendChild(li);
  });
}

const isHost = true; // TEMP: just assume true for now

// Update list on join/leave/update
callFrame.on("participant-joined", (e) => {
  renderParticipants(callFrame.participants());
});
callFrame.on("participant-left", (e) => {
  renderParticipants(callFrame.participants());
});
callFrame.on("participant-updated", (e) => {
  renderParticipants(callFrame.participants());
});

// Also update once after joining
callFrame.on("joined-meeting", () => {
  renderParticipants(callFrame.participants());
});
