const id = new URLSearchParams(window.location.search).get('id');
console.log("Exercise ID:", id);
const list = JSON.parse(localStorage.getItem("exerciseList"));
let exercise;
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
    document.getElementById("exerciseName").textContent = `Welcome to ${selectedExercise.title}`;
    document.getElementById("exerciseDesc").textContent = selectedExercise.description;
    document.getElementById("benefit").textContent = selectedExercise.benefits;
  } else {
    console.error("Exercise not found in cache.");
  }
} else {
  console.error("Exercise list not found in cache.");
}
// Button logic
const button = document.querySelector(".startButton");
let hasStarted = false;

button.addEventListener("click", () => {
  if (!hasStarted) {
    // First click → start
    hasStarted = true;
    document.getElementById("Steps").style.display = "flex";
    document.getElementById("finish").style.display = "flex"

    button.textContent = "End Exercise";
  } else {
    // Second click → finish
    window.location.href = "exercise.html"; // Redirect to main exercise list
  }
});
fetchExerciseSteps();

async function fetchExerciseSteps() {
  try {
    const res = await fetch(`/exercises/steps/${id}`, {
      method: "GET",
      credentials: "include"
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
        ${index !== steps.length - 1 ? '<hr class="step-divider">' : ''}
      `;
    });

  } catch (error) {
    console.error("Error fetching exercise steps:", error);
  }
}
