async function loadJoinedGroups() {
try {
    const response = await fetch("/groups/joined", {
    credentials: "include"
    });
    if (!response.ok) {
      throw new Error("Failed to fetch joined groups");
    }
    const groups = await response.json();
    const container = document.getElementById("joinedGroupsContainer");

    if (groups.length === 0) {
      const message = document.createElement("p");
      message.textContent = "You have not joined any groups yet.";
      message.className = "text-gray-600 text-xl text-center group-block";
      container.appendChild(message);
      return;
    }
    
    groups.forEach(group => {
      const groupDiv = document.createElement("div");
      groupDiv.className = "group-block flex w-[80vw] h-[30vh] mt-14 justify-between";

      groupDiv.innerHTML = `
        <div class="flex bg-[#f9fafb] w-[75vw] h-full p-4 rounded-2xl justify-between items-center">
          <div class="flex flex-col justify-center gap-1">
            <h2 class="text-gray-800 text-opacity-50 text-xl">${group.IsPrivate ? "Private" : "Public"}</h2>
            <h1 class="font-bold text-[1.4rem]">${group.Name}</h1>
            <h3 class="text-gray-800 text-opacity-70 text-xl">${group.Description || ""}</h3>
            <button data-groupId="${group.ID}" class="bg-[#d7e961] w-fit px-4 py-2 rounded-2xl mt-6">View Announcements</button>
          </div>
          <img src="${group.GroupPicture}" 
          onerror="this.onerror=null; this.src='communityEvents/assets/failedImage.jpg';" 
          alt="${group.Name} Group Image" 
          class="w-96 h-full rounded-2xl ml-4 object-cover">

        </div>
        <div class="w-[5vw] flex justify-center items-center">
          <div class="flex flex-row justify-center items-center gap-1">
            <h5>Exit</h5>
            <img src="communityEvents/assets/cross.svg" alt="Exit group icon" class="w-8 h-8">
          </div>
        </div>
      `;

      container.appendChild(groupDiv);
    });

    container.querySelectorAll("button[data-groupId]").forEach(button => {
      button.addEventListener("click", e => {
        const groupId = e.currentTarget.getAttribute("data-groupId");
        window.location.href = `/announcements.html?groupId=${groupId}`;
      });
    });

  } catch (error) {
    console.error("Error loading joined groups:", error);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  loadJoinedGroups();
});