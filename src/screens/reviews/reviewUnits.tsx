import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { MoreHorizontal, Pencil } from 'lucide-react';
import type { Work } from '../../data/works';
import { featured, MAX_TEXT, opensLater, releaseLabel, reviewsOpen, sortReviews, stats, starsLabel, type Review } from '../../domain/reviews';
import { person } from '../../state/selectors';
import { useStore } from '../../state/store';
import { reviewsOf } from '../../state/world';
import { Avatar, Button, Photo, PressCard, SectionHeader, Toggle } from '../../ui/primitives';
import { posterFor } from '../../data/posters';
import { TypesetPoster } from '../../ui/PosterCard';
import { org } from '../../state/selectors';

/* Shared review pieces: the film page, the profile, the reviews lists, Home in both versions. */

/** Five stars, filled to the rating. */
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="stars" style={{ fontSize: size }} role="img" aria-label={`${starsLabel(value)} out of 5 stars`}>
      <span className="stars-base" aria-hidden>
        ★★★★★
      </span>
      <span className="stars-fill" aria-hidden style={{ width: `${(value / 5) * 100}%` }}>
        ★★★★★
      </span>
    </span>
  );
}

/** "★ 4.3 · 128 ratings", or nothing until a film has enough ratings. */
export function ScoreLine({ id, className = '' }: { id: string; className?: string }) {
  const s = stats(reviewsOf(id));
  if (!s.enough) return <span className={`score-line ${className}`}>{s.count ? `${s.count} ${s.count === 1 ? 'rating' : 'ratings'}` : 'No ratings yet'}</span>;
  return (
    <span className={`score-line ${className}`} aria-label={`${s.avg} out of 5 from ${s.count} ratings`}>
      <b>★ {s.avg.toFixed(1)}</b> · {s.count} ratings
    </span>
  );
}

const HOUR = 36e5;
export function reviewAge(at: number, now = Date.now()) {
  const m = Math.round((now - at) / 6e4);
  if (m < 1) return 'Now';
  if (m < 60) return `${m}m`;
  const h = Math.round((now - at) / HOUR);
  if (h < 24) return `${h}h`;
  if (h < 24 * 7) return `${Math.round(h / 24)}d`;
  return new Date(at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Pick a rating in half stars: tap the left half of a star for a half, the right half for a whole. Arrow keys move by a half. */
export function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const at = (e: PointerEvent) => {
    const b = ref.current!.getBoundingClientRect();
    const v = Math.ceil(((e.clientX - b.left) / b.width) * 10) / 2;
    onChange(Math.min(5, Math.max(0.5, v)));
  };
  const key = (e: KeyboardEvent) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 0.5 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -0.5 : 0;
    if (e.key === 'Home') return e.preventDefault(), onChange(0.5);
    if (e.key === 'End') return e.preventDefault(), onChange(5);
    if (!d) return;
    e.preventDefault();
    onChange(Math.min(5, Math.max(0.5, (value || (d > 0 ? 0 : 1)) + d)));
  };
  return (
    <div
      ref={ref}
      className="star-picker"
      role="slider"
      tabIndex={0}
      aria-label="Rating"
      aria-valuemin={0.5}
      aria-valuemax={5}
      aria-valuenow={value || undefined}
      aria-valuetext={value ? `${starsLabel(value)} out of 5 stars` : 'Not rated'}
      onPointerDown={at}
      onKeyDown={key}
    >
      <Stars value={value} size={40} />
    </div>
  );
}

