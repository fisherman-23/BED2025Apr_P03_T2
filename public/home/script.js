var id;
fetch("/me", {
  method: "GET",
  credentials: "include",
})
  .then((res) => {
    if (!res.ok) throw new Error("Not logged in");
    return res.json();
  })
  .then((data) => {
    // Troubleshooting Purpose: Uncomment the following line to see the full response
    // id = data.id; // Store the user ID for later use
    // console.log(id);
    // // Get user details
    // fetch(`/users/${id}`, {
    //   method: "GET",
    //   credentials: "include",
    // })
    //   .then((res) => {
    //     if (!res.ok) throw new Error("Failed to fetch user details");
    //     return res.json();
    //   })
    //   .then((userData) => {
    //     console.log(userData);
    //   });
    console.log(data);
    const container = document.getElementById("auth-container");
    container.innerHTML = `
      <p class="text-lg mb-2">Logged in as <strong>${data.username}</strong></p>
      <button
        class="px-6 py-2 rounded-xl border-2 border-black bg-transparent text-black"
        id="logout-btn"
      >
        Logout
      </button>
    `;

    document.getElementById("logout-btn").addEventListener("click", () => {
      fetch("/users/logout", {
        method: "POST",
        credentials: "include",
      })
        .then((res) => {
          if (res.ok) {
            window.location.href = "/login.html";
          } else {
            alert("Logout failed");
          }
        })
        .catch(() => alert("Logout failed"));
    });
  })
  .catch(() => {});
