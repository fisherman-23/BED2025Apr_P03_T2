// Fetch and display exercise
let currentIndex = 0;
let exercises = [];
const container = document.querySelector(".exercise-cards");
const viewMoreBtn = document.getElementById("viewMore");

function getWindowWidth() {
  const width = window.innerWidth;
  if (width <= 1620) return 3;
  return 4;
}
let batchSize = getWindowWidth();

window.addEventListener("resize", () => {
  const newBatchSize = getWindowWidth();
  if (newBatchSize !== batchSize) {
    batchSize = newBatchSize;
    currentIndex = 0;
    container.innerHTML = "";
    renderNextBatch();
  }
});

async function fetchExercise() {
  try {
    const res = await fetch(`/exercises`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) {
      throw new Error(`Server error: ${res.status} ${res.statusText}`);
    }

    exercises = await res.json();
    currentIndex = 0;
    localStorage.setItem("exerciseList", JSON.stringify(exercises));
    console.log(exercises);

    currentIndex = 0; // Reset index
    container.innerHTML = ""; // Clear existing cards
    renderNextBatch(); // Render first batch
  } catch (error) {
    console.error("Error fetching exercises:", error);
    alert("Failed to fetch exercises. Please try again later.");
  }
}

async function renderNextBatch() {
  const nextBatch = exercises.slice(currentIndex, currentIndex + batchSize);

  nextBatch.forEach((exercise) => {
    const card = document.createElement("div");
    card.className = "card-wrapper";
    card.innerHTML = `
      <div class="bg-overlay"></div>
      <div class="exercise-card">
        <img src="${exercise.image_url}" alt="Exercise Image">
        <h1>${exercise.title}</h1>
        <hr>
        <p>${exercise.description}</p>
        <button class="viewExercise" data-id="${exercise.exerciseId}">View Exercise</button>
      </div>
    `;
    container.appendChild(card);
    const button = card.querySelector(".viewExercise");
    button.addEventListener("click", () => {
      window.location.href = `exercise-steps.html?id=${exercise.exerciseId}`;
    });
  });

  currentIndex += batchSize;
  if (currentIndex >= exercises.length) {
    viewMoreBtn.style.display = "none";
  } else {
    viewMoreBtn.style.display = "flex";
  }
}

// Preferences

document.querySelectorAll(".exercise-option").forEach((btn) => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("selected");
  });
});

const personalise_popup = document.getElementById("personalise-popup");

document.getElementById("personalise-close").addEventListener("click", () => {
  personalise_popup.style.opacity = 0;
  personalise_popup.style.visibility = "hidden";
});

personalise_popup.addEventListener("click", (e) => {
  if (e.target === personalise_popup) {
    personalise_popup.style.opacity = 0;
    personalise_popup.style.visibility = "hidden";
  }
});

document.getElementById("personalise").addEventListener("click", async () => {
  document.querySelectorAll(".exercise-option").forEach((btn) => {
    btn.classList.remove("selected");
  });
  personalise_popup.style.opacity = 1;
  personalise_popup.style.visibility = "visible";
  const pref = await fetch("/exercises/preferences", {
    method: "GET",
    credentials: "include",
  });
  const preferences = await pref.json();
  if (preferences.categoryIds.length > 0) {
    const selectedIds = preferences.categoryIds;
    selectedIds.forEach((id) => {
      const match = document.querySelector(
        `.exercise-option[data-category-id="${id}"]`
      );
      if (match) match.classList.add("selected");
    });
    document.getElementById("personalise-text").textContent =
      "You can update your preferences below";
    document.getElementById("personalise-add").style.display = "none";
    document.getElementById("personalise-update").style.display = "flex";
    document.getElementById("personalise-clear").style.display = "flex";
  }
});