/** One review. Spoilers stay hidden until tapped. Film reviews carry no Helpful vote (a review is a point of view, not an answer). */
export function ReviewCard({ r, showFilm, film }: { r: Review; showFilm?: boolean; film?: Work }) {
  const { viewer, push, openSheet } = useStore();
  const [reveal, setReveal] = useState(false);
  const p = person(r.personId);
  const own = r.personId === viewer.id;
  return (
    <article className="rv-card">
      <header className="rv-card-head">
        {showFilm && film ? (
          <PressCard className="rv-card-who" onPress={() => push({ name: 'work', id: film.id })} scale={0.99} aria-label={film.title}>
            <span className="rv-card-film">{film.title}</span>
            <span className="meta">{film.format}</span>
          </PressCard>
        ) : (
          <PressCard className="rv-card-who" onPress={() => push({ name: 'profile', id: p.id })} scale={0.99} aria-label={p.name}>
            <Avatar party={p} size={36} />
            <span className="rv-card-name">
              <b>{own ? 'You' : p.name}</b>
              <span className="meta">{p.role}</span>
            </span>
          </PressCard>
        )}
        {own ? (
          <button className="icon-btn rv-more" aria-label="Edit your review" onClick={() => openSheet({ name: 'review', projectId: r.projectId })}>
            <Pencil size={16} />
          </button>
        ) : (
          <button className="icon-btn rv-more" aria-label={`More options for ${p.name}'s review`} onClick={() => openSheet({ name: 'report', subject: `this review by ${p.name}`, partyId: p.id, target: { kind: 'Review', id: r.id } })}>
            <MoreHorizontal size={18} />
          </button>
        )}
      </header>
      <p className="rv-card-meta">
        <Stars value={r.stars} />
        <span className="meta">
          {reviewAge(r.at)}
          {r.edited ? ' · edited' : ''}
        </span>
      </p>
      {r.text &&
        (r.spoiler && !reveal ? (
          <button className="rv-spoiler" onClick={() => setReveal(true)}>
            Contains spoilers · <u>Show</u>
          </button>
        ) : (
          <p className="rv-card-text">{r.text}</p>
        ))}
    </article>
  );
}

/**
 * One of a person's film reviews, as it reads on their profile (docs/ux-refinement/PLAN.md): the film's poster, then
 * its title, the rating and when, and the review itself in a few lines. A spoiler stays hidden behind a line. Tapping
 * opens the film, where the full review sits with everyone else's (and where your own is edited).
 */
export function FilmReviewTile({ r, film }: { r: Review; film: Work }) {
  const { push } = useStore();
  const poster = posterFor(film.id);
  const house = film.orgIds[0] ? org(film.orgIds[0]) : undefined;
  return (
    <PressCard className="rvt" onPress={() => push({ name: 'work', id: film.id })} scale={0.985} aria-label={`${film.title}, ${starsLabel(r.stars)} out of 5 stars, ${reviewAge(r.at)}${r.spoiler ? ', contains spoilers' : r.text ? `: ${r.text}` : ''}`}>
      <span className="rvt-poster" aria-hidden>
        {poster ? <Photo media={poster} surface="credit-card" frameRatio={2 / 3} showPlay={false} alt="" /> : <TypesetPoster title={film.title} production={house?.name} year={film.year} />}
      </span>
      <span className="rvt-body">
        <b className="rvt-title">{film.title}</b>
        <span className="rvt-meta">
          <Stars value={r.stars} size={13} />
          <span>{reviewAge(r.at)}</span>
        </span>
        {r.text ? (r.spoiler ? <span className="rvt-spoiler">Contains spoilers</span> : <span className="rvt-text">{r.text}</span>) : <span className="rvt-spoiler">Rated, no written review</span>}
      </span>
    </PressCard>
  );
}

