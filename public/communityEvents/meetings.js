const params = new URLSearchParams(window.location.search);
const roomUrl = params.get("room");
const meetingId = params.get("meetingId");
const hostToken = params.get("token");
if (!roomUrl) {
  alert("No meeting URL provided");
  throw new Error("Missing room URL");
}

let currentUserId = null;
let currentUserName = null;
let isAuthenticated = false;

try {
  const meRes = await fetch("/me", { credentials: "include" });
  if (meRes.ok) {
    const userData = await meRes.json();
    currentUserId = userData.id;
    currentUserName = userData.name || 
      userData.firstName ||
      (userData.username ? userData.username.split('@')[0] : null);
    isAuthenticated = true;
  } else {
    throw new Error("Not authenticated");
  }
} catch (error) {
  console.log("User not authenticated, will use Daily.co pre-join UI");
  isAuthenticated = false;
}


const dataRes = await fetch(`/meetings/${meetingId}/data`, {
  credentials: "include",
});
let hostId = null;
let meetingName = null;
if (dataRes.ok) {
  const data = await dataRes.json();
  hostId = data.hostId;
  meetingName = data.roomName;
}



const callFrame = window.DailyIframe.createFrame({
  showLeaveButton: true,
  showFullscreenButton: true,
  iframeStyle: {
    width: "100%",
    height: "100%",
  },
});

const container = document.getElementById("callFrame");
container.innerHTML = "";
container.appendChild(callFrame.iframe());

if (isAuthenticated) {
  // Authenticated users join directly with their name
  if (hostToken) {
    callFrame.join({ 
      url: roomUrl, 
      token: hostToken,
      userName: currentUserName
    }).catch(console.error);
  } else {
    callFrame.join({ 
      url: roomUrl,
      userName: currentUserName
    }).catch(console.error);
  }
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
    
    let displayName = p.user_name;
    if (!displayName || displayName === p.session_id) {
      displayName = "User";
    }
    li.textContent = displayName;
    
    // Only show kick button if current user is authenticated and is the host
    if (currentUserId && hostId && currentUserId === hostId && !p.local) {
      const btn = document.createElement("button");
      btn.textContent = "Kick";
      btn.className = "ml-2 px-2 py-1 text-sm bg-red-500 text-white rounded";
      btn.onclick = () => callFrame.updateParticipant(p.session_id, { eject: true });
      li.appendChild(btn);
    }
    list.appendChild(li);
  });
}

callFrame.on("joined-meeting", (event) => {
  // For non-authenticated users, get their name from the join event
  if (!isAuthenticated && event.participants.local.user_name) {
    currentUserName = event.participants.local.user_name;
  }
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
    
    const meetingNameDiv = document.getElementById("meetingNameDisplay");
    if (meetingName && meetingNameDiv) {
      meetingNameDiv.textContent = `Meeting Name: ${meetingName}`;
      meetingNameDiv.classList.remove("hidden");
    }
  } else {
    qrPopup.classList.add("hidden");
    qrButton.textContent = "Show QR Code";
    




    const meetingNameDiv = document.getElementById("meetingNameDisplay");
    if (meetingNameDiv) {
      meetingNameDiv.classList.add("hidden");
    }
  }
});

document.getElementById("backButton").addEventListener("click", () => {
  window.location.href = "/events.html";
});