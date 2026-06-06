/* ══════════════════════════════════════════════
   TAJWEED TRACKER — snapshot.js  v4 (clean)
══════════════════════════════════════════════ */

// ── Кнопка таблицы ──
document.getElementById('snapshotBtn').addEventListener('click', takeSnapshot);

// ── Делегирование для динамических кнопок ──
document.addEventListener('click', function(e) {
  if (e.target && e.target.id === 'ratingSnapshotBtn') {
    takeRatingSnapshot();
  }
  if (e.target && e.target.classList.contains('btn-snap-card')) {
    const card = e.target.closest('.student-card');
    if (card && card.dataset.studentId) {
      takeStudentSnapshot(card.dataset.studentId);
    }
  }
});

// ══════════════════════════════════════════════
// УНИВЕРСАЛЬНОЕ СКАЧИВАНИЕ
// ══════════════════════════════════════════════

// ── Вспомогательные иконки для статистики ──
function drawStar(ctx,cx,cy,r,points,color){
  ctx.fillStyle=color;
  ctx.beginPath();
  for(let i=0;i<points*2;i++){
    const angle=i*Math.PI/points - Math.PI/2;
    const rad=i%2===0?r:r*0.45;
    i===0?ctx.moveTo(cx+rad*Math.cos(angle),cy+rad*Math.sin(angle))
         :ctx.lineTo(cx+rad*Math.cos(angle),cy+rad*Math.sin(angle));
  }
  ctx.closePath(); ctx.fill();
}
function drawFlame(ctx,cx,cy,color){
  ctx.fillStyle=color;
  ctx.beginPath();
  ctx.ellipse(cx,cy+2,5,8,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#ffcc80';
  ctx.beginPath();
  ctx.ellipse(cx,cy+3,3,5,0,0,Math.PI*2); ctx.fill();
}
function drawMedal(ctx,cx,cy,color){
  ctx.fillStyle=color;
  ctx.beginPath(); ctx.arc(cx,cy+3,8,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.5)';
  ctx.beginPath(); ctx.arc(cx,cy+3,5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=color; ctx.lineWidth=2;
  ctx.fillRect(cx-2,cy-10,4,8);
}
function drawDiamond(ctx,cx,cy,color){
  ctx.fillStyle=color;
  ctx.beginPath();
  ctx.moveTo(cx,cy-9); ctx.lineTo(cx+7,cy); ctx.lineTo(cx,cy+9); ctx.lineTo(cx-7,cy);
  ctx.closePath(); ctx.fill();
}

function downloadCanvas(canvas, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 1.0);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
// CANVAS HELPERS
// ══════════════════════════════════════════════
function fillRoundRect(ctx, x, y, w, h, r, topOnly, bottomOnly) {
  ctx.beginPath();
  if (topOnly) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h);
    ctx.arcTo(x, y, x + r, y, r);
  } else if (bottomOnly) {
    ctx.moveTo(x, y); ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  }
  ctx.closePath(); ctx.fill();
}
function strokeRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath(); ctx.stroke();
}

// ══════════════════════════════════════════════
// 1. СНИМОК ТАБЛИЦЫ
// ══════════════════════════════════════════════
async function takeSnapshot() {
  const group = getActiveGroup();
  if (!group || group.students.length === 0) {
    alert('Нет данных для снимка. Добавьте учеников и уроки.');
    return;
  }
  const btn = document.getElementById('snapshotBtn');
  btn.disabled = true; btn.textContent = '⏳ Создаю…';
  try {
    const canvas = await buildSnapshotCanvas(group);
    downloadCanvas(canvas, `${group.name}_таджвид_${formatDate()}.png`);
  } catch(e) {
    console.error('Snapshot error:', e);
    alert('Не удалось создать снимок.');
  } finally {
    btn.disabled = false; btn.textContent = '📸 Снимок';
  }
}

