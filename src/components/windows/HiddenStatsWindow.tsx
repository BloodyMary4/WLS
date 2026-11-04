import { CharacterStats } from '../../game/types';
import { WindowPane, BarStat } from '../Dashboard';
import { isCritical } from '../../game/critical';
import { HIDDEN_HINTS, declineMiracles, buildRaceBars } from '../../game/codexMeta';

interface HiddenStatsWindowProps {
  character: CharacterStats;
}

/**
 * Окно «Скрытые свойства» — все шкалы характера и расовых сил (v0.3.32).
 * Основные (Вера/Хитрость/Сила/Воля + Мутация/Подозрение у людей),
 * расовые (WAAAGH!, пси-сила, Жестокость…), Верность Императору и
 * Внимание Имматериума. Критичные значения краснеют; длинные списки
 * скроллятся только внутри окна.
 */
export function HiddenStatsWindow({ character }: HiddenStatsWindowProps) {
  const hp = character.hiddenParams;
  const raceBars = buildRaceBars(character);
  return (
    <WindowPane title="Скрытые свойства" icon="👁️" scroll
      extra={<span className="text-[10px] text-gray-400 tabular-nums">0–10</span>}>
      <BarStat label="Вера" value={hp.faith} color="bg-amber-500" hint={HIDDEN_HINTS.faith} />
      <BarStat label="Хитрость" value={hp.cunning} color="bg-emerald-500" hint={HIDDEN_HINTS.cunning} />
      <BarStat label="Сила" value={hp.strength} color="bg-wh-blood" hint={HIDDEN_HINTS.strength} />
      <BarStat label="Воля" value={hp.willpower} color="bg-wh-plasma" hint={HIDDEN_HINTS.willpower} />
      {character.race === 'human' && (
        <>
          <BarStat label="Мутация" value={hp.mutation} color="bg-wh-warp-mid"
            danger={isCritical('Мутация', hp.mutation)} hint={HIDDEN_HINTS.mutation} />
          <BarStat label="Подозрение" value={hp.suspicion} color="bg-wh-caution"
            danger={isCritical('Подозрение', hp.suspicion)} hint={HIDDEN_HINTS.suspicion} />
        </>
      )}
      {raceBars.map((b) => (
        <BarStat key={b.label} label={b.label} value={b.value} color={b.color} hint={b.hint} />
      ))}

      {/* Верность Императору — скрытая добродетель людей: при 10 смерть может быть отвращена чудом */}
      {character.race === 'human' && typeof character.imperialCreed === 'number' && (
        <div className={`mt-1.5 pt-1.5 border-t ${character.imperialCreed >= 8 ? 'border-yellow-500/60 animate-candle' : 'border-[#c9a227]/20'}`}>
          <BarStat label="Верность Императору" value={character.imperialCreed} color="bg-gradient-to-r from-yellow-700 to-yellow-400"
            hint="Преданность Трону. При высокой верности смерть иногда отводит взор — чудо заступничества." />
          {character.imperialCreed >= 5 && (
            <p className="text-[10px] text-yellow-500/70 italic leading-snug">
              {character.intercessionCount
                ? `Смерть уже отводила взор ${character.intercessionCount} ${declineMiracles(character.intercessionCount)}.`
                : 'Твоя вера замечена на Троне. В час смерти Он может взглянуть вниз.'}
            </p>
          )}
        </div>
      )}

      {/* Внимание Имматериума — лорная шкала: псайкеры и безумцы «светятся» в Варпе */}
      {character.warpAttention > 0 && (
        <div className={`mt-1.5 pt-1.5 border-t border-purple-500/20 ${character.warpAttention >= 5 ? 'text-[#c9a2ff]' : ''}`}>
          <BarStat label="Внимание Имматериума" value={character.warpAttention} color="bg-gradient-to-r from-purple-800 to-fuchsia-500"
            danger={character.warpAttention >= 7} hint={HIDDEN_HINTS.warpAttention} />
          {character.warpAttention >= 4 && (
            <p className="text-[10px] text-purple-300/70 italic leading-snug">
              Тебя слышат по ту сторону реальности. Чем ярче свет — тем раньше придут: Ордо Малипус или то, что хуже него.
            </p>
          )}
        </div>
      )}
    </WindowPane>
  );
}
