const container = document.querySelector('.announcements-container');
const params = new URLSearchParams(window.location.search);
const groupId = params.get('groupId');
const groupName = params.get('groupName');

const groupTitle = document.getElementById("group-title");
let currentUserId = null;
let currentUserProfilePicture = null;

if (groupTitle && groupName) {
  const decodedGroupName = decodeURIComponent(groupName);
  groupTitle.textContent = `${decodedGroupName}`;
}

function formatDate(dtString) {
  const d = new Date(dtString);
  return d.toLocaleDateString(undefined, { year:'numeric', month:'long', day:'numeric' });
}

async function loadAnnouncements() {
  try {
    const res = await fetch(`/announcements?groupId=${groupId}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch announcements');
    const list = await res.json();
    container.innerHTML = '';
    if (list.length === 0) {
      container.innerHTML = `
        <div class="text-center text-gray-500 mt-10">
          No announcements yet.
        </div>
      `;
      return;
    }
    list.forEach(a => {
      const card = document.createElement('div');
      card.className = 'announcement-card bg-white border-2 border-dashed border-blue-200 rounded-2xl overflow-hidden';
      card.innerHTML = `
        <div class="relative">
          ${a.ImageURL ? `<img src="${a.ImageURL}" alt="${a.Title}" class="w-full h-60 md:h-[28rem] object-cover">` : ''}
        </div>
        <div class="p-6">
          <h3 class="font-bold text-xl mb-2">${a.Title}</h3>
          <p class="text-gray-600 text-sm mb-3">${formatDate(a.CreatedAt)}</p>
          <p class="text-gray-800 mb-6">${a.Content}</p>
          ${a.GroupCreatorID === currentUserId ? `<button class="edit-announcement-btn text-blue-500 hover:underline text-sm">Edit</button>` : ''}
          <div class="border-t border-gray-200 pt-4" data-ann-id="${a.ID}">
            <h4 class="font-semibold text-lg mb-4">Comments</h4>
            <div class="comments-list space-y-4 mb-4"></div>
            <div class="comment-input flex items-start gap-3 mb-4">
              <img src="${currentUserProfilePicture || '/assets/images/defaultPFP.png'}" alt="Your avatar" class="w-10 h-10 rounded-full object-cover">
              <input type="text" placeholder="Write a comment..." class="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 comment-field">
            </div>
            <button class="post-comment-btn bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors">
              Post Comment
            </button>
          </div>
        </div>
      `;
      container.appendChild(card);
      const editBtn = card.querySelector('.edit-announcement-btn');
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          openEditModal(a);
        });
      }
    });
    // Bind comments for all announcements after cards are appended
    list.forEach(a => bindComments(a.ID));
  } catch (err) { 
    console.error(err);
    toastError('Unable to load announcements');
  }
}

//render comments for 1 announcement
async function bindComments(annId) {

  const section = container.querySelector(`[data-ann-id="${annId}"]`);
  if (!section) {
    console.error(`Section with ann-id="${annId}" not found`);
    return;
  }
  const listDiv = section.querySelector('.comments-list');
  if (!listDiv) {
    console.error(`Comments list not found for announcement ${annId}`);
    return;
  }
  listDiv.innerHTML = '';

  try {
    const res = await fetch(`/announcements/${annId}/comments`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch comments');
    const comments = await res.json();

    comments.forEach(c => {
      const wrapper = document.createElement('div');
      wrapper.className = 'own-comment-wrapper relative group';

      const div = document.createElement('div');
      div.className = 'comment flex items-start gap-3 mb-4';

      div.innerHTML = `
        <img src="${c.ProfilePicture || '/assets/images/defaultPFP.png'}"
             alt="${c.Name}"
             class="w-10 h-10 rounded-full object-cover">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-semibold text-sm">${c.Name}</span>
          </div>
          <p class="comment-text text-gray-700 text-sm">${c.Content}</p>
        </div>
      `;
      wrapper.appendChild(div);

      if (c.IsOwnComment) {
        const original = c.Content;
        const p = div.querySelector('.comment-text');
        const commentId = c.ID; 

        wrapper.addEventListener('mouseenter', () => {
          p.textContent = 'Delete comment?';
          p.classList.replace('text-gray-700', 'text-red-500');
          p.classList.add('font-semibold', 'cursor-pointer');
        });

        wrapper.addEventListener('mouseleave', () => {
          p.textContent = original;
          p.classList.replace('text-red-500', 'text-gray-700');
          p.classList.remove('font-semibold', 'cursor-pointer');
        });

        wrapper.addEventListener('click', async () => {
          if (!(await newConfirm('Delete this comment?'))) return;
          try {
            const delRes = await fetch(
              `/announcements/${annId}/comments/${commentId}`, 
              { method: 'DELETE', credentials: 'include' }
            );
            if (!delRes.ok) throw new Error('Failed to delete comment');
            toastSuccess('Comment deleted');
            bindComments(annId);
          } catch (err) {
            console.error(err);
            toastError('Unable to delete comment');
          }
        });
      }

      listDiv.appendChild(wrapper);
    });


    const postBtn = section.querySelector('.post-comment-btn');
    if (!postBtn) {
      console.error(`Post comment button not found for announcement ${annId}`);
      return;
    }
    
    postBtn.onclick = async () => {
      const field = section.querySelector('.comment-field');
      if (!field) {
        console.error(`Comment field not found for announcement ${annId}`);
        return;
      }
      
      const content = field.value.trim();
      if (!content) return;
      try {
        const res2 = await fetch(`/announcements/${annId}/comments`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ announcementId: annId, content })
        });
        if (!res2.ok) throw new Error('Failed to post comment');
        field.value = '';
        toastSuccess('Comment posted');
        bindComments(annId);
      } catch (err) {
        console.error(err);
        toastError('Unable to post comment');
      }
    };

  } catch (err) {
    console.error(err);
    toastError('Unable to load comments');
  }
}







async function postNewAnnouncement({ groupId, title, content, imageUrl }) {
  const payload = {
    GroupID: Number(groupId),
    Title: title.trim(),
    Content: content.trim(),
    ImageURL: imageUrl || null
  };
  const res = await fetch("/announcements", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create announcement");
  }
  const { id } = await res.json(); 
  return id;
}

async function getCurrentUserId() {
  try {
    const res = await fetch('/me', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch user info');
    const user = await res.json();
    
    const profileRes = await fetch('/me/profile-picture', { credentials: 'include' });
    if (profileRes.ok) {
      const profileData = await profileRes.json();
      currentUserProfilePicture = profileData.profilePicture || '/assets/images/defaultPFP.png';
    } else {
      currentUserProfilePicture = '/assets/images/defaultPFP.png';
    }
    
    return user.id;
  } catch (err) {
    console.error(err);
    toastError('Failed to get user info');
    currentUserProfilePicture = '/assets/images/defaultPFP.png';
    return null;
  }
}

async function initialize() {
  currentUserId = await getCurrentUserId();
  if (!groupId) {
    toastError('No group specified');
    return;
  }
  await loadAnnouncements();
  await checkIfUserIsGroupOwner();
}

async function checkIfUserIsGroupOwner() {
  try {
    const response = await fetch(`/groups/${groupId}/invite-token`, {
      method: 'GET',
      credentials: 'include'
    });
    
    // If user can get the invite token, they are the owner
    const isOwner = response.ok;
    
    // Show/hide share group buttons based on ownership
    const shareGroupBtn = document.getElementById('shareGroupBtn');
    const shareGroupBtnMobile = document.getElementById('shareGroupBtnMobile');
    
    if (shareGroupBtn) {
      if (isOwner) {
        shareGroupBtn.style.display = '';  // Reset to use CSS classes
        shareGroupBtn.classList.remove('hidden');
        shareGroupBtn.classList.add('md:flex');
      } else {
        shareGroupBtn.style.display = 'none';
      }
    }
    if (shareGroupBtnMobile) {
      if (isOwner) {
        shareGroupBtnMobile.style.display = '';  // Reset to use CSS classes
        shareGroupBtnMobile.classList.remove('hidden');
        shareGroupBtnMobile.classList.add('flex', 'md:hidden');
      } else {
        shareGroupBtnMobile.style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Error checking group ownership:', error);
    // Hide buttons by default if there's an error
    const shareGroupBtn = document.getElementById('shareGroupBtn');
    const shareGroupBtnMobile = document.getElementById('shareGroupBtnMobile');
    if (shareGroupBtn) shareGroupBtn.style.display = 'none';
    if (shareGroupBtnMobile) shareGroupBtnMobile.style.display = 'none';
  }
}


document.addEventListener('DOMContentLoaded', () => {
  if (!groupId) {
    toastError('No group specified');
    return;
  }
  initialize();
});



const openDesktopBtn = document.getElementById("openAnnouncementModalBtn");
const openMobileBtn  = document.getElementById("openAnnouncementModalBtnMobile");
const announcementModal = document.getElementById("announcementModal");
const closeModalBtn = announcementModal.querySelector(".close-announcement-modal-btn");
const cancelModalBtn = document.getElementById("cancelAnnouncementBtn");
const createBtn = document.getElementById("createAnnouncementBtn");
const imageInput = document.getElementById("annImageInput");
const imagePreview = document.getElementById("annImagePreview");

function openAnnouncementModal() {
  announcementModal.classList.remove("pointer-events-none","opacity-0");
  announcementModal.classList.add("opacity-100");
}
function closeAnnouncementModal() {
  announcementModal.classList.add("pointer-events-none","opacity-0");
  announcementModal.classList.remove("opacity-100");
}
openDesktopBtn?.addEventListener("click", openAnnouncementModal);
openMobileBtn?.addEventListener("click", openAnnouncementModal);
closeModalBtn.addEventListener("click", closeAnnouncementModal);
cancelModalBtn.addEventListener("click", closeAnnouncementModal);

createBtn.addEventListener("click", async () => {
  createBtn.disabled = true;
  createBtn.textContent = "Posting…";

  try {
    const Title = document.getElementById("annTitle").value.trim();
    const Content = document.getElementById("annContent").value.trim();
    const GroupID = Number(groupId);
    let ImageURL = null;

    if (imageInput.files[0]) {
      const form = new FormData();
      form.append("file", imageInput.files[0]);
      const uploadRes = await fetch("/api/upload/communityEvents", {
        method: "POST",
        credentials: "include",
        body: form
      });
      if (!uploadRes.ok) throw new Error("Image upload failed");
      const { url } = await uploadRes.json();
      if (!url) throw new Error("No URL returned");
      ImageURL = url;
    }

    const payload = { GroupID, Title, Content, ImageURL };
    const res = await fetch("/announcements", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create announcement");
    }

    toastSuccess("Announcement posted!");
    
    document.getElementById("annTitle").value = "";
    document.getElementById("annContent").value = "";
    imageInput.value = "";
    imagePreview.src = 'communityEvents/assets/plus-icon.svg';
    imagePreview.classList.remove(
      'w-24','h-24',
      'object-contain',
      'rounded-md',
      'max-w-full','max-h-full','rounded-lg','p-2'
    );
    imagePreview.classList.add('w-6','h-6');
    
    closeAnnouncementModal();
    loadAnnouncements(); 
  } catch (err) {
    console.error(err);
    toastError(err.message || "Unable to post announcement");
  } finally {
    createBtn.disabled = false;
    createBtn.textContent = "Create";
  }
});



const fileInput  = document.getElementById('annImageInput');
const previewImg = document.getElementById('annImagePreview');

fileInput.addEventListener('change', () => {
  if (!fileInput.files || fileInput.files.length === 0) {
    previewImg.src = 'communityEvents/assets/plus-icon.svg';
    previewImg.classList.remove(
      'w-24','h-24',
      'object-contain',
      'rounded-md',
      'max-w-full','max-h-full','rounded-lg','p-2'
    );
    previewImg.classList.add('w-6','h-6');
    return;
  }

  const file = fileInput.files[0];
  if (!file.type.startsWith('image/')) return;

  const reader = new FileReader();
  reader.onload = e => {
    previewImg.src = e.target.result;
    previewImg.classList.remove('w-6','h-6');
    previewImg.classList.remove(
      'max-w-full','max-h-full','rounded-lg','p-2'
    );
    previewImg.classList.add(
      'w-24','h-24',
      'object-contain',
      'rounded-md'
    );
  };
  reader.readAsDataURL(file);
});


function newConfirm(message) {
  return new Promise((resolve) => {
    const modal = document.querySelector('#customConfirmModal');
    const text = modal.querySelector('.confirm-message');
    const yesBtn = modal.querySelector('.confirm-yes');
    const noBtn = modal.querySelector('.confirm-no');

    text.textContent = message;

    modal.classList.remove('opacity-0', 'pointer-events-none');
    modal.classList.add('opacity-100');

    const cleanUp = () => {
      modal.classList.add('opacity-0', 'pointer-events-none');
      modal.classList.remove('opacity-100');
      yesBtn.removeEventListener('click', onYes);
      noBtn.removeEventListener('click', onNo);
    };

    const onYes = () => {
      cleanUp();
      resolve(true);
    };

    const onNo = () => {
      cleanUp();
      resolve(false);
    };

    yesBtn.addEventListener('click', onYes);
    noBtn.addEventListener('click', onNo);
  });
}






const shareGroupBtn = document.getElementById('shareGroupBtn');
const shareGroupBtnMobile = document.getElementById('shareGroupBtnMobile');
const shareGroupModal = document.getElementById('shareGroupModal');
const closeShareGroupModal = document.getElementById('closeShareGroupModal');
const inviteTokenDisplay = document.getElementById('inviteTokenDisplay');
const copyTokenBtn = document.getElementById('copyTokenBtn');
const tokenMessage = document.getElementById('tokenMessage');

async function openShareGroupModal() {
  shareGroupModal.classList.remove('opacity-0', 'pointer-events-none');
  shareGroupModal.classList.add('opacity-100');
  
  // Reset the display
  inviteTokenDisplay.value = 'Loading...';
  tokenMessage.textContent = '';
  
  try {
    // Get the current group ID from URL params
    const params = new URLSearchParams(window.location.search);
    const groupId = params.get('groupId');
    
    if (!groupId) {
      tokenMessage.textContent = 'No group selected';
      inviteTokenDisplay.value = '';
      return;
    }
    
    const response = await fetch(`/groups/${groupId}/invite-token`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      inviteTokenDisplay.value = data.inviteToken;
    } else {
      const errorData = await response.json();
      tokenMessage.textContent = errorData.error || 'Failed to load invite token';
      inviteTokenDisplay.value = '';
    }
  } catch (error) {
    console.error('Error fetching invite token:', error);
    tokenMessage.textContent = 'Error loading invite token';
    inviteTokenDisplay.value = '';
  }
}

function closeShareGroup() {
  shareGroupModal.classList.add('opacity-0', 'pointer-events-none');
  shareGroupModal.classList.remove('opacity-100');
  inviteTokenDisplay.value = '';
  tokenMessage.textContent = '';
}

function copyInviteToken() {
  const token = inviteTokenDisplay.value;
  if (token && token !== 'Loading...') {
    navigator.clipboard.writeText(token).then(() => {
      tokenMessage.textContent = 'Token copied to clipboard!';
      setTimeout(() => {
        tokenMessage.textContent = '';
      }, 3000);
    }).catch(err => {
      console.error('Failed to copy token:', err);
      tokenMessage.textContent = 'Failed to copy token';
    });
  }
}

shareGroupBtn?.addEventListener('click', openShareGroupModal);
shareGroupBtnMobile?.addEventListener('click', openShareGroupModal);
closeShareGroupModal.addEventListener('click', closeShareGroup);
copyTokenBtn?.addEventListener('click', copyInviteToken);

// Edit Announcement Modal
const editModal = document.getElementById('editAnnouncementModal');
const closeEditModalBtn = document.getElementById('closeEditModal');
const editForm = document.getElementById('editAnnouncementForm');
const editTitleInput = document.getElementById('editTitle');
const editContentInput = document.getElementById('editContent');
const editImageInput = document.getElementById('editImageURL');
const deleteAnnouncementBtn = document.getElementById('deleteAnnouncementBtn');

let currentEditAnnId = null;
function openEditModal(announcement) {
  currentEditAnnId = announcement.ID;
  editTitleInput.value = announcement.Title;
  editContentInput.value = announcement.Content;
  editImageInput.value = announcement.ImageURL || '';
  editModal.classList.remove("hidden");
}

closeEditModalBtn.addEventListener("click", () => {
  currentEditAnnId = null;
  editForm.reset();
  editModal.classList.add("hidden");
});

editForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentEditAnnId) return;

  const updatedTitle = editTitleInput.value.trim();
  const updatedContent = editContentInput.value.trim();
  const updatedImageURL = editImageInput.value.trim() || null;

  try {
    const res = await fetch(`/announcements/${currentEditAnnId}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Title: updatedTitle,
        Content: updatedContent,
        ImageURL: updatedImageURL
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update announcement");
    }

    toastSuccess("Announcement updated!");
    editModal.classList.add("hidden");
    currentEditAnnId = null;
    loadAnnouncements();
  } catch (err) {
    console.error(err);
    toastError(err.message || "Unable to update announcement");
  }
});

deleteAnnouncementBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  if (!currentEditAnnId) {
    console.error("No currentEditAnnId set");
    return;
  }
  
  // Store the ID before showing confirmation to prevent it from being cleared
  const announcementIdToDelete = currentEditAnnId;
  
  // Hide edit modal while showing confirmation
  editModal.classList.add("hidden");
  
  const confirmed = await newConfirm('Are you sure you want to delete this announcement?');
  
  if (!confirmed) {
    // If cancelled, show edit modal again
    editModal.classList.remove("hidden");
    return;
  }

  try {
    const res = await fetch(`/announcements/${announcementIdToDelete}`, {
      method: "DELETE",
      credentials: "include"
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete announcement");
    }

    toastSuccess("Announcement deleted!");
    currentEditAnnId = null;
    loadAnnouncements();
  } catch (err) {
    console.error("Delete announcement error:", err);
    toastError(err.message || "Unable to delete announcement");
    // Show edit modal again if there was an error
    editModal.classList.remove("hidden");
  }
});
