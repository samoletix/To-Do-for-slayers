/**
 * Все пользовательские надписи приложения.
 *
 * Рядом с файлом данных создаются два файла:
 *   `strings.txt`     — русский, справа от дефиса твой текст;
 *   `strings.en.txt`  — английский, уже заполнен переводом.
 * Формат строки: `надпись - новая надпись`. Пустая правая часть означает «оставить как есть».
 */

import type { Language } from './types'

export const STRINGS_FILE_NAME = 'strings.txt'
export const STRINGS_EN_FILE_NAME = 'strings.en.txt'

export const LANGUAGES: Language[] = ['ru', 'en']

export const DEFAULT_STRINGS: Record<string, string> = {
  // --- общие действия ---
  'Закрыть': 'Закрыть',
  'Отмена': 'Отмена',
  'Сохранить': 'Сохранить',
  'Сохранено': 'Сохранено',
  'Добавить': 'Добавить',
  'Удалить': 'Удалить',
  'Готово': 'Готово',
  'Найти': 'Найти',
  'Есть': 'Есть',
  'Открыть': 'Открыть',
  'Найти по ID': 'Найти по ID',
  'Посмотреть из буфера': 'Посмотреть из буфера',
  'Найти уровень по ID, даже если его нет в листе': 'Найти уровень по ID, даже если его нет в листе',

  // --- статусы уровня ---
  'Пройден': 'Пройден',
  'В процессе': 'В процессе',
  'Планируется': 'Планируется',
  'Заморожен': 'Заморожен',
  'Мечта': 'Мечта',
  'Мёртв': 'Мёртв',
  'пройден': 'пройден',
  'в процессе': 'в процессе',

  // --- листы Global Demonlist ---
  'Main': 'Main',
  'Extended': 'Extended',
  'Advanced': 'Advanced',
  'Unbounded': 'Unbounded',

  // --- шапка ---
  'To-Do for slayers': 'To-Do for slayers',
  'Поиск': 'Поиск',
  'Синхронизировать': 'Синхронизировать',
  '+ Уровень': '+ Уровень',

  // --- вкладки ---
  'Уровни': 'Уровни',

  // --- список уровней ---
  'Название': 'Название',
  'Статус': 'Статус',
  'Прогресс': 'Прогресс',
  'Попытки': 'Попытки',
  'Видео': 'Видео',
  'Превью видео': 'Превью видео',
  'Превью недоступно': 'Preview unavailable',
  'Открыть видео': 'Открыть видео',
  'Открыть уровень': 'Открыть уровень',
  'Открыть на demonlist.org': 'Открыть на demonlist.org',
  'Всего уровней: {n}': 'Всего уровней: {n}',
  'Показано {shown} из {total} уровней': 'Показано {shown} из {total} уровней',
  'Ничего не найдено': 'Ничего не найдено',
  'Список пуст': 'Список пуст',
  'Введи номер, чтобы поставить уровень на это место':
    'Введи номер, чтобы поставить уровень на это место',
  'Позиция в GDL: #{place}. Введи номер, чтобы поставить уровень на это место':
    'Позиция в GDL: #{place}. Введи номер, чтобы поставить уровень на это место',
  'Место': 'Место',
  'Нет': 'Нет',

  // --- порядок уровней ---
  'Сортировать по позиции в GDL': 'Сортировать по позиции в GDL',
  'Порядок по позиции в GDL восстановлен': 'Порядок по позиции в GDL восстановлен',
  'Порядок вручную': 'Порядок вручную',
  'Порядок задан вручную, а не по позиции в GDL': 'Порядок задан вручную, а не по позиции в GDL',
  'Перетащи строку, чтобы поменять местами уровни': 'Перетащи строку, чтобы поменять местами уровни',

  // --- сайдбар ---
  'Фильтр по статусам': 'Фильтр по статусам',
  'Сбросить фильтры': 'Сбросить фильтры',
  'Всего': 'Всего',
  'Пройдено': 'Пройдено',
  'Пройдено {done} из {total}': 'Пройдено {done} из {total}',
  'Настройки': 'Настройки',

  // --- форма уровня ---
  'Название уровня': 'Название уровня',
  'Название уровня *': 'Название уровня *',
  'Например: Bloodbath': 'Например: Bloodbath',
  'Примеры: 27-100, 99.96%, 75, 100%': 'Примеры: 27-100, 99.96%, 75, 100%',
  'Фановость': 'Фановость',
  'Любой текст: 95, топ, легенда': 'Любой текст: 95, топ, легенда',
  'Сколько попыток ушло на уровень': 'Сколько попыток ушло на уровень',
  'Счётчик вручную: синхронизация его не меняет':
    'The counter is manual: sync never changes it',
  'Мнение о сложности': 'Мнение о сложности',
  'Свободным текстом: где подвох, сколько попыток ушло':
    'Свободным текстом: где подвох, сколько попыток ушло',
  'Комментарий': 'Комментарий',
  'Заметки, идеи, тайминги': 'Заметки, идеи, тайминги',
  'Дополнительно': 'Дополнительно',
  'Автор': 'Автор',
  'Верификатор': 'Верификатор',
  'ID в Geometry Dash': 'ID в Geometry Dash',
  'Позиция в списке': 'Позиция в списке',
  'Ссылка на видео прохождения': 'Ссылка на видео прохождения',
  'Ролик прохождения от самого слеера, не ролик верификатора':
    'Ролик прохождения от самого слеера, не ролик верификатора',
  'Своё превью': 'Своё превью',
  'Выбрать изображение': 'Выбрать изображение',
  'Вставить из буфера': 'Вставить из буфера',
  'В буфере обмена нет картинки': 'В буфере обмена нет картинки',
  'Убрать превью': 'Убрать превью',
  'Убрать своё превью?': 'Убрать своё превью?',
  'Картинка вместо превью ролика': 'Картинка вместо превью ролика',
  'Превью обновлено': 'Превью обновлено',

  // --- добавление уровня ---
  'Добавить уровень': 'Добавить уровень',
  'Свой уровень': 'Свой уровень',
  'Все листы': 'Все листы',
  'Добавлено: {n}': 'Добавлено: {n}',
  '+ В план': '+ В план',
  '{points} очк. · {percent}%': '{points} очк. · {percent}%',
  '3436 или https://demonlist.org/classic/3436': '3436 или https://demonlist.org/classic/3436',
  'Ничего не найдено. Попробуй другое название или выбери другой лист.':
    'Ничего не найдено. Попробуй другое название или выбери другой лист.',
  'Нужен ID уровня (например 3436) или ссылка вида https://demonlist.org/classic/3436':
    'Нужен ID уровня (например 3436) или ссылка вида https://demonlist.org/classic/3436',


  'Место в рейтинге': 'Место в рейтинге',
  'Очки': 'Очки',
  'Не пройдено': 'Не пройдено',

  'Показать папку': 'Показать папку',

  // --- синхронизация ---
  'Синхронизация с Global Demonlist': 'Синхронизация с Global Demonlist',
  'Данные берутся из открытого профиля на demonlist.org — логин и пароль не нужны.':
    'Данные берутся из открытого профиля на demonlist.org — логин и пароль не нужны.',
  'Статусы «Заморожен», «Мечта» и «Мёртв» синхронизация не трогает.':
    'Статусы «Заморожен», «Мечта» и «Мёртв» синхронизация не трогает.',
  'Ник, ID или ссылка': 'Ник, ID или ссылка',
  'Введи ник, ID или ссылку на профиль Global Demonlist':
    'Введи ник, ID или ссылку на профиль Global Demonlist',
  'Введите ник, ID или ссылку на профиль Global Demonlist':
    'Введите ник, ID или ссылку на профиль Global Demonlist',
  'Добавлять новые уровни из профиля': 'Добавлять новые уровни из профиля',
  'Добирать с листа уровни, которые игрок ещё не прошёл':
    'Добирать с листа уровни, которые игрок ещё не прошёл',
  'В профиле их нет: список уровней Global Demonlist вычитается из профиля, остаток добавляется как «Планируется»':
    'В профиле их нет: список уровней Global Demonlist вычитается из профиля, остаток добавляется как «Планируется»',
  'Не пройдено в листе: {n}{added}': 'Не пройдено в листе: {n}{added}',
  'добавлено {n}': 'добавлено {n}',
  'Подтягивать автора, верификатора и ссылки (дополнительные запросы к API)':
    'Подтягивать автора, верификатора и ссылки (дополнительные запросы к API)',
  'Место в рейтинге: #{place}': 'Место в рейтинге: #{place}',
  'Очки: {points}': 'Очки: {points}',
  'Профиль:': 'Профиль:',
  'Пройдено: {done} · в процессе: {progress} · {message}':
    'Пройдено: {done} · в процессе: {progress} · {message}',
  'Добавлены:': 'Добавлены:',
  'Обновлены:': 'Обновлены:',
  'Не трогал (заморожен/мечта/мёртв):': 'Не трогал (заморожен/мечта/мёртв):',
  'Не удалось получить детали для {n} уровней.':
    'Не удалось получить детали для {n} уровней.',
  'и ещё {n}': 'и ещё {n}',
  'Пропущено защищённых статусов: {n}': 'Пропущено защищённых статусов: {n}',
  'Добавлено {n}': 'Добавлено {n}',
  'Обновлено {n}': 'Обновлено {n}',
  'Поддерживаются: ник, ID или ссылка на профиль':
    'Поддерживаются: ник, ID или ссылка на профиль',
  '{name} ({done})': '{name} ({done})',
  'изменений нет': 'изменений нет',
  'Добавлено синхронизацией: уже пройден': 'Добавлено синхронизацией: уже пройден',
  'Добавлено синхронизацией: ещё не пройден': 'Добавлено синхронизацией: ещё не пройден',
  'Добавлено синхронизацией: в процессе ({percent}%)':
    'Добавлено синхронизацией: в процессе ({percent}%)',
  'Статус изменён на «Пройден» при синхронизации с Global Demonlist':
    'Статус изменён на «Пройден» при синхронизации с Global Demonlist',

  // --- настройки: внешний вид ---
  'Внешний вид': 'Внешний вид',
  'Язык': 'Язык',
  'Русский': 'Русский',
  'Английский': 'Английский',
  'Масштаб интерфейса': 'Масштаб интерфейса',
  'Как увеличить или уменьшить размер текста и элементов':
    'Как увеличить или уменьшить размер текста и элементов',
  'Компактный режим': 'Компактный режим',
  'Убирает превью в строках: остаются название, позиция, прогресс и рамка цвета статуса':
    'Убирает превью в строках: остаются название, позиция, прогресс и рамка цвета статуса',
  'Шаблон оформления': 'Шаблон оформления',
  'Набор цветов, рамок и шрифта приложения': 'Набор цветов, рамок и шрифта приложения',
  'Modern Dark UI': 'Modern Dark UI',
  'Glassmorphism': 'Glassmorphism',
  'Neumorphism': 'Neumorphism',
  'Retro Terminal': 'Retro Terminal',
  'Material Design': 'Material Design',
  'Synthwave': 'Synthwave',
  'Claymorphism': 'Claymorphism',
  'Minimalism': 'Minimalism',
  'Neon': 'Neon',
  'Flat Design 2.0': 'Flat Design 2.0',
  'Цвет фона': 'Цвет фона',
  'Цвет фона объектов': 'Цвет фона объектов',
  'Цвет панелей': 'Цвет панелей',
  'Цвет кнопок': 'Цвет кнопок',
  'Цвет текста': 'Цвет текста',
  'Цвет из шаблона': 'Цвет из шаблона',
  'Сбросить': 'Сбросить',
  'Сбросить цвета': 'Сбросить цвета',
  'Сбросить все цвета на цвета шаблона?': 'Сбросить все цвета на цвета шаблона?',
  '«Цвет фона» красит только полосу позади плашек уровней, «Цвет фона объектов» — сами плашки':
    '«Цвет фона» красит только полосу позади плашек уровней, «Цвет фона объектов» — сами плашки',
  'Фоновая картинка': 'Фоновая картинка',
  'Выбрать картинку': 'Выбрать картинку',
  'Убрать картинку': 'Убрать картинку',
  'Картинка на весь фон приложения, GIF тоже можно':
    'Картинка на весь фон приложения, GIF тоже можно',
  'Шрифт': 'Шрифт',
  'Шрифт по умолчанию': 'Шрифт по умолчанию',
  'Выбрать файл шрифта': 'Выбрать файл шрифта',
  'Свой шрифт': 'Свой шрифт',
  'Шрифты из папки Fonts в Windows или свой файл .ttf/.otf':
    'Шрифты из папки Fonts в Windows или свой файл .ttf/.otf',

  // --- настройки: цвета статусов ---
  'Цвета статусов': 'Цвет статусов',

  // --- настройки: файлы ---
  'Файлы и данные': 'Файлы и данные',
  'Папка данных приложения': 'Папка данных приложения',
  'Переместить данные…': 'Переместить данные…',
  'Выбери папку, куда перенести файл данных, надписи, превью и шрифты':
    'Выбери папку, куда перенести файл данных, надписи, превью и шрифты',
  'Файл сохранения': 'Файл сохранения',
  'Показать файл в проводнике': 'Показать файл в проводнике',
  'Экспорт копии': 'Экспорт копии',
  'Импорт из файла': 'Импорт из файла',
  'Данные перемещены в {path}': 'Данные перемещены в {path}',
  'Копия сохранена: {path}': 'Копия сохранена: {path}',
  'Загружено из {path}': 'Загружено из {path}',

  // --- настройки: надписи ---
  'Файл с надписями': 'Файл с надписями',
  'Открыть папку': 'Открыть папку',
  'В файле каждая строка имеет вид «надпись - новая надпись». Оставь правую часть пустой, чтобы не менять.':
    'В файле каждая строка имеет вид «надпись - новая надпись». Оставь правую часть пустой, чтобы не менять.',
  'Обновить надписи': 'Обновить надписи',
  'Надписи обновлены': 'Надписи обновлены',
  'Сохрани файл — надписи обновятся в приложении сразу, перезапускать не нужно.':
    'Сохрани файл — надписи обновятся в приложении сразу, перезапускать не нужно.',

  // --- уведомления ---
  '«{name}» добавлен в планы': '«{name}» добавлен в планы',
  '«{name}» удалён': '«{name}» удалён',
  'Удалить фоновое изображение?': 'Удалить фоновое изображение?',
  'Данные ещё загружаются': 'Данные ещё загружаются',
  'Синхронизация с {user}: {message}': 'Синхронизация с {user}: {message}',

  // --- ошибки ---
  'Некорректная ссылка: {url}': 'Некорректная ссылка: {url}',
  'Разрешены только http(s)-ссылки': 'Разрешены только http(s)-ссылки',
  'Некорректный ID уровня': 'Некорректный ID уровня',
  'Загрузка картинок разрешена только с i.ytimg.com':
    'Загрузка картинок разрешена только с i.ytimg.com',
  'Это не изображение': 'Это не изображение',
  'Не удалось разобрать ссылку: {input}': 'Не удалось разобрать ссылку: {input}',
  'Не удалось определить пользователя из «{input}»':
    'Не удалось определить пользователя из «{input}»',
  'Пользователь «{name}» не найден на Global Demonlist':
    'Пользователь «{name}» не найден на Global Demonlist',
  'Пользователь не найден на Global Demonlist': 'Пользователь не найден на Global Demonlist',
  'Уровень не найден на Global Demonlist': 'Уровень не найден на Global Demonlist',
  'API не понял параметры запроса уровня': 'API не понял параметры запроса уровня',
  'Некорректная дата': 'Некорректная дата',
  'Это не картинка': 'Это не картинка',
  'Не удалось прочитать изображение': 'Не удалось прочитать изображение',
  'Не удалось связаться с api.demonlist.org ({reason})':
    'Не удалось связаться с api.demonlist.org ({reason})'
}

