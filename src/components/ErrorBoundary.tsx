import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Вызывается при каждой пойманной ошибке рендера (для логов/сброса состояния). */
  onError?: (error: Error) => void;
}

interface State {
  error: Error | null;
}

/**
 * Страховка от «чёрного экрана с одной иконкой»: если любой компонент
 * падает при рендере, React без ErrorBoundary размонтирует ВСЁ приложение —
 * игрок видит только тёмный фон страницы и favicon во вкладке.
 * Этот boundary показывает читаемую панель вместо пустоты и даёт кнопки
 * «Продолжить» (повторный рендер) и «Перезапустить» (полная перезагрузка).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[WLS] Ошибка рендера интерфейса:', error, info.componentStack);
    this.props.onError?.(error);
  }

  private retry = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: '#0b0a08',
          color: '#e8dcc0',
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <div
          style={{
            maxWidth: '36rem',
            border: '1px solid #8a6d2f',
            background: '#141009',
            padding: '2rem',
            borderRadius: '4px',
            boxShadow: '0 0 24px rgba(0,0,0,.7)',
            textAlign: 'center',
          }}
        >
          <h1 style={{ margin: '0 0 .75rem', fontSize: '1.35rem', color: '#d4af37' }}>
            ⚠ Интерфейс пострадал, но Император не молчит
          </h1>
          <p style={{ margin: '0 0 1rem', lineHeight: 1.5 }}>
            Экран игры столкнулся с ошибкой и был закрыт защитной панелью — сохранение не тронуто.
          </p>
          <p
            style={{
              margin: '0 0 1.25rem',
              fontSize: '.85rem',
              color: '#b3a47f',
              wordBreak: 'break-word',
            }}
          >
            {error.message}
          </p>
          <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={this.retry}
              style={{
                cursor: 'pointer',
                background: '#2a2010',
                color: '#d4af37',
                border: '1px solid #8a6d2f',
                padding: '.5rem 1.25rem',
                borderRadius: '3px',
                font: 'inherit',
              }}
            >
              Продолжить
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                cursor: 'pointer',
                background: '#3a1510',
                color: '#e8c85a',
                border: '1px solid #8a6d2f',
                padding: '.5rem 1.25rem',
                borderRadius: '3px',
                font: 'inherit',
              }}
            >
              Перезапустить игру
            </button>
          </div>
        </div>
      </div>
    );
  }
}
