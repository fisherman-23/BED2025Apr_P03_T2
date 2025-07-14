const container = document.querySelector('.announcements-container');
const params = new URLSearchParams(window.location.search);
const groupId = params.get('groupId');

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
          ${a.ImageURL ? `<img src="${a.ImageURL}" alt="${a.Title}" class="w-full h-60 object-cover">` : ''}
        </div>
        <div class="p-6">
          <h3 class="font-bold text-xl mb-2">${a.Title}</h3>
          <p class="text-gray-600 text-sm mb-3">${formatDate(a.CreatedAt)}</p>
          <p class="text-gray-800 mb-6">${a.Content}</p>
          <div class="border-t border-gray-200 pt-4" data-ann-id="${a.ID}">
            <h4 class="font-semibold text-lg mb-4">Comments</h4>
            <div class="comments-list space-y-4 mb-4"></div>
            <div class="comment-input flex items-start gap-3 mb-4">
              <img src="/assets/images/elderlyPFP.png" alt="Your avatar" class="w-10 h-10 rounded-full">
              <input type="text" placeholder="Write a comment..." class="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 comment-field">
            </div>
            <button class="post-comment-btn bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors">
              Post Comment
            </button>
          </div>
        </div>
      `;
      container.appendChild(card);
      bindComments(a.ID);
    });
  } catch (err) {
    console.error(err);
    toastError('Unable to load announcements');
  }
}

//render comments for 1 announcement
async function bindComments(annId) {
  const section = container.querySelector(`[data-ann-id="${annId}"]`);
  const listDiv = section.querySelector('.comments-list');
  listDiv.innerHTML = '';
  try {
    const res = await fetch(`/announcements/${annId}/comments`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch comments');
    const comments = await res.json();
    comments.forEach(c => {
      const div = document.createElement('div');
      div.className = 'comment flex items-start gap-3 mb-4';
      div.innerHTML = `
        <img src="${c.ProfilePicture || '/assets/images/elderlyPFP.png'}" alt="${c.Name}" class="w-10 h-10 rounded-full object-cover">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-semibold text-sm">${c.Name}</span>
          </div>
          <p class="text-gray-700 text-sm">${c.Content}</p>
        </div>
      `;
      listDiv.appendChild(div);
    });

    const postBtn = section.querySelector('.post-comment-btn');
    postBtn.onclick = async () => {
      const field = section.querySelector('.comment-field');
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




document.addEventListener('DOMContentLoaded', () => {
  if (!groupId) {
    toastError('No group specified');
    return;
  }
  loadAnnouncements();
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
