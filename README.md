# Nexus AI

Персональный AI-ассистент: чат, голосовой режим, стикеры, файлы, живой AI-аватар.
Next.js (static export) + TypeScript + Tailwind + Firebase + imgbb.

## Статус проекта

Это рабочий каркас продукта, не демо-макет:

- ✅ Firebase Auth (Email/пароль, Google, восстановление пароля) — реально работает
- ✅ Firestore (чаты, сообщения, проекты, настройки, память, избранные стикеры) — реально работает
- ✅ Realtime Database (online/offline presence) — реально работает
- ✅ imgbb (загрузка изображений) — реально работает
- ✅ Голосовой режим (Web Speech API: распознавание + синтез речи) — реально работает в браузере, без внешних ключей
- ✅ AI-аватар со стейт-машиной (все состояния из твоего списка)
- ✅ Sticker keyboard (поиск, категории, избранное, недавние, ленивая загрузка)
- ⚠️ Сам AI отвечает через **MockAIProvider** — локальную заглушку без реальной модели (см. раздел "Подключение реальной модели" ниже). Вся архитектура вокруг (стриминг, история, память, состояния) полностью рабочая — тебе нужно только подставить свой backend.
- 🚧 Режим Project (работа с файлами проекта) — реализован в Firestore-слое (`lib/firebase/firestore.ts`: `createProject`, `addFileToProject`, `subscribeToProjects`), но пока без отдельного UI-экрана — следующий логичный шаг развития.

## Запуск локально

```bash
npm install
npm run dev
```

Открой http://localhost:3000

`.env.local` уже заполнен твоими данными (Firebase + imgbb) — этот файл в `.gitignore` и никогда не попадёт в репозиторий. Если нужно поменять ключи — просто отредактируй его.

## Структура проекта

```
app/                    # Next.js App Router (layout, page, стили)
components/
  auth/                 # Экран входа/регистрации
  avatar/               # AIAvatar — главный визуальный элемент
  chat/                 # Окно чата, сообщения, code block, поле ввода
  sidebar/              # Боковая панель (чаты/избранное/архив)
  stickers/             # Клавиатура стикеров
  voice/                # Полноэкранный голосовой режим
  settings/             # Страница настроек
  ui/                   # Icon, IconButton — используют только твои PNG
lib/
  firebase/             # config, auth, firestore, presence (RTDB)
  ai/                   # AIProvider интерфейс + MockAIProvider + выборка контекста
  imgbb/                # Загрузка изображений
  stickers/             # Загрузка библиотеки стикеров, недавние
hooks/                  # useAuth, useChat, useAIState, useVoice
types/                  # Общие TypeScript-типы
data/                   # uiIcons.ts, aiStateIcons.ts, stickerLibrary.json
firebase/               # firestore.rules, database.rules.json, storage.rules
.github/workflows/      # Автодеплой на GitHub Pages
```

## Подключение твоей библиотеки стикеров

Сейчас в `data/stickerLibrary.json` лежит небольшой демо-набор. Чтобы подключить полную библиотеку:

1. Приведи файл к формату:
   ```json
   [
     { "name": "Категория", "stickers": [{ "name": "Название", "url": "https://..." }] }
   ]
   ```
2. Замени содержимое `data/stickerLibrary.json`.

Больше ничего менять не нужно — `lib/stickers/library.ts` сам сгенерирует уникальные ID, поиск и ленивая загрузка (`components/stickers/StickerKeyboard.tsx`) уже работают с любым объёмом данных. Если библиотека окажется очень большой (мегабайты JSON), лучше положить файл в `public/stickers.json` и заменить статический импорт в `library.ts` на `fetch('/stickers.json')` внутри `useEffect` — тогда он не будет раздувать бандл.

## Подключение реальной AI-модели

Единая точка входа — `lib/ai/index.ts`, всё приложение обращается только к интерфейсу `AIProvider` (`lib/ai/types.ts`). Чтобы подключить реальную модель:

1. **Никогда** не клади API-ключ модели в `NEXT_PUBLIC_*` — на статическом хостинге (GitHub Pages) это сделает ключ публичным.
2. Разверни отдельный serverless-эндпоинт (Firebase Cloud Function, Vercel Function, Cloudflare Worker и т.д.), который держит ключ на сервере и проксирует запросы к модели.
3. Создай `lib/ai/httpProvider.ts`, реализующий интерфейс `AIProvider`, который ходит на твой эндпоинт через `fetch`.
4. Замени `export const aiProvider = new MockAIProvider()` в `lib/ai/index.ts` на `new HttpProvider(...)`.

Остальной код (чат, стриминг, аватар, голос) трогать не придётся.

## Настройка Firebase

Проект уже сконфигурирован под твой Firebase-проект `nexus-21d3f`. Что нужно проверить в консоли Firebase (console.firebase.google.com):

1. **Authentication → Sign-in method** — включены Email/Password и Google (судя по твоему сообщению, уже сделано).
2. **Authentication → Settings → Authorized domains** — добавь домен, на котором будет жить GitHub Pages, например `<твой-логин>.github.io`.
3. **Firestore Database** — создана в production или test-режиме. Опубликуй правила из `firebase/firestore.rules`:
   ```bash
   firebase deploy --only firestore:rules
   ```
   (нужен установленный `firebase-tools` и `firebase login`, либо просто вставь содержимое файла в Firebase Console → Firestore → Rules → Publish).
4. **Realtime Database** — опубликуй правила из `firebase/database.rules.json` аналогично.
5. Storage правила (`firebase/storage.rules`) — на будущее, сейчас изображения идут через imgbb, а Storage активно не используется.

## Деплой на GitHub Pages

1. Создай репозиторий на GitHub и запушь туда проект.
2. В настройках репозитория: **Settings → Pages → Source → GitHub Actions**.
3. В **Settings → Secrets and variables → Actions** добавь секреты (те же значения, что в `.env.local`):
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
   - `NEXT_PUBLIC_IMGBB_API_KEY`
4. Запушь в ветку `main` — сработает `.github/workflows/deploy.yml`, который соберёт проект (`npm run build`, статический экспорт в `out/`) и опубликует на GitHub Pages.
5. Сайт появится на `https://<твой-логин>.github.io/<название-репозитория>/`.

**Важно:** `next.config.js` автоматически подставляет `basePath` из имени репозитория при сборке в GitHub Actions. Если деплоишь вручную (не через Actions) — впиши имя репозитория в `basePath` вручную в `next.config.js`.

⚠️ Firebase Web API key и imgbb-ключ **будут видны** в собранном JS-бандле — это нормально для Firebase (он для этого и предназначен, безопасность обеспечивают Security Rules), но для imgbb это значит, что теоретически кто угодно может использовать твою квоту загрузок. Для личного проекта это некритично; для публичного продукта — вынеси загрузку изображений на свой backend.

## Известные ограничения браузерной поддержки

- Голосовой ввод (`SpeechRecognition`) хорошо работает в Chrome/Edge. В Safari и Firefox поддержка ограничена или отсутствует — приложение аккуратно показывает предупреждение вместо падения.
- Не-графические файлы (docx, pdf и т.д.) сейчас прикрепляются как временный `blob:`-URL в браузере (не сохраняются постоянно) — для постоянного хранения таких файлов подключи Firebase Storage (`lib/firebase/storage.ts` — предстоит создать по аналогии с `firestore.ts`).
