/**
 * Страховка от «пустого экрана»: если приложение падает при старте
 * (например, в браузере/Webview без window.matchMedia), React размонтирует
 * всё и игрок видит только чёрный фон с favicon. Этот модуль:
 *  1) добавляет недостающие браузерные API-заглушки ДО импорта приложения;
 *  2) перехватывает ошибки старта и показывает читаемое сообщение вместо пустоты.
 */

export function installBrowserPolyfills(): void {
  if (typeof window === 'undefined') return;

  // matchMedia отсутствует в некоторых старых webview — из-за него падал весь рендер.
  if (typeof window.matchMedia !== 'function') {
    const stub = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
    (window as unknown as { matchMedia: (q: string) => MediaQueryList }).matchMedia = stub;
  }

  // Element.scrollTo отсутствует в некоторых webview — краш при автоскролле хроники.
  if (typeof Element !== 'undefined' && typeof Element.prototype.scrollTo !== 'function') {
    Element.prototype.scrollTo = function scrollTo(options?: ScrollToOptions | number, y?: number) {
      if (typeof options === 'number') {
        this.scrollLeft = options;
        if (typeof y === 'number') this.scrollTop = y;
      } else if (options && typeof options.top === 'number') {
        this.scrollTop = options.top;
        if (typeof options.left === 'number') this.scrollLeft = options.left;
      }
    };
  }
}

/** Показывает запасной экран с текстом ошибки вместо чёрной пустоты. */
export function showBootFallback(message: string): void {
  if (typeof document === 'undefined') return;
  const root = document.getElementById('root');
  if (!root || root.childElementCount > 0) return; // приложение живёт — не мешаем
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;
                padding:2rem;font-family:Georgia,'Times New Roman',serif;text-align:center;">
      <div style="max-width:34rem;border:1px solid #8a6d2f;background:#141009;color:#e8dcc0;
                  padding:2rem;border-radius:4px;box-shadow:0 0 24px rgba(0,0,0,.7);">
        <h1 style="margin:0 0 .75rem;font-size:1.35rem;color:#d4af37;">⚠ Император молчит</h1>
        <p style="margin:0 0 1rem;line-height:1.5;">Игра не смогла запуститься в этом браузере.</p>
        <p style="margin:0 0 1.25rem;font-size:.85rem;color:#b3a47f;word-break:break-word;">${escapeHtml(message)}</p>
        <button type="button" id="boot-retry"
          style="cursor:pointer;background:#2a2010;color:#d4af37;border:1px solid #8a6d2f;
                 padding:.5rem 1.25rem;border-radius:3px;font:inherit;">Перезапустить</button>
      </div>
    </div>`;
  const btn = document.getElementById('boot-retry');
  if (btn) btn.addEventListener('click', () => window.location.reload());
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Устанавливает полифиллы + слушатели фатальных ошибок старта. Вызывать до импорта main. */
export function setupBootGuard(): void {
  installBrowserPolyfills();
  if (typeof window === 'undefined') return;
  let reported = false;
  const report = (message: string) => {
    // Только если приложение так и не отрендерилось.
    setTimeout(() => {
      if (reported) return;
      const root = typeof document !== 'undefined' ? document.getElementById('root') : null;
      if (root && root.childElementCount === 0) {
        reported = true;
        showBootFallback(message);
      }
    }, 0);
  };
  window.addEventListener('error', (e) => report(e.message || 'Неизвестная ошибка загрузки'));
  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason;
    report(reason instanceof Error ? reason.message : String(reason));
  });
}
