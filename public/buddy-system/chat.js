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
        messages.length > 0
          ? messages[messages.length - 1].IsDeleted
            ? {
                Content: "This message was deleted",
                SentAt: messages[messages.length - 1].SentAt,
              }
            : messages[messages.length - 1]
          : null;

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
  <div class="flex flex-row items-center w-full gap-2 overflow-hidden">
    <div class="flex flex-col min-w-0">
      <p class="text-lg font-semibold">${friendName}</p>
      <p class="text-sm text-gray-500 truncate">${messagePreview}</p>
    </div>
    <p class="text-sm text-gray-400 whitespace-nowrap ml-auto">${messageTime}</p>
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
  friendID = parseInt(friendID, 10);
  conversationId = parseInt(conversationId, 10);
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

    // Add messages to smartReply function
    const messageContentWithUsernames = messages.map((msg) => ({
      Content: msg.Content,
      SenderID: msg.SenderID,
      SenderName: msg.SenderID === friendID ? friendName : "You",
      IsDeleted: msg.IsDeleted,
    }));
    const smartReplyButton = document.getElementById("smartReplyButton");
    smartReplyButton.onclick = () => smartReply(messageContentWithUsernames);

    // Render each message
    messages.forEach((message) => {
      const wrapper = document.createElement("div");
      wrapper.className =
        message.SenderID === friendID
          ? "flex justify-start mb-2"
          : "flex justify-end mb-2";

      const innerHTML = message.IsDeleted
        ? `
    <div class="bg-gray-200 p-4 rounded-2xl max-w-xs">
      <p class="text-gray-500 italic">This message was deleted</p>
      <p class="text-sm text-gray-400 text-right">${formatTime(message.SentAt)}</p>
    </div>
  `
        : message.SenderID === friendID
          ? `
      <div class="bg-white p-4 rounded-2xl max-w-xs">
        <p class="text-gray-700"><strong>${friendName}:</strong> ${message.Content}</p>
        <p class="text-sm text-gray-400 text-right">${formatTime(message.SentAt)}</p>
      </div>
    `
          : `
      <div class="bg-blue-100 p-4 rounded-2xl max-w-xs relative pr-10">
        <button class="absolute top-2 right-2 text-gray-400 hover:text-red-500"
          onclick="deleteMessage('${message.ID}', '${conversationId}', '${friendID}', '${friendName}')"
          title="Delete message">
          <!-- SVG here -->
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M27 6H22V5C22 4.20435 21.6839 3.44129 21.1213 2.87868C20.5587 2.31607 19.7956 2 19 2H13C12.2044 2 11.4413 2.31607 10.8787 2.87868C10.3161 3.44129 10 4.20435 10 5V6H5C4.73478 6 4.48043 6.10536 4.29289 6.29289C4.10536 6.48043 4 6.73478 4 7C4 7.26522 4.10536 7.51957 4.29289 7.70711C4.48043 7.89464 4.73478 8 5 8H6V26C6 26.5304 6.21071 27.0391 6.58579 27.4142C6.96086 27.7893 7.46957 28 8 28H24C24.5304 28 25.0391 27.7893 25.4142 27.4142C25.7893 27.0391 26 26.5304 26 26V8H27C27.2652 8 27.5196 7.89464 27.7071 7.70711C27.8946 7.51957 28 7.26522 28 7C28 6.73478 27.8946 6.48043 27.7071 6.29289C27.5196 6.10536 27.2652 6 27 6ZM12 5C12 4.73478 12.1054 4.48043 12.2929 4.29289C12.4804 4.10536 12.7348 4 13 4H19C19.2652 4 19.5196 4.10536 19.7071 4.29289C19.8946 4.48043 20 4.73478 20 5V6H12V5ZM24 26H8V8H24V26ZM14 13V21C14 21.2652 13.8946 21.5196 13.7071 21.7071C13.5196 21.8946 13.2652 22 13 22C12.7348 22 12.4804 21.8946 12.2929 21.7071C12.1054 21.5196 12 21.2652 12 21V13C12 12.7348 12.1054 12.4804 12.2929 12.2929C12.4804 12.1054 12.7348 12 13 12C13.2652 12 13.5196 12.1054 13.7071 12.2929C13.8946 12.4804 14 12.7348 14 13ZM20 13V21C20 21.2652 19.8946 21.5196 19.7071 21.7071C19.5196 21.8946 19.2652 22 19 22C18.7348 22 18.4804 21.8946 18.2929 21.7071C18.1054 21.5196 18 21.2652 18 21V13C18 12.7348 18.1054 12.4804 18.2929 12.2929C18.4804 12.1054 18.7348 12 19 12C19.2652 12 19.5196 12.1054 19.7071 12.2929C19.8946 12.4804 20 12.7348 20 13Z" fill="#343330"/>
          </svg>
        </button>
        <p class="text-gray-700"><strong>You:</strong> ${message.Content}</p>
        <p class="text-sm text-gray-400 text-right">${formatTime(message.SentAt)}</p>
      </div>
    `;

      wrapper.innerHTML = innerHTML;
      chatMessages.appendChild(wrapper);
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

    friendsData.forEach((friend) => {
      const friendItem = document.createElement("div");
      friendItem.className =
        "friend-item flex items-center p-2 rounded-lg hover:bg-gray-200 cursor-pointer justify-center bg-gray-100";
      friendItem.innerHTML = `
        <span class="text-center">${friend.Name}</span>
      `;
      friendItem.onclick = () => {
        createChat(friend.FriendID);
      };
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
    // Reload page, not just reload chat list
    window.location.reload();
  } catch (err) {
    console.error("Error creating chat:", err);
    alert("Failed to create chat: " + err.message);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const chatList = document.getElementById("chatList");

  // Reusable search function
  function filterChats() {
    const query = searchInput.value.toLowerCase();
    const cards = chatList.querySelectorAll("div.flex-row");

    cards.forEach((card) => {
      const nameElement = card.querySelector("p.text-lg");
      if (!nameElement) return; // skip if name not found

      const name = nameElement.textContent.toLowerCase();
      if (name.includes(query)) {
        card.style.display = "flex"; // show match
      } else {
        card.style.display = "none"; // hide non-match
      }
    });
  }

  // Trigger search on button click or Enter key
  searchButton.addEventListener("click", filterChats);
  searchInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      filterChats();
    }
  });
});

