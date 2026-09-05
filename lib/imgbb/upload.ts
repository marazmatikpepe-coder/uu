/**
 * Загрузка изображений через imgbb API.
 * Ключ читается из NEXT_PUBLIC_IMGBB_API_KEY (см. .env.example).
 *
 * Важно: т.к. приложение — статический сайт (GitHub Pages), ключ будет
 * виден в собранном JS. Для личного использования это приемлемо.
 * Если станешь публиковать проект для чужих пользователей — перенеси
 * этот вызов на сторону сервера (например, Firebase Cloud Function),
 * чтобы ключ не "утекал" в браузер.
 */

export interface ImgbbUploadResult {
  url: string;
  displayUrl: string;
  deleteUrl: string;
  width: number;
  height: number;
  size: number;
}

export async function uploadImageToImgbb(file: File): Promise<ImgbbUploadResult> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Не найден NEXT_PUBLIC_IMGBB_API_KEY. Добавь его в .env.local (см. .env.example).'
    );
  }

  const base64 = await fileToBase64(file);

  const form = new FormData();
  form.append('key', apiKey);
  form.append('image', base64);
  form.append('name', file.name);

  const res = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Ошибка загрузки на imgbb (${res.status}): ${text}`);
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || 'imgbb вернул ошибку загрузки');
  }

  const data = json.data;
  return {
    url: data.image?.url ?? data.url,
    displayUrl: data.display_url ?? data.image?.url,
    deleteUrl: data.delete_url,
    width: Number(data.width) || 0,
    height: Number(data.height) || 0,
    size: Number(data.size) || file.size,
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // imgbb принимает чистый base64 без префикса data:...;base64,
      resolve(result.split(',')[1] ?? result);
    };
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.readAsDataURL(file);
  });
}
