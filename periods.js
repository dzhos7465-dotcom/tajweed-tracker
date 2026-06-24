/* ══════════════════════════════════════════════
   TAJWEED TRACKER — periods.js
   Система периодов: текущий + архив
   
   Структура данных периодов внутри группы:
   group.periods = [
     {
       id: string,
       name: 'Текущий',         ← всегда у активного
       num: 1,                   ← номер периода
       lessons: number,
       marks: { studentId: { lessonNum: mark } }
     },
     {
       id: string,
       name: 'Период 1',
       num: 1,
       lessons: number,
       marks: { ... },
       closedAt: '15 мая 2026'  ← дата завершения
     }
   ]
   group.activePeriodId = string  ← ID активного периода
   
   Обратная совместимость:
   Если у группы нет periods — старые данные
   автоматически оборачиваются в первый период.
══════════════════════════════════════════════ */

// ══════════════════════════════════════════════
// МИГРАЦИЯ СТАРЫХ ДАННЫХ
// При первом запуске оборачивает старые уроки
// и отметки в структуру периодов
// ══════════════════════════════════════════════
function migrateGroupToPeriods(group) {
  if (group.periods) return; // уже мигрировано

  const periodId = uid();
  const marks = {};

  // Переносим старые отметки в новый формат
  // Старый формат: student.marks = { lessonNum: mark }
  // Новый формат: period.marks = { studentId: { lessonNum: mark } }
  group.students.forEach(s => {
    if (s.marks && Object.keys(s.marks).length > 0) {
      marks[s.id] = { ...s.marks };
    }
    // Старые marks оставляем на месте для совместимости — 
    // gamification.js читает их через getStudentMarks()
  });

  group.periods = [
    {
      id:       periodId,
      name:     typeof t === 'function' ? t('periodCurrent') : 'Текущий',
      num:      1,
      lessons:  group.lessons || 0,
      marks:    marks,
      isCurrent: true,
    }
  ];
  group.activePeriodId = periodId;
}

// ══════════════════════════════════════════════
// ГЕТТЕРЫ
// ══════════════════════════════════════════════

// Получить активный период группы
function getActivePeriod(group) {
  if (!group) return null;
  migrateGroupToPeriods(group);
  return group.periods.find(p => p.id === group.activePeriodId)
      || group.periods[group.periods.length - 1]
      || null;
}

// Получить отметки ученика в активном периоде
function getStudentMarks(group, studentId) {
  const period = getActivePeriod(group);
  if (!period) return {};
  return (period.marks && period.marks[studentId]) || {};
}

// Получить кол-во уроков активного периода
function getActiveLessons(group) {
  const period = getActivePeriod(group);
  return period ? period.lessons : 0;
}

// Получить ВСЕ отметки ученика через все периоды (для звёзд и уровней)
function getAllStudentMarks(group, studentId) {
  if (!group.periods) return (group.students.find(s=>s.id===studentId)||{}).marks || {};
  const allMarks = {};
  let offset = 0;
  // Сортируем периоды по номеру (старые первые)
  const sorted = [...group.periods].sort((a,b) => (a.num||0) - (b.num||0));
  sorted.forEach(period => {
    const m = (period.marks && period.marks[studentId]) || {};
    Object.keys(m).forEach(k => {
      allMarks[offset + Number(k)] = m[k];
    });
    offset += period.lessons || 0;
  });
  return allMarks;
}

// ══════════════════════════════════════════════
// ЗАВЕРШИТЬ ТЕКУЩИЙ ПЕРИОД
// ══════════════════════════════════════════════
function closePeriod() {
  const group = getActiveGroup();
  if (!group) return;
  migrateGroupToPeriods(group);

  const current = getActivePeriod(group);
  if (!current) return;

  // Считаем номер следующего периода
  const maxNum = Math.max(...group.periods.map(p => p.num || 1));
  const newNum = maxNum + 1;

  // Архивируем текущий период
  current.isCurrent = false;
  current.name = `${typeof t === 'function' ? t('periodName') : 'Период'} ${maxNum}`;
  current.closedAt = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  // Создаём новый пустой период
  const newPeriodId = uid();
  const newMarks = {};
  group.students.forEach(s => { newMarks[s.id] = {}; });

  group.periods.push({
    id:        newPeriodId,
    name:      typeof t === 'function' ? t('periodCurrent') : 'Текущий',
    num:       newNum,
    lessons:   0,
    marks:     newMarks,
    isCurrent: true,
  });

  group.activePeriodId = newPeriodId;

  // Синхронизируем group.lessons с активным периодом
  group.lessons = 0;

  save();
  render();
  renderPeriodTabs();
}

