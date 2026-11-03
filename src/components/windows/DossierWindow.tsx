import { CharacterStats } from '../../game/types';
import { WindowPane, ReadoutRow, BarStat } from '../Dashboard';

type RaceInfo = { name: string; emoji: string; description: string };

interface DossierWindowProps {
  character: CharacterStats;
  raceInfo: RaceInfo;
}

/**
 * Окно «Досье» — кто ты в этой галактике (v0.3.32, самостоятельный модуль).
 * Раса/сословие/положение/планета + шкалы Влияния и Удачи. Компактное,
 * всегда открыто, занимает верхнюю ячейку левого отсека.
 */
export function DossierWindow({ character, raceInfo }: DossierWindowProps) {
  return (
    <WindowPane title="Досье" icon="⚜️">
      <ReadoutRow label="Раса" value={raceInfo.name} hint={`${raceInfo.emoji} ${raceInfo.description}`} />
      <ReadoutRow label="Сословие" value={character.caste} hint="Сословие определяет доступные события и профессии." />
      <ReadoutRow label="Положение" value={character.status} hint="Твоё место в жизни меняется судьбоносными выборами." />
      <ReadoutRow label="Планета" value={character.planet} hint="Место рождения — там начинался твой путь." />
      <div className="grid grid-cols-2 gap-x-3 mt-1">
        <BarStat label="Влияние" value={character.influence} max={100} icon="⭐" color="bg-wh-caution"
          hint="Влияние в имперских кругах: открывает связи, торг и покровительство." />
        <BarStat label="Удача" value={character.luck} max={10} icon="🍀" color="bg-wh-health" danger={character.luck <= 2}
          hint="Удача: ниже 2 — звёзды против тебя, торг и взятки дают сбой." />
      </div>
    </WindowPane>
  );
}
