/* ══════════════════════════════════════════════
   TAJWEED TRACKER — snapshot.js
   v3: снимок таблицы → PNG (высокое качество)
   Зависит от: html2canvas (cdnjs), state, getActiveGroup()
══════════════════════════════════════════════ */

document.getElementById('snapshotBtn').addEventListener('click', takeSnapshot);

async function takeSnapshot() {
  const group = getActiveGroup();
  if (!group || group.students.length === 0) {
    alert('Нет данных для снимка. Добавьте учеников и уроки.');
    return;
  }

  const btn = document.getElementById('snapshotBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Создаю…';

  try {
    // ── Строим отдельный DOM-узел для рендера ──
    const canvas = await buildSnapshotCanvas(group);

    // ── Скачиваем PNG ──
    const link = document.createElement('a');
    link.download = `${group.name}_таджвид_${formatDate()}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  } catch (e) {
    console.error('Snapshot error:', e);
    alert('Не удалось создать снимок. Попробуйте ещё раз.');
  } finally {
    btn.disabled = false;
    btn.textContent = '📸 Снимок';
  }
}

// ══════════════════════════════════════════════
// ПОСТРОЕНИЕ CANVAS
// ══════════════════════════════════════════════

async function buildSnapshotCanvas(group) {
  const isDark = document.body.classList.contains('dark');

  // Цвета для снимка (независимо от темы — всегда светлый чистый фон)
  const C = {
    bg:        '#ffffff',
    surface:   '#f8f9fe',
    surface2:  '#eef0f8',
    border:    '#dde0f0',
    text:      '#1a1d2e',
    text2:     '#4a5070',
    text3:     '#8890b0',
    gold:      '#d4980a',
    header:    '#1e2235',
    headerTxt: '#ffffff',
    accent:    '#5a4fd0',
  };

  const MARK_COLOR = {
    '⭐': '#f5c842',
    '🌟': '#e040fb',
    '🏆': '#ff6b35',
    '❌': '#e05560',
    '':   '#dde0f0',
  };

  const CELL_W   = 68;
  const NAME_W   = 180;
  const ROW_H    = 46;
  const HEAD_H   = 52;
  const PAD      = 28;
  const SCALE    = 2;   // retina — 2x для высокого качества
  const RADIUS   = 12;

  const cols   = group.lessons;
  const rows   = group.students.length;
  const tableW = NAME_W + cols * CELL_W;
  const tableH = HEAD_H + rows * ROW_H;

  // Заголовок и подвал
  const TITLE_H  = 72;
  const FOOTER_H = 40;
  const totalW   = tableW + PAD * 2;
  const totalH   = tableH + TITLE_H + FOOTER_H + PAD * 2;

  // Создаём canvas
  const cv = document.createElement('canvas');
  cv.width  = totalW * SCALE;
  cv.height = totalH * SCALE;
  const ctx = cv.getContext('2d');
  ctx.scale(SCALE, SCALE);

  // ── Фон ──
  ctx.fillStyle = C.bg;
  fillRoundRect(ctx, 0, 0, totalW, totalH, 0);

  // ── Заголовок ──
  // Полоса
  const grad = ctx.createLinearGradient(0, 0, totalW, 0);
  grad.addColorStop(0, '#1e2235');
  grad.addColorStop(1, '#2c3050');
  ctx.fillStyle = grad;
  fillRoundRect(ctx, 0, 0, totalW, TITLE_H, 0);

  // Логотип + название группы
  ctx.font = 'bold 22px Nunito, Arial, sans-serif';
  ctx.fillStyle = C.headerTxt;
  ctx.fillText(`🌙 ${group.name}`, PAD, TITLE_H / 2 + 8);

  // Дата справа
  ctx.font = '13px Nunito, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.textAlign = 'right';
  ctx.fillText(formatDateFull(), totalW - PAD, TITLE_H / 2 + 8);
  ctx.textAlign = 'left';

  // ── Таблица ──
  const tX = PAD;
  const tY = TITLE_H + PAD;

  // Тень таблицы
  ctx.shadowColor   = 'rgba(0,0,0,0.12)';
  ctx.shadowBlur    = 16;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = C.bg;
  fillRoundRect(ctx, tX, tY, tableW, tableH, RADIUS);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur  = 0;
  ctx.shadowOffsetY = 0;

  // Граница таблицы
  ctx.strokeStyle = C.border;
  ctx.lineWidth   = 1;
  strokeRoundRect(ctx, tX, tY, tableW, tableH, RADIUS);

  // Заголовок таблицы
  ctx.fillStyle = C.header;
  fillRoundRect(ctx, tX, tY, tableW, HEAD_H, RADIUS, true, false);

  // "Ученик"
  ctx.font = 'bold 12px Nunito, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('УЧЕНИК', tX + 18, tY + HEAD_H / 2 + 5);

  // Заголовки уроков
  for (let i = 0; i < cols; i++) {
    const x = tX + NAME_W + i * CELL_W + CELL_W / 2;
    const y = tY + HEAD_H / 2 + 5;
    ctx.font = 'bold 11px Nunito, Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'center';
    ctx.fillText(`У${i + 1}`, x, y);
  }
  ctx.textAlign = 'left';

  // Строки учеников
  group.students.forEach((student, ri) => {
    const rowY = tY + HEAD_H + ri * ROW_H;
    const isLast = ri === rows - 1;

    // Зебра
    if (ri % 2 === 1) {
      ctx.fillStyle = C.surface;
      const isLastRow = ri === rows - 1;
      fillRoundRect(ctx, tX, rowY, tableW, ROW_H,
        isLastRow ? RADIUS : 0, false, isLastRow);
    }

    // Разделитель строк
    if (!isLast) {
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(tX, rowY + ROW_H);
      ctx.lineTo(tX + tableW, rowY + ROW_H);
      ctx.stroke();
    }

    // Имя ученика
    ctx.font = 'bold 13px Nunito, Arial, sans-serif';
    ctx.fillStyle = C.text;
    ctx.fillText(
      student.name.length > 20 ? student.name.slice(0, 19) + '…' : student.name,
      tX + 18, rowY + ROW_H / 2 + 5
    );

    // Вертикальная линия после имени
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(tX + NAME_W, rowY);
    ctx.lineTo(tX + NAME_W, rowY + ROW_H);
    ctx.stroke();

    // Отметки
    for (let ci = 0; ci < cols; ci++) {
      const mark = (student.marks && student.marks[ci + 1]) || '';
      const cx = tX + NAME_W + ci * CELL_W;
      const cellCX = cx + CELL_W / 2;
      const cellCY = rowY + ROW_H / 2;

      // Вертикальная линия между ячейками
      if (ci > 0) {
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(cx, rowY);
        ctx.lineTo(cx, rowY + ROW_H);
        ctx.stroke();
      }

      if (mark) {
        // Цветной кружок — яркий, ~80% opacity
        ctx.fillStyle = MARK_COLOR[mark] + 'cc';
        ctx.beginPath();
        ctx.arc(cellCX, cellCY, 18, 0, Math.PI * 2);
        ctx.fill();

        // Тонкая обводка для чёткости
        ctx.strokeStyle = MARK_COLOR[mark];
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cellCX, cellCY, 18, 0, Math.PI * 2);
        ctx.stroke();

        // Эмодзи — крупнее
        ctx.font = '22px serif';
        ctx.textAlign = 'center';
        ctx.fillText(mark, cellCX, cellCY + 8);
        ctx.textAlign = 'left';
      } else {
        // Пустая ячейка — точка
        ctx.fillStyle = C.border;
        ctx.beginPath();
        ctx.arc(cellCX, cellCY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });

  // ── Подвал ──
  const footY = tY + tableH + PAD / 2;
  ctx.font = '11px Nunito, Arial, sans-serif';
  ctx.fillStyle = C.text3;
  ctx.fillText('🌙 Таджвид — Журнал учителя', tX, footY + 14);

  // Легенда
  const legend = [['⭐','Выполнил'], ['🌟','Отлично'], ['🏆','Перевыполнил'], ['❌','Не выполнил']];
  let lx = totalW - PAD;
  ctx.textAlign = 'right';
  legend.slice().reverse().forEach(([emoji, label]) => {
    ctx.font = '11px Nunito, Arial, sans-serif';
    ctx.fillStyle = C.text3;
    ctx.fillText(label, lx, footY + 14);
    lx -= ctx.measureText(label).width + 4;
    ctx.font = '13px serif';
    ctx.fillText(emoji, lx, footY + 14);
    lx -= 20;
  });
  ctx.textAlign = 'left';

  return cv;
}

// ══════════════════════════════════════════════
// CANVAS HELPERS
// ══════════════════════════════════════════════

function fillRoundRect(ctx, x, y, w, h, r, topOnly = false, bottomOnly = false) {
  ctx.beginPath();
  if (topOnly) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.arcTo(x, y, x + r, y, r);
  } else if (bottomOnly) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
  }
  ctx.closePath();
  ctx.fill();
}

function strokeRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.stroke();
}

// ══════════════════════════════════════════════
// УТИЛИТЫ
// ══════════════════════════════════════════════

function formatDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDateFull() {
  return new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ══════════════════════════════════════════════
// СНИМОК КАРТОЧКИ УЧЕНИКА
// ══════════════════════════════════════════════

async function takeStudentSnapshot(studentId) {
  const group = getActiveGroup();
  if (!group) return;
  const student = group.students.find(s => s.id === studentId);
  if (!student) return;

  // Собираем данные (те же функции что в gamification.js)
  const stars   = calcStars(student);
  const streak  = calcStreak(student);
  const level   = getLevel(stars);
  const next    = getNextLevel(stars);
  const prog    = calcProgress(stars);
  const achs    = getUnlockedAchievements(student);
  const weekly  = calcWeeklyStars(student, group.lessons);

  const SCALE  = 2;
  const W      = 420;
  const H      = 320;
  const PAD    = 28;
  const RADIUS = 16;

  const cv  = document.createElement('canvas');
  cv.width  = W * SCALE;
  cv.height = H * SCALE;
  const ctx = cv.getContext('2d');
  ctx.scale(SCALE, SCALE);

  // Фон карточки
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, '#1e2235');
  bgGrad.addColorStop(1, '#2c3050');
  ctx.fillStyle = bgGrad;
  fillRoundRect(ctx, 0, 0, W, H, RADIUS);

  // Цветная полоса сверху
  ctx.fillStyle = level.color;
  fillRoundRect(ctx, 0, 0, W, 5, 0);

  // Аватар-круг
  const avX = PAD + 36, avY = PAD + 36;
  ctx.fillStyle = level.color + '33';
  ctx.beginPath();
  ctx.arc(avX, avY, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = level.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(avX, avY, 36, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = '34px serif';
  ctx.textAlign = 'center';
  ctx.fillText(level.icon, avX, avY + 12);
  ctx.textAlign = 'left';

  // Имя ученика
  ctx.font = 'bold 20px Nunito, Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(
    student.name.length > 22 ? student.name.slice(0, 21) + '…' : student.name,
    PAD + 84, PAD + 26
  );

  // Уровень
  ctx.font = 'bold 13px Nunito, Arial, sans-serif';
  ctx.fillStyle = level.color;
  ctx.fillText(`${level.icon} ${level.title}`, PAD + 84, PAD + 46);

  // Группа
  ctx.font = '11px Nunito, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillText(group.name, PAD + 84, PAD + 63);

  // Серия 🔥
  if (streak > 0) {
    const sW = 70, sH = 24, sX = W - PAD - sW, sY = PAD + 14;
    ctx.fillStyle = '#ff6b3544';
    fillRoundRect(ctx, sX, sY, sW, sH, 999);
    ctx.font = 'bold 12px Nunito, Arial, sans-serif';
    ctx.fillStyle = '#ff8c42';
    ctx.textAlign = 'center';
    ctx.fillText(`🔥 ${streak} подряд`, sX + sW / 2, sY + 16);
    ctx.textAlign = 'left';
  }

  // Разделитель
  const divY = PAD + 88;
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, divY);
  ctx.lineTo(W - PAD, divY);
  ctx.stroke();

  // Прогресс-бар
  const barY = divY + 16;
  const barW = W - PAD * 2;
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  fillRoundRect(ctx, PAD, barY, barW, 10, 999);
  const filled = Math.max(4, barW * prog / 100);
  ctx.fillStyle = level.color;
  fillRoundRect(ctx, PAD, barY, filled, 10, 999);

  const capText = next
    ? `До «${next.title}»: ещё ${next.min - stars} ⭐`
    : '🎉 Максимальный уровень!';
  ctx.font = '11px Nunito, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText(capText, PAD, barY + 24);

  // 4 статистики
  const statsY = barY + 40;
  const statW  = (W - PAD * 2) / 4;
  const statsData = [
    { val: stars,   key: 'звёзд ⭐' },
    { val: streak,  key: 'серия 🔥' },
    { val: achs.length, key: 'наград 🏅' },
    { val: weekly,  key: 'неделя' },
  ];
  statsData.forEach((st, i) => {
    const sx = PAD + i * statW;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    fillRoundRect(ctx, sx + 2, statsY, statW - 4, 52, 10);

    ctx.font = 'bold 22px Nunito, Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(String(st.val), sx + statW / 2, statsY + 28);

    ctx.font = '10px Nunito, Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText(st.key, sx + statW / 2, statsY + 44);
    ctx.textAlign = 'left';
  });

  // Достижения
  const achY = statsY + 64;
  if (achs.length > 0) {
    ctx.font = '10px Nunito, Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText('ДОСТИЖЕНИЯ', PAD, achY);

    achs.slice(0, 8).forEach((a, i) => {
      const ax = PAD + i * 34;
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      fillRoundRect(ctx, ax, achY + 8, 28, 28, 8);
      ctx.font = '16px serif';
      ctx.textAlign = 'center';
      ctx.fillText(a.icon, ax + 14, achY + 26);
      ctx.textAlign = 'left';
    });
  } else {
    ctx.font = '11px Nunito, Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillText('Достижения появятся по мере выполнения заданий…', PAD, achY + 20);
  }

  // Подвал
  ctx.font = '10px Nunito, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.textAlign = 'right';
  ctx.fillText(`🌙 Таджвид — ${formatDateFull()}`, W - PAD, H - 12);
  ctx.textAlign = 'left';

  // Скачиваем
  const link = document.createElement('a');
  link.download = `${student.name}_прогресс_${formatDate()}.png`;
  link.href = cv.toDataURL('image/png', 1.0);
  link.click();
}

// ══════════════════════════════════════════════
// СНИМОК РЕЙТИНГА НЕДЕЛИ
// ══════════════════════════════════════════════

async function takeRatingSnapshot() {
  const group = getActiveGroup();
  if (!group || group.students.length === 0) {
    alert('Нет данных для снимка.');
    return;
  }

  const btn = document.getElementById('ratingSnapshotBtn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Создаю…'; }

  try {
    const enriched = group.students.map(s => ({
      ...s,
      stars:       calcStars(s),
      streak:      calcStreak(s),
      level:       getLevel(calcStars(s)),
      weeklyStars: calcWeeklyStars(s, group.lessons),
    })).sort((a, b) => b.weeklyStars - a.weeklyStars);

    const SCALE   = 2;
    const W       = 480;
    const ROW_H   = 52;
    const HEAD_H  = 90;
    const FOOT_H  = 40;
    const PAD     = 24;
    const H       = HEAD_H + enriched.length * ROW_H + FOOT_H + PAD;
    const MEDALS  = ['🥇', '🥈', '🥉'];

    const cv  = document.createElement('canvas');
    cv.width  = W * SCALE;
    cv.height = H * SCALE;
    const ctx = cv.getContext('2d');
    ctx.scale(SCALE, SCALE);

    // Фон
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#1e2235');
    bgGrad.addColorStop(1, '#141827');
    ctx.fillStyle = bgGrad;
    fillRoundRect(ctx, 0, 0, W, H, 0);

    // Заголовок
    ctx.font = 'bold 22px Nunito, Arial, sans-serif';
    ctx.fillStyle = '#f5c842';
    ctx.textAlign = 'center';
    ctx.fillText('🏅 Рейтинг недели', W / 2, PAD + 28);

    ctx.font = '13px Nunito, Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText(group.name + ' · ' + formatDateFull(), W / 2, PAD + 50);
    ctx.textAlign = 'left';

    // Разделитель
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, HEAD_H - 10);
    ctx.lineTo(W - PAD, HEAD_H - 10);
    ctx.stroke();

    // Строки
    enriched.forEach((s, i) => {
      const rowY   = HEAD_H + i * ROW_H;
      const isTop3 = i < 3;

      // Фон строки
      if (isTop3) {
        const rowGrad = ctx.createLinearGradient(0, rowY, W, rowY);
        const gold = ['#f5c84218', '#e0a01018', '#c0c0c018'];
        rowGrad.addColorStop(0, gold[i]);
        rowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = rowGrad;
      } else {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent';
      }
      fillRoundRect(ctx, PAD / 2, rowY + 3, W - PAD, ROW_H - 6, 10);

      // Медаль / номер
      ctx.font = isTop3 ? '22px serif' : 'bold 14px Nunito, Arial, sans-serif';
      ctx.fillStyle = isTop3 ? '#ffffff' : 'rgba(255,255,255,0.35)';
      ctx.textAlign = 'center';
      ctx.fillText(isTop3 ? MEDALS[i] : String(i + 1), PAD + 12, rowY + ROW_H / 2 + 7);
      ctx.textAlign = 'left';

      // Иконка уровня
      ctx.font = '18px serif';
      ctx.fillText(s.level.icon, PAD + 34, rowY + ROW_H / 2 + 7);

      // Имя
      ctx.font = isTop3 ? 'bold 15px Nunito, Arial, sans-serif' : '14px Nunito, Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      const name = s.name.length > 24 ? s.name.slice(0, 23) + '…' : s.name;
      ctx.fillText(name, PAD + 60, rowY + ROW_H / 2 + 6);

      // Серия
      if (s.streak > 0) {
        ctx.font = '11px Nunito, Arial, sans-serif';
        ctx.fillStyle = '#ff8c42';
        ctx.fillText(`🔥${s.streak}`, PAD + 60, rowY + ROW_H / 2 + 22);
      }

      // Звёзды-пипсы
      const maxPips = 7;
      const pips    = Math.min(s.weeklyStars, maxPips);
      for (let p = 0; p < maxPips; p++) {
        ctx.fillStyle = p < pips ? '#f5c842' : 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.arc(W - PAD - 80 + p * 11, rowY + ROW_H / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Число звёзд
      ctx.font = 'bold 14px Nunito, Arial, sans-serif';
      ctx.fillStyle = s.weeklyStars > 0 ? '#f5c842' : 'rgba(255,255,255,0.2)';
      ctx.textAlign = 'right';
      ctx.fillText(`${s.weeklyStars} ⭐`, W - PAD, rowY + ROW_H / 2 + 6);
      ctx.textAlign = 'left';
    });

    // Подвал
    const footY = HEAD_H + enriched.length * ROW_H + PAD / 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, footY);
    ctx.lineTo(W - PAD, footY);
    ctx.stroke();

    ctx.font = '10px Nunito, Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.textAlign = 'center';
    ctx.fillText('🌙 Таджвид — Журнал учителя', W / 2, footY + 22);
    ctx.textAlign = 'left';

    const link = document.createElement('a');
    link.download = `${group.name}_рейтинг_${formatDate()}.png`;
    link.href = cv.toDataURL('image/png', 1.0);
    link.click();

  } catch(e) {
    console.error('Rating snapshot error:', e);
    alert('Не удалось создать снимок рейтинга.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '📊 Снимок рейтинга'; }
  }
}