/** Английский перевод. Ключи должны совпадать с русским файлом. */
export const EN_STRINGS: Record<string, string> = {
  'Закрыть': 'Close',
  'Отмена': 'Cancel',
  'Сохранить': 'Save',
  'Сохранено': 'Saved',
  'Добавить': 'Add',
  'Удалить': 'Delete',
  'Готово': 'Done',
  'Найти': 'Find',
  'Есть': 'Added',
  'Открыть': 'Open',
  'Найти по ID': 'Find by ID',
  'Посмотреть из буфера': 'Preview from clipboard',
  'Найти уровень по ID, даже если его нет в листе': 'Find a level by ID, even if it is not on the list',

  'Пройден': 'Completed',
  'В процессе': 'In progress',
  'Планируется': 'Planned',
  'Заморожен': 'Frozen',
  'Мечта': 'Dream',
  'Мёртв': 'Dead',
  'пройден': 'completed',
  'в процессе': 'in progress',

  'Main': 'Main',
  'Extended': 'Extended',
  'Advanced': 'Advanced',
  'Unbounded': 'Unbounded',

  'To-Do for slayers': 'To-Do for slayers',
  'Поиск': 'Search',
  'Синхронизировать': 'Sync',
  '+ Уровень': '+ Level',

  'Уровни': 'Levels',

  'Название': 'Name',
  'Статус': 'Status',
  'Прогресс': 'Progress',
  'Попытки': 'Attempts',
  'Видео': 'Video',
  'Превью видео': 'Video preview',
  'Превью недоступно': 'Preview unavailable',
  'Открыть видео': 'Open video',
  'Открыть уровень': 'Open level',
  'Открыть на demonlist.org': 'Open on demonlist.org',
  'Всего уровней: {n}': 'Total levels: {n}',
  'Показано {shown} из {total} уровней': 'Showing {shown} of {total} levels',
  'Ничего не найдено': 'Nothing found',
  'Список пуст': 'The list is empty',
  'Введи номер, чтобы поставить уровень на это место':
    'Type a number to move the level to that place',
  'Позиция в GDL: #{place}. Введи номер, чтобы поставить уровень на это место':
    'GDL position: #{place}. Type a number to move the level to that place',
  'Место': 'Place',
  'Нет': 'No',

  'Сортировать по позиции в GDL': 'Sort by GDL position',
  'Порядок по позиции в GDL восстановлен': 'GDL position order restored',
  'Порядок вручную': 'Manual order',
  'Порядок задан вручную, а не по позиции в GDL': 'The order is manual, not by GDL position',
  'Перетащи строку, чтобы поменять местами уровни': 'Drag a row to swap levels',

  'Фильтр по статусам': 'Filter by status',
  'Сбросить фильтры': 'Clear filters',
  'Всего': 'Total',
  'Пройдено': 'Completed',
  'Пройдено {done} из {total}': 'Completed {done} of {total}',
  'Настройки': 'Settings',

  'Название уровня': 'Level name',
  'Название уровня *': 'Level name *',
  'Например: Bloodbath': 'For example: Bloodbath',
  'Примеры: 27-100, 99.96%, 75, 100%': 'Examples: 27-100, 99.96%, 75, 100%',
  'Фановость': 'Popularity',
  'Любой текст: 95, топ, легенда': 'Any text: 95, top, legend',
  'Сколько попыток ушло на уровень': 'How many attempts the level took',
  'Счётчик вручную: синхронизация его не меняет':
    'The counter is manual: sync never changes it',
  'Мнение о сложности': 'Difficulty thoughts',
  'Свободным текстом: где подвох, сколько попыток ушло':
    'Free text: where the trick is, how many attempts it took',
  'Комментарий': 'Comment',
  'Заметки, идеи, тайминги': 'Notes, ideas, timings',
  'Дополнительно': 'More',
  'Автор': 'Creator',
  'Верификатор': 'Verifier',
  'ID в Geometry Dash': 'Geometry Dash ID',
  'Позиция в списке': 'List position',
  'Ссылка на видео прохождения': 'Link to the playthrough video',
  'Ролик прохождения от самого слеера, не ролик верификатора':
    'The playthrough clip by the slayer, not the verifier’s video',
  'Своё превью': 'Custom preview',
  'Выбрать изображение': 'Choose image',
  'Вставить из буфера': 'Paste from clipboard',
  'В буфере обмена нет картинки': 'There is no image in the clipboard',
  'Убрать превью': 'Remove preview',
  'Убрать своё превью?': 'Remove the custom preview?',
  'Картинка вместо превью ролика': 'An image instead of the video thumbnail',
  'Превью обновлено': 'Preview updated',

  'Добавить уровень': 'Add level',
  'Свой уровень': 'Custom level',
  'Все листы': 'All lists',
  'Добавлено: {n}': 'Added: {n}',
  '+ В план': '+ To plan',
  '{points} очк. · {percent}%': '{points} points · {percent}%',
  '3436 или https://demonlist.org/classic/3436': '3436 or https://demonlist.org/classic/3436',
  'Ничего не найдено. Попробуй другое название или выбери другой лист.':
    'Nothing found. Try another name or pick a different list.',
  'Нужен ID уровня (например 3436) или ссылка вида https://demonlist.org/classic/3436':
    'A level ID (for example 3436) or a link like https://demonlist.org/classic/3436 is required',


  'Место в рейтинге': 'Leaderboard place',
  'Очки': 'Points',
  'Не пройдено': 'Not completed',


  'Синхронизация с Global Demonlist': 'Sync with Global Demonlist',
  'Данные берутся из открытого профиля на demonlist.org — логин и пароль не нужны.':
    'Data comes from a public profile on demonlist.org — no login or password needed.',
  'Статусы «Заморожен», «Мечта» и «Мёртв» синхронизация не трогает.':
    'Sync never touches the Frozen, Dream and Dead statuses.',
  'Ник, ID или ссылка': 'Username, ID or link',
  'Введи ник, ID или ссылку на профиль Global Demonlist':
    'Enter a username, ID or a link to a Global Demonlist profile',
  'Введите ник, ID или ссылку на профиль Global Demonlist':
    'Enter a username, ID or a link to a Global Demonlist profile',
  'Добавлять новые уровни из профиля': 'Add new levels from the profile',
  'Добирать с листа уровни, которые игрок ещё не прошёл':
    'Pull in the list levels the player has not beaten yet',
  'В профиле их нет: список уровней Global Demonlist вычитается из профиля, остаток добавляется как «Планируется»':
    'The profile has no such list: the Global Demonlist levels are subtracted from the profile and the rest is added as “Planned”',
  'Не пройдено в листе: {n}{added}': 'Not beaten on the list: {n}{added}',
  'добавлено {n}': ', added {n}',
  'Подтягивать автора, верификатора и ссылки (дополнительные запросы к API)':
    'Fetch creator, verifier and links (extra API requests)',
  'Место в рейтинге: #{place}': 'Rank: #{place}',
  'Очки: {points}': 'Points: {points}',
  'Профиль:': 'Profile:',
  'Пройдено: {done} · в процессе: {progress} · {message}':
    'Completed: {done} · in progress: {progress} · {message}',
  'Добавлены:': 'Added:',
  'Обновлены:': 'Updated:',
  'Не трогал (заморожен/мечта/мёртв):': 'Untouched (frozen/dream/dead):',
  'Не удалось получить детали для {n} уровней.':
    'Could not fetch details for {n} levels.',
  'и ещё {n}': 'and {n} more',
  'Пропущено защищённых статусов: {n}': 'Skipped protected statuses: {n}',
  'Добавлено {n}': 'Added {n}',
  'Обновлено {n}': 'Updated {n}',
  'Поддерживаются: ник, ID или ссылка на профиль':
    'Supported: username, ID or a profile link',
  '{name} ({done})': '{name} ({done})',
  'изменений нет': 'no changes',
  'Добавлено синхронизацией: уже пройден': 'Added by sync: already completed',
  'Добавлено синхронизацией: ещё не пройден': 'Added by sync: not completed yet',
  'Добавлено синхронизацией: в процессе ({percent}%)':
    'Added by sync: in progress ({percent}%)',
  'Статус изменён на «Пройден» при синхронизации с Global Demonlist':
    'Status set to Completed during Global Demonlist sync',

  'Внешний вид': 'Appearance',
  'Язык': 'Language',
  'Русский': 'Russian',
  'Английский': 'English',
  'Масштаб интерфейса': 'Interface scale',
  'Как увеличить или уменьшить размер текста и элементов':
    'How to enlarge or shrink the text and elements',
  'Компактный режим': 'Compact mode',
  'Убирает превью в строках: остаются название, позиция, прогресс и рамка цвета статуса':
    'Removes previews in rows: only the name, position, progress and status colour frame remain',
  'Шаблон оформления': 'Appearance template',
  'Набор цветов, рамок и шрифта приложения':
    'A set of colours, borders and the app font',
  'Modern Dark UI': 'Modern Dark UI',
  'Glassmorphism': 'Glassmorphism',
  'Neumorphism': 'Neumorphism',
  'Retro Terminal': 'Retro Terminal',
  'Material Design': 'Material Design',
  'Synthwave': 'Synthwave',
  'Claymorphism': 'Claymorphism',
  'Minimalism': 'Minimalism',
  'Neon': 'Neon',
  'Flat Design 2.0': 'Flat Design 2.0',
  'Цвет фона': 'Background colour',
  'Цвет фона объектов': 'Object background colour',
  'Цвет панелей': 'Panel colour',
  'Цвет кнопок': 'Button colour',
  'Цвет текста': 'Text colour',
  'Цвет из шаблона': 'Colour from the template',
  'Сбросить': 'Reset',
  'Сбросить цвета': 'Reset colours',
  'Сбросить все цвета на цвета шаблона?': 'Reset all colours to the template ones?',
  '«Цвет фона» красит только полосу позади плашек уровней, «Цвет фона объектов» — сами плашки':
    '“Background colour” paints only the strip behind the level rows, “Object background colour” paints the rows themselves',
  'Фоновая картинка': 'Background image',
  'Выбрать картинку': 'Choose image',
  'Убрать картинку': 'Remove image',
  'Картинка на весь фон приложения, GIF тоже можно':
    'The image covers the whole app background, GIF is supported too',
  'Шрифт': 'Font',
  'Шрифт по умолчанию': 'Default font',
  'Выбрать файл шрифта': 'Choose font file',
  'Свой шрифт': 'Custom font',
  'Шрифты из папки Fonts в Windows или свой файл .ttf/.otf':
    'Fonts from the Windows Fonts folder, or your own .ttf/.otf file',

  'Цвета статусов': 'Status colours',

  'Файлы и данные': 'Files and data',
  'Папка данных приложения': 'App data folder',
  'Показать папку': 'Show folder',
  'Переместить данные…': 'Move data…',
  'Выбери папку, куда перенести файл данных, надписи, превью и шрифты':
    'Pick a folder to move the data file, strings, previews and fonts into',
  'Файл сохранения': 'Save file',
  'Показать файл в проводнике': 'Show file in Explorer',
  'Экспорт копии': 'Export copy',
  'Импорт из файла': 'Import from file',
  'Данные перемещены в {path}': 'Data moved to {path}',
  'Копия сохранена: {path}': 'Copy saved: {path}',
  'Загружено из {path}': 'Loaded from {path}',

  'Файл с надписями': 'Strings file',
  'Открыть папку': 'Open folder',
  'В файле каждая строка имеет вид «надпись - новая надпись». Оставь правую часть пустой, чтобы не менять.':
    'Every line looks like “text - new text”. Leave the right side empty to keep it unchanged.',
  'Обновить надписи': 'Reload strings',
  'Надписи обновлены': 'Strings reloaded',
  'Сохрани файл — надписи обновятся в приложении сразу, перезапускать не нужно.':
    'Save the file — strings update in the app right away, no restart needed.',

  '«{name}» добавлен в планы': '“{name}” added to plans',
  '«{name}» удалён': '“{name}” deleted',
  'Удалить фоновое изображение?': 'Delete the background image?',
  'Данные ещё загружаются': 'Data is still loading',
  'Синхронизация с {user}: {message}': 'Sync with {user}: {message}',

  'Некорректная ссылка: {url}': 'Invalid link: {url}',
  'Разрешены только http(s)-ссылки': 'Only http(s) links are allowed',
  'Некорректный ID уровня': 'Invalid level ID',
  'Загрузка картинок разрешена только с i.ytimg.com':
    'Images can only be downloaded from i.ytimg.com',
  'Это не изображение': 'That is not an image',
  'Не удалось разобрать ссылку: {input}': 'Could not parse the link: {input}',
  'Не удалось определить пользователя из «{input}»':
    'Could not resolve a user from “{input}”',
  'Пользователь «{name}» не найден на Global Demonlist':
    'User “{name}” not found on Global Demonlist',
  'Пользователь не найден на Global Demonlist': 'User not found on Global Demonlist',
  'Уровень не найден на Global Demonlist': 'Level not found on Global Demonlist',
  'API не понял параметры запроса уровня': 'The API did not understand the level query',
  'Некорректная дата': 'Invalid date',
  'Это не картинка': 'That is not an image',
  'Не удалось прочитать изображение': 'Could not read the image',
  'Не удалось связаться с api.demonlist.org ({reason})':
    'Could not reach api.demonlist.org ({reason})'
}