async function buildSnapshotCanvas(group) {
  const C = {
    bg:'#ffffff', surface:'#f8f9fe', surface2:'#eef0f8', border:'#dde0f0',
    text:'#1a1d2e', text2:'#4a5070', text3:'#8890b0', gold:'#d4980a',
    header:'#1e2235', headerTxt:'#ffffff',
  };
  const MARK_COLOR = { '⭐':'#f5c842','🌟':'#e040fb','🏆':'#ff6b35','❌':'#e05560','':'#dde0f0' };
  const CELL_W=68, NAME_W=180, ROW_H=46, HEAD_H=52, PAD=28, SCALE=2, RADIUS=12;
  const cols=group.lessons, rows=group.students.length;
  const tableW=NAME_W+cols*CELL_W, tableH=HEAD_H+rows*ROW_H;
  const TITLE_H=72, FOOTER_H=40;
  const totalW=tableW+PAD*2, totalH=tableH+TITLE_H+FOOTER_H+PAD*2;

  const cv = document.createElement('canvas');
  cv.width=totalW*SCALE; cv.height=totalH*SCALE;
  const ctx=cv.getContext('2d'); ctx.scale(SCALE,SCALE);

  ctx.fillStyle=C.bg; fillRoundRect(ctx,0,0,totalW,totalH,0);

  const grad=ctx.createLinearGradient(0,0,totalW,0);
  grad.addColorStop(0,'#1e2235'); grad.addColorStop(1,'#2c3050');
  ctx.fillStyle=grad; fillRoundRect(ctx,0,0,totalW,TITLE_H,0);

  ctx.font='bold 22px Arial,sans-serif'; ctx.fillStyle=C.headerTxt;
  ctx.fillText(`🌙 ${group.name}`,PAD,TITLE_H/2+8);
  ctx.font='13px Arial,sans-serif'; ctx.fillStyle='rgba(255,255,255,0.55)';
  ctx.textAlign='right'; ctx.fillText(formatDateFull(),totalW-PAD,TITLE_H/2+8);
  ctx.textAlign='left';

  const tX=PAD, tY=TITLE_H+PAD;
  ctx.shadowColor='rgba(0,0,0,0.12)'; ctx.shadowBlur=16; ctx.shadowOffsetY=4;
  ctx.fillStyle=C.bg; fillRoundRect(ctx,tX,tY,tableW,tableH,RADIUS);
  ctx.shadowColor='transparent'; ctx.shadowBlur=0; ctx.shadowOffsetY=0;
  ctx.strokeStyle=C.border; ctx.lineWidth=1; strokeRoundRect(ctx,tX,tY,tableW,tableH,RADIUS);

  ctx.fillStyle=C.header; fillRoundRect(ctx,tX,tY,tableW,HEAD_H,RADIUS,true,false);
  ctx.font='bold 12px Arial,sans-serif'; ctx.fillStyle='rgba(255,255,255,0.6)';
  ctx.fillText('УЧЕНИК',tX+18,tY+HEAD_H/2+5);
  for(let i=0;i<cols;i++){
    ctx.font='bold 11px Arial,sans-serif'; ctx.fillStyle='rgba(255,255,255,0.7)';
    ctx.textAlign='center';
    ctx.fillText(`У${i+1}`,tX+NAME_W+i*CELL_W+CELL_W/2,tY+HEAD_H/2+5);
  }
  ctx.textAlign='left';

  group.students.forEach((student,ri)=>{
    const rowY=tY+HEAD_H+ri*ROW_H, isLast=ri===rows-1;
    if(ri%2===1){ ctx.fillStyle=C.surface; fillRoundRect(ctx,tX,rowY,tableW,ROW_H,isLast?RADIUS:0,false,isLast); }
    if(!isLast){ ctx.strokeStyle=C.border; ctx.lineWidth=0.5; ctx.beginPath(); ctx.moveTo(tX,rowY+ROW_H); ctx.lineTo(tX+tableW,rowY+ROW_H); ctx.stroke(); }
    ctx.font='bold 13px Arial,sans-serif'; ctx.fillStyle=C.text;
    ctx.fillText(student.name.length>20?student.name.slice(0,19)+'…':student.name,tX+18,rowY+ROW_H/2+5);
    ctx.strokeStyle=C.border; ctx.lineWidth=0.5;
    ctx.beginPath(); ctx.moveTo(tX+NAME_W,rowY); ctx.lineTo(tX+NAME_W,rowY+ROW_H); ctx.stroke();

    for(let ci=0;ci<cols;ci++){
      const mark=(student.marks&&student.marks[ci+1])||'';
      const cx=tX+NAME_W+ci*CELL_W, cellCX=cx+CELL_W/2, cellCY=rowY+ROW_H/2;
      if(ci>0){ ctx.strokeStyle=C.border; ctx.lineWidth=0.5; ctx.beginPath(); ctx.moveTo(cx,rowY); ctx.lineTo(cx,rowY+ROW_H); ctx.stroke(); }
      if(mark){
        ctx.fillStyle=MARK_COLOR[mark]+'cc';
        ctx.beginPath(); ctx.arc(cellCX,cellCY,18,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle=MARK_COLOR[mark]; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(cellCX,cellCY,18,0,Math.PI*2); ctx.stroke();
        ctx.font='22px serif'; ctx.textAlign='center';
        ctx.fillText(mark,cellCX,cellCY+8); ctx.textAlign='left';
      } else {
        ctx.fillStyle=C.border;
        ctx.beginPath(); ctx.arc(cellCX,cellCY,3,0,Math.PI*2); ctx.fill();
      }
    }
  });

  const footY=tY+tableH+PAD/2;
  ctx.font='11px Arial,sans-serif'; ctx.fillStyle=C.text3;
  ctx.fillText('🌙 Таджвид — Журнал учителя',tX,footY+14);
  const legend=[['⭐','Выполнил'],['🌟','Отлично'],['🏆','Перевыполнил'],['❌','Не выполнил']];
  let lx=totalW-PAD; ctx.textAlign='right';
  legend.slice().reverse().forEach(([emoji,label])=>{
    ctx.font='11px Arial,sans-serif'; ctx.fillStyle=C.text3;
    ctx.fillText(label,lx,footY+14); lx-=ctx.measureText(label).width+4;
    ctx.font='13px serif'; ctx.fillText(emoji,lx,footY+14); lx-=20;
  });
  ctx.textAlign='left';
  return cv;
}

// ══════════════════════════════════════════════
// 2. СНИМОК КАРТОЧКИ УЧЕНИКА
// ══════════════════════════════════════════════
async function takeStudentSnapshot(studentId) {
  const group = getActiveGroup();
  if (!group) return;
  const student = group.students.find(s => s.id === studentId);
  if (!student) return;

  const stars  = calcStars(student);
  const streak = calcStreak(student);
  const level  = getLevel(stars);
  const next   = getNextLevel(stars);
  const prog   = calcProgress(stars);
  const achs   = getUnlockedAchievements(student);
  const weekly = calcWeeklyStars(student, group.lessons);

  const SCALE=2, W=500, H=380, PAD=32;
  const cv=document.createElement('canvas');
  cv.width=W*SCALE; cv.height=H*SCALE;
  const ctx=cv.getContext('2d'); ctx.scale(SCALE,SCALE);

  const bgGrad=ctx.createLinearGradient(0,0,W,H);
  bgGrad.addColorStop(0,'#12152a'); bgGrad.addColorStop(1,'#1e2240');
  ctx.fillStyle=bgGrad; ctx.beginPath(); ctx.roundRect(0,0,W,H,20); ctx.fill();

  ctx.fillStyle=level.color+'15';
  ctx.beginPath(); ctx.arc(W,0,180,0,Math.PI*2); ctx.fill();

  const topGrad=ctx.createLinearGradient(0,0,W,0);
  topGrad.addColorStop(0,level.color); topGrad.addColorStop(1,level.color+'88');
  ctx.fillStyle=topGrad; ctx.beginPath(); ctx.roundRect(0,0,W,6,[20,20,0,0]); ctx.fill();

  const avCX=PAD+44, avCY=48;
  ctx.shadowColor=level.color; ctx.shadowBlur=18;
  ctx.fillStyle=level.color+'30';
  ctx.beginPath(); ctx.arc(avCX,avCY,40,0,Math.PI*2); ctx.fill();
  ctx.shadowBlur=0;
  ctx.strokeStyle=level.color; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.arc(avCX,avCY,40,0,Math.PI*2); ctx.stroke();
  ctx.font='38px serif'; ctx.textAlign='center'; ctx.fillStyle='#ffffff';
  ctx.fillText(level.icon,avCX,avCY+14); ctx.textAlign='left';

  const nameX=PAD+100;
  ctx.font='bold 22px Arial,sans-serif'; ctx.fillStyle='#ffffff';
  ctx.fillText(student.name.length>20?student.name.slice(0,19)+'…':student.name,nameX,32);
  ctx.font='bold 14px Arial,sans-serif'; ctx.fillStyle=level.color;
  ctx.fillText(level.icon+' '+level.title,nameX,52);
  ctx.font='12px Arial,sans-serif'; ctx.fillStyle='rgba(255,255,255,0.4)';
  ctx.fillText('📚 '+group.name,nameX,70);

  if(streak>0){
    const pill='🔥 '+streak+' подряд';
    ctx.font='bold 12px Arial,sans-serif';
    const pillW=ctx.measureText(pill).width+20, pillX=W-PAD-pillW, pillY=20;
    ctx.fillStyle='rgba(255,107,53,0.25)';
    ctx.beginPath(); ctx.roundRect(pillX,pillY,pillW,26,999); ctx.fill();
    ctx.strokeStyle='#ff6b35'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.roundRect(pillX,pillY,pillW,26,999); ctx.stroke();
    ctx.fillStyle='#ff8c42'; ctx.textAlign='center';
    ctx.fillText(pill,pillX+pillW/2,pillY+17); ctx.textAlign='left';
  }

  const div1Y=96;
  ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(PAD,div1Y); ctx.lineTo(W-PAD,div1Y); ctx.stroke();

  const barY=div1Y+16, barW=W-PAD*2, barH=12;
  ctx.font='10px Arial,sans-serif'; ctx.fillStyle='rgba(255,255,255,0.35)';
  ctx.fillText('ПРОГРЕСС ДО СЛЕДУЮЩЕГО УРОВНЯ',PAD,barY-4);
  ctx.fillStyle='rgba(255,255,255,0.1)';
  ctx.beginPath(); ctx.roundRect(PAD,barY,barW,barH,999); ctx.fill();
  const filledW=Math.max(barH,barW*prog/100);
  const barGrad=ctx.createLinearGradient(PAD,0,PAD+filledW,0);
  barGrad.addColorStop(0,level.color); barGrad.addColorStop(1,level.color+'aa');
  ctx.fillStyle=barGrad; ctx.shadowColor=level.color; ctx.shadowBlur=8;
  ctx.beginPath(); ctx.roundRect(PAD,barY,filledW,barH,999); ctx.fill();
  ctx.shadowBlur=0;
  const capText=next?'До «'+next.title+'»: ещё '+(next.min-stars)+' ⭐':'🎉 Максимальный уровень!';
  ctx.font='11px Arial,sans-serif'; ctx.fillStyle='rgba(255,255,255,0.5)';
  ctx.fillText(capText,PAD,barY+barH+16);

  const statsY=barY+barH+32, statW=(W-PAD*2-12)/4;
  // Цвета и символы для статистики — без эмодзи, всё рисуем сами
  const statsData=[
    {val:String(stars),   key:'Звёзд',  color:'#f5c842', draw:(ctx,cx,cy)=>{ drawStar(ctx,cx,cy,10,5,'#f5c842'); }},
    {val:String(streak),  key:'Серия',  color:'#ff7043', draw:(ctx,cx,cy)=>{ drawFlame(ctx,cx,cy,'#ff7043'); }},
    {val:String(achs.length),key:'Наград',color:'#ab87ff',draw:(ctx,cx,cy)=>{ drawMedal(ctx,cx,cy,'#ab87ff'); }},
    {val:String(weekly),  key:'Неделя', color:'#4fc3f7', draw:(ctx,cx,cy)=>{ drawDiamond(ctx,cx,cy,'#4fc3f7'); }},
  ];
  statsData.forEach((st,i)=>{
    const sx=PAD+i*(statW+4), sy=statsY;
    // Фон ячейки с лёгким цветным оттенком
    ctx.fillStyle=st.color+'18'; ctx.strokeStyle=st.color+'55'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.roundRect(sx,sy,statW,72,12); ctx.fill(); ctx.stroke();
    // Иконка
    const cx=sx+statW/2, iconY=sy+22;
    ctx.save(); st.draw(ctx,cx,iconY); ctx.restore();
    // Значение
    ctx.font='bold 24px Arial,sans-serif'; ctx.fillStyle='#ffffff';
    ctx.textAlign='center'; ctx.fillText(st.val,cx,sy+50);
    // Подпись
    ctx.font='10px Arial,sans-serif'; ctx.fillStyle='rgba(255,255,255,0.45)';
    ctx.fillText(st.key,cx,sy+65); ctx.textAlign='left';
  });

  const achY=statsY+86;
  ctx.font='10px Arial,sans-serif'; ctx.fillStyle='rgba(255,255,255,0.35)';
  ctx.fillText('ДОСТИЖЕНИЯ',PAD,achY);
  if(achs.length>0){
    achs.slice(0,10).forEach((a,i)=>{
      const ax=PAD+i*40, ay=achY+6;
      // Белый фон — эмодзи хорошо виден на белом
      ctx.fillStyle='rgba(255,255,255,0.92)'; ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.roundRect(ax,ay,34,34,9); ctx.fill(); ctx.stroke();
      ctx.shadowBlur=0; ctx.font='22px serif'; ctx.textAlign='center';
      ctx.fillText(a.icon,ax+17,ay+25); ctx.textAlign='left';
    });
  } else {
    ctx.font='11px Arial,sans-serif'; ctx.fillStyle='rgba(255,255,255,0.35)';
    ctx.fillText('Достижения появятся после выполнения заданий…',PAD,achY+24);
  }

  ctx.font='10px Arial,sans-serif'; ctx.fillStyle='rgba(255,255,255,0.2)';
  ctx.textAlign='right';
  ctx.fillText('🌙 Таджвид — Журнал учителя · '+formatDateFull(),W-PAD,H-12);
  ctx.textAlign='left';

  downloadCanvas(cv, student.name+'_прогресс_'+formatDate()+'.png');
}

// ══════════════════════════════════════════════
// 3. СНИМОК РЕЙТИНГА НЕДЕЛИ
// ══════════════════════════════════════════════
async function takeRatingSnapshot() {
  const group = getActiveGroup();
  if (!group || group.students.length === 0) {
    alert('Нет данных для снимка.');
    return;
  }
  const btn = document.getElementById('ratingSnapshotBtn');
  if (btn) { btn.disabled=true; btn.textContent='⏳ Создаю…'; }

  try {
    const enriched = group.students.map(s => ({
      ...s,
      stars:       calcStars(s),
      streak:      calcStreak(s),
      level:       getLevel(calcStars(s)),
      weeklyStars: calcWeeklyStars(s, group.lessons),
    }));

    const groupMap={};
    enriched.forEach(s=>{ const k=s.weeklyStars; if(!groupMap[k]) groupMap[k]=[]; groupMap[k].push(s); });
    const sortedKeys=Object.keys(groupMap).map(Number).sort((a,b)=>b-a);
    const groups=sortedKeys.map(k=>({stars:k,students:groupMap[k]}));

    const SCALE=2, W=500, PAD=28, HEAD_H=90, FOOT_H=44, GRP_H=36, NAME_H=44;
    let contentH=0;
    groups.forEach(g=>{ contentH+=GRP_H; contentH+=Math.ceil(g.students.length/2)*NAME_H+8; });
    const H=HEAD_H+contentH+FOOT_H+PAD;

    const cv=document.createElement('canvas');
    cv.width=W*SCALE; cv.height=H*SCALE;
    const ctx=cv.getContext('2d'); ctx.scale(SCALE,SCALE);

    const bgGrad=ctx.createLinearGradient(0,0,0,H);
    bgGrad.addColorStop(0,'#12152a'); bgGrad.addColorStop(1,'#1a1e35');
    ctx.fillStyle=bgGrad; ctx.beginPath(); ctx.rect(0,0,W,H); ctx.fill();

    ctx.font='bold 24px Arial,sans-serif'; ctx.fillStyle='#f5c842';
    ctx.textAlign='center'; ctx.fillText('🏅 Рейтинг недели',W/2,PAD+30);
    ctx.font='13px Arial,sans-serif'; ctx.fillStyle='rgba(255,255,255,0.4)';
    ctx.fillText(group.name+' · '+formatDateFull(),W/2,PAD+52);
    ctx.textAlign='left';

    ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(PAD,HEAD_H-8); ctx.lineTo(W-PAD,HEAD_H-8); ctx.stroke();

    const GROUP_COLORS=['#f5c842','#e8a020','#a0a0b0','#6bcb77'];
    let curY=HEAD_H;

    groups.forEach((g,gi)=>{
      const color=GROUP_COLORS[Math.min(gi,GROUP_COLORS.length-1)];
      const hasStars=g.stars>0;
      const blockRows=Math.ceil(g.students.length/2);
      const blockH=GRP_H+blockRows*NAME_H+12;

      ctx.fillStyle='rgba(255,255,255,0.04)';
      ctx.beginPath(); ctx.roundRect(PAD/2,curY+4,W-PAD,blockH-8,12); ctx.fill();

      const starsLabel=hasStars?(g.stars===1?'1 звезда':g.stars+' звезды'):'Пока нет звёзд';
      const starEmoji=hasStars?'⭐'.repeat(Math.min(g.stars,5)):'—';
      ctx.font='bold 13px Arial,sans-serif'; ctx.fillStyle=color;
      ctx.fillText(starEmoji+'  '+starsLabel,PAD+8,curY+GRP_H/2+5);
      ctx.font='11px Arial,sans-serif'; ctx.fillStyle='rgba(255,255,255,0.3)';
      ctx.textAlign='right'; ctx.fillText(g.students.length+' уч.',W-PAD-8,curY+GRP_H/2+5);
      ctx.textAlign='left';

      ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=0.5;
      ctx.beginPath(); ctx.moveTo(PAD+8,curY+GRP_H); ctx.lineTo(W-PAD-8,curY+GRP_H); ctx.stroke();
      curY+=GRP_H;

      const colW=(W-PAD*2)/2;
      g.students.forEach((s,si)=>{
        const col=si%2, row=Math.floor(si/2);
        const nx=PAD+8+col*colW, ny=curY+row*NAME_H+NAME_H/2;
        ctx.font='14px serif'; ctx.fillText(s.level.icon,nx,ny+5);
        const shortName=s.name.length>18?s.name.slice(0,17)+'…':s.name;
        ctx.font=hasStars?'bold 13px Arial,sans-serif':'12px Arial,sans-serif';
        ctx.fillStyle=hasStars?'#ffffff':'rgba(255,255,255,0.45)';
        ctx.fillText(shortName,nx+22,ny+5);
        if(s.streak>0){
          ctx.font='10px Arial,sans-serif'; ctx.fillStyle='#ff8c42';
          ctx.fillText('🔥'+s.streak,nx+22,ny+19);
        }
      });
      curY+=blockRows*NAME_H+12;
    });

    ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(PAD,curY+8); ctx.lineTo(W-PAD,curY+8); ctx.stroke();
    ctx.font='10px Arial,sans-serif'; ctx.fillStyle='rgba(255,255,255,0.2)';
    ctx.textAlign='center';
    ctx.fillText('🌙 Таджвид — Журнал учителя',W/2,curY+28);
    ctx.textAlign='left';

    downloadCanvas(cv, group.name+'_рейтинг_'+formatDate()+'.png');

  } catch(e) {
    console.error('Rating snapshot error:', e);
    alert('Не удалось создать снимок рейтинга.');
  } finally {
    if(btn){ btn.disabled=false; btn.textContent='📊 Снимок рейтинга'; }
  }
}
