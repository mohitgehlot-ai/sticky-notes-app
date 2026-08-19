let allNotes = [];
let currentColor = 'blue';

document.addEventListener('DOMContentLoaded', () => {
    fetchNotes();

    // Color Selector
    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
            document.querySelector('.color-dot.active').classList.remove('active');
            e.target.classList.add('active');
            currentColor = e.target.dataset.color;
        });
    });

    // Save Note
    document.getElementById('saveBtn').addEventListener('click', saveNote);

    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allNotes.filter(n => n.content.toLowerCase().includes(term));
        renderNotes(filtered);
    });
});

async function fetchNotes() {
    const res = await fetch('/api/notes');
    allNotes = await res.json();
    renderNotes(allNotes);
}

function renderNotes(notes) {
    const grid = document.getElementById('notesGrid');
    grid.innerHTML = '';

    // Sort: Pinned first
    const sortedNotes = [...notes].sort((a, b) => b.pinned - a.pinned);

    sortedNotes.forEach(note => {
        const el = document.createElement('div');
        el.className = `note-card glass ${note.color} ${note.pinned ? 'pinned' : ''}`;
        el.innerHTML = `
            <div class="note-content" contenteditable="true" onblur="updateContent('${note.id}', this.innerText)">${note.content}</div>
            <div class="note-footer">
                <span>${note.timestamp}</span>
                <div class="note-actions">
                    <i class="fas fa-thumbtack ${note.pinned ? 'pin-active' : ''}" onclick="togglePin('${note.id}')"></i>
                    <i class="fas fa-trash" onclick="deleteNote('${note.id}')"></i>
                </div>
            </div>
        `;
        grid.appendChild(el);
    });
}

async function saveNote() {
    const content = document.getElementById('noteText').value;
    if (!content.trim()) return;

    const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, color: currentColor })
    });

    if (res.ok) {
        document.getElementById('noteText').value = '';
        fetchNotes();
    }
}

async function updateContent(id, content) {
    await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
    });
    // Update local data without re-rendering to keep focus
    const note = allNotes.find(n => n.id === id);
    if (note) note.content = content;
}

async function togglePin(id) {
    const note = allNotes.find(n => n.id === id);
    await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: !note.pinned })
    });
    fetchNotes();
}

async function deleteNote(id) {
    if (confirm("Erase this data node?")) {
        await fetch(`/api/notes/${id}`, { method: 'DELETE' });
        fetchNotes();
    }
}