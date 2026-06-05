/* ══════════════════════════════════════════════
   TAJWEED TRACKER — script.js
   v2: + Google Sheets sync via Apps Script
══════════════════════════════════════════════ */

// ══════════════════════════════════════════════
// GOOGLE SHEETS CONFIG
// Сюда вставьте URL вашего Apps Script Web App
// после настройки (см. инструкцию).
// Можно также вставить через кнопку ⚙️ в шапке.
// ══════════════════════════════════════════════
const GS_CONFIG_KEY = 'tajweedScriptUrl';

function getScriptUrl() {
  return localStorage.getItem(GS_CONFIG_KEY) || '';
}
function setScriptUrl(url) {
  localStorage.setItem(GS_CONFIG_KEY, url.trim());
}

// ── SYNC STATUS UI ─────────────────────────────
function setSyncStatus(status, text) {
  // status: '' | 'syncing' | 'ok' | 'error'
  const el    = document.getElementById('syncStatus');
  const label = document.getElementById('syncLabel');
  if (!el || !label) return;
  el.className = 'sync-status' + (status ? ' ' + status : '');
  label.textContent = text;
}

// ── GOOGLE SHEETS API ──────────────────────────
// Все запросы идут через fetch к Apps Script Web App.
// Apps Script принимает JSON и возвращает JSON.

async function gsRequest(payload) {
  const url = getScriptUrl();
  if (!url) return null; // нет URL — тихо пропускаем

  const response = await fetch(url, {
    method: 'POST',
    // Apps Script требует text/plain для POST без preflight CORS
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
}

// Загрузить все данные из Google Sheets
async function gsLoad() {
  if (!getScriptUrl()) return;
  setSyncStatus('syncing', 'Загрузка…');
  try {
    const data = await gsRequest({ action: 'load' });
    if (data && data.groups) {
      // Мержим: берём данные из Sheets, сохраняем тему из localStorage
      const theme = state.theme;
      state.groups = data.groups;
      state.theme  = theme;
      // Восстанавливаем activeGroupId если группа ещё существует
      const ids = state.groups.map(g => g.id);
      if (!ids.includes(state.activeGroupId)) {
        state.activeGroupId = state.groups.length > 0 ? state.groups[0].id : null;
      }
      save(); // обновляем localStorage
      render();
    }
    setSyncStatus('ok', 'Синхронизировано');
  } catch(e) {
    console.error('gsLoad error:', e);
    setSyncStatus('error', 'Нет связи');
  }
}

// Сохранить все данные в Google Sheets
let syncTimer = null;
async function gsSync() {
  if (!getScriptUrl()) return;
  // Дебаунс: ждём 800мс после последнего изменения
  clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    setSyncStatus('syncing', 'Сохранение…');
    try {
      await gsRequest({ action: 'save', groups: state.groups });
      setSyncStatus('ok', 'Сохранено');
    } catch(e) {
      console.error('gsSync error:', e);
      setSyncStatus('error', 'Ошибка сохранения');
    }
  }, 800);
}

// ── STATE ──────────────────────────────────────
let state = {
  theme: 'dark',
  groups: [],
  activeGroupId: null
};

// ── PERSISTENCE ────────────────────────────────
function save() {
  localStorage.setItem('tajweedTracker', JSON.stringify(state));
  gsSync(); // автосинхронизация с Google Sheets
}

function load() {
  const raw = localStorage.getItem('tajweedTracker');
  if (raw) {
    try { state = JSON.parse(raw); } catch(e) { /* ignore */ }
  }
}

// ── HELPERS ────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function getActiveGroup() {
  return state.groups.find(g => g.id === state.activeGroupId) || null;
}

// ── THEME ──────────────────────────────────────
const themeToggle = document.getElementById('themeToggle');

function applyTheme() {
  document.body.className = state.theme;
  themeToggle.textContent = state.theme === 'dark' ? '☀️' : '🌙';
}

themeToggle.addEventListener('click', () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme();
  save();
});

// ── RENDER ─────────────────────────────────────
function render() {
  renderGroupTabs();
  renderGroupPanel();
  if (typeof renderGameSection === 'function') renderGameSection();
}

// ── GROUP TABS ─────────────────────────────────
function renderGroupTabs() {
  const container = document.getElementById('groupsList');
  container.innerHTML = '';

  state.groups.forEach(group => {
    const tab = document.createElement('button');
    tab.className = 'group-tab' + (group.id === state.activeGroupId ? ' active' : '');
    tab.textContent = group.name;
    tab.addEventListener('click', () => selectGroup(group.id));
    container.appendChild(tab);
  });
}

