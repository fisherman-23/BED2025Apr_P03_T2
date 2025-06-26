document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const searchTerm = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("http://localhost:3000/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ searchTerm, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Login failed");
      return;
    }
    alert(`Welcome, ${data.user.name}!`);

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    window.location.href = "/index.html";

  } catch (error) {
    console.error("Login error:", error);
    alert("Something went wrong. Try again later.");
  }
});
