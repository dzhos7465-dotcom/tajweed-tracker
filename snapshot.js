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
        // Цветной кружок за эмодзи
        ctx.fillStyle = MARK_COLOR[mark] + '22';
        ctx.beginPath();
        ctx.arc(cellCX, cellCY, 16, 0, Math.PI * 2);
        ctx.fill();

        // Эмодзи
        ctx.font = '20px serif';
        ctx.textAlign = 'center';
        ctx.fillText(mark, cellCX, cellCY + 7);
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