// Update preferences
document
  .getElementById("personalise-update")
  .addEventListener("click", async () => {
    const selectedOptions = Array.from(
      document.querySelectorAll(".exercise-option.selected")
    ).map((btn) => btn.dataset.categoryId);
    if (selectedOptions.length === 0) {
      alert("Please select at least one category.");
      return;
    }

    try {
      const res = await fetch("/exercises/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          categoryIds: selectedOptions,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }
      const result = await res.json();
      console.log(result);
      alert("Preferences updated successfully!");
      await fetchExercise(); // Refresh the exercise list
      personalise_popup.style.opacity = 0;
      personalise_popup.style.visibility = "hidden";
    } catch (error) {
      console.error("Error updating preferences:", error);
      alert("Failed to update preferences. Please try again later.");
    }
  });

// Delete preferences
document
  .getElementById("personalise-clear")
  .addEventListener("click", async () => {
    try {
      const res = await fetch("/exercises/preferences", {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }
      alert("Preferences cleared successfully!");
      document.querySelectorAll(".exercise-option").forEach((btn) => {
        btn.classList.remove("selected");
      });
      await fetchExercise(); // Refresh the exercise list
      personalise_popup.style.opacity = 0;
      personalise_popup.style.visibility = "hidden";
      document.getElementById("personalise-text").textContent =
        "PLease select which type of exercises you prefer";
      document.getElementById("personalise-add").style.display = "flex";
      document.getElementById("personalise-update").style.display = "none";
      document.getElementById("personalise-clear").style.display = "none";
    } catch (error) {
      console.error("Error clearing preferences:", error);
      alert("Failed to clear preferences. Please try again later.");
    }
  });

// Add preferences
document
  .getElementById("personalise-add")
  .addEventListener("click", async () => {
    const selectedOptions = Array.from(
      document.querySelectorAll(".exercise-option.selected")
    ).map((btn) => btn.dataset.categoryId);
    if (selectedOptions.length === 0) {
      alert("Please select at least one category.");
      return;
    }

    try {
      const res = await fetch("/exercises/personalisation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          categoryIds: selectedOptions,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }

      const result = await res.json();
      console.log(result);
      alert("Preferences saved successfully!");
      await fetchExercise(); // Refresh the exercise list
      personalise_popup.style.opacity = 0;
      personalise_popup.style.visibility = "hidden";
    } catch (error) {
      console.error("Error saving preferences:", error);
      alert("Failed to save preferences. Please try again later.");
    }
  });

// Goal Management

const goalBtn = document.getElementById("addGoal");
const goalPopup = document.getElementById("goal-popup");
goalBtn.addEventListener("click", () => {
  goalPopup.style.opacity = 1;
  goalPopup.style.visibility = "visible";
});
document.getElementById("goal-close").addEventListener("click", () => {
  goalPopup.style.opacity = 0;
  goalPopup.style.visibility = "hidden";
});
goalPopup.addEventListener("click", (e) => {
  if (e.target === goalPopup) {
    goalPopup.style.opacity = 0;
    goalPopup.style.visibility = "hidden";
  }
});

// Goal Creation
document.getElementById("goal-add").addEventListener("click", async () => {
  const goalName = document.getElementById("goal-name-input").value;
  const goalDesc = document.getElementById("goal-description-input").value;

  if (!goalName || !goalDesc) {
    alert("Please fill in all fields.");
    return;
  }
  console.log("Creating goal:", goalName, goalDesc);

  try {
    const res = await fetch("/exercises/goals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        name: goalName,
        description: goalDesc,
      }),
    });

    if (!res.ok) {
      const err = await res.json(); // read the error JSON
      throw new Error(err.message || "Failed to create goal");
    }

    const result = await res.json();
    fetchGoals(result);
    alert("Goal created successfully!");
    goalPopup.style.opacity = 0;
    goalPopup.style.visibility = "hidden";
  } catch (error) {
    console.log(error);
    alert(`Failed to create goal: ${error}`);
  }
});

