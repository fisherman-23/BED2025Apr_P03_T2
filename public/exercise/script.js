
async function fetchExerciseSteps() {
  try {
    const user = await fetch("/me", {
      method: "GET",
      credentials: "include"
    });
    const res = await fetch(`/exercises/1`, {
    method: "GET",
    credentials: "include"
    });
    if (!res.ok) {
    throw new Error(`Server error: ${res.status} ${res.statusText}`);
    }
    const exercises = await res.json();
    console.log(exercises);

    let currentIndex = 0;
    const batchSize = 4;
    const container = document.querySelector(".exercise-cards");
    container.innerHTML = ""; // Clear existing content
    const viewMoreBtn = document.getElementById("viewMore");
    
    function renderNextBatch() {
      const nextBatch = exercises.slice(currentIndex, currentIndex + batchSize);

      nextBatch.forEach(exercise => {
        const card = document.createElement("div");
        card.className = "card-wrapper";
        card.innerHTML = `
          <div class="bg-overlay"></div>
          <div class="exercise-card">
            <img src="${exercise.image_url}" alt="Exercise Image">
            <h1>${exercise.title}</h1>
            <hr>
            <p>${exercise.description}</p>
            <button class="viewExercise">View Exercise</button>
          </div>
        `;
        container.appendChild(card);
      });

      currentIndex += batchSize;
      if (currentIndex >= exercises.length) {
        viewMoreBtn.style.display = "none";
      }else {
        viewMoreBtn.style.display = "flex";
      }
    }

    renderNextBatch();

    // Click handler to load more
    viewMoreBtn.addEventListener("click", renderNextBatch);

    } catch (error) {
    console.error("Error fetching exercises:", error);
    alert("Failed to fetch exercises. Please try again later.");
  }
};

document.addEventListener("DOMContentLoaded",fetchExerciseSteps);

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


document.getElementById('personalise').addEventListener("click", async () => {
  document.querySelectorAll('.exercise-option').forEach(btn => {btn.classList.remove('selected');});
  personalise_popup.style.opacity = 1;
  personalise_popup.style.visibility = "visible";
  const pref = await fetch("/exercises/preferences/1", {
    method: "GET",
    credentials: "include"
  });
  const preferences = await pref.json();
  if (preferences.categoryIds.length > 0) {
    const selectedIds = preferences.categoryIds; // e.g. [1, 3, 5]
    selectedIds.forEach(id => {
      const match = document.querySelector(`.exercise-option[data-category-id="${id}"]`);
      if (match) match.classList.add('selected');
    });
    document.getElementById('personalise-text').textContent = "You can update your preferences below";
    document.getElementById('personalise-add').style.display = "none";
    document.getElementById('personalise-update').style.display = "flex";
    document.getElementById('personalise-clear').style.display = "flex";
  }
});

document.getElementById('personalise-update').addEventListener("click", async () => {
  const selectedOptions = Array.from(document.querySelectorAll('.exercise-option.selected')).map(btn => btn.dataset.categoryId);
  if (selectedOptions.length === 0) {
    alert("Please select at least one category.");
    return;
  }

  try {
    const res = await fetch("/exercises/preferences", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        categoryIds: selectedOptions,
        userId: 1 // Replace with actual user ID
      })
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status} ${res.statusText}`);
    }
    const result = await res.json();
    console.log(result);
    alert("Preferences updated successfully!");
    await fetchExerciseSteps(); // Refresh the exercise list
    personalise_popup.style.opacity = 0;
    personalise_popup.style.visibility = "hidden";
  } catch (error) {
    console.error("Error updating preferences:", error);
    alert("Failed to update preferences. Please try again later.");
  }
});

document.getElementById('personalise-clear').addEventListener("click", async () => {
  try {
    const res = await fetch("/exercises/preferences/1", {
      method: "DELETE",
      credentials: "include"
    });
    if (!res.ok) {
      throw new Error(`Server error: ${res.status} ${res.statusText}`);
    }
    alert("Preferences cleared successfully!");
    document.querySelectorAll('.exercise-option').forEach(btn => {btn.classList.remove('selected');});
    await fetchExerciseSteps(); // Refresh the exercise list
    personalise_popup.style.opacity = 0;
    personalise_popup.style.visibility = "hidden";
    document.getElementById('personalise-text').textContent = "PLease select which type of exercises you prefer";
    document.getElementById('personalise-add').style.display = "flex";
    document.getElementById('personalise-update').style.display = "none";
    document.getElementById('personalise-clear').style.display = "none";
  } catch (error) {
    console.error("Error clearing preferences:", error);
    alert("Failed to clear preferences. Please try again later.");
  }
});


document.getElementById('personalise-add').addEventListener("click", async () => {
  const selectedOptions = Array.from(document.querySelectorAll('.exercise-option.selected')).map(btn => btn.dataset.categoryId);
  if (selectedOptions.length === 0) {
    alert("Please select at least one category.");
    return;
  }

  try {
    const res = await fetch("/exercises/personalisation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        categoryIds: selectedOptions,
        userId: 1 // Replace with actual user ID
      })
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status} ${res.statusText}`);
    }

    const result = await res.json();
    console.log(result);
    alert("Preferences saved successfully!");
    await fetchExerciseSteps(); // Refresh the exercise list
    personalise_popup.style.opacity = 0;
    personalise_popup.style.visibility = "hidden";
  } catch (error) {
    console.error("Error saving preferences:", error);
    alert("Failed to save preferences. Please try again later.");
  }
});