function selectGroup(id) {
  state.activeGroupId = id;
  save();
  render();
}

// ── GROUP PANEL ────────────────────────────────
function renderGroupPanel() {
  const emptyState   = document.getElementById('emptyState');
  const groupPanel   = document.getElementById('groupPanel');
  const noStudents   = document.getElementById('noStudents');
  const tableWrapper = document.getElementById('tableWrapper');
  const addLessonRow = document.getElementById('addLessonRow');

  if (state.groups.length === 0 || !state.activeGroupId) {
    emptyState.classList.remove('hidden');
    groupPanel.classList.add('hidden');
    return;
  }

  const group = getActiveGroup();
  if (!group) {
    emptyState.classList.remove('hidden');
    groupPanel.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  groupPanel.classList.remove('hidden');

  // Group name
  document.getElementById('groupNameDisplay').textContent = group.name;

  if (group.students.length === 0) {
    noStudents.classList.remove('hidden');
    tableWrapper.classList.add('hidden');
    addLessonRow.classList.add('hidden');
  } else {
    noStudents.classList.add('hidden');
    tableWrapper.classList.remove('hidden');
    addLessonRow.classList.remove('hidden');
    renderTable(group);
  }
}

// ── TABLE ──────────────────────────────────────
function renderTable(group) {
  const thead = document.getElementById('tableHead');
  const tbody = document.getElementById('tableBody');

  // ── THEAD ──
  thead.innerHTML = '';
  const headerRow = document.createElement('tr');

  // First TH: "Ученик"
  const thName = document.createElement('th');
  thName.textContent = 'Ученик';
  headerRow.appendChild(thName);

  // Lesson headers
  for (let i = 1; i <= group.lessons; i++) {
    const th = document.createElement('th');
    th.className = 'lesson-header';
    th.textContent = `Урок ${i}`;
    headerRow.appendChild(th);
  }

  thead.appendChild(headerRow);

  // ── TBODY ──
  tbody.innerHTML = '';

  group.students.forEach(student => {
    const tr = document.createElement('tr');

    // Student name cell
    const tdName = document.createElement('td');
    tdName.className = 'student-cell';
    tdName.innerHTML = `
      <div class="student-name-inner">
        <span>${escapeHtml(student.name)}</span>
        <button class="delete-student-btn" data-id="${student.id}" title="Удалить">✕</button>
      </div>
    `;
    tr.appendChild(tdName);

    // Mark cells
    for (let i = 1; i <= group.lessons; i++) {
      const td = document.createElement('td');
      td.className = 'mark-cell';

      const mark = (student.marks && student.marks[i]) || '';
      const btn = document.createElement('button');
      btn.className = 'mark-btn' + (mark ? ' has-mark' : ' empty-mark');
      btn.dataset.studentId = student.id;
      btn.dataset.lesson = i;

      if (mark) {
        btn.textContent = mark;
      } else {
        btn.textContent = '·';
      }

      btn.addEventListener('click', () => openMarkModal(student.id, i));
      td.appendChild(btn);
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  });

  // Delete student listeners
  tbody.querySelectorAll('.delete-student-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openDeleteStudentModal(btn.dataset.id);
    });
  });
}

// ── ESCAPE HTML ────────────────────────────────
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ══════════════════════════════════════════════
// ADD GROUP MODAL
// ══════════════════════════════════════════════
const addGroupBtn     = document.getElementById('addGroupBtn');
const addGroupModal   = document.getElementById('addGroupModal');
const newGroupName    = document.getElementById('newGroupName');
const cancelAddGroup  = document.getElementById('cancelAddGroup');
const confirmAddGroup = document.getElementById('confirmAddGroup');

addGroupBtn.addEventListener('click', () => {
  newGroupName.value = '';
  addGroupModal.classList.remove('hidden');
  setTimeout(() => newGroupName.focus(), 50);
});

cancelAddGroup.addEventListener('click', () => addGroupModal.classList.add('hidden'));
addGroupModal.addEventListener('click', e => { if (e.target === addGroupModal) addGroupModal.classList.add('hidden'); });

confirmAddGroup.addEventListener('click', () => {
  const name = newGroupName.value.trim();
  if (!name) { newGroupName.focus(); return; }

  const group = {
    id: uid(),
    name,
    lessons: 0,
    students: []
  };

  state.groups.push(group);
  state.activeGroupId = group.id;
  addGroupModal.classList.add('hidden');
  save();
  render();
});

