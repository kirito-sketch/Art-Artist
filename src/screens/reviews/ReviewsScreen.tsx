import { ChevronLeft } from 'lucide-react';
import type { Person } from '../../data/types';
import { averageScore, reviewedProjects, reviewsFor } from '../../data/reviews';
import { org, party } from '../../state/selectors';
import { useStore } from '../../state/store';
import { work } from '../../state/world';
import { Avatar, IconButton, Photo, PressCard } from '../../ui/primitives';

/** Reviews from people in the industry, film by film (District Home direction; sample content, see data/reviews.ts). */
export function ReviewsScreen() {
  const { pop, push } = useStore();
  return (
    <div className="screen canvas rv">
      <header className="topbar topbar--nav browse-top">
        <IconButton label="Back" onClick={pop}>
          <ChevronLeft size={26} />
        </IconButton>
        <h1 className="topbar-title">Reviews</h1>
        <span className="icon-btn-spacer" aria-hidden />
      </header>
      <div className="rv-list">
        {reviewedProjects().map((id) => {
          const w = work(id);
          if (!w) return null;
          const rs = reviewsFor(id);
          return (
            <section key={id} className="rv-film" aria-label={w.title}>
              <PressCard className="rv-head" onPress={() => push({ name: 'work', id })} scale={0.985} aria-label={`${w.title}, ${averageScore(id)} out of 5`}>
                <span className="rv-poster">
                  <Photo media={w.media} showPlay={false} />
                </span>
                <span className="rv-head-t">
                  <b>{w.title}</b>
                  <span>
                    {w.orgIds[0] ? org(w.orgIds[0]).name : w.format} · {w.year}
                  </span>
                  <span className="rv-score">
                    ★ {averageScore(id)} <small>· {rs.length} reviews</small>
                  </span>
                </span>
              </PressCard>
              <div className="rv-quotes">
                {rs.map((r) => {
                  const p = party(r.personId);
                  if (!p) return null;
                  return (
                    <PressCard key={r.id} className="rv-q" onPress={() => push({ name: 'profile', id: p.id })} scale={0.99} aria-label={`${p.name}: ${r.quote}`}>
                      <Avatar party={p} size={34} />
                      <span className="rv-q-t">
                        <span className="rv-q-who">
                          <b>{p.name}</b> · {(p as Person).role}
                          <span className="rv-q-score">★ {r.score}</span>
                        </span>
                        <span className="rv-q-text">{r.quote}</span>
                      </span>
                    </PressCard>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