export function stringsFileName(language: Language): string {
  return language === 'en' ? STRINGS_EN_FILE_NAME : STRINGS_FILE_NAME
}

export function dateLocale(language: Language): string {
  return language === 'en' ? 'en-US' : 'ru-RU'
}

let overrides: Record<string, string> = {}
let language: Language = 'ru'

export function setLanguage(next: Language): void {
  language = next
}

/** Правая часть строки файла. */
export function parseStringsFile(text: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    // Ключ сам может содержать « - » (например, в подсказке про формат файла),
    // поэтому сперва ищем разделитель, дающий известный ключ, и только потом
    // берём первый. Пустая правая часть («Ключ -») тоже допустима.
    let key = ''
    let value = ''
    let fallbackTaken = false
    for (const match of line.matchAll(/\s+-(?:\s|$)/g)) {
      const at = match.index as number
      const candidate = line.slice(0, at).trim()
      const candidateValue = line.slice(at).replace(/^\s+-(?:\s|$)/, '').trim()
      if (!fallbackTaken) {
        key = candidate
        value = candidateValue
        fallbackTaken = true
      }
      if (DEFAULT_STRINGS[candidate] !== undefined) {
        key = candidate
        value = candidateValue
        break
      }
    }
    if (!key) continue
    result[key] = value
  }
  return result
}

