let allFriends = [];
let allRequests = [];
let activeFilter = "all"; // 'all', 'friends', 'requests'

// --- Render friends and requests based on active filter ---
const renderFriendsAndRequests = () => {
  const container = document.getElementById("friends-requests-list");
  container.innerHTML = ""; // Clear previous content

  if (activeFilter === "all" || activeFilter === "friends") {
    allFriends.forEach((friend) => {
      const card = document.createElement("div");
      card.className =
        "flex flex-row bg-gray-100 p-4 rounded-2xl items-center gap-4";

      card.innerHTML = `
        <img src="/assets/images/elderlyPFP.png" alt="Friend's Profile Picture"
          class="w-16 h-16 rounded-full mr-4 object-cover">
        <div class="flex flex-col">
          <p class="text-lg font-semibold">${friend.Name}</p>
          <p class="text-sm text-gray-500">Friends since ${friend.CreatedAt || "recently"}</p>
        </div>
        <button class="ml-auto bg-[#D7E961] text-black px-4 py-2 rounded-xl">Remove</button>
      `;

      card.querySelector("button").addEventListener("click", async () => {
        if (!confirm(`Remove ${friend.Name} as a buddy?`)) return;

        try {
          const response = await fetch(`/friends/${friend.FriendID}`, {
            method: "DELETE",
            credentials: "include",
          });

          const data = await response.json();
          if (response.ok) {
            alert(`Removed ${friend.Name} successfully.`);
            testAll(); // Refresh both lists
          } else {
            alert(`Error: ${data.message || "Something went wrong"}`);
          }
        } catch (err) {
          console.error("Failed to remove friend:", err);
          alert("Network error. Try again later.");
        }
      });

      container.appendChild(card);
    });
  }

  if (activeFilter === "all" || activeFilter === "requests") {
    allRequests.forEach((request) => {
      const card = document.createElement("div");
      card.className =
        "flex flex-row bg-gray-100 p-4 rounded-2xl items-center gap-4";

      card.innerHTML = `
        <img src="/assets/images/elderlyPFP.png" alt="Profile Picture"
          class="w-16 h-16 rounded-full mr-4 object-cover">
        <div class="flex flex-col">
          <p class="text-lg font-semibold">${request.Name}</p>
          <p class="text-sm text-gray-500">Pending</p>
        </div>
        <div class="ml-auto flex gap-2">
          <button class="accept-btn bg-lime-600 text-white px-4 py-2 rounded-xl">Accept</button>
          <button class="reject-btn bg-red-500 text-white px-4 py-2 rounded-xl">Reject</button>
        </div>
      `;

      card.querySelector(".accept-btn").addEventListener("click", async () => {
        try {
          const res = await fetch(`/friend-requests/${request.ID}/accept`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });

          const data = await res.json();
          if (res.ok) {
            alert(`Accepted ${request.Name}`);
            testAll(); // Refresh after action
          } else {
            alert(`Error: ${data.message}`);
          }
        } catch (err) {
          console.error(err);
          alert("Failed to accept request.");
        }
      });

      card.querySelector(".reject-btn").addEventListener("click", async () => {
        try {
          const res = await fetch(`/friendRequests/${request.ID}/reject`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });

          const data = await res.json();
          if (res.ok) {
            alert(`Rejected ${request.Name}`);
            testAll();
          } else {
            alert(`Error: ${data.message}`);
          }
        } catch (err) {
          console.error(err);
          alert("Failed to reject request.");
        }
      });

      container.appendChild(card);
    });
  }
};

// --- Fetch both friends and requests ---
const testAll = async () => {
  try {
    const [friendsRes, requestsRes] = await Promise.all([
      fetch("/friends", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }),
      fetch("/friend-requests", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }),
    ]);

    if (!friendsRes.ok || !requestsRes.ok) throw new Error("Fetch failed");

    const friendsData = await friendsRes.json();
    const requestsData = await requestsRes.json();

    allFriends = friendsData.friends || [];
    allRequests = requestsData.incoming || [];

    renderFriendsAndRequests();
  } catch (err) {
    console.error("Failed to load data:", err);
    alert("Could not load friends and requests");
  }
};

// --- Optional: Filter buttons ---
document.querySelectorAll(".filter-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    console.log("Filter clicked:", chip.dataset.filter);
    activeFilter = chip.dataset.filter;
    renderFriendsAndRequests(); // re-render with new filter
  });
});

// --- Run on page load ---
window.addEventListener("DOMContentLoaded", () => {
  testAll();

  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      activeFilter = chip.dataset.filter;
      renderFriendsAndRequests();

      // Optional: add visual active highlight
      document
        .querySelectorAll(".filter-chip")
        .forEach((c) => c.classList.remove("ring-2", "ring-offset-2"));
      chip.classList.add("ring-2", "ring-offset-2");
    });
  });
});
window.addEventListener("DOMContentLoaded", () => {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabs = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      console.log("Tab button clicked:", button.dataset.tab);
      // Hide all tabs
      tabs.forEach((tab) => tab.classList.add("hidden"));

      // Remove active style from all buttons
      tabButtons.forEach((btn) =>
        btn.classList.remove("text-blue-600", "font-semibold")
      );
      tabButtons.forEach((btn) => btn.classList.add("text-gray-500"));

      // Show the selected tab
      const target = document.getElementById(`tab-${button.dataset.tab}`);
      target.classList.remove("hidden");

      // Highlight the active tab button
      button.classList.add("text-blue-600", "font-semibold");
      button.classList.remove("text-gray-500");
    });
  });
  const closeButton = document.getElementById("close-btn");
  const popup = document.getElementById("popup");

  function hidePopup() {
    popup.classList.add("hidden");
    popup.style.opacity = 0;
    popup.style.visibility = "hidden";
  }

  function showPopup() {
    popup.classList.remove("hidden");
    popup.style.opacity = 1;
    popup.style.visibility = "visible";
  }

  closeButton.addEventListener("click", hidePopup);

  popup.addEventListener("click", (e) => {
    if (e.target === popup) hidePopup();
  });

  document.getElementById("add-friend-btn").addEventListener("click", () => {
    console.log("Send request button clicked");
    showPopup();

    // display profile uuid
    const profileUUIDElement = document.getElementById("profileUUID");
    fetch("/me", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then((response) => response.json())
      .then((meData) => {
        const id = meData.id; // Assuming the response contains an 'id' field
        return fetch(`/users/${id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
      })
      .then((response) => response.json())
      .then((data) => {
        profileUUIDElement.innerText = data.PublicUUID || "No UUID found";
        console.log("Profile UUID:", data.PublicUUID);
      })
      .catch((error) => {
        console.error("Error fetching profile UUID:", error);
        profileUUIDElement.innerText = "Error fetching UUID";
      });
  });
});

function copyToClipboard(elementId) {
  const text = document.getElementById(elementId).innerText;
  navigator.clipboard
    .writeText(text)
    .then(() => alert("Copied to clipboard!"))
    .catch((err) => console.error("Failed to copy: ", err));
}

function addFriend() {
  const uuid = document.getElementById("friendUUID").value.trim();
  if (!uuid) {
    alert("Please enter a UUID.");
    return;
  }
  fetch(`/friend-invite/${uuid}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send friend request");
      }
      return response.json();
    })
    .then((data) => {
      // handle success
      console.log("Friend request sent!", data);
      alert("Friend request sent successfully!");
    })
    .catch((error) => {
      // handle error
      console.error("Error:", error.message);
      alert(error.message); // optional
    });
}
