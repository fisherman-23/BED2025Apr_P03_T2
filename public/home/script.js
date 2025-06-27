fetch("/me", {
  method: "GET",
  credentials: "include",
})
  .then((res) => {
    if (!res.ok) throw new Error("Not logged in");
    return res.json();
  })
  .then((data) => {
    const container = document.getElementById("auth-container");
    container.innerHTML = `
      <p class="text-lg mb-2">Logged in as <strong>${data.username}</strong></p>
      <button
        class="px-6 py-2 rounded-xl border-2 border-black bg-transparent text-black"
        onclick="window.location.href='logout.html';"
      >
        Logout
      </button>
    `;
  })
  .catch(() => {
    // fallback if not logged in
  });
