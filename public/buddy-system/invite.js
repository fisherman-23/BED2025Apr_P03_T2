window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
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
        console.log("User data:", data);
        document.getElementById("name").textContent = data.Name;
        document.getElementById("uuid").textContent = data.PublicUUID;
        document.getElementById("pfp").src =
          data.ProfilePicture || "/assets/images/elderlyPFP.png";

        const addButton = document.getElementById("addFriendBtn");
        addButton.style.display = "block"; // Show the button
        if (addButton) {
          addButton.addEventListener("click", () => {
            addFriend(data.PublicUUID);
          });
        }
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
        document.getElementById("name").textContent = "User not found";
        document.getElementById("uuid").textContent = "N/A";
        document.getElementById("pfp").src = "/assets/images/elderlyPFP.png";
        document.getElementById("addFriendBtn").style.display = "none";
        alert("User not found or an error occurred while fetching data.");
      });
  } else {
    console.error("No UUID found in URL");
    document.getElementById("name").textContent = "No UUID provided";
    document.getElementById("uuid").textContent = "N/A";
    document.getElementById("pfp").src = "/assets/images/elderlyPFP.png";
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
