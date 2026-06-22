/* ══════════════════════════════════════════════
   TAJWEED TRACKER — i18n.js
   Система переводов: Русский / Чеченский
   Использование: t('ключ') → строка на текущем языке
══════════════════════════════════════════════ */

const translations = {
  ru: {
    // ── Шапка ──
    appTitle:            'Таджвид',
    appSubtitle:         'Журнал учителя',
    syncTitle:           'Статус синхронизации',
    settingsTitle:       'Настройки Google Sheets',
    themeToggle:         'Сменить тему',

    // ── Группы ──
    addGroup:            '＋ Группа',
    noGroups:            'Нет групп',
    noGroupsDesc:        'Нажмите «＋ Группа», чтобы начать',
    deleteGroup:         'Удалить группу',

    // ── Ученики ──
    sortStudents:        '🔤 А→Я',
    bulkAdd:             '📋 Список',
    addStudent:          '＋ Ученик',
    noStudents:          'Нет учеников',
    noStudentsDesc:      'Добавьте первого ученика',

    // ── Таблица ──
    tableNameHeader:     'Имя',
    lessonPrefix:        'Урок',
    snapshotBtn:         '📸 Снимок',
    creating:            'Создаю…',
    removeLesson:        '− Урок',
    addLesson:           '＋ Урок',

    // ── Модалка: новая группа ──
    modalNewGroup:       'Новая группа',
    placeholderGroup:    'Название группы…',
    btnCancel:           'Отмена',
    btnCreate:           'Создать',

    // ── Модалка: новый ученик ──
    modalNewStudent:     'Новый ученик',
    placeholderStudent:  'Имя ученика…',
    btnAdd:              'Добавить',

    // ── Модалка: отметки ──
    modalMark:           'Выберите отметку',
    markDone:            'Выполнил',
    markExcellent:       'Отлично',
    markExceeded:        'Перевыполнил',
    markFailed:          'Не выполнил',
    markClear:           'Очистить',

    // ── Модалка: удалить ученика ──
    modalDeleteStudent:  'Удалить ученика?',
    btnDelete:           'Удалить',

    // ── Модалка: удалить группу ──
    modalDeleteGroup:    'Удалить группу?',

    // ── Модалка: редактировать имя ──
    modalEditName:       '✏️ Редактировать имя',
    btnSave:             'Сохранить',

    // ── Модалка: список имён ──
    modalBulkAdd:        '📋 Добавить список',
    bulkAddDesc:         'Вставьте имена — каждое с новой строки:',
    bulkPlaceholder:     'Айша Иванова\nМарьям Петрова\nЗайнаб Сидорова…',

    // ── Модалка: настройки ──
    modalSettings:       '⚙️ Подключение Google Sheets',
    settingsDesc:        'Вставьте URL вашего Google Apps Script Web App:',
    btnTest:             'Проверить',

    // ── Уровни ──
    levelBeginner:       'Начинающий',
    levelReader:         'Чтец',
    levelDiligent:       'Старательный чтец',
    levelExpert:         'Знаток чтения',
    levelMaster:         'Мастер чтения',

    // ── Достижения ──
    achFirstStar:        'Первая звезда',
    achFirstStarDesc:    'Получить первую отметку',
    achStreak3:          'Огонь!',
    achStreak3Desc:      'Серия 3 урока подряд',
    achStreak5:          'Непрерывный огонь',
    achStreak5Desc:      'Серия 5 уроков подряд',
    achPerfect3:         'Трижды отлично',
    achPerfect3Desc:     '3 отметки 🌟 подряд',
    achTenStars:         'Десятка!',
    achTenStarsDesc:     'Набрать 10 звёзд',
    achTrophy:           'Трофей',
    achTrophyDesc:       'Получить отметку 🏆',
    achNoMiss:           'Без пропусков',
    achNoMissDesc:       '5 выполненных уроков без ❌',
    achCentury:          'Мастер!',
    achCenturyDesc:      'Набрать 100 звёзд',

    achHeader:           'ДОСТИЖЕНИЯ',
    progressHeader:      'ПРОГРЕСС ДО СЛЕДУЮЩЕГО УРОВНЯ',

    // ── Карточки учеников ──
    statStars:           'звёзд',
    statStreak:          'серия 🔥',
    statAwards:          'наград',
    statWeekly:          'за неделю',
    noAchievements:      'Пока нет достижений',
    progressTo:          'До',
    progressMore:        'ещё',
    maxLevel:            'Максимальный уровень! 🎉',
    cardStarsLabel:      'звёзд',
    snapCard:            '📸 Снимок прогресса',

    // ── Рейтинг недели ──
    weeklyRating:        '🏅 Рейтинг недели',
    ratingSnapshot:      '📊 Снимок рейтинга',
    noMarksYet:          'Пока нет отметок за последние уроки',
    studentsCount:       'уч.',
    starWord1:           'звезда',
    starWord2:           'звезды',
    starWord5:           'звёзд',
    noStarsYet:          '— Пока нет звёзд',

    // ── Периоды ──
    periodCurrent:       'Текущий',
    periodName:          'Период',
    periodArchive:       '📁 Просмотр архива',
    closePeriod:         '📦 Завершить период',
    closePeriodConfirm:  'Завершить текущий период? Уроки сохранятся в архиве, начнётся новый период.',

    // ── Подтверждения ──
    confirmRemoveLesson: 'Удалить Урок',
    confirmRemoveLessonSuffix: '? Все отметки этого урока будут удалены.',
  },

  ce: {
    // ── Шапка ──
    appTitle:            'Таджвид',
    appSubtitle:         'Хьехархочун тептар',
    syncTitle:           'Синхронизацин статус',
    settingsTitle:       'Google Sheets гӀирсаш',
    themeToggle:         'Тема хийца',

    // ── Группы ──
    addGroup:            '＋ Тоба',
    noGroups:            'Тобанаш яц',
    noGroupsDesc:        'ДӀадоло «＋ Тоба» тӀетаӀа йе',
    deleteGroup:         'Тоба дӀайаккха',

    // ── Ученики ──
    sortStudents:        '🔤 А→Я',
    bulkAdd:             '📋 МогIам',
    addStudent:          '＋ Дешархо',
    noStudents:          'Дешархой бац',
    noStudentsDesc:      'Хьалхара дешархо д1аваз ве',

    // ── Таблица ──
    tableNameHeader:     'ЦӀе',
    lessonPrefix:        'Урок',
    snapshotBtn:         '📸 Сурт',
    creating:            'Кхуллуш…',
    removeLesson:        '− Урок',
    addLesson:           '＋ Урок',

    // ── Модалка: новая группа ──
    modalNewGroup:       'Керла тоба',
    placeholderGroup:    'Тобанан цӀе…',
    btnCancel:           'Юхадаккха',
    btnCreate:           'Кхолла',

    // ── Модалка: новый ученик ──
    modalNewStudent:     'Керла дешархо',
    placeholderStudent:  'Дешархочун цӀе…',
    btnAdd:              'ТӀетоха',

    // ── Модалка: отметки ──
    modalMark:           'Билгало харжа',
    markDone:            'Кхочушдина',
    markExcellent:       'ТӀехдика',
    markExceeded:        'ТӀехkхочушдина',
    markFailed:          'Кхочуш ца дина',
    markClear:           'ЦӀандан',

    // ── Модалка: удалить ученика ──
    modalDeleteStudent:  'Дешархо дӀаваккха?',
    btnDelete:           'ДӀайаккха',

    // ── Модалка: удалить группу ──
    modalDeleteGroup:    'Тоба дӀайаккха?',

    // ── Модалка: редактировать имя ──
    modalEditName:       '✏️ ЦӀе нисъян',
    btnSave:             'Чуйаккха',

    // ── Модалка: список имён ──
    modalBulkAdd:        '📋 МогIам тӀетоха',
    bulkAddDesc:         'ЦӀераш йаз йе — хӀора а керлачу могӀанера:',
    bulkPlaceholder:     'Айша\nМарьям\nАхьмад …',

    // ── Модалка: настройки ──
    modalSettings:       '⚙️ Google Sheets т1етасар',
    settingsDesc:        'Шайн Google Apps Script Web App URL йилла:',
    btnTest:             'Таллам бан',

    // ── Уровни ──
    levelBeginner:       'ДIаволалуриг',
    levelReader:         'Дешархо',
    levelDiligent:       'Дика доьшуриг',
    levelExpert:         'Къахьоьгу дешархо',
    levelMaster:         'Дешаран говзанча',

    // ── Достижения ──
    achFirstStar:        'Хьалхара седа',
    achFirstStarDesc:    'Хьалхара билгало яккха',
    achStreak3:          'ЦӀе!',
    achStreak3Desc:      'ТӀаьхьий-хьалхий 3 урок',
    achStreak5:          'Йовш йоцу цӀе',
    achStreak5Desc:      'ТӀаьхьий-хьалхий 5 урок',
    achPerfect3:         'Кхозза «ТӀехдика»',
    achPerfect3Desc:     'ТӀаьхьий-хьалхий 3 билгало',
    achTenStars:         'Итт!',
    achTenStarsDesc:     '10 седа гулбар',
    achTrophy:           'ХӀонс',
    achTrophyDesc:       'Билгало йаккха',
    achNoMiss:           'Юкъахдахарш доцуш',
    achNoMissDesc:       '❌ доцуш кхочушдина 5 урок',
    achCentury:          'Говзанча!',
    achCenturyDesc:      '100 седа гулбар',

    achHeader:           'КХИАМАШ',
    progressHeader:      'КХИАМ',

    // ── Карточки учеников ──
    statStars:           'седа',
    statStreak:          'рогӀалла 🔥',
    statAwards:          'совгӀаташ',
    statWeekly:          'кӀиранна',
    noAchievements:      'ХӀинца а кхиамаш бац',
    progressTo:          'ТӀе кхаччалц',
    progressMore:        'кхин а',
    maxLevel:            'Лакхара тIегIа! 🎉',
    cardStarsLabel:      'седа',
    snapCard:            '📸 Сурт',

    // ── Рейтинг недели ──
    weeklyRating:        '🏅 КӀиран рейтинг',
    ratingSnapshot:      'Рейтинган сурт',
    noMarksYet:          'ТӀаьххьарчу урокашна хӀинца а билгаллонаш яц',
    studentsCount:       'деш.',
    starWord1:           'седа',
    starWord2:           'седа',
    starWord5:           'седа',
    noStarsYet:          '— ХӀинца а седарчий дац',

    // ── Периоды ──
    periodCurrent:       'Текущий',
    periodName:          'Период',
    periodArchive:       '📁 Просмотр архива',
    closePeriod:         '📦 Завершить период',
    closePeriodConfirm:  'Завершить текущий период? Уроки сохранятся в архиве, начнётся новый период.',

    // ── Периоды ──
    periodCurrent:       'Карара',
    periodName:          'Мур',
    periodArchive:       '📁 Архиве хьажар',
    closePeriod:         '📦 Мур чекхбаккха',
    closePeriodConfirm:  'Карара мур дIаберза бой? Урокаш архивехь хир ю, керла мур дIаболалур бу.',

    // ── Подтверждения ──
    confirmRemoveLesson: 'Урок дӀаяккха',
    confirmRemoveLessonSuffix: '? ХӀокху урокан билгаллонаш йерриге а дӀайолу.',
  }
};