newGroupName.addEventListener('keydown', e => { if (e.key === 'Enter') confirmAddGroup.click(); });

// ══════════════════════════════════════════════
// DELETE GROUP MODAL
// ══════════════════════════════════════════════
const deleteGroupBtn     = document.getElementById('deleteGroupBtn');
const deleteGroupModal   = document.getElementById('deleteGroupModal');
const deleteGroupDesc    = document.getElementById('deleteGroupDesc');
const cancelDeleteGroup  = document.getElementById('cancelDeleteGroup');
const confirmDeleteGroup = document.getElementById('confirmDeleteGroup');

deleteGroupBtn.addEventListener('click', () => {
  const group = getActiveGroup();
  if (!group) return;
  deleteGroupDesc.textContent = `Удалить группу «${group.name}»? Все данные будут потеряны.`;
  deleteGroupModal.classList.remove('hidden');
});

cancelDeleteGroup.addEventListener('click', () => deleteGroupModal.classList.add('hidden'));
deleteGroupModal.addEventListener('click', e => { if (e.target === deleteGroupModal) deleteGroupModal.classList.add('hidden'); });

confirmDeleteGroup.addEventListener('click', () => {
  state.groups = state.groups.filter(g => g.id !== state.activeGroupId);
  state.activeGroupId = state.groups.length > 0 ? state.groups[state.groups.length - 1].id : null;
  deleteGroupModal.classList.add('hidden');
  save();
  render();
});

// ══════════════════════════════════════════════
// ADD STUDENT MODAL
// ══════════════════════════════════════════════
const addStudentBtn     = document.getElementById('addStudentBtn');
const addStudentModal   = document.getElementById('addStudentModal');
const newStudentName    = document.getElementById('newStudentName');
const cancelAddStudent  = document.getElementById('cancelAddStudent');
const confirmAddStudent = document.getElementById('confirmAddStudent');

addStudentBtn.addEventListener('click', () => {
  newStudentName.value = '';
  addStudentModal.classList.remove('hidden');
  setTimeout(() => newStudentName.focus(), 50);
});

cancelAddStudent.addEventListener('click', () => addStudentModal.classList.add('hidden'));
addStudentModal.addEventListener('click', e => { if (e.target === addStudentModal) addStudentModal.classList.add('hidden'); });

confirmAddStudent.addEventListener('click', () => {
  const name = newStudentName.value.trim();
  if (!name) { newStudentName.focus(); return; }

  const group = getActiveGroup();
  if (!group) return;

  group.students.push({
    id: uid(),
    name,
    marks: {}
  });

  addStudentModal.classList.add('hidden');
  save();
  render();
});

newStudentName.addEventListener('keydown', e => { if (e.key === 'Enter') confirmAddStudent.click(); });

// ══════════════════════════════════════════════
// DELETE STUDENT MODAL
// ══════════════════════════════════════════════
const deleteStudentModal   = document.getElementById('deleteStudentModal');
const deleteStudentDesc    = document.getElementById('deleteStudentDesc');
const cancelDeleteStudent  = document.getElementById('cancelDeleteStudent');
const confirmDeleteStudent = document.getElementById('confirmDeleteStudent');
let pendingDeleteStudentId = null;

function openDeleteStudentModal(studentId) {
  const group = getActiveGroup();
  if (!group) return;
  const student = group.students.find(s => s.id === studentId);
  if (!student) return;

  pendingDeleteStudentId = studentId;
  deleteStudentDesc.textContent = `Удалить ученика «${student.name}»?`;
  deleteStudentModal.classList.remove('hidden');
}

cancelDeleteStudent.addEventListener('click', () => {
  deleteStudentModal.classList.add('hidden');
  pendingDeleteStudentId = null;
});
deleteStudentModal.addEventListener('click', e => {
  if (e.target === deleteStudentModal) {
    deleteStudentModal.classList.add('hidden');
    pendingDeleteStudentId = null;
  }
});

confirmDeleteStudent.addEventListener('click', () => {
  const group = getActiveGroup();
  if (!group || !pendingDeleteStudentId) return;

  group.students = group.students.filter(s => s.id !== pendingDeleteStudentId);
  pendingDeleteStudentId = null;
  deleteStudentModal.classList.add('hidden');
  save();
  render();
});

