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

// Function to list all pending request in HTML
const listPendingRequests = (requests) => {
  console.log("Listing pending requests:", requests);
  const incomingList = document.getElementById("incomingRequests");
  const outgoingList = document.getElementById("outgoingRequests");

  // Clear existing lists
  incomingList.innerHTML = "";
  outgoingList.innerHTML = "";

  // Populate incoming requests
  requests.incoming.forEach((request) => {
    const li = document.createElement("li");
    li.textContent = `${request.Name} (${request.ID}) - ${request.Direction}`;
    incomingList.appendChild(li);
  });

  // Populate outgoing requests
  requests.outgoing.forEach((request) => {
    const li = document.createElement("li");
    li.textContent = `${request.Name} (${request.ID}) - ${request.Direction}`;
    outgoingList.appendChild(li);
  });
};

const listFriends = (friends) => {
  console.log("Listing friends:", friends);
  const friendsList = document.getElementById("friendsList");

  // Clear existing list
  friendsList.innerHTML = "";

  // Populate friends list
  friends.forEach((friend) => {
    const li = document.createElement("li");
    li.textContent = `${friend.Name} (${friend.PublicUUID})`;
    friendsList.appendChild(li);
  });
};

test = async () => {
  console.log("Fetching pending requests...");
  try {
    const response = await fetch("/friend-requests", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch requests");
    }

    const data = await response.json();
    listPendingRequests(data); // Call the function to list requests in HTML
    console.log("Pending Requests:", data);
  } catch (error) {
    console.error("Error fetching requests:", error);
    alert("Failed to load pending requests. Please try again later.");
  }
};
test(); // Call the test function to fetch pending requests on page load
test2 = async () => {
  console.log("Fetching pending requests...");
  try {
    const response = await fetch("/friends", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch requests");
    }

    const data = await response.json();
    console.log("Pending Requests:", data);
    listFriends(data.friends); // Call the function to list friends in HTML
  } catch (error) {
    console.error("Error fetching requests:", error);
    alert("Failed to load pending requests. Please try again later.");
  }
};

test2(); // Call the test function to fetch pending requests on page load

document.getElementById("acceptButton").addEventListener("click", async () => {
  const requestId = document.getElementById("requestId").value.trim();
  if (!requestId) {
    alert("Please enter a Request ID");
    return;
  }

  try {
    const response = await fetch(`/friend-requests/${requestId}/accept`, {
      method: "POST",
      credentials: "include", // include cookies if needed for auth
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (response.ok) {
      alert(`Success: ${data.message}`);
    } else {
      alert(`Error: ${data.message || "Something went wrong"}`);
    }
  } catch (err) {
    alert("Network error, please try again.");
    console.error(err);
  }
});

document.getElementById("rejectButton").addEventListener("click", async () => {
  const requestId = document.getElementById("requestId").value.trim();
  if (!requestId) {
    alert("Please enter a Request ID");
    return;
  }

  try {
    const response = await fetch(`/friendRequests/${requestId}/reject`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (response.ok) {
      alert(`Success: ${data.message}`);
    } else {
      alert(`Error: ${data.message || "Something went wrong"}`);
    }
  } catch (err) {
    alert("Network error, please try again.");
    console.error(err);
  }
});