async function deleteMessage(messageId, conversationId, friendID, friendName) {
  if (!confirm("Are you sure you want to delete this message?")) return;

  try {
    const response = await fetch(`/messages/${messageId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to delete message");
    // Reload the chat messages after deletion
    loadChatMessages(conversationId, friendID, friendName);
    console.log("Message deleted successfully");
  } catch (err) {
    console.error("Error deleting message:", err);
  }
}

async function smartReply(content) {
  const messageInput = document.getElementById("messageInput");
  const smartReplyStatus = document.getElementById("smartReplyStatus");
  const smartReplyButton = document.getElementById("smartReplyButton");
  smartReplyButton.disable = true; // Disable button while generating reply
  smartReplyStatus.classList.remove("hidden");

  // Get up to last 3 messages from the chat
  if (!Array.isArray(content) || content.length === 0) {
    console.error("No messages available for smart reply");
    return;
  }
  content = content
    .slice(-3)
    .map((msg) =>
      msg.IsDeleted
        ? `${msg.SenderName}: This message was deleted`
        : `${msg.SenderName}: ${msg.Content}`
    )
    .join(";");
  if (!content) {
    console.error("No content available for smart reply");
    return;
  }
  try {
    const response = await fetch("/smart-reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error("Failed to get smart reply");
    const reply = await response.json();
    console.log("Smart reply received:", reply);
    const smartReplyText = reply.suggestions.replace(/^"|"$/g, "").trim();
    messageInput.value = smartReplyText; // Set the smart reply in the input
    smartReplyButton.disable = false; // Re-enable button

    smartReplyStatus.classList.add("hidden"); // Hide status message
  } catch (err) {
    console.error("Error getting smart reply:", err);
  }
}
