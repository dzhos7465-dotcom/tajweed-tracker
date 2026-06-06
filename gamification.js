/* ══════════════════════════════════════════════
   TAJWEED TRACKER — gamification.js
   v3: игровая система
   Зависит от: state, getActiveGroup() из script.js
   Вызывается: renderGameSection() внутри render()
══════════════════════════════════════════════ */

// ══════════════════════════════════════════════
// КОНСТАНТЫ
// ══════════════════════════════════════════════

const LEVELS = [
  { min: 0,   max: 9,   title: 'Начинающий',      icon: '🌱', color: '#6bcb77' },
  { min: 10,  max: 24,  title: 'Чтец',             icon: '📖', color: '#f5c842' },
  { min: 25,  max: 49,  title: 'Старательный чтец', icon: '⭐', color: '#f5a623' },
  { min: 50,  max: 99,  title: 'Знаток чтения',    icon: '🌟', color: '#e040fb' },
  { min: 100, max: Infinity, title: 'Мастер чтения', icon: '🏆', color: '#ff6b35' },
];

const ACHIEVEMENTS = [
  { id: 'first_star',    icon: '⭐', title: 'Первая звезда',      desc: 'Получить первую отметку',          check: s => calcStars(s) >= 1 },
  { id: 'streak3',       icon: '🔥', title: 'Огонь!',             desc: 'Серия 3 урока подряд',             check: s => calcStreak(s) >= 3 },
  { id: 'streak5',       icon: '🌋', title: 'Непрерывный огонь',  desc: 'Серия 5 уроков подряд',            check: s => calcStreak(s) >= 5 },
  { id: 'perfect3',      icon: '💎', title: 'Трижды отлично',     desc: '3 отметки 🌟 подряд',              check: s => calcPerfectStreak(s) >= 3 },
  { id: 'ten_stars',     icon: '🌠', title: 'Десятка!',           desc: 'Набрать 10 звёзд',                 check: s => calcStars(s) >= 10 },
  { id: 'trophy',        icon: '🏆', title: 'Трофей',             desc: 'Получить отметку 🏆',              check: s => Object.values(s.marks||{}).includes('🏆') },
  { id: 'no_miss5',      icon: '🛡',  title: 'Без пропусков',      desc: '5 выполненных уроков без ❌',      check: s => calcNoMissStreak(s) >= 5 },
  { id: 'century',       icon: '💯', title: 'Мастер!',            desc: 'Набрать 100 звёзд',                check: s => calcStars(s) >= 100 },
];

// Стоимость отметки в звёздах
const MARK_STARS = { '⭐': 1, '🌟': 2, '🏆': 3, '❌': 0 };

// ══════════════════════════════════════════════
// ВЫЧИСЛЕНИЯ ДЛЯ ОДНОГО УЧЕНИКА
// ══════════════════════════════════════════════

function calcStars(student) {
  return Object.values(student.marks || {})
    .reduce((sum, m) => sum + (MARK_STARS[m] || 0), 0);
}

function calcStreak(student) {
  // Серия ВЫПОЛНЕННЫХ заданий подряд (с конца)
  const marks = student.marks || {};
  const keys = Object.keys(marks).map(Number).sort((a,b) => a - b);
  let streak = 0;
  for (let i = keys.length - 1; i >= 0; i--) {
    const m = marks[keys[i]];
    if (m && m !== '❌') streak++;
    else break;
  }
  return streak;
}

function calcPerfectStreak(student) {
  const marks = student.marks || {};
  const keys = Object.keys(marks).map(Number).sort((a,b) => a - b);
  let streak = 0;
  for (let i = keys.length - 1; i >= 0; i--) {
    if (marks[keys[i]] === '🌟') streak++;
    else break;
  }
  return streak;
}

function calcNoMissStreak(student) {
  const marks = student.marks || {};
  const keys = Object.keys(marks).map(Number).sort((a,b) => a - b);
  let streak = 0;
  for (let i = keys.length - 1; i >= 0; i--) {
    const m = marks[keys[i]];
    if (m && m !== '❌') streak++;
    else break;
  }
  return streak;
}

function getLevel(stars) {
  return LEVELS.slice().reverse().find(l => stars >= l.min) || LEVELS[0];
}

function getNextLevel(stars) {
  return LEVELS.find(l => l.min > stars) || null;
}

function calcProgress(stars) {
  const cur  = getLevel(stars);
  const next = getNextLevel(stars);
  if (!next) return 100;
  const range = next.min - cur.min;
  const done  = stars - cur.min;
  return Math.round((done / range) * 100);
}

function getUnlockedAchievements(student) {
  return ACHIEVEMENTS.filter(a => a.check(student));
}

// «Звёзды за неделю» — последние 7 уроков (по индексу)
function calcWeeklyStars(student, totalLessons) {
  const marks = student.marks || {};
  const start = Math.max(1, totalLessons - 6);
  let sum = 0;
  for (let i = start; i <= totalLessons; i++) {
    sum += MARK_STARS[marks[i]] || 0;
  }
  return sum;
}

// ══════════════════════════════════════════════
// ГЛАВНЫЙ РЕНДЕР ИГРОВОЙ СЕКЦИИ
// ══════════════════════════════════════════════

