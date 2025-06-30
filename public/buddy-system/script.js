document.getElementById("buddyForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const receiverUUID = document.getElementById("uuid").value.trim();

  try {
    const response = await fetch(`/friend-request/${receiverUUID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const text = await response.text(); // get raw text first
    console.log("Raw response text:", text);

    // Try parsing JSON only if response is ok
    if (!response.ok) {
      alert("Request failed: " + text);
      return;
    }

    const data = JSON.parse(text); // manually parse JSON

    alert(`Buddy request sent!`);
  } catch (error) {
    console.error("Request error:", error);
    alert("Something went wrong. Try again later.");
  }
});
