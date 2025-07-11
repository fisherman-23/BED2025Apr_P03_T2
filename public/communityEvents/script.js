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
    container.innerHTML = "";

    if (groups.length === 0) {
      const message = document.createElement("p");
      message.textContent = "You have not joined any groups yet.";
      message.className = "text-gray-600 text-xl text-center group-block";
      container.appendChild(message);
      return;
    }
    
    groups.forEach(group => {
      const groupDiv = document.createElement("div");

      groupDiv.innerHTML = `
      <div class="w-[90vw] md:w-[75vw] h-fit-content rounded-2xl flex justify-between items-center flex-row">
        <div class="flex bg-[#f9fafb] w-[90vw] md:w-[75vw] h-fit-content p-4 rounded-2xl justify-between items-center md:flex-row flex-col-reverse">
          <div class="flex flex-col justify-center gap-1">
            <h2 class="text-gray-800 text-opacity-50 text-xl">${group.IsPrivate ? "Private" : "Public"}</h2>
            <h1 class="font-bold text-[1.4rem]">${group.Name}</h1>
            <h3 class="text-gray-800 text-opacity-70 text-lg leading-snug">${group.Description || ""}</h3>
            <button data-groupId="${group.ID}" class="view-announcements-btn bg-[#d7e961] w-fit px-4 py-2 rounded-xl mt-6">View Announcements</button>
          </div>
          <img src="${group.GroupPicture}"
          onerror="this.onerror=null; this.src='communityEvents/assets/failedImage.jpg';" 
          alt="${group.Name} Group Image" 
          class="w-96 h-48 rounded-2xl md:ml-4 object-cover">

          <div class="w-[5vw] flex justify-center items-center md:hidden flex absolute right-14">
            <div class="flex flex-row justify-center items-center gap-1 exit-group">
              <h5>Exit</h5>
              <img src="communityEvents/assets/cross.svg" alt="Exit group icon" class="w-8 h-8">
            </div>
          </div>
        </div>

        <div class="w-[5vw] flex justify-center items-center hidden md:flex">
          <div class="flex flex-row justify-center items-center gap-1 exit-group">
            <h5>Exit</h5>
            <img src="communityEvents/assets/cross.svg" alt="Exit group icon" class="w-8 h-8">
          </div>
        </div>
        

      </div>
      `;

      container.appendChild(groupDiv);
    });

    container.querySelectorAll("button.view-announcements-btn").forEach(button => {
        button.addEventListener("click", e => {
        const groupId = e.currentTarget.getAttribute("data-groupId");
        window.location.href = `/announcements.html?groupId=${groupId}`;
      });
    });

  } catch (error) {
    console.error("Error loading joined groups:", error);
  }
}

async function loadAvailableGroups() {
  try {
    const response = await fetch("/groups/available", {
      credentials: "include"
    });
    if (!response.ok) {
      throw new Error("Failed to fetch available groups");
    }
    const groups = await response.json();
    const container = document.querySelector(".available-groups-container");
    container.innerHTML = "";

    if (groups.length === 0) {
      const message = document.createElement("p");
      message.textContent = "No available groups to join.";
      message.className = "text-gray-600 text-xl text-center group-block";
      container.appendChild(message);
      return;
    }

    groups.forEach(group => {
      const groupDiv = document.createElement("div");

      groupDiv.innerHTML = `
      <div class="join-group-button flex w-[44vw] h-auto flex-col mb-4 md:mb-2 md:w-[33vw]" data-groupId="${group.ID}">
          <img src="${group.GroupPicture}"
          onerror="this.onerror=null; this.src='communityEvents/assets/failedImage.jpg';" 
          alt="${group.Name} Group Image" 
          class="w-full h-[28vw] md:h-[24vw] rounded-xl" alt="">
        <h3 class="w-full md:text-lg">${group.Name}</h3>
      </div>
      `
      container.appendChild(groupDiv);
    })

    container.querySelectorAll(".join-group-button").forEach(button => {
      button.addEventListener("click", e => {
        const groupId = e.currentTarget.getAttribute("data-groupId");
        joinGroup(groupId).then(() => {
          loadJoinedGroups();
          loadAvailableGroups();
        }).catch(error => {
          console.error("Error joining group:", error);
        })
      });
    }
    );

  } catch (error) {
    console.error("Error loading available groups:", error);
  }
}

async function joinGroup(groupId) {
  try {
    const response = await fetch("/groups/join", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ groupId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to join group");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}


window.addEventListener("DOMContentLoaded", () => {
  loadJoinedGroups();
  loadAvailableGroups();
});