function renderGameSection() {
  const container = document.getElementById('gameSectionContainer');
  if (!container) return;

  const group = getActiveGroup();
  if (!group || group.students.length === 0) {
    container.innerHTML = '';
    return;
  }

  // Считаем данные для всех учеников
  const enriched = group.students.map(s => ({
    ...s,
    stars:        calcStars(s),
    streak:       calcStreak(s),
    level:        getLevel(calcStars(s)),
    progress:     calcProgress(calcStars(s)),
    nextLevel:    getNextLevel(calcStars(s)),
    achievements: getUnlockedAchievements(s),
    weeklyStars:  calcWeeklyStars(s, group.lessons),
  }));

  container.innerHTML = `
    ${renderWeeklyRating(enriched)}
    <div class="student-cards-grid">
      ${enriched.map(s => renderStudentCard(s)).join('')}
    </div>
  `;
}

// ══════════════════════════════════════════════
// РЕЙТИНГ НЕДЕЛИ
// ══════════════════════════════════════════════

function renderWeeklyRating(enriched) {
  // Группируем по weeklyStars
  const groupMap = {};
  enriched.forEach(s => {
    const key = s.weeklyStars;
    if (!groupMap[key]) groupMap[key] = [];
    groupMap[key].push(s);
  });
  const sortedKeys = Object.keys(groupMap).map(Number).sort((a, b) => b - a);
  const groups = sortedKeys.map(k => ({ stars: k, students: groupMap[k] }));
  const hasAny = enriched.some(s => s.weeklyStars > 0);

  const groupsHtml = groups.map((g, gi) => {
    const hasStars  = g.stars > 0;
    const starsText = hasStars
      ? `${'⭐'.repeat(Math.min(g.stars, 7))} ${g.stars} ${g.stars === 1 ? 'звезда' : g.stars < 5 ? 'звезды' : 'звёзд'}`
      : '— Пока нет звёзд';

    const namesHtml = g.students.map(s => `
      <div class="rg-student">
        <span class="rg-icon">${s.level.icon}</span>
        <span class="rg-name">${escapeHtml(s.name)}</span>
        ${s.streak > 0 ? `<span class="rg-streak">🔥${s.streak}</span>` : ''}
      </div>
    `).join('');

    return `
      <div class="rating-group ${hasStars ? 'has-stars' : 'no-stars-group'} gi-${Math.min(gi,3)}">
        <div class="rg-header">
          <span class="rg-label">${starsText}</span>
          <span class="rg-count">${g.students.length} уч.</span>
        </div>
        <div class="rg-students">${namesHtml}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="weekly-rating">
      <div class="rating-header">
        <div class="section-label">🏅 Рейтинг недели</div>
        <button class="btn btn-snap-small" id="ratingSnapshotBtn">📊 Снимок рейтинга</button>
      </div>
      ${!hasAny ? '<div class="rating-empty">Пока нет отметок за последние уроки</div>' : groupsHtml}
    </div>
  `;
}

// ══════════════════════════════════════════════
// КАРТОЧКА УЧЕНИКА
// ══════════════════════════════════════════════

function renderStudentCard(s) {
  const lvl      = s.level;
  const next     = s.nextLevel;
  const achSlice = s.achievements.slice(-4); // последние 4 ачивки

  const streakHtml = s.streak > 0
    ? `<span class="streak-badge">🔥 ${s.streak}</span>`
    : '';

  const nextLevelHtml = next
    ? `<div class="progress-caption">До «${next.title}»: ещё ${next.min - s.stars} ⭐</div>`
    : `<div class="progress-caption" style="color:var(--gold)">Максимальный уровень! 🎉</div>`;

  const achHtml = achSlice.length > 0
    ? achSlice.map(a => `<span class="ach-badge" title="${a.title}: ${a.desc}">${a.icon}</span>`).join('')
    : `<span class="ach-empty">Пока нет достижений</span>`;

  return `
    <div class="student-card" style="--level-color:${lvl.color}" data-student-id="${s.id}">
      <div class="card-top">
        <div class="card-avatar" style="background: linear-gradient(135deg, ${lvl.color}33, ${lvl.color}11)">
          <span class="card-avatar-icon">${lvl.icon}</span>
        </div>
        <div class="card-info">
          <div class="card-name">${escapeHtml(s.name)} ${streakHtml}</div>
          <div class="card-level" style="color:${lvl.color}">${lvl.icon} ${lvl.title}</div>
          <div class="card-stars">⭐ ${s.stars} звёзд</div>
        </div>
      </div>

      <div class="progress-bar-wrap">
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width:${s.progress}%; background:${lvl.color}"></div>
        </div>
        ${nextLevelHtml}
      </div>

      <div class="card-stats">
        <div class="stat-item">
          <div class="stat-val">${s.stars}</div>
          <div class="stat-key">звёзд</div>
        </div>
        <div class="stat-item">
          <div class="stat-val">${s.streak}</div>
          <div class="stat-key">серия 🔥</div>
        </div>
        <div class="stat-item">
          <div class="stat-val">${s.achievements.length}</div>
          <div class="stat-key">наград</div>
        </div>
        <div class="stat-item">
          <div class="stat-val">${s.weeklyStars}</div>
          <div class="stat-key">за неделю</div>
        </div>
      </div>

      <div class="card-achievements">
        ${achHtml}
      </div>
      <button class="btn btn-snap-card">📸 Снимок прогресса</button>
    </div>
  `;
}
