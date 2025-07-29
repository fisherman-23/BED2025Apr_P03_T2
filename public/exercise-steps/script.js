// Get the exercise ID from the URL
const id = new URLSearchParams(window.location.search).get("id");
console.log("Exercise ID:", id);
// Get the cached exercise list
const list = JSON.parse(localStorage.getItem("exerciseList"));
let exercise;
// Display the exercise details
if (list) {
  let selectedExercise = null;

  for (const exercise of list) {
    if (exercise.exerciseId == id) {
      selectedExercise = exercise;
      break;
    }
  }

  if (selectedExercise) {
    document.querySelector(".start img").src = selectedExercise.image_url;
    document.getElementById("exerciseName").textContent =
      `Welcome to ${selectedExercise.title}`;
    document.getElementById("exerciseDesc").textContent =
      selectedExercise.description;
    document.getElementById("benefit").textContent = selectedExercise.benefits;
  } else {
    console.error("Exercise not found in cache.");
  }
} else {
  console.error("Exercise list not found in cache.");
}

// // External API
navigator.geolocation.getCurrentPosition(
  async (position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    try {
      const res = await fetch("/exercises/weather", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ lat, lon }),
      });
      const data = await res.json();

      const message = `
        <p><strong>Weather in ${data.location}</strong></p>
        <p>${data.description.charAt(0).toUpperCase() + data.description.slice(1)}</p>
        <p>Temp: ${data.temp}°C (Feels like: ${data.feelsLike}°C)</p>
        <p>${data.message}</p>
      `;
      document.getElementById("weather-message").innerHTML = message;
      document.getElementById("weather-notification").style.display = "block";
    } catch (error) {
      console.error("Weather fetch error:", error);
    }
  },
  (error) => {
    console.error("Geolocation error:", error.message);
  }
);

document.getElementById("weather-close").addEventListener("click", () => {
  document.getElementById("weather-notification").style.display = "none";
});

const button = document.querySelector(".startButton");
let hasStarted = false;

button.addEventListener("click", () => {
  if (!hasStarted) {
    hasStarted = true;
    document.getElementById("Steps").style.display = "flex";
    document.getElementById("finish").style.display = "flex";

    button.textContent = "End Exercise";
  } else {
    window.location.href = "exercise.html";
  }
});
fetchExerciseSteps();

// Fetch and display exercise steps
async function fetchExerciseSteps() {
  try {
    const res = await fetch(`/exercises/steps/${id}`, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status} ${res.statusText}`);
    }
    const steps = await res.json();
    console.log("Steps:", steps);

    const stepsContainer = document.getElementById("Steps");
    stepsContainer.innerHTML = ""; // Clear placeholder

    steps.forEach((step, index) => {
      stepsContainer.innerHTML += `
        <div class="stepCard">
          <div class="stepHeader">
            <h1>Step</h1>
            <div class="stepNumber">${step.step_number}</div>
          </div>
          <h2 class="insturctions">${step.instruction}</h2>
        </div>
        ${index !== steps.length - 1 ? '<hr class="step-divider">' : ""}
      `;
    });
  } catch (error) {
    console.error("Error fetching exercise steps:", error);
  }
}

// Fetch and display goals
async function fetchGoals() {
  const goalContainer = document.querySelector(".goals");
  try {
    const res = await fetch("/exercises/incompleted-goals", {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) {
      throw new Error(`Server error: ${res.status} ${res.statusText}`);
    }
    const goals = await res.json();
    console.log("Goals:", goals);
    goalContainer.innerHTML = "";
    if (goals.length === 0) {
      goalContainer.innerHTML = `
      <div class="no-goals-message">
        <p>You have cleared all your goals! or if you haven't add some!</p>
      </div>
      `;
      document.getElementById("goal-update").style.display = "none";
      document.getElementById("goal-text").innerHTML = "Congrats!";
      return;
    }
    goals.forEach((goal) => {
      const card = document.createElement("div");
      card.className = "goalcard";
      card.innerHTML = `
        <img src="/assets/icons/goal.svg" alt="goalIcon">
        <div class="goalText">
            <h1>${goal.name}</h1>
            <p>${goal.description}</p>
        </div>
        <input type="checkbox" class="goalCheckbox" data-goal-id="${goal.goalId}">
      `;
      goalContainer.appendChild(card);
    });
  } catch (error) {
    console.error("Error fetching goals:", error);
    alert("Failed to fetch goals. Please try again later.");
  }
}

function getCheckedGoalIds() {
  const checkedBoxes = document.querySelectorAll(".goalCheckbox:checked");
  console.log("Checked Boxes:", checkedBoxes);
  const checkedGoalIds = Array.from(checkedBoxes).map(
    (box) => box.dataset.goalId
  );
  return checkedGoalIds;
}

fetchGoals();

// Update goals
document.getElementById("goal-update").addEventListener("click", async () => {
  const checkedGoalIds = getCheckedGoalIds();
  try {
    const res = await fetch("/exercises/goals", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ goalIds: checkedGoalIds }),
    });
    if (!res.ok) {
      throw new Error(`Server error: ${res.status} ${res.statusText}`);
    }
    const result = await res.json();
    console.log("Goals updated:", result);
    alert("Goals updated successfully!");
    const logGoals = await fetch("/exercises/logGoals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ goalIds: checkedGoalIds }),
    });
    if (!logGoals.ok) {
      throw new Error(
        `Server error: ${logGoals.status} ${logGoals.statusText}`
      );
    }
    console.log("Exercise logged successfully.");
    goalPopup.style.opacity = 0;
    goalPopup.style.visibility = "hidden";
    window.location.href = "exercise.html";
  } catch (error) {
    console.error("Error updating goals:", error);
    alert("Failed to update goals. Please try again later.");
  }
});

// Show goal popup
const finish = document.getElementById("finish");
const goalPopup = document.getElementById("goal-popup");
finish.addEventListener("click", async () => {
  console.log("logging exercises");
  try {
    const res = await fetch(`/exercises/logExercise/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    if (!res.ok) {
      throw new Error(`Failed to log exercise: ${res.status}`);
    }
    console.log("Exercise logged successfully.");
  } catch (err) {
    console.error("Error logging exercise:", err);
    alert("Failed to log your exercise. Try again later.");
  }
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