// ══════════════════════════════════════════════
// ТЕКУЩИЙ ЯЗЫК
// ══════════════════════════════════════════════
let currentLang = localStorage.getItem('tajweedLang') || 'ru';

// Функция получения перевода
function t(key) {
  return (translations[currentLang] && translations[currentLang][key])
    || (translations['ru'] && translations['ru'][key])
    || key;
}

// ══════════════════════════════════════════════
// ПРИМЕНИТЬ ЯЗЫК К СТАТИЧНЫМ ЭЛЕМЕНТАМ
// ══════════════════════════════════════════════
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const attr = el.getAttribute('data-i18n-attr');
    if (attr) {
      el.setAttribute(attr, t(key));
    } else {
      el.textContent = t(key);
    }
  });

  // Placeholder-ы обрабатываем отдельно
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });

  // Title-атрибуты
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.getAttribute('data-i18n-title'));
  });
}

// ══════════════════════════════════════════════
// ПЕРЕКЛЮЧИТЬ ЯЗЫК
// ══════════════════════════════════════════════
function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('tajweedLang', lang);

  // Обновляем кнопку переключателя
  const btn = document.getElementById('langToggleBtn');
  if (btn) btn.textContent = lang === 'ru' ? 'ЧЕЧ' : 'РУС';

  // Применяем переводы к статичным элементам
  applyTranslations();

  // Перерисовываем динамические части
  if (typeof render === 'function') render();
}

// ══════════════════════════════════════════════
// ИНИЦИАЛИЗАЦИЯ ПЕРЕКЛЮЧАТЕЛЯ ЯЗЫКА
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Создаём кнопку переключателя и вставляем в шапку
  const btn = document.createElement('button');
  btn.id        = 'langToggleBtn';
  btn.className = 'icon-btn lang-btn';
  btn.title     = 'Переключить язык / Мотт хийца';
  btn.textContent = currentLang === 'ru' ? 'ЧЕЧ' : 'РУС';
  btn.addEventListener('click', () => {
    setLanguage(currentLang === 'ru' ? 'ce' : 'ru');
  });

  // Вставляем перед кнопкой темы
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) themeBtn.parentNode.insertBefore(btn, themeBtn);

  // Применяем текущий язык
  applyTranslations();
});
