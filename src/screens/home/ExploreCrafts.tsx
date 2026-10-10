import { CraftObject, CRAFT_OBJECTS } from '../../ui/craft';
import { PressCard } from '../../ui/primitives';

/**
 * Explore by craft: a rail of soft gradient tiles, each holding one large craft object. A tile opens Discover on
 * that craft. The gradient is the visual-interest moment District uses for its "Go out and play" section.
 */
export function ExploreCrafts({ onOpen }: { onOpen: (craftId: string) => void }) {
  return (
    <div className="xcrafts" role="group" aria-label="Explore by craft">
      {CRAFT_OBJECTS.map((o, i) => (
        <PressCard key={o.kind} className={`xcraft xcraft--${i % 4}`} onPress={() => onOpen(o.crafts[0])} scale={0.97} aria-label={`${o.label}: see work`}>
          <span className="xcraft-name">{o.label}</span>
          <span className="xcraft-obj">
            <CraftObject kind={o.kind} size={104} />
          </span>
        </PressCard>
      ))}
    </div>
  );
}
