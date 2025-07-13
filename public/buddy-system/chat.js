window.addEventListener("DOMContentLoaded", () => {
  messageInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendButton.click();
    }
  });
  // Load chat list when the page is ready
  loadChatList();
  document.getElementById("close-btn-1").addEventListener("click", () => {
    event.stopPropagation(); // stops it from triggering parent's onclick
    console.log("Close button 1 clicked");
    document.getElementById("popup").classList.add("hidden");
    document.getElementById("popupContent1").classList.add("hidden");
  });

  document.getElementById("close-btn-2")?.addEventListener("click", () => {
    event.stopPropagation(); // stops it from triggering parent's onclick
    document.getElementById("popup").classList.add("hidden");
    document.getElementById("popupContent2").classList.add("hidden");
  });

  const popup = document.getElementById("popup");

  popup.addEventListener("click", (event) => {
    // If click target is exactly the overlay (popup div), close popup
    if (event.target === popup) {
      console.log("Popup background clicked");
      popup.classList.add("hidden");
      document.getElementById("popupContent1").classList.add("hidden");
      document.getElementById("popupContent2").classList.add("hidden");
    }
  });
});

function formatTime(dateString) {
  const date = new Date(dateString);
  const options = { hour: "2-digit", minute: "2-digit", hour12: true };
  return date.toLocaleTimeString([], options);
}
// Load and render chat list
async function loadChatList() {
  const chatListEl = document.getElementById("chatList");
  chatListEl.innerHTML = ""; // clear existing

  try {
    const convoRes = await fetch("/conversations", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }).then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response;
    });
    if (!convoRes.ok) throw new Error("Failed to load conversations");
    const conversations = await convoRes.json();

    // 2. For each convo, fetch messages and get last message
    for (const convo of conversations) {
      const messagesRes = await fetch(`/conversations/${convo.ID}/messages`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      if (!messagesRes.ok) throw new Error("Failed to load messages");
      const messages = await messagesRes.json();

      // Get last message (or placeholder if no messages)
      const lastMessage =
        messages.length > 0 ? messages[messages.length - 1] : null;

      // Determine friend's info (the other user in conversation)

      fetch("/me", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch current user info");
          }
          return response.json();
        })
        .then((currentUser) => {
          console.log(convo);
          console.log(currentUser);
          console.log(convo.User1ID === currentUser.ID);
          const friendId =
            convo.User1ID === currentUser.id ? convo.User2ID : convo.User1ID;
          const friendName =
            convo.User1ID === currentUser.id
              ? convo.User2Name
              : convo.User1Name;
          const friendProfilePic = "/assets/images/elderlyPFP.png"; // placeholder

          // Message content and time or "Read" status text (adjust as needed)
          const messagePreview = lastMessage
            ? lastMessage.Content
            : "No messages yet";
          const messageTime = lastMessage ? formatTime(lastMessage.SentAt) : "";

          // Build chat item HTML
          const chatItem = document.createElement("div");
          chatItem.onclick = () => {
            // Deselect all other chat items
            document.querySelectorAll(".chat-item").forEach((item) => {
              item.classList.remove("bg-gray-200");
              item.classList.add("bg-gray-100");
            });
            // Select the clicked one
            chatItem.classList.remove("bg-gray-100");
            chatItem.classList.add("bg-gray-200");
            loadChatMessages(convo.ID, friendId, friendName);
          };
          chatItem.className =
            "flex flex-row bg-gray-100 p-4 rounded-2xl items-center gap-4 chat-item cursor-pointer";

          chatItem.innerHTML = `
        <img src="${friendProfilePic}" alt="Friend's Profile Picture"
          class="w-16 h-16 rounded-full object-cover">
        <div class="flex flex-row items-center w-full">
          <div class="flex flex-col">
            <p class="text-lg font-semibold">${friendName}</p>
            <p class="text-sm text-gray-500 truncate max-w-xs">${messagePreview}</p>
          </div>
          <p class="text-sm text-gray-400 ml-auto self-end">${messageTime}</p>
        </div>
      `;

          chatListEl.appendChild(chatItem);
        });
    }
  } catch (err) {
    chatListEl.innerHTML = `<p class="text-red-500">Error loading chats: ${err.message}</p>`;
  }
}
async function loadChatMessages(conversationId, friendID, friendName) {
  const chatHeaderName = document.getElementById("chatHeaderName");
  const messageInputContainer = document.getElementById(
    "messageInputContainer"
  );
  const chatHeaderMessage = document.getElementById("chatHeaderMessage");
  const infoButton = document.getElementById("infoButton");
  infoButton.onclick = () => {
    openPopup("popupContent2", { conversationId, friendID, friendName });
  };
  chatHeaderName.innerText = friendName;
  const chatMessages = document.getElementById("chatMessages");
  chatMessages.innerHTML = ""; // Clear existing messages
  const sendButton = document.getElementById("sendButton");
  const messageInput = document.getElementById("messageInput");
  // Remove any existing event listeners to prevent duplicates
  messageInput.removeEventListener("keyup", sendMessage);
  // Remove any existing onclick handlers
  sendButton.onclick = null;

  sendButton.onclick = () => sendMessage(conversationId, friendID, friendName);

  try {
    const messagesRes = await fetch(
      `/conversations/${conversationId}/messages`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );
    if (!messagesRes.ok) throw new Error("Failed to load messages");
    const messages = await messagesRes.json();
    infoButton.classList.remove("hidden"); // Show info button
    messageInputContainer.classList.remove("hidden"); // Show message input
    chatHeaderMessage.classList.add("hidden"); // Hide default message
    // Render each message
    messages.forEach((message) => {
      const messageEl = document.createElement("div");
      messageEl.className = "message";
      if (message.SenderID === friendID) {
        messageEl.innerHTML = `
    <div class="flex justify-start mb-2">
      <div class="bg-white p-4 rounded-2xl max-w-xs">
        <p class="text-gray-700"><strong>${friendName}:</strong> ${message.Content}</p>
        <p class="text-sm text-gray-400 text-right">${formatTime(message.SentAt)}</p>
      </div>
    </div>
            `;
      } else {
        messageEl.innerHTML = `
    <div class="flex justify-end mb-2">
      <div class="bg-blue-100 p-4 rounded-2xl max-w-xs">
        <p class="text-gray-700"><strong>You:</strong> ${message.Content}</p>
        <p class="text-sm text-gray-400 text-right">${formatTime(message.SentAt)}</p>
      </div>
    </div>
            `;
      }

      chatMessages.appendChild(messageEl);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  } catch (err) {
    chatMessages.innerHTML = `<p class="text-red-500">Error loading messages: ${err.message}</p>`;
  }
}

async function sendMessage(conversationId, friendID, friendName) {
  const messageInput = document.getElementById("messageInput");
  const content = messageInput.value.trim();
  if (!content) return;

  try {
    const response = await fetch(`/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error("Failed to send message");
    messageInput.value = "";
    loadChatMessages(conversationId, friendID, friendName);
  } catch (err) {
    console.error("Error sending message:", err);
  }
}

function openPopup(contentId, optionalData) {
  console.log("Opening popup with content ID:", contentId);
  const popup = document.getElementById("popup");
  const contents = document.querySelectorAll(
    '#popup > div[id^="popupContent"]'
  );

  popup.classList.remove("hidden");

  // Hide all popup contents
  contents.forEach((c) => c.classList.add("hidden"));

  // Show the one you want
  document.getElementById(contentId).classList.remove("hidden");

  if (contentId === "popupContent2") {
    conversationInfo(optionalData); // Load conversation info if needed
  }
  if (contentId === "popupContent1") {
    // Load friends list for creating new chat
    showFriendsList();
  }
}

async function conversationInfo(conversationObj) {
  const recipientSpan = document.getElementById("recipient");
  const creationDateSpan = document.getElementById("creation-date");

  // Fetch conversation details
  try {
    const response = await fetch("/conversations", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch conversations");
    const conversations = await response.json();

    if (conversations.length > 0) {
      const convo = conversations[0];
      recipientSpan.innerText = conversationObj.friendName;
      creationDateSpan.innerText = new Date(convo.CreatedAt).toLocaleString();
    }
  } catch (err) {
    console.error("Error fetching conversation info:", err);
  }
}

async function showFriendsList() {
  const friendsList = document.getElementById("friendsList");
  friendsList.innerHTML = ""; // Clear existing list
  try {
    const response = await fetch("/friends", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch friends list");
    const friends = await response.json();
    const friendsData = friends.friends || [];
    console.log("Friends fetched:", friends);

    friendsData.forEach((friend) => {
      const friendItem = document.createElement("div");
      friendItem.className =
        "friend-item flex items-center p-2 rounded-lg hover:bg-gray-200 cursor-pointer justify-center bg-gray-100";
      friendItem.innerHTML = `
        <span class="text-center">${friend.Name}</span>
      `;

      friendsList.appendChild(friendItem);
    });
  } catch (err) {
    console.error("Error loading friends list:", err);
  }
}

async function createChat(friendId) {
  try {
    const response = await fetch("/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ otherUserId: friendId }),
    });
    if (!response.ok) throw new Error("Failed to create chat");
    const conversation = await response.json();
    console.log("Chat created:", conversation);
    loadChatList(); // Refresh chat list
    document.getElementById("popup").classList.add("hidden");
    document.getElementById("popupContent1").classList.add("hidden");
  } catch (err) {
    console.error("Error creating chat:", err);
  }
}
