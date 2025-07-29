window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  // Extract the UUID from the URL parameters
  // Example URL: /invite.html?uuid=123e4567-e89b-12d3-a456-426614174000
  const uuid = params.get("uuid");

  if (uuid) {
    console.log("UUID found in URL:", uuid);

    fetch(`/users/uuid/${uuid}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        // Set the user data in the HTML elements
        console.log("User data:", data);
        document.getElementById("name").textContent = data.Name;
        document.getElementById("uuid").textContent = data.PublicUUID;
        // Set the profile picture, defaulting to a placeholder if not available
        document.getElementById("pfp").src =
          data.ProfilePicture || "/assets/images/defaultPFP.png";

        const addButton = document.getElementById("addFriendBtn");
        addButton.style.display = "block"; // Show the button
        if (addButton) {
          addButton.addEventListener("click", () => {
            addFriend(data.PublicUUID);
          });
        }
      })
      .catch((error) => {
        // Handle errors, such as user not found or network issues
        console.error("Error fetching user data:", error);
        document.getElementById("name").textContent = "User not found";
        document.getElementById("uuid").textContent = "N/A";
        document.getElementById("pfp").src = "/assets/images/defaultPFP.png";
        document.getElementById("addFriendBtn").style.display = "none";
        alert("User not found or an error occurred while fetching data.");
      });
  } else {
    // If no UUID is found in the URL, handle it gracefully by showing appropriate values
    console.error("No UUID found in URL");
    document.getElementById("name").textContent = "No UUID provided";
    document.getElementById("uuid").textContent = "N/A";
    document.getElementById("pfp").src = "/assets/images/defaultPFP.png";
    document.getElementById("addFriendBtn").style.display = "none";

    alert("No UUID found in the URL.");
  }
});

function addFriend(uuid) {
  if (!uuid) {
    alert("No UUID found.");
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
      console.log("Friend request sent!", data);
      alert("Friend request sent successfully!");
      window.location.href = "/index.html";
    })
    .catch((error) => {
      console.error("Error:", error.message);
      alert(error.message);
    });
}
