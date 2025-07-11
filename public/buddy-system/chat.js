window.addEventListener("DOMContentLoaded", () => {
  // Load chat list when the page is ready
  loadChatList();
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
            loadChatMessages(1, 1, friendName);
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
const loadChatMessages = async (conversationId, friendID, friendName) => {
  const chatHeaderName = document.getElementById("chatHeaderName");
  chatHeaderName.innerText = friendName;
};