// ══════════════════════════════════════════════
// ADD LESSON
// ══════════════════════════════════════════════
document.getElementById('addLessonBtn').addEventListener('click', () => {
  const group = getActiveGroup();
  if (!group) return;
  group.lessons += 1;
  save();
  render();
  // Scroll table to right
  setTimeout(() => {
    const tw = document.getElementById('tableWrapper');
    if (tw) tw.scrollLeft = tw.scrollWidth;
  }, 50);
});

// ══════════════════════════════════════════════
// MARK MODAL
// ══════════════════════════════════════════════
const markModal      = document.getElementById('markModal');
const markModalTitle = document.getElementById('markModalTitle');
const cancelMark     = document.getElementById('cancelMark');
let pendingMark      = { studentId: null, lesson: null };

function openMarkModal(studentId, lesson) {
  const group = getActiveGroup();
  if (!group) return;
  const student = group.students.find(s => s.id === studentId);
  if (!student) return;

  pendingMark = { studentId, lesson };
  markModalTitle.textContent = `${student.name} — Урок ${lesson}`;
  markModal.classList.remove('hidden');
}

cancelMark.addEventListener('click', () => {
  markModal.classList.add('hidden');
  pendingMark = { studentId: null, lesson: null };
});
markModal.addEventListener('click', e => {
  if (e.target === markModal) {
    markModal.classList.add('hidden');
    pendingMark = { studentId: null, lesson: null };
  }
});

// Mark option buttons
document.querySelectorAll('.mark-option').forEach(btn => {
  btn.addEventListener('click', () => {
    const group = getActiveGroup();
    if (!group || !pendingMark.studentId) return;

    const student = group.students.find(s => s.id === pendingMark.studentId);
    if (!student) return;

    const mark = btn.dataset.mark; // "" = clear
    if (!student.marks) student.marks = {};

    if (mark === '') {
      delete student.marks[pendingMark.lesson];
    } else {
      student.marks[pendingMark.lesson] = mark;
    }

    markModal.classList.add('hidden');
    pendingMark = { studentId: null, lesson: null };
    save();
    render();
  });
});

// ══════════════════════════════════════════════
// SETTINGS MODAL
// ══════════════════════════════════════════════
const settingsBtn      = document.getElementById('settingsBtn');
const settingsModal    = document.getElementById('settingsModal');
const scriptUrlInput   = document.getElementById('scriptUrlInput');
const cancelSettings   = document.getElementById('cancelSettings');
const saveSettings     = document.getElementById('saveSettings');
const testConnection   = document.getElementById('testConnection');

settingsBtn.addEventListener('click', () => {
  scriptUrlInput.value = getScriptUrl();
  settingsModal.classList.remove('hidden');
  setTimeout(() => scriptUrlInput.focus(), 50);
});

cancelSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));
settingsModal.addEventListener('click', e => {
  if (e.target === settingsModal) settingsModal.classList.add('hidden');
});

saveSettings.addEventListener('click', () => {
  const url = scriptUrlInput.value.trim();
  setScriptUrl(url);
  settingsModal.classList.add('hidden');
  if (url) {
    gsLoad(); // сразу загружаем данные из Sheets
  } else {
    setSyncStatus('', '—');
  }
});

testConnection.addEventListener('click', async () => {
  const url = scriptUrlInput.value.trim();
  if (!url) { scriptUrlInput.focus(); return; }

  // Временно используем введённый URL для теста
  const prevUrl = getScriptUrl();
  localStorage.setItem(GS_CONFIG_KEY, url);
  setSyncStatus('syncing', 'Проверка…');
  settingsModal.classList.add('hidden');

  try {
    const data = await gsRequest({ action: 'ping' });
    if (data && data.ok) {
      setSyncStatus('ok', 'Подключено ✓');
      alert('✅ Соединение успешно! Google Sheets подключён.');
    } else {
      throw new Error('Неверный ответ');
    }
  } catch(e) {
    setSyncStatus('error', 'Ошибка');
    alert('❌ Ошибка подключения. Проверьте URL и настройки доступа Apps Script.');
    localStorage.setItem(GS_CONFIG_KEY, prevUrl); // откатываем
  }

  settingsModal.classList.remove('hidden');
});

// ══════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════
load();
applyTheme();
render();

// Показать статус если URL уже сохранён
if (getScriptUrl()) {
  setSyncStatus('syncing', 'Загрузка…');
  gsLoad(); // загружаем свежие данные из Sheets при открытии
} else {
  setSyncStatus('', '—');
}
