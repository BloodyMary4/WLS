import { useEffect, useState } from 'react';

/** Режим «всё во вьюпорте»: страница не прокручивается, окна скроллятся сами.
 *  Вне lg+ или на низких экранах — обычный поток с прокруткой страницы. */
export const FIT_QUERY = '(min-width: 1024px) and (min-height: 640px)';

/** Компактный режим для коротких окон (ноутбуки ~768px): вертикаль на вес золота. */
export const SHORT_QUERY = '(min-width: 1024px) and (max-height: 899px)';

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** Fit-режим экрана (вся игра умещается во вьюпорте). */
export function useFit(): boolean {
  return useMediaQuery(FIT_QUERY);
}

/** Короткий экран: включаем максимальную плотность интерфейса. */
export function useShortScreen(): boolean {
  return useMediaQuery(SHORT_QUERY);
}
