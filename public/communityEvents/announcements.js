const container = document.querySelector('.announcements-container');
const params = new URLSearchParams(window.location.search);
const groupId = params.get('groupId');

// Utility to format date
function formatDate(dtString) {
  const d = new Date(dtString);
  return d.toLocaleDateString(undefined, { year:'numeric', month:'long', day:'numeric' });
}

// Load and render announcements
async function loadAnnouncements() {
  try {
    const res = await fetch(`/announcements?groupId=${groupId}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch announcements');
    const list = await res.json();
    container.innerHTML = '';
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
            <div class="comments-list space-y-4"></div>
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

// Fetch and render comments for one announcement
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
    // bind post comment button
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



// Init
document.addEventListener('DOMContentLoaded', () => {
  if (!groupId) {
    toastError('No group specified');
    return;
  }
  // Optionally fetch and set group title here
  loadAnnouncements();
});