// ══════════════════════════════════════════════
// ОТМЕНИТЬ ЗАВЕРШЕНИЕ ПОСЛЕДНЕГО ПЕРИОДА
// ══════════════════════════════════════════════
function undoClosePeriod() {
  const group = getActiveGroup();
  if (!group || !group.periods) return;

  // Проверяем: есть ли завершённые периоды
  const archived = group.periods.filter(p => !p.isCurrent);
  if (archived.length === 0) {
    alert(typeof t === 'function' ? t('noArchiveToUndo') : 'Нет завершённых периодов для отмены.');
    return;
  }

  const msg = typeof t === 'function' ? t('undoClosePeriodConfirm')
    : 'Отменить завершение последнего периода? Текущий пустой период будет удалён.';
  if (!confirm(msg)) return;

  // Удаляем текущий пустой период
  const currentIdx = group.periods.findIndex(p => p.isCurrent);
  if (currentIdx !== -1) group.periods.splice(currentIdx, 1);

  // Восстанавливаем последний архивный период как текущий
  const lastArchived = [...archived].sort((a,b) => (b.num||0) - (a.num||0))[0];
  lastArchived.isCurrent = true;
  lastArchived.name = typeof t === 'function' ? t('periodCurrent') : 'Текущий';
  delete lastArchived.closedAt;

  group.activePeriodId = lastArchived.id;
  group.lessons = lastArchived.lessons;

  save();
  render();
  renderPeriodTabs();
}

// ══════════════════════════════════════════════
// ПЕРЕКЛЮЧИТЬ ПЕРИОД
// ══════════════════════════════════════════════
function selectPeriod(periodId) {
  const group = getActiveGroup();
  if (!group) return;
  group.activePeriodId = periodId;
  // Синхронизируем group.lessons
  const period = group.periods.find(p => p.id === periodId);
  if (period) group.lessons = period.lessons;
  save();
  render();
  renderPeriodTabs();
}

// ══════════════════════════════════════════════
// РЕНДЕР ПАНЕЛИ ПЕРИОДОВ
// ══════════════════════════════════════════════
function renderPeriodTabs() {
  const container = document.getElementById('periodTabsContainer');
  if (!container) return;

  const group = getActiveGroup();
  if (!group) {
    container.innerHTML = '';
    container.classList.add('hidden');
    return;
  }

  migrateGroupToPeriods(group);

  // Показываем панель только если периодов больше одного
  // или есть хотя бы один завершённый
  const hasArchive = group.periods.some(p => !p.isCurrent);
  const activePeriod = getActivePeriod(group);
  const isViewingArchive = activePeriod && !activePeriod.isCurrent;

  container.innerHTML = '';

  // Всегда показываем панель (кнопка «Завершить период» + вкладки если есть архив)
  container.classList.remove('hidden');

  // Вкладки периодов (только если есть архив)
  if (hasArchive) {
    const tabsWrap = document.createElement('div');
    tabsWrap.className = 'period-tabs-scroll';

    // Сортируем: текущий первый, потом архив по убыванию номера
    const sorted = [...group.periods].sort((a,b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      return (b.num||0) - (a.num||0);
    });

    sorted.forEach(period => {
      const btn = document.createElement('button');
      btn.className = 'period-tab' + (period.id === group.activePeriodId ? ' active' : '');

      const label = period.isCurrent
        ? (typeof t === 'function' ? t('periodCurrent') : 'Текущий')
        : period.name;

      btn.innerHTML = period.isCurrent
        ? `✏️ ${label}`
        : `📁 ${label}`;

      if (period.closedAt) {
        const sub = document.createElement('span');
        sub.className = 'period-tab-date';
        sub.textContent = period.closedAt;
        btn.appendChild(sub);
      }

      btn.addEventListener('click', () => selectPeriod(period.id));
      tabsWrap.appendChild(btn);
    });

    container.appendChild(tabsWrap);
  }

  // Кнопка «Завершить период» — только в текущем периоде
  if (!isViewingArchive) {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn btn-close-period';
    closeBtn.id = 'closePeriodBtn';
    closeBtn.textContent = typeof t === 'function' ? t('closePeriod') : '📦 Завершить период';
    closeBtn.addEventListener('click', () => {
      const msg = typeof t === 'function'
        ? t('closePeriodConfirm')
        : 'Завершить текущий период? Уроки сохранятся в архиве, начнётся новый период.';
      if (confirm(msg)) closePeriod();
    });
    container.appendChild(closeBtn);

    // Кнопка отмены — только если есть архивные периоды
    if (hasArchive) {
      const undoBtn = document.createElement('button');
      undoBtn.className = 'btn btn-undo-period';
      undoBtn.title = typeof t === 'function' ? t('undoClosePeriod') : 'Отменить завершение периода';
      undoBtn.textContent = '↩️';
      undoBtn.addEventListener('click', undoClosePeriod);
      container.appendChild(undoBtn);
    }
  } else {
    // В архивном периоде — бейдж «архив»
    const badge = document.createElement('div');
    badge.className = 'archive-badge';
    badge.textContent = typeof t === 'function' ? t('periodArchive') : '📁 Просмотр архива';
    container.appendChild(badge);
  }
}