// Fetch and display goals
async function fetchGoals(newGoal = null) {
  const goalContainer = document.querySelector(".goalCards");
  if (newGoal !== null) {
    const noGoalsMsg = goalContainer.querySelector(".no-goals-message");
    if (noGoalsMsg) {
      goalContainer.innerHTML = "";
    }
    const card = document.createElement("div");
    card.className = "goalcard";
    card.innerHTML = `
      <img src="/assets/icons/goal.svg" alt="goalIcon">
      <div class="goalText">
        <h1>${newGoal.name}</h1>
        <p>${newGoal.description}</p>
      </div>
      <button class="goalDelete" data-id="${newGoal.goalId}">&#10006;</button>
    `;
    goalContainer.appendChild(card);
    card.querySelector(".goalDelete").addEventListener("click", async () => {
      try {
        const delRes = await fetch(`/exercises/goals/${newGoal.goalId}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!delRes.ok) throw new Error();
        alert("Goal deleted successfully!");
        card.remove();
        if (goalContainer.children.length === 0) {
          goalContainer.innerHTML = `<div class="no-goals-message"><p>You have not added a goal.</p></div>`;
        }
      } catch (err) {
        console.error("Delete error:", err);
        alert("Failed to delete goal.");
      }
    });

    return;
  }

  try {
    const res = await fetch("/exercises/goals", {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) {
      throw new Error(`Server error: ${res.status} ${res.statusText}`);
    }
    const goals = await res.json();
    goalContainer.innerHTML = "";
    if (goals.length === 0) {
      goalContainer.innerHTML = `
      <div class="no-goals-message">
        <p>Try to add some goals!</p>
      </div>
      `;
      return;
    }
    goals.forEach((goal) => {
      const card = document.createElement("div");
      card.className = "goalcard";
      if (goal.last_completed_at !== null) {
        card.classList.add("completed");
      }
      card.innerHTML = `
        <img src="/assets/icons/goal.svg" alt="goalIcon">
        <div class="goalText">
            <h1>${goal.name}</h1>
            <p>${goal.description}</p>
        </div>
        <button class="goalDelete" data-id="${goal.goalId}">&#10006;</button>
      `;
      goalContainer.appendChild(card);
      console.log("Goal card created:", goal.name);
      console.log("Goal ID:", goal.goalId);
      const deleteBtn = card.querySelector(".goalDelete");
      deleteBtn.addEventListener("click", async () => {
        try {
          const delRes = await fetch(`/exercises/goals/${goal.goalId}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (!delRes.ok) {
            throw new Error(
              `Server error: ${delRes.status} ${delRes.statusText}`
            );
          }
          alert("Goal deleted successfully!");
          card.remove();
          fetchGoals();
        } catch (error) {
          console.error("Error deleting goal:", error);
          alert("Failed to delete goal. Please try again later.");
        }
      });
    });
  } catch (error) {
    console.error("Error fetching goals:", error);
    alert("Failed to fetch goals. Please try again later.");
  }
}

async function resetGoals() {
  try {
    await fetch("/exercises/reset", {
      method: "PUT",
      credentials: "include",
    });
  } catch (error) {
    console.error("Error resetting goals:", error);
    alert("Failed to reset goals.");
  }
}

async function getStatistic() {
  try {
    stats = await fetch("/exercises/stats", {
      method: "GET",
      credentials: "include",
    });
    if (!stats.ok) {
      throw new Error(`Server error: ${stats.status} ${stats.statusText}`);
    }
    const stat = await stats.json();
    document.getElementById("exerciseNum").innerHTML = stat.exercise_completed;
    document.getElementById("goalNum").innerHTML = stat.goal_completed;
  } catch (error) {
    console.error("Error getting user statistics", error);
    alert("Failed to get user statistics");
  }
}

(async () => {
  await resetGoals();
  await fetchGoals();
  await fetchExercise();
  await getStatistic();
})();

viewMoreBtn.addEventListener("click", () => {
  renderNextBatch();
});