/** Average, count and how the ratings spread. */
export function RatingSummary({ id }: { id: string }) {
  const s = stats(reviewsOf(id));
  if (!s.enough)
    return (
      <div className="rv-summary rv-summary--thin">
        <p className="item-title">{s.count ? 'Not enough ratings yet' : 'No ratings yet'}</p>
        {s.count > 0 && <p className="meta">{s.count} so far</p>}
      </div>
    );
  const max = Math.max(...s.dist, 1);
  return (
    <div className="rv-summary">
      <div className="rv-summary-score">
        <span className="rv-avg">{s.avg.toFixed(1)}</span>
        <Stars value={s.avg} />
        <span className="meta">{s.count} ratings</span>
      </div>
      <ul className="rv-dist" aria-label="Ratings breakdown">
        {s.dist.map((n, i) => (
          <li key={i} aria-label={`${5 - i} stars: ${n}`}>
            <span aria-hidden>{5 - i}</span>
            <span className="rv-bar" aria-hidden>
              <i style={{ width: `${(n / max) * 100}%` }} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The film page's Reviews: average, your review or the way to write one, the top three. */
export function FilmReviewsSection({ w }: { w: Work }) {
  const { viewer, mayReview, push, openSheet, worldVersion } = useStore();
  void worldVersion;
  const now = Date.now();
  if (opensLater(w, now))
    return (
      <section className="section section--flush rv-section">
        <SectionHeader title="Reviews" />
        <p className="rv-opens">Reviews open {releaseLabel(w.releaseDate!)}</p>
      </section>
    );
  if (!reviewsOpen(w, now)) return null;
  const all = reviewsOf(w.id);
  const mine = all.find((r) => r.personId === viewer.id);
  const others = sortReviews(
    all.filter((r) => r !== mine && r.text),
    'newest',
  ).slice(0, 3);
  const can = mayReview(w.id);
  return (
    <section className="section section--flush rv-section">
      <SectionHeader title="Reviews" action={all.length > 3 ? 'See all' : undefined} onAction={() => push({ name: 'filmReviews', id: w.id })} />
      <RatingSummary id={w.id} />
      {mine ? (
        <ReviewCard r={mine} />
      ) : (
        can && (
          <Button block variant="secondary" onClick={() => openSheet({ name: 'review', projectId: w.id })}>
            Rate and review
          </Button>
        )
      )}
      <div className="rv-cards">
        {others.map((r) => (
          <ReviewCard key={r.id} r={r} />
        ))}
      </div>
    </section>
  );
}

/** Write or edit: stars are required, words are optional. */
export function ReviewSheet({ projectId, title, initial }: { projectId: string; title: string; initial?: number }) {
  const { viewer, saveReview, deleteReview, closeSheet, showToast } = useStore();
  const mine = reviewsOf(projectId).find((r) => r.personId === viewer.id);
  const [stars, setStars] = useState(mine?.stars ?? initial ?? 0);
  const [text, setText] = useState(mine?.text ?? '');
  const [spoiler, setSpoiler] = useState(!!mine?.spoiler);
  const left = MAX_TEXT - text.length;
  return (
    <div className="stack rv-sheet">
      <p className="title-2">{title}</p>
      <StarPicker value={stars} onChange={setStars} />
      <label className="field-label" htmlFor="rv-text">
        Review <span className="meta">(optional)</span>
      </label>
      <textarea id="rv-text" className="field field--area" rows={4} maxLength={MAX_TEXT} value={text} onChange={(e) => setText(e.target.value)} />
      <p className={`meta rv-count ${left < 20 ? 'is-low' : ''}`} aria-live="polite">
        {left}
      </p>
      {text.trim() && (
        <div className="rv-toggle-row">
          <span id="rv-spoiler-label">Contains spoilers</span>
          <Toggle on={spoiler} onChange={setSpoiler} label="Contains spoilers" />
        </div>
      )}
      <Button
        block
        size="l"
        disabled={!stars}
        onClick={() => {
          if (saveReview(projectId, { stars, text, spoiler })) {
            closeSheet();
            showToast({ text: mine ? 'Review updated' : 'Review posted', tone: 'success' });
          }
        }}
      >
        {mine ? 'Save' : 'Post'}
      </Button>
      {mine && (
        <Button
          block
          variant="secondary"
          onClick={() => {
            closeSheet();
            deleteReview(mine.id);
          }}
        >
          Delete review
        </Button>
      )}
    </div>
  );
}

/** The week's films as Home shows them: poster, score, and one good review. */
export function featuredFor(id: string, following: string[] = []) {
  return featured(reviewsOf(id), following);
}
