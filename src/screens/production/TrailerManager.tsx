import { Film, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { orderVersions, trailerGate } from '../../domain/trailers';
import { useStore } from '../../state/store';
import { LANGUAGES, project, type Trailer } from '../../state/world';
import { Button, Photo, SectionHeader } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';
import { previewTrailer, type TrailerStep } from '../../ui/trailerPreview';

/*
 * Trailers in the house workspace (docs/ux-refinement/PLAN.md, Stage 4; D6 and D7). One version per language and kind.
 * Each version is a draft until published; only published versions of a shared project appear on the public page.
 * Files stay on this device for this session (there is no media storage yet), and the page says so plainly.
 */
const STEP: Record<TrailerStep, [string, number]> = { checking: ['Checking the file', 20], reading: ['Reading the video', 60], poster: ['Making the poster frame', 90] };

export function TrailerManager({ id, canAct }: { id: string; canAct: boolean }) {
  const { updateProject, showToast } = useStore();
  const p = project(id)!;
  const versions = orderVersions(p.trailers ?? [], p.languages);
  const [adding, setAdding] = useState<null | { replace?: string }>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [error, setError] = useState('');
  const save = (trailers: Trailer[]) => updateProject(id, { trailers });
  const blocked = (next: Trailer[]) => trailerGate({ ...p, trailers: next });

  const setStatus = (t: Trailer, status: Trailer['status']) => {
    const next = (p.trailers ?? []).map((x) => (x.id === t.id ? { ...x, status } : x));
    const why = status === 'draft' ? blocked(next) : null;
    if (why) return setError(`${why} Publish another version first.`);
    setError('');
    save(next);
    showToast({ text: status === 'published' ? (p.shared ? 'Published on the project page' : 'Published. It appears once the project is shared.') : 'Moved back to draft' });
  };
  const remove = (t: Trailer) => {
    const next = (p.trailers ?? []).filter((x) => x.id !== t.id);
    const why = blocked(next);
    setConfirmRemove(null);
    if (why) return setError(`${why} Add another version before removing this one.`);
    if (t.temporary && t.url.startsWith('blob:')) URL.revokeObjectURL(t.url);
    setError('');
    save(next);
    showToast({ text: `${t.kind === 'teaser' ? 'Teaser' : 'Trailer'} removed` });
  };

  const gate = trailerGate(p, { shared: true });
  return (
    <section className="section trailer-manager">
      <SectionHeader title="Trailers and teasers" />
      <p className="meta tm-note">One version per language. Drafts stay here; published versions show on the public page{p.shared ? '' : ' once the project is shared'}.</p>
      {!p.shared && gate && <p className="inline-note">{gate.replace('making', 'sharing')}</p>}
      {versions.length > 0 && (
        <ul className="tm-list">
          {versions.map((t) => (
            <li key={t.id} className="tm-row">
              <span className="tm-thumb">{t.poster ? <Photo media={t.poster} surface="project-card" showPlay={false} alt="" /> : <Film size={20} aria-hidden />}</span>
              <span className="tm-text">
                <b>
                  {t.kind === 'teaser' ? 'Teaser' : 'Trailer'} · {t.language}
                </b>
                <span className="meta">
                  {[t.duration, t.status === 'published' ? (p.shared ? 'Published' : 'Published, shows when shared') : 'Draft'].filter(Boolean).join(' · ')}
                </span>
                {t.temporary && <span className="meta tm-temp">On this device for this session only</span>}
                {canAct && (
                  <span className="tm-actions">
                    {t.status === 'draft' ? (
                      <button className="link" onClick={() => setStatus(t, 'published')}>Publish</button>
                    ) : (
                      <button className="link" onClick={() => setStatus(t, 'draft')}>Move to draft</button>
                    )}
                    <button className="link" onClick={() => setAdding({ replace: t.id })}>Replace</button>
                    {confirmRemove === t.id ? (
                      <>
                        <button className="link link--danger" onClick={() => remove(t)}>Remove</button>
                        <button className="link link--muted" onClick={() => setConfirmRemove(null)}>Keep</button>
                      </>
                    ) : (
                      <button className="link link--muted" onClick={() => setConfirmRemove(t.id)}>Remove</button>
                    )}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="field-error" role="alert">{error}</p>}
      {canAct && (
        <Button variant="secondary" icon={<Plus size={16} />} onClick={() => setAdding({})}>
          Add trailer or teaser
        </Button>
      )}
      <p className="meta tm-storage">Trailer storage isn't set up yet: files stay in this browser tab and are gone after a reload.</p>
      <Sheet open={!!adding} onClose={() => setAdding(null)} title={adding?.replace ? 'Replace video' : 'Add trailer or teaser'} size="tall">
        {adding && (
          <TrailerForm
            languages={p.languages}
            taken={(p.trailers ?? []).filter((t) => t.id !== adding.replace).map((t) => `${t.kind}:${t.language}`)}
            initial={adding.replace ? (p.trailers ?? []).find((t) => t.id === adding.replace) : undefined}
            done={(t) => {
              const list = p.trailers ?? [];
              const old = adding.replace ? list.find((x) => x.id === adding.replace) : undefined;
              if (old?.temporary && old.url !== t.url && old.url.startsWith('blob:')) URL.revokeObjectURL(old.url);
              save(old ? list.map((x) => (x.id === old.id ? { ...t, id: old.id, status: old.status } : x)) : [...list, t]);
              setAdding(null);
              setError('');
              showToast({ text: old ? 'Video replaced' : `${t.kind === 'teaser' ? 'Teaser' : 'Trailer'} added as a draft` });
            }}
          />
        )}
      </Sheet>
    </section>
  );
}

function TrailerForm({ languages, taken, initial, done }: { languages: string[]; taken: string[]; initial?: Trailer; done: (t: Trailer) => void }) {
  const [kind, setKind] = useState<Trailer['kind']>(initial?.kind ?? 'trailer');
  const [language, setLanguage] = useState(initial?.language ?? languages[0] ?? 'Hindi');
  const [step, setStep] = useState<TrailerStep | null>(null);
  const [error, setError] = useState('');
  const abort = useRef<AbortController | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => () => abort.current?.abort(), []);
  const duplicate = taken.includes(`${kind}:${language}`);
  const pick = async (file?: File) => {
    if (!file) return;
    abort.current?.abort();
    const ctl = new AbortController();
    abort.current = ctl;
    setError('');
    try {
      const got = await previewTrailer(file, ctl.signal, setStep);
      done({ id: crypto.randomUUID(), kind, language, status: 'draft', ...got });
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message);
    } finally {
      setStep(null);
      if (input.current) input.current.value = '';
    }
  };
  const options = [...languages, ...LANGUAGES.filter((l) => !languages.includes(l))];
  return (
    <div className="stack tm-form">
      {!initial && (
        <>
          <fieldset className="tm-kind">
            <legend className="field-label">Kind</legend>
            {(['trailer', 'teaser'] as const).map((k) => (
              <label key={k} className={`chip${kind === k ? ' is-on' : ''}`}>
                <input type="radio" name="tm-kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
                {k === 'trailer' ? 'Trailer' : 'Teaser'}
              </label>
            ))}
          </fieldset>
          <div>
            <label className="field-label" htmlFor="tm-lang">Language</label>
            <select id="tm-lang" className="field" value={language} onChange={(e) => setLanguage(e.target.value)}>
              {options.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            {duplicate && <p className="field-error" role="alert">There is already a {kind} in {language}. Replace that one instead.</p>}
          </div>
        </>
      )}
      <p className="meta">MP4, MOV or WebM, up to 5 minutes and 500 MB, 1080p or smaller. A 16:9 export looks best on the project page.</p>
      <input ref={input} type="file" accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm" className="sr-only" id="tm-file" onChange={(e) => pick(e.target.files?.[0])} disabled={!!step || duplicate} />
      <Button block size="l" disabled={!!step || duplicate} onClick={() => input.current?.click()}>
        {initial ? 'Choose the new video' : 'Choose video'}
      </Button>
      {step && (
        <div role="status" className="tm-progress">
          <label className="meta" htmlFor="tm-prog">{STEP[step][0]}</label>
          <progress id="tm-prog" value={STEP[step][1]} max={100} />
          <button className="link link--muted" onClick={() => abort.current?.abort()}>Cancel</button>
        </div>
      )}
      {error && <p className="field-error" role="alert">{error}</p>}
      <p className="meta">The video stays on this device for this session. It's added as a draft; publish it when you're ready.</p>
    </div>
  );
}

