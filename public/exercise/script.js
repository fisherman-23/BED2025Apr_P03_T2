document.getElementById("exercise").addEventListener("click", async function () {
    try{
        const res = await fetch("/exercises", {
            method: "GET",
            credentials: "include"
        });
        if (!res.ok) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
        }
        const exercises = await res.json();
        console.log(exercises);
    } catch (error) {
    console.error("Error fetching exercises:", error);
    alert("Failed to fetch exercises. Please try again later.");
  }
});

document.getElementById("steps").addEventListener("click", async function () {
    try {
        const res = await fetch("/exercises/steps/1", {
            method: "GET",
            credentials: "include"
        });
        if (!res.ok) {
            throw new Error(`Server error: ${res.status} ${res.statusText}`);
        }
        const steps = await res.json();
        console.log(steps);
    } catch (error) {
        console.error("Error fetching steps:", error);
        alert("Failed to fetch steps. Please try again later.");
    }
});

document.querySelectorAll('.exercise-option').forEach(btn => {
btn.addEventListener('click', () => {
    btn.classList.toggle('selected');
});
});

const personalise_popup = document.getElementById('personalise-popup');

document.getElementById('personalise-close').addEventListener("click", () => {
  personalise_popup.style.opacity = 0;
  personalise_popup.style.visibility = "hidden";
});

personalise_popup.addEventListener("click", (e) => {
  if (e.target === personalise_popup) {
    personalise_popup.style.opacity = 0;
    personalise_popup.style.visibility = "hidden";
  }
});

document.getElementById('personalise').addEventListener("click", () => {
  document.querySelectorAll('.exercise-option').forEach(btn => {btn.classList.remove('selected');});
  personalise_popup.style.opacity = 1;
  personalise_popup.style.visibility = "visible";
});