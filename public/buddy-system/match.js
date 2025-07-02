const token = localStorage.getItem("token") || ""; // or sessionStorage

// Helper: build profile data from form
function getProfileFormData() {
  const form = document.getElementById("matchProfileForm");
  const data = {
    bio: form.querySelector("textarea[name='bio']").value,
  };

  [
    "likesHiking",
    "likesGardening",
    "likesBoardGames",
    "likesSinging",
    "likesReading",
    "likesWalking",
    "likesCooking",
    "likesMovies",
    "likesTaiChi",
  ].forEach((hobby) => {
    data[hobby] = form.querySelector(`input[name='${hobby}']`).checked;
  });

  return data;
}

// Create Match Profile
document
  .getElementById("createProfileBtn")
  .addEventListener("click", async () => {
    const data = getProfileFormData();

    try {
      const res = await fetch("/match/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (res.ok) {
        alert("Profile created!");
      } else {
        const err = await res.json();
        alert(
          "Error creating profile: " +
            (err.error || res.statusText) +
            err.details
        );
      }
    } catch (e) {
      alert("Network error: " + e.message);
    }
  });

// Update Match Profile
document
  .getElementById("updateProfileBtn")
  .addEventListener("click", async () => {
    const data = getProfileFormData();

    try {
      const res = await fetch("/match/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (res.ok) {
        alert("Profile updated!");
      } else {
        const err = await res.json();
        alert(
          "Error updating profile: " +
            (err.error || res.statusText) +
            err.details
        );
      }
    } catch (e) {
      alert("Network error: " + e.message);
    }
  });

// Check if Match Profile exists
document
  .getElementById("checkProfileBtn")
  .addEventListener("click", async () => {
    try {
      const res = await fetch("/match/profile/check", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const statusDiv = document.getElementById("profileStatus");

      if (res.ok) {
        const data = await res.json();
        statusDiv.textContent = data.exists
          ? "Match profile exists."
          : "No match profile found.";
      } else {
        statusDiv.textContent = "Failed to check profile.";
      }
    } catch (e) {
      alert("Network error: " + e.message);
    }
  });

// Load Potential Matches and display
document
  .getElementById("loadPotentialBtn")
  .addEventListener("click", async () => {
    try {
      const res = await fetch("/match/potential", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const container = document.getElementById("potentialMatches");
      container.innerHTML = "";

      if (res.ok) {
        const data = await res.json();

        if (data.length === 0) {
          container.textContent = "No potential matches found.";
          return;
        }

        data.forEach((user) => {
          const div = document.createElement("div");
          div.style.border = "1px solid #ddd";
          div.style.margin = "5px";
          div.style.padding = "5px";

          div.innerHTML = `
          <strong>User ID:</strong> ${user.UserID} <br/>
          <strong>Bio:</strong> ${user.Bio || "No bio"} <br/>
          <strong>Hobby Match Score:</strong> ${user.HobbyMatchScore || 0} <br/>
        `;

          container.appendChild(div);
        });
      } else {
        container.textContent = "Failed to load potential matches.";
      }
    } catch (e) {
      alert("Network error: " + e.message);
    }
  });
