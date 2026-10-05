import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import type { Work } from '../../data/works';
import { isOutThisWeek, sortReviews, topRated, type ReviewSort } from '../../domain/reviews';
import { org, person } from '../../state/selectors';
import { useStore } from '../../state/store';
import { publicWorks, reviewsBy, reviewsOf, work, world } from '../../state/world';
import { Button, Chip, IconButton, Photo, PressCard, SectionHeader } from '../../ui/primitives';
import { featuredFor, RatingSummary, ReviewCard, ScoreLine } from './reviewUnits';

const maker = (w: Work) => (w.orgIds[0] ? org(w.orgIds[0]).name : w.format);
export const outThisWeek = (now = Date.now()) => publicWorks().filter((w) => isOutThisWeek(w, now));

function Top({ title }: { title: string }) {
  const { pop } = useStore();
  return (
    <header className="topbar topbar--nav browse-top">
      <IconButton label="Back" onClick={pop}>
        <ChevronLeft size={26} />
      </IconButton>
      <h1 className="topbar-title">{title}</h1>
      <span className="icon-btn-spacer" aria-hidden />
    </header>
  );
}

/** A film out this week: poster, score and the one review it is introduced with. */
export function WeekFilm({ w, big }: { w: Work; big?: boolean }) {
  const { push } = useStore();
  const f = featuredFor(w.id);
  const who = f && person(f.personId);
  return (
    <PressCard className={`wk-film ${big ? 'wk-film--big' : ''}`} onPress={() => push({ name: 'work', id: w.id })} scale={0.985} aria-label={w.title}>
      <span className="wk-poster">
        <Photo media={w.media} showPlay={false} />
      </span>
      <span className="wk-body">
        <span className="wk-title">{w.title}</span>
        <span className="meta">
          {maker(w)} · {w.format.split(' · ').pop()}
        </span>
        <ScoreLine id={w.id} className="wk-score" />
        {f && who && (
          <span className="wk-quote">
            “{f.text}” <span className="wk-by">{who.name}</span>
          </span>
        )}
      </span>
    </PressCard>
  );
}

/** Reviews (District tile): the week's films, the best rated, and what people said lately. */
export function ReviewsScreen() {
  const { push, worldVersion } = useStore();
  void worldVersion;
  const week = outThisWeek();
  const top = topRated(publicWorks(), reviewsOf).filter((w) => !week.some((x) => x.id === w.id));
  const recent = [...world.reviews].filter((r) => r.text && work(r.projectId)).sort((a, b) => b.at - a.at).slice(0, 8);
  return (
    <div className="screen canvas rv">
      <Top title="Reviews" />
      <div className="rv-page">
        {week.length > 0 && (
          <section className="section section--flush">
            <SectionHeader title="Out this Friday" />
            <div className="wk-list">
              {week.map((w) => (
                <WeekFilm key={w.id} w={w} big />
              ))}
            </div>
          </section>
        )}
        {top.length > 0 && (
          <section className="section section--flush">
            <SectionHeader title="Top rated" />
            <ol className="rv-rank">
              {top.map((w, i) => (
                <li key={w.id}>
                  <PressCard className="rv-rank-row" onPress={() => push({ name: 'work', id: w.id })} scale={0.99} aria-label={w.title}>
                    <span className="rv-rank-n" aria-hidden>
                      {i + 1}
                    </span>
                    <span className="rv-rank-poster">
                      <Photo media={w.media} showPlay={false} />
                    </span>
                    <span className="rv-rank-t">
                      <b>{w.title}</b>
                      <span className="meta">
                        {maker(w)} · {w.year}
                      </span>
                      <ScoreLine id={w.id} />
                    </span>
                  </PressCard>
                </li>
              ))}
            </ol>
          </section>
        )}
        {recent.length > 0 && (
          <section className="section section--flush">
            <SectionHeader title="Recent reviews" />
            <div className="rv-cards">
              {recent.map((r) => (
                <div key={r.id} className="rv-recent">
                  <button className="rv-recent-film" onClick={() => push({ name: 'work', id: r.projectId })}>
                    {work(r.projectId)!.title}
                  </button>
                  <ReviewCard r={r} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/** Every review of one film, most helpful or newest first. */
export function FilmReviewsScreen({ id }: { id: string }) {
  const { viewer, mayReview, openSheet, worldVersion } = useStore();
  void worldVersion;
  const [sort, setSort] = useState<ReviewSort>('helpful');
  const w = work(id);
  if (!w) return null;
  const all = reviewsOf(id);
  const mine = all.find((r) => r.personId === viewer.id);
  const list = sortReviews(
    all.filter((r) => r !== mine && r.text),
    sort,
  );
  return (
    <div className="screen canvas rv">
      <Top title={w.title} />
      <div className="rv-page">
        <RatingSummary id={id} />
        {mine ? <ReviewCard r={mine} /> : mayReview(id) && <Button block variant="secondary" onClick={() => openSheet({ name: 'review', projectId: id })}>Rate and review</Button>}
        <div className="chips rv-sort" role="group" aria-label="Sort">
          <Chip active={sort === 'helpful'} onClick={() => setSort('helpful')}>
            Most helpful
          </Chip>
          <Chip active={sort === 'newest'} onClick={() => setSort('newest')}>
            Newest
          </Chip>
        </div>
        <div className="rv-cards">
          {list.map((r) => (
            <ReviewCard key={r.id} r={r} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Everything one person has reviewed, newest first. */
export function PersonReviewsScreen({ id }: { id: string }) {
  const { viewer, worldVersion } = useStore();
  void worldVersion;
  const list = reviewsBy(id).filter((r) => work(r.projectId));
  return (
    <div className="screen canvas rv">
      <Top title={id === viewer.id ? 'Your reviews' : `${person(id).name.split(' ')[0]}'s reviews`} />
      <div className="rv-page">
        <div className="rv-cards">
          {list.map((r) => (
            <ReviewCard key={r.id} r={r} showFilm film={work(r.projectId)} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Profile: the latest three reviews, then See all. */
export function ProfileReviewsSection({ id }: { id: string }) {
  const { push, worldVersion } = useStore();
  void worldVersion;
  const list = reviewsBy(id).filter((r) => work(r.projectId));
  if (!list.length) return null;
  return (
    <section className="section section--flush rv-section">
      <SectionHeader title="Reviews" action={list.length > 3 ? 'See all' : undefined} onAction={() => push({ name: 'personReviews', id })} />
      <div className="rv-cards">
        {list.slice(0, 3).map((r) => (
          <ReviewCard key={r.id} r={r} showFilm film={work(r.projectId)} />
        ))}
      </div>
    </section>
  );
}
