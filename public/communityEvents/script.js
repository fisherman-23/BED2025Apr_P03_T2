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
    container.innerHTML = `<h2 class="font-bold text-2xl">My Groups</h2>`

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
        <div class="flex bg-[#f9fafb] w-[90vw] md:w-[75vw] h-fit-content p-4 rounded-2xl justify-between items-center md:flex-row flex-col-reverse relative">
          <div class="flex flex-col justify-center gap-1 w-full md:w-auto">
            <h2 class="text-gray-800 text-opacity-50 text-xl">${group.IsPrivate ? "Private" : "Public"}</h2>
            <h1 class="font-bold text-[1.4rem]">${group.Name}</h1>
            <h3 class="text-gray-800 text-opacity-70 text-lg leading-snug">${group.Description || ""}</h3>
            <div class="flex justify-between items-center mt-6">
              <button data-groupId="${group.ID}" data-groupName="${group.Name}" class="view-announcements-btn bg-[#d7e961] w-fit px-4 py-2 rounded-xl">View Announcements</button>
              <div class="w-fit-content flex justify-center items-center md:hidden">
                <div class="flex flex-row justify-center items-center gap-1 exit-group cursor-pointer leave-group-button" data-group-id="${group.ID}">
                  <h5>Exit</h5>
                  <img src="communityEvents/assets/cross.svg" alt="Exit group icon" class="w-8 h-8">
                </div>
              </div>
            </div>
          </div>
          <img src="${group.GroupPicture}"
          onerror="this.onerror=null; this.src='communityEvents/assets/failedImage.jpg';" 
          alt="${group.Name} Group Image" 
          class="w-96 h-48 rounded-2xl md:ml-4 object-cover mb-4 md:mb-0">
        </div>

        <div class="w-fit-content ml-4 flex justify-center items-center hidden md:flex">
          <div class="flex flex-row justify-center items-center gap-1 exit-group cursor-pointer leave-group-button" data-group-id="${group.ID}">
            <h5>Exit</h5>
            <img src="communityEvents/assets/cross.svg" alt="Exit group icon" class="w-8 h-8">
          </div>
        </div>
        

      </div>
      `;


      const button = groupDiv.querySelector("button.view-announcements-btn");
      button.addEventListener("click", e => {
        const groupId = e.currentTarget.getAttribute("data-groupId");
        const groupName = e.currentTarget.getAttribute("data-groupName");
        const encodedGroupName = encodeURIComponent(groupName);
        window.location.href = `/announcements.html?groupId=${groupId}&groupName=${encodedGroupName}`;
      });
      container.appendChild(groupDiv);
    });


    container.querySelectorAll(".leave-group-button").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const groupId = e.currentTarget.dataset.groupId;
        try {
          await leaveGroup(groupId);
          toastSuccess("Left group successfully!");
          loadJoinedGroups();    // refresh both lists
          loadAvailableGroups();
        } catch (err) {
          console.error("Error leaving group:", err);
          toastError("Unable to leave group. Please try again.");
        }
      });
    });

  } catch (error) {
    console.error("Error loading joined groups:", error);
    toastError("Unable to load your joined groups.");
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
          toastSuccess("Joined group!");
          loadJoinedGroups();
          loadAvailableGroups();
        }).catch(error => {
          console.error("Error joining group:", error);
          toastError("Unable to join group. Please try again.");
        })
      });
    }
    );

  } catch (error) {
    console.error("Error loading available groups:", error);
    toastError("Unable to load available groups.");
  }
}

async function joinGroup(groupId) {
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
}

async function createGroup() {
  const nameInput = document.getElementById('groupname');
  const descInput = document.getElementById('groupdesc');
  const publicRadio = document.getElementById('publicGroup');
  const fileInput = document.getElementById('groupIconInput');
  const createButton = document.querySelector('.modal-overlay button.bg-blue-500');

  createButton.disabled = true;
  createButton.textContent = 'Creating...';

  try {
    const Name = nameInput.value.trim();
    const Description = descInput.value.trim() || null;
    const IsPrivate = !publicRadio.checked;
    let GroupPicture = null;

    if (fileInput.files && fileInput.files[0]) {
      const uploadForm = new FormData();
      uploadForm.append('file', fileInput.files[0]);

      const uploadRes = await fetch('/api/upload/communityEvents', {
        method: 'POST',
        credentials: 'include',
        body: uploadForm
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.text();
        throw new Error(err || uploadRes.statusText);
      }

      const uploadData = await uploadRes.json();
      console.log('Upload data:', uploadData);

      if (!uploadData.url) {
        throw new Error("Upload succeeded but no URL returned");
      }

      GroupPicture = uploadData.url;
      fileInput.value = '';
    }

    const groupPayload = { Name, Description, IsPrivate };
    if (GroupPicture) {
      groupPayload.GroupPicture = GroupPicture;
    }
    const response = await fetch('/groups', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(groupPayload)    
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create group");
    }

    toastSuccess("Group created successfully!");
    closeModal();
    loadJoinedGroups();
    loadAvailableGroups();

  } catch (error) {
    console.error("Create group failed:", error);
    toastError("Unable to create group: " + error.message);
  } finally {
    createButton.disabled = false;
    createButton.textContent = 'Create Group';
  }
}



function closeModal() {
  const modal = document.querySelector('.modal-overlay');
  modal.classList.remove('opacity-100');
  modal.classList.add('opacity-0');
  setTimeout(() => {
    modal.classList.add('pointer-events-none');
  }, 300);

    document.getElementById('groupname').value = '';
  document.getElementById('groupdesc').value = '';
  document.getElementById('publicGroup').checked = true;

  const fileInput = document.getElementById('groupIconInput');
  const previewImg = document.getElementById('iconUploadPreview');
  const previewText = document.getElementById('iconUploadText');

  fileInput.value = '';
  previewImg.src = 'communityEvents/assets/plus-icon.svg';
  previewImg.classList.remove('max-w-full', 'max-h-full', 'rounded-lg', 'p-2');
  previewImg.classList.add('w-6', 'h-6');
  previewImg.style.display = 'block';
  previewText.textContent = 'Group Icon';
  previewText.style.display = 'block';
}

function openModal() {
  const modal = document.querySelector('.modal-overlay');
  const createBtn = document.querySelector('.create-group-button');
  const closeBtn = modal.querySelector('.close-modal-btn');
  const fileInput = document.getElementById('groupIconInput');
  const previewImg = document.getElementById('iconUploadPreview');
  const previewText = document.getElementById('iconUploadText');
  
  fileInput.addEventListener('change', () => {
    if (!fileInput.files || fileInput.files.length === 0) {
      previewImg.src = 'communityEvents/assets/plus-icon.svg';
      previewImg.classList.remove('max-w-full','max-h-full','rounded-lg','p-2');
      previewImg.classList.add('w-6','h-6');
      previewImg.style.display = 'block';
      previewText.textContent = 'Group Icon';
      previewText.style.display = 'block';
      return;
    }
    const file = fileInput.files[0];
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => {
        previewImg.src = e.target.result;
        previewImg.classList.remove('w-6','h-6');
        previewImg.classList.add('max-w-full','max-h-full','rounded-lg','p-2');
        previewImg.style.display = 'block';
        previewText.style.display = 'none';
      };
      reader.readAsDataURL(file);
    } else {
      previewImg.style.display = 'none';
      previewText.textContent = file.name;
      previewText.style.display = 'block';
    }
  });
  
  createBtn.addEventListener('click', () => {
    modal.classList.remove('pointer-events-none', 'opacity-0');
    modal.classList.add('opacity-100');
  });
  
  closeBtn.addEventListener('click', () => {
    closeModal();
  });
}

async function leaveGroup(groupId) {
    const response = await fetch("/groups/leave", {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ groupId })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to leave group");
  }

  return await response.json();
}



document.addEventListener('DOMContentLoaded', () => {
  loadJoinedGroups();
  loadAvailableGroups();
  openModal();

  const submitBtn = document.querySelector('.create-group');
  submitBtn.addEventListener('click', () => {
    createGroup().catch(e => {
      console.error(e);
      toastError("Unable to create group. Please try again.");
    });
  });
});



const createMeetingBtn = document.querySelector('.create-meeting-button') 
  || document.querySelectorAll('h3').forEach(el => {
    if (el.textContent === 'Create Meeting') createMeetingBtn = el.parentElement;
  });

createMeetingBtn.addEventListener('click', async () => {
  try {
    const res = await fetch('/meetings', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to create meeting');
    const { meetingId, url, token } = await res.json();
      window.location.href =
      `/meetings.html?meetingId=${meetingId}` +
      `&room=${encodeURIComponent(url)}` +
      `&token=${token}`; 
  } catch (err) {
    console.error(err);
    toastError('Unable to create meeting');
  }
});


const joinBtn = document.querySelector('.join-meeting-button');
const modal = document.getElementById('meetingPopup'); 
const roomNameInput = document.getElementById('roomName');
const cancelJoin = document.getElementById('cancelJoinBtn');
const confirmJoin = document.getElementById('confirmJoinBtn');

function openJoinModal() {
  modal.classList.remove('pointer-events-none','opacity-0');
  modal.classList.add('opacity-100');
}
function closeJoinModal() {
  modal.classList.add('pointer-events-none','opacity-0');
  modal.classList.remove('opacity-100');
}

joinBtn.addEventListener('click', openJoinModal);
cancelJoin.addEventListener('click', closeJoinModal);

confirmJoin.addEventListener('click', async () => {
  const name = roomNameInput.value.trim();
  if (!name) {
    toastError('Please enter a room name');
    return;
  }

  try {
    const res = await fetch(`/meetings/join?name=${encodeURIComponent(name)}`, {
      credentials: 'include'
    });
    if (res.status === 404) {
      toastError('Meeting not found');
    } else if (!res.ok) {
      throw new Error('Lookup failed');
    } else {
      const { url } = await res.json();
      window.location.href =
      `/meetings.html?meetingId=${encodeURIComponent(name)}` +
      `&room=${encodeURIComponent(url)}`;
      closeJoinModal();
      toastSuccess('Joining meeting…');
    }
  } catch (err) {
    console.error(err);
    toastError('Unable to join meeting');
  }
});

// Join Group Modal functionality
const joinGroupButton = document.querySelector('.join-group-button');
const joinGroupModal = document.getElementById('joinGroupModal');
const closeJoinGroupModal = document.getElementById('closeJoinGroupModal');
const joinTokenInput = document.getElementById('joinTokenInput');
const joinTokenMessage = document.getElementById('joinTokenMessage');
const joinGroupByTokenBtn = document.getElementById('joinGroupByTokenBtn');

function openJoinGroupModal() {
  joinGroupModal.classList.remove('opacity-0', 'pointer-events-none');
  joinGroupModal.classList.add('opacity-100');
  resetJoinGroupModal();
}

function closeJoinGroupModalFunc() {
  joinGroupModal.classList.add('opacity-0', 'pointer-events-none');
  joinGroupModal.classList.remove('opacity-100');
  resetJoinGroupModal();
}

function resetJoinGroupModal() {
  joinTokenInput.value = '';
  joinTokenMessage.textContent = '';
  joinGroupByTokenBtn.disabled = true;
}

// Enable/disable join button based on input
joinTokenInput.addEventListener('input', () => {
  const token = joinTokenInput.value.trim();
  joinGroupByTokenBtn.disabled = token.length === 0;
  joinTokenMessage.textContent = '';
});

// Join group by token
joinGroupByTokenBtn.addEventListener('click', async () => {
  const token = joinTokenInput.value.trim();
  if (!token) {
    joinTokenMessage.textContent = 'Please enter an invite token';
    return;
  }

  try {
    joinGroupByTokenBtn.disabled = true;
    joinTokenMessage.textContent = 'Joining group...';
    
    const response = await fetch('/groups/join-by-token', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inviteToken: token })
    });

    const data = await response.json();
    
    if (response.ok) {
      joinTokenMessage.textContent = `Successfully joined ${data.groupName}!`;
      joinTokenMessage.className = 'text-center text-green-500 min-h-[1.5rem] mt-2';
      
      // Refresh the groups list after a short delay
      setTimeout(() => {
        closeJoinGroupModalFunc();
        window.location.reload(); // Refresh to show the new group
      }, 1500);
    } else {
      joinTokenMessage.textContent = data.error || 'Failed to join group';
      joinTokenMessage.className = 'text-center text-red-500 min-h-[1.5rem] mt-2';
      joinGroupByTokenBtn.disabled = false;
    }
  } catch (error) {
    console.error('Error joining group:', error);
    joinTokenMessage.textContent = 'Error joining group';
    joinTokenMessage.className = 'text-center text-red-500 min-h-[1.5rem] mt-2';
    joinGroupByTokenBtn.disabled = false;
  }
});

joinGroupButton?.addEventListener('click', openJoinGroupModal);
closeJoinGroupModal?.addEventListener('click', closeJoinGroupModalFunc);
