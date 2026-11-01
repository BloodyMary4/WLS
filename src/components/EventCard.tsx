import { GameEvent, Choice } from '../game/types';

interface EventCardProps {
  event: GameEvent;
  age: number;
  phase: 'event' | 'result';
  resultText: string;
  lastChoice: Choice | null;
  onChoice: (choice: Choice) => void;
  onProceed: () => void;
}

/** Центральная карточка события: текст года или результат выбора. */
export function EventCard({ event, age, phase, resultText, lastChoice, onChoice, onProceed }: EventCardProps) {
  return (
    <div className="wh-panel wh-frame p-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
          <span className="font-gothic text-lg font-bold text-[#c0392b] uppercase tracking-[0.2em]">
            Событие &bull; М41.{String(age).padStart(3, '0')}
          </span>
        </div>
        <div className="wh-parchment rounded-sm p-6 pt-7">
          <p className="font-event text-lg leading-relaxed text-[#d8c9a3]">
            {event.text}
          </p>
        </div>
      </div>

      {phase === 'result' && lastChoice ? (
        <div className="space-y-4 animate-fade-in">
          <div className="wh-parchment rounded-sm p-6" style={{ borderColor: 'rgba(201,162,39,0.7)' }}>
            <div className="flex items-start gap-3">
              <span className="text-3xl">⚔️</span>
              <p className="font-event text-lg leading-relaxed text-[#e8d9b0] flex-1 italic">{resultText}</p>
            </div>
          </div>
          <button
            onClick={onProceed}
            className="btn-wh-primary btn-modern w-full font-bold py-4 rounded-sm text-xl transition-all hover:scale-[1.02]"
          >
            Продолжить → Год {age}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="font-gothic text-lg font-bold text-[#e8c85a] uppercase tracking-[0.15em] mb-4 flex items-center gap-3">
            Твоё решение:
          </p>
          {event.choices.map((choice, index) => (
            <button
              key={choice.letter}
              onClick={() => onChoice(choice)}
              className="btn-modern w-full text-left p-4 bg-gradient-to-br from-[#1c1913] to-[#12100b] hover:from-[#2a2517] hover:to-[#1c1913] border border-[#c9a227]/40 hover:border-[#e8c85a] rounded-sm transition-all shadow-lg hover:shadow-[0_0_18px_rgba(201,162,39,0.3)] hover:scale-[1.01] animate-slide-in-left"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-4">
                <div className="wh-choice-letter flex-shrink-0 w-10 h-10 flex items-center justify-center shadow-lg">
                  <span className="font-bold text-lg">
                    {choice.letter}
                  </span>
                </div>
                <span className="font-event text-lg text-[#d8c9a3] flex-1 leading-relaxed pt-1">{choice.text}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
