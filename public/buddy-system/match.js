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
    console.log("Creating profile...");
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
document
  .getElementById("loadPotentialBtn")
  .addEventListener("click", async () => {
    try {
      const res = await fetch("/match/potential", {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
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
          <button class="likeBtn" data-userid="${user.UserID}">Like</button>
          <button class="skipBtn" data-userid="${user.UserID}">Skip</button>
        `;

          container.appendChild(div);
        });

        // Attach click events for Like buttons
        document.querySelectorAll(".likeBtn").forEach((btn) => {
          btn.addEventListener("click", async () => {
            const targetUserId = btn.dataset.userid;
            try {
              const res = await fetch(`/match/like/${targetUserId}`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                credentials: "include",
              });

              const data = await res.json();
              if (res.ok) {
                alert(data.matched ? "It's a match!" : "You liked the user.");
                btn.closest("div").remove(); // Remove from list
              } else {
                alert("Error liking user: " + (data.error || res.statusText));
              }
            } catch (e) {
              alert("Network error: " + e.message);
            }
          });
        });

        // Attach click events for Skip buttons
        document.querySelectorAll(".skipBtn").forEach((btn) => {
          btn.addEventListener("click", async () => {
            const targetUserId = btn.dataset.userid;
            try {
              const res = await fetch(`/match/skip/${targetUserId}`, {
                method: "POST",
                headers: {
                  contentType: "application/json",
                },
                credentials: "include",
              });

              if (res.ok) {
                alert("User skipped.");
                btn.closest("div").remove(); // Remove from list
              } else {
                const err = await res.json();
                alert("Error skipping user: " + (err.error || res.statusText));
              }
            } catch (e) {
              alert("Network error: " + e.message);
            }
          });
        });
      } else {
        container.textContent = "Failed to load potential matches.";
      }
    } catch (e) {
      alert("Network error: " + e.message);
    }
  });