// ══════════════════════════════════════════════
// ПАТЧИМ renderTable И renderGroupPanel
// чтобы они брали данные из активного периода
// ══════════════════════════════════════════════

// Переопределяем после загрузки всех скриптов
window.addEventListener('load', () => {

  // Патчим renderGroupPanel — добавляем renderPeriodTabs
  const _origRender = render;
  window.render = function() {
    _origRender();
    renderPeriodTabs();
  };

  // Патчим renderTable — берём уроки и отметки из активного периода
  const _origRenderTable = renderTable;
  window.renderTable = function(group) {
    migrateGroupToPeriods(group);
    const period = getActivePeriod(group);
    if (!period) return;

    // Синхронизируем group.lessons с периодом для совместимости
    group.lessons = period.lessons;

    // Временно подменяем marks учеников данными из периода
    group.students.forEach(s => {
      s._origMarks = s.marks;
      s.marks = (period.marks && period.marks[s.id]) || {};
    });

    _origRenderTable(group);

    // Восстанавливаем
    group.students.forEach(s => {
      s.marks = s._origMarks;
      delete s._origMarks;
    });
  };

  // Патчим addLessonBtn — добавляет урок в активный период
  const addLessonBtn = document.getElementById('addLessonBtn');
  if (addLessonBtn) {
    const newBtn = addLessonBtn.cloneNode(true);
    addLessonBtn.parentNode.replaceChild(newBtn, addLessonBtn);
    newBtn.addEventListener('click', () => {
      const group = getActiveGroup();
      if (!group) return;
      migrateGroupToPeriods(group);
      const period = getActivePeriod(group);
      if (!period || !period.isCurrent) return; // нельзя добавлять в архив
      period.lessons += 1;
      group.lessons = period.lessons;
      save();
      render();
      setTimeout(() => {
        const tw = document.getElementById('tableWrapper');
        if (tw) tw.scrollLeft = tw.scrollWidth;
      }, 50);
    });
  }

  // Патчим removeLessonBtn
  const removeLessonBtn = document.getElementById('removeLessonBtn');
  if (removeLessonBtn) {
    const newBtn = removeLessonBtn.cloneNode(true);
    removeLessonBtn.parentNode.replaceChild(newBtn, removeLessonBtn);
    newBtn.addEventListener('click', () => {
      const group = getActiveGroup();
      if (!group) return;
      migrateGroupToPeriods(group);
      const period = getActivePeriod(group);
      if (!period || !period.isCurrent || period.lessons === 0) return;
      const hasMarks = group.students.some(s =>
        period.marks && period.marks[s.id] && period.marks[s.id][period.lessons]
      );
      if (hasMarks) {
        const msg = typeof t === 'function'
          ? `${t('confirmRemoveLesson')} ${period.lessons}${t('confirmRemoveLessonSuffix')}`
          : `Удалить Урок ${period.lessons}? Все отметки этого урока будут удалены.`;
        if (!confirm(msg)) return;
        group.students.forEach(s => {
          if (period.marks && period.marks[s.id]) delete period.marks[s.id][period.lessons];
        });
      }
      period.lessons -= 1;
      group.lessons = period.lessons;
      save();
      render();
    });
  }

  // Патчим openMarkModal — сохраняет отметки в активный период
  const _origMark = window.openMarkModal;
  window.openMarkModal = function(studentId, lesson) {
    const group = getActiveGroup();
    if (!group) return;
    migrateGroupToPeriods(group);
    const period = getActivePeriod(group);
    if (!period || !period.isCurrent) return; // только чтение в архиве
    if (_origMark) _origMark(studentId, lesson);
  };

  // Патчим gamification — используем getAllStudentMarks для звёзд/уровней
  if (typeof calcStars === 'function') {
    const _calcStars = calcStars;
    window.calcStars = function(student) {
      const group = getActiveGroup();
      if (!group || !group.periods) return _calcStars(student);
      const allMarks = getAllStudentMarks(group, student.id);
      const tempStudent = { ...student, marks: allMarks };
      return _calcStars(tempStudent);
    };
    const _calcStreak = calcStreak;
    window.calcStreak = function(student) {
      const group = getActiveGroup();
      const period = group ? getActivePeriod(group) : null;
      const marks = period ? ((period.marks||{})[student.id]||{}) : (student.marks||{});
      return _calcStreak({ ...student, marks });
    };
    const _calcWeeklyStars = calcWeeklyStars;
    window.calcWeeklyStars = function(student, totalLessons) {
      const group = getActiveGroup();
      const period = group ? getActivePeriod(group) : null;
      const marks = period ? ((period.marks||{})[student.id]||{}) : (student.marks||{});
      return _calcWeeklyStars({ ...student, marks }, totalLessons);
    };
  }

  // Первый рендер с периодами
  render();
});
