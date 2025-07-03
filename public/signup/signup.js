document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registration-form");

  // toggle password visibility
  const togglePassword = document.getElementById("eye-icon");
  const passwordInput = document.getElementById("Password");

  togglePassword.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    togglePassword.src = isHidden
      ? "/assets/icons/eye.svg"
      : "/assets/icons/eye-hidden.svg";
  });

    // handle photo upload
    const photoInput = document.getElementById("photo-input");
    const photoLabelSpan = document.querySelector(".photo-label span");
    const photoIcon = document.querySelector(".photo-icon");
    const removeButton = document.getElementById("remove-photo");

    let selectedFile = null;

    photoInput.addEventListener("change", () => {
      const file = photoInput.files[0];
      if (file) {
        selectedFile = file;
        photoLabelSpan.textContent = file.name;

        const reader = new FileReader();
        reader.onload = (e) => {
          photoIcon.src = e.target.result;
        };
        reader.readAsDataURL(file);
        removeButton.style.display = "inline-block";
      }
    });

    // handle removal/reset
    removeButton.addEventListener("click", () => {
    photoInput.value = "";
    photoIcon.src = "/assets/icons/add-a-photo.svg";
    photoLabelSpan.textContent = "Add Photo";
    removeButton.style.display = "none";
    });

  // populate dropdowns for DOB
  populateDOB();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // get form values
    const email = document.getElementById("Email").value.trim();
    const password = document.getElementById("Password").value;
    const name = document.getElementById("Name").value.trim();
    const phoneNumber = document.getElementById("PhoneNumber").value.trim();
    const day = document.getElementById("dob-day").value;
    const month = document.getElementById("dob-month").value;
    const year = document.getElementById("dob-year").value;

    // validate DOB fields are selected (extra guard)
    if (!day || !month || !year) {
      alert("Please select your complete Date of Birth.");
      return;
    }

    // format DOB as YYYY-MM-DD with zero-padding
    const dob = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

    let uploadedImageUrl = null;
    
    // handle image upload if a file is selected
    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);

      try {
        const response = await fetch("/api/upload/profile_pictures", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Upload failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        if (!data.url) {
          throw new Error("No URL returned from image upload");
        }

        uploadedImageUrl = data.url;

      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        alert("Image upload failed. Please try again or use a different image.");
        return;  // stop form submission if image upload fails
      }
    }

    const userData = {
      Email: email,
      Password: password,
      Name: name,
      PhoneNumber: phoneNumber,
      DateOfBirth: dob,
      ProfilePicture: uploadedImageUrl || null // use uploaded image URL or null if not uploaded
    };

    try {
      const res = await fetch("/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(userData)
      });

      const result = await res.json();

      if (res.ok) {
        alert("🎉 Account created successfully!");
        window.location.href = "/login.html"; // redirect to login page
      } else {
        alert("⚠️ " + (result.error || "Unknown error occurred"));
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      alert("Something went wrong. Please try again.");
    }
  });
});

// populate DOB dropdowns dynamically
function populateDOB() {
  const daySelect = document.getElementById("dob-day");
  const monthSelect = document.getElementById("dob-month");
  const yearSelect = document.getElementById("dob-year");

  // populate days 1-31
  for (let d = 1; d <= 31; d++) {
    const option = document.createElement("option");
    option.value = d.toString();
    option.textContent = d;
    daySelect.appendChild(option);
  }

  // populate months with long names, values as "01".."12"
  const months = [
    "01", "02", "03", "04", "05", "06",
    "07", "08", "09", "10", "11", "12"
  ];
  months.forEach((m, i) => {
    const option = document.createElement("option");
    option.value = m;
    option.textContent = new Date(0, i).toLocaleString("default", { month: "long" });
    monthSelect.appendChild(option);
  });

  // populate years from current down to 1900
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 1900; y--) {
    const option = document.createElement("option");
    option.value = y.toString();
    option.textContent = y;
    yearSelect.appendChild(option);
  }
}