function header(lang: Language): string[] {
  return lang === 'en'
    ? [
        '# To-Do for slayers — strings file (English).',
        '# Format:  text - new text',
        '# Everything after the dash is your translation. Leave the right side empty to keep the built-in text.',
        '# Placeholders like {n}, {name}, {url}, {percent} are substituted at runtime — do not rename them.',
        '# The file is re-read when you save it, no restart needed.'
      ]
    : [
        '# Файл надписей приложения.',
        '# Формат строки:  надпись - новая надпись',
        '# Всё, что справа от дефиса, — это перевод. Оставь правую часть пустой, чтобы оставить надпись как есть.',
        '# Подсказка: «{n}», «{name}», «{url}», «{percent}» и другие — подставляются в текст, не меняй их имена.',
        '# Файл перечитывается при запуске приложения.'
      ]
}

/** Готовый файл для правки: русский — с пустыми переводами, английский — уже переведённый. */
export function buildStringsFile(lang: Language): string {
  const base = lang === 'en' ? EN_STRINGS : DEFAULT_STRINGS
  const lines = [...header(lang), '']
  for (const key of Object.keys(DEFAULT_STRINGS)) {
    const value = base[key] ?? ''
    lines.push(lang === 'en' ? `${key} - ${value}` : `${key} - `)
  }
  return `${lines.join('\n')}\n`
}

export function setStringOverrides(next: Record<string, string>): void {
  overrides = next
}

export function stringOverrides(): Record<string, string> {
  return { ...overrides }
}

/** Перевод строки с подстановкой {placeholders}. */
export function t(key: string, vars?: Record<string, string | number>): string {
  const custom = overrides[key]
  const base = language === 'en' ? EN_STRINGS : DEFAULT_STRINGS
  const template = custom && custom.length ? custom : (base[key] ?? key)
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match
  )
}

export function hasOverride(key: string): boolean {
  return !!overrides[key]
}
