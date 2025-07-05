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

async function checkMatchProfile() {
  try {
    const res = await fetch("/match/profile/check", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.exists; // true or false
  } catch (e) {
    console.error("Network error:", e);
    return null;
  }
}

async function getMatchProfile() {
  try {
    const res = await fetch("/match/profile/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data; // assumes it's the profile directly
  } catch (e) {
    console.error("Error fetching match profile:", e);
    return null;
  }
}

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

async function createOrUpdateMatchProfile() {
  const hobbies = [
    "likesHiking",
    "likesGardening",
    "likesSinging",
    "likesReading",
    "likesWalking",
    "likesCooking",
    "likesMovies",
    "likesTaiChi",
  ];

  const profileData = {
    bio: document.getElementById("bio").value,
  };

  hobbies.forEach((hobby) => {
    const checkbox = document.getElementById(hobby);
    if (checkbox) {
      profileData[hobby.charAt(0).toLowerCase() + hobby.slice(1)] =
        checkbox.checked;
    }
  });

  try {
    const exists = await checkMatchProfile(); // true / false / null

    if (exists === null) {
      throw new Error("Unable to check profile existence");
    }

    const method = exists ? "PUT" : "POST";
    console.log(profileData);
    const res = await fetch("/match/profile", {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(profileData),
    });

    if (res.ok) {
      const data = await res.json();
      alert(
        method === "POST"
          ? "Profile created successfully!"
          : "Profile updated successfully!"
      );
      console.log("Profile saved:", data);
      window.location.reload();
    } else {
      const error = await res.json();
      throw new Error(error.error || "Something went wrong");
    }
  } catch (err) {
    console.error("Error saving profile:", err);
    alert("Failed to save profile. Please try again.");
  }
}

// async DOMContentLoaded function to check match profile
window.addEventListener("DOMContentLoaded", async () => {
  const userProfile = await getMatchProfile();
  const lastUpdated = document.getElementById("lastUpdated");
  const editCreateHeader = document.getElementById("edit-create-match-header");

  if (!userProfile) {
    console.log("No match profile found, skipping hobby checkboxes.");
    lastUpdated.innerText = "Profile not created yet.";
    editCreateHeader.innerText = "Create Match Profile";

    return;
  }
  editCreateHeader.innerText = "Edit Match Profile";
  console.log("Match profile found:", userProfile);
  const hobbies = [
    "likesHiking",
    "likesGardening",
    "likesBoardGames",
    "likesSinging",
    "likesReading",
    "likesWalking",
    "likesCooking",
    "likesMovies",
    "likesTaiChi",
  ];

  hobbies.forEach((hobby) => {
    const checkbox = document.getElementById(hobby);
    if (checkbox)
      checkbox.checked =
        userProfile[hobby.charAt(0).toUpperCase() + hobby.slice(1)];
  });

  const bio = document.getElementById("bio");
  bio.value = userProfile.Bio || "";

  if (userProfile.LastUpdated) {
    const date = new Date(userProfile.LastUpdated);
    lastUpdated.innerText = `Last updated: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  }
});

window.addEventListener("DOMContentLoaded", () => {
  // Close buttons
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

  const profileUUIDElement = document.getElementById("profileUUID");
  const name = document.getElementById("profile-name");
  const age = document.getElementById("profile-age");
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
      name.innerText = data.Name || "No Name";
      const birthDate = data.DateOfBirth;
      console.log("Birth Date:", birthDate);
      if (birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        const ageInMilliseconds = today - birth;
        const ageInYears = Math.floor(
          ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25)
        );
        age.innerText =
          ageInYears >= 0 ? `${ageInYears} years old` : "Age not available";
      } else {
        age.innerText = "Date of Birth not available";
      }
      console.log("Profile data fetched:", data);

      console.log("Profile UUID:", data.PublicUUID);
    })
    .catch((error) => {
      console.error("Error fetching profile UUID:", error);

      profileUUIDElement.innerText = "Error fetching UUID";
    });

  const shareLink = document.getElementById("shareLink").innerText.trim();
  // Generate QR Code
  new QRCode(document.getElementById("qrcode"), {
    text: shareLink,
    width: 256,
    height: 256,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H,
  });

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
function openPopup(contentId) {
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
}
