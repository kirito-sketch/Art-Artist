import { CreditSeal } from '../../ui/CreditSeal';
import { scriptLang } from '../../ui/compose';
import { ChevronLeft, Globe2, Lock, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as seed from '../../data/seed';
import type { Media } from '../../data/types';
import { useStore } from '../../state/store';
import { org, person } from '../../state/selectors';
import { DEPTS, FORMATS, LANGUAGES, STAGES, creditState, project, publicName, world, type Format } from '../../state/world';
import { Avatar, Button, EmptyState, IconButton, Photo, PressCard, Pressable, Row, SectionHeader, Verified } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';
import { DateField, fmtPay, fmtRange, MissingHint, MoneyField, PAY_UNITS, type PayUnit } from '../../ui/fields';
import { useFeatures } from '../../ui/features';
import { searchablePeople } from '../../domain/discovery';

/* ============================================================ New project */

/** Three fields and nothing public. Everything else is added to the workspace over time. */
export function NewProjectForm() {
  const { createProject, closeSheet, push, showToast, acting, viewer } = useStore();
  const [title, setTitle] = useState('');
  const [format, setFormat] = useState<Format>('Feature');
  const [langs, setLangs] = useState<string[]>(['Telugu']);
  const owner = acting !== 'self' ? org(acting).name : person(viewer.id).name;
  const fallback = `Untitled ${langs[0] ?? ''} ${format.toLowerCase()}`.replace(/\s+/g, ' ');
  return (
    <div className="stack">
      <div>
        <label className="field-label" htmlFor="np-title">Working title</label>
        <input id="np-title" className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={fallback} />
        <p className="meta field-hint">Only {owner} sees this. You choose a public title when you share.</p>
      </div>
      <div>
        <span className="field-label">Format</span>
        <div className="chips">
          {FORMATS.map((f) => (
            <button key={f} className={`chip ${format === f ? 'is-on' : ''}`} aria-pressed={format === f} onClick={() => setFormat(f)}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className="field-label">Language</span>
        <div className="chips">
          {LANGUAGES.map((l) => (
            <button key={l} className={`chip ${langs.includes(l) ? 'is-on' : ''}`} aria-pressed={langs.includes(l)} onClick={() => setLangs((x) => (x.includes(l) ? x.filter((y) => y !== l) : [...x, l]))}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <Button
        block
        size="l"
        disabled={!langs.length}
        onClick={() => {
          const id = createProject({ workingTitle: title.trim() || fallback, format, languages: langs });
          closeSheet();
          push({ name: 'hproject', id });
          showToast({ text: `Project created. Only ${owner} can see it.` });
        }}
      >
        Create project
      </Button>
    </div>
  );
}

/** "Open a role" from Create: a role always belongs to a project. */
export function PickProject() {
  const { acting, viewer, closeSheet, push, openSheet } = useStore();
  const mine = world.projects.filter((p) => (acting !== 'self' ? p.houseId === acting : p.ownerId === viewer.id));
  return (
    <div className="stack">
      <p className="meta">Which project is the role for?</p>
      {mine.length ? (
        <div className="list list--flush">
          {mine.map((p) => (
            <PressCard
              key={p.id}
              className="prow"
              onPress={() => {
                closeSheet();
                push({ name: 'hproject', id: p.id });
              }}
              scale={0.985}
            >
              <div className="prow-text">
                <p className="item-title">{p.workingTitle}</p>
                <p className="meta">
                  {p.format} · {p.stage}
                </p>
              </div>
            </PressCard>
          ))}
        </div>
      ) : (
        <p className="meta">No projects yet.</p>
      )}
      <Button block variant="secondary" onClick={() => openSheet({ name: 'newProject' })}>
        New project
      </Button>
    </div>
  );
}

/* ============================================================ Workspace */

const CREDIT_LABEL: Record<string, string> = { prepared: 'Credit prepared', proposed: 'Credit proposed', accepted: 'Credited', correction: 'Correction asked' };

export function HouseProjectScreen({ id, focusAssociation }: { id: string; focusAssociation?: string }) {
  const { pop, push, acting, viewer, interestsReceived, roleStatus, setRoleVisibility, showToast, canIssue, proposePrepared, memberships, setActing } = useStore();
  const p = project(id);
  const district = useFeatures().home === 'district' && !!p?.houseId;
  const [confirmRole, setConfirmRole] = useState<string | null>(null);
  const [sheet, setSheet] = useState<null | 'share' | 'details' | 'role' | 'person' | { issue: string } | { edit: string } | { revise: string }>(() => district && p?.houseId === acting && world.associations.some((a) => a.id === focusAssociation && a.projectId === id && a.status !== 'removed') ? { edit: focusAssociation! } : null);
  if (!p) return <EmptyState title="Project not found" />;
  const owner = p.houseId ? org(p.houseId).name : person(p.ownerId!).name;
  const canAct = p.houseId ? acting === p.houseId : acting === 'self' && viewer.id === p.ownerId;
  // Trust-sensitive actions (public roles, sharing, credits) unlock only once Art and Artist verifies the house.
  const verified = !p.houseId || org(p.houseId).verified;
  const roles = world.roles.filter((r) => r.projectId === id);
  const people = world.associations.filter((a) => a.projectId === id && a.status !== 'removed');

  const detailsSection = (
<section className="section dhouse-details">
        <SectionHeader title="Details" />
        <div className="group">
          <Row label="Public title" value={p.publicTitle ?? 'Not set'} onPress={canAct ? () => setSheet('details') : undefined} />
          <Row label="Logline" value={p.logline ? 'Added' : 'Not set'} onPress={canAct ? () => setSheet('details') : undefined} />
          <Row label="Artwork" value={p.artwork ? 'Added' : 'Not set'} onPress={canAct ? () => setSheet('details') : undefined} />
          <Row label="Stage" value={p.stage} onPress={canAct ? () => setSheet('details') : undefined} />
        </div>
        <p className="meta settings-note">{p.shared ? 'Changes to these show on the public page.' : 'Private until you share.'}</p>
      </section>
  );

  return (
    <div className={`screen${district ? ' dhouse-page dhouse-workspace' : ''}`}>
      <header className="topbar topbar--nav">
        <IconButton label="Back" onClick={pop}>
          <ChevronLeft size={26} />
        </IconButton>
        {p.shared && (
          <button className="link" onClick={() => push({ name: 'work', id })}>
            View public page
          </button>
        )}
      </header>
      {district && p.artwork && <div className="dhouse-workspace-art"><Photo media={p.artwork} showPlay={false} /></div>}
      <div className="title-block">
        <p className="kicker">
          {p.format} · {p.languages.join(', ')} · {p.stage}
        </p>
        <h1 className="large-title" lang={scriptLang(p.workingTitle)}>{p.workingTitle}</h1>
        <p className="meta ws-visibility">
          {p.shared ? <Globe2 size={13} /> : <Lock size={13} />} {district ? p.shared ? `Public as ${publicName(p)}` : 'Private project' : p.shared ? `Shared on Art and Artist as "${publicName(p)}"` : `Only ${owner} can see this project`}
        </p>
      </div>

      {!canAct && (
        <p className="inline-note ws-pad">
          You're viewing as yourself.{' '}
          {p.houseId && memberships.includes(p.houseId) ? (
            <button className="link" onClick={() => setActing(p.houseId!, true, true)}>
              Switch to {owner}
            </button>
          ) : (
            `Only ${owner} can make changes.`
          )}
        </p>
      )}
      {!verified && <p className="inline-note ws-pad">Verification pending. You can prepare this project privately; opening roles, sharing and credits unlock once Art and Artist verifies {owner}.</p>}

      {!p.shared && (
        <div className="ws-announce">
          <p className="item-title">Not announced</p>
          <p className="meta">{district ? 'Share when you’re ready.' : "Add details and roles privately. Share when you're ready, and you'll see exactly what becomes public."}</p>
          <Button disabled={!canAct || !verified} onClick={() => setSheet('share')}>
            Share on Art and Artist
          </Button>
        </div>
      )}

      {!district && detailsSection}

      {(p.stage !== 'Released' || roles.length > 0) && (
      <section className="section">
        <SectionHeader title="Roles" />
        <div className="list list--flush">
          {roles.map((r) => {
            const st = roleStatus[r.id];
            const ints = interestsReceived.filter((i) => i.opportunityId === r.id && !i.withdrawn).length;
            const label = st ? (st.state === 'filled' ? 'Filled' : 'Closed') : r.visibility === 'private' ? `Only ${owner}` : `Open on Art and Artist${ints ? ` · ${ints} interested` : ''}`;
            return (
              <div key={r.id} className="prow">
                <div className="prow-text">
                  <p className="item-title">{r.role}</p>
                  <p className="meta">
                    {!st && (r.visibility === 'open' ? <Globe2 size={12} /> : <Lock size={12} />)} {label}
                  </p>
                </div>
                {r.visibility === 'private' && !st ? (
                  <Button
                    size="s"
                    variant="outline"
                    disabled={!canAct || !verified}
                    onClick={() => {
                      // On an unannounced project, opening a role is a deliberate, previewed disclosure.
                      if (!p.shared) return setConfirmRole(r.id);
                      setRoleVisibility(r.id, 'open');
                      showToast({ text: `${r.role} is open on Art and Artist` });
                    }}
                  >
                    Open on Art and Artist
                  </Button>
                ) : (
                  <Button size="s" variant="secondary" aria-label={`View ${r.role} role`} onClick={() => push({ name: 'opportunity', id: r.id })}>
                    View
                  </Button>
                )}
              </div>
            );
          })}
          {!roles.length && <p className="meta">No roles yet.</p>}
        </div>
        <Button block variant="outline" disabled={!canAct} onClick={() => setSheet('role')}>
          <Plus size={16} /> Add role
        </Button>
      </section>
      )}

      <section className="section">
        <SectionHeader title={district ? 'People on this project' : 'On this project'} />
        <p className="meta ph-note">{district ? <><Lock size={12} /> Private associations</> : `Private to ${owner} and each person. Being added isn't a credit. Issue a credit when it's earned.`}</p>
        <div className="list list--flush">
          {people.map((a) => {
            const { current, pending, amendment } = creditState(a.id);
            const c = pending ?? current;
            const amending = amendment?.status === 'open';
            const who = a.personId ? person(a.personId) : null;
            const label = pending ? (pending.supersedes ? 'Revision proposed' : CREDIT_LABEL[pending.status]) : amending ? 'Amendment asked' : current ? 'Credited' : a.pending ? 'Not on Art and Artist' : 'Added';
            return (
              <PressCard key={a.id} className="prow" onPress={() => canAct && setSheet({ edit: a.id })} scale={0.99}>
                {who ? <Avatar party={who} size={40} /> : <span className="ph-initial">{a.pending!.name[0]}</span>}
                <div className="prow-text">
                  <p className="item-title">{who?.name ?? a.pending!.name}</p>
                  <p className="meta">{district ? a.workingRole : c && c.status !== 'prepared' ? c.line : current ? current.line : a.workingRole}</p>
                  {a.status === 'flagged' && <p className="meta meta--attention">Says this isn't right</p>}
                  {!district && c?.status === 'correction' && c.note && <p className="meta meta--attention">Asked: {c.note}</p>}
                  {!district && amending && <p className="meta meta--attention">Asked to amend: {amendment!.reason}. The credit stays public until you decide.</p>}
                </div>
                <span className={`ph-state ${district ? 'ph-state--added' : !pending && !amending && current ? 'ph-state--confirmed' : c ? 'ph-state--invited' : 'ph-state--added'}`}>{district ? a.pending ? 'Not on Ana' : 'Added' : label}</span>
              </PressCard>
            );
          })}
          {!people.length && <p className="meta">No one added yet.</p>}
        </div>
        <Button block variant="outline" disabled={!canAct} onClick={() => setSheet('person')}>
          <Plus size={16} /> Add person
        </Button>
        {!district && canIssue &&
          world.credits
            .filter((c) => c.projectId === id && c.status === 'prepared')
            .map((c) => (
              <p key={c.id} className="inline-note">
                Credit for {person(c.personId).name} is prepared.{' '}
                <button className="link" onClick={() => proposePrepared(c.id)}>
                  Issue it
                </button>
              </p>
            ))}
      </section>

      {district && p.houseId && <section className="section dhouse-credits">
        <SectionHeader title="Credits" />
        <div className="list list--flush">{people.filter((a) => { const cs = creditState(a.id); return cs.current || cs.pending; }).map((a) => {
          const { current, pending, amendment } = creditState(a.id);
          const c = pending ?? current!;
          const who = person(a.personId!);
          const amending = amendment?.status === 'open';
          const label = amending ? 'Amendment asked' : pending?.supersedes ? 'Revision proposed' : pending ? CREDIT_LABEL[pending.status] : p.shared ? 'Public credit' : 'Accepted · project private';
          return <PressCard key={a.id} className="prow" onPress={() => canAct && setSheet({ edit: a.id })} aria-label={`${who.name}, ${label}`}>
            <Avatar party={who} size={48} /><div className="prow-text"><p className="item-title">{who.name}</p><p className="meta">{c.line}</p><p className="meta">{label}</p>{(c.note || amending) && <p className="meta meta--attention">{amending ? amendment!.reason : c.note}</p>}</div>
            {c.status === 'prepared' && canIssue && <Button size="s" disabled={!canAct || !verified} onClick={(e) => { e.stopPropagation(); proposePrepared(c.id); }}>Issue</Button>}
          </PressCard>;
        })}</div>
        {!people.some((a) => { const cs = creditState(a.id); return cs.current || cs.pending; }) && <p className="meta">No credits issued yet.</p>}
      </section>}

      {district && detailsSection}

      <Sheet className={district ? 'dhouse-sheet' : undefined} open={!!confirmRole} onClose={() => setConfirmRole(null)} title="Open on Art and Artist?">
        {confirmRole && (
          <div className="stack">
            <RoleDisclosure projectId={id} />
            <Button
              block
              size="l"
              onClick={() => {
                const r = world.roles.find((x) => x.id === confirmRole)!;
                setRoleVisibility(confirmRole, 'open');
                setConfirmRole(null);
                showToast({ text: `${r.role} is open on Art and Artist as part of "${publicName(p)}"` });
              }}
            >
              Open on Art and Artist
            </Button>
          </div>
        )}
      </Sheet>
      <Sheet className={district ? 'dhouse-sheet' : undefined} open={sheet === 'share'} onClose={() => setSheet(null)} title="Share on Art and Artist" size="tall">
        {sheet === 'share' && <ShareProject id={id} done={() => setSheet(null)} />}
      </Sheet>
      <Sheet className={district ? 'dhouse-sheet' : undefined} open={sheet === 'details'} onClose={() => setSheet(null)} title="Details" size="tall">
        {sheet === 'details' && <ProjectDetails id={id} done={() => setSheet(null)} />}
      </Sheet>
      <Sheet className={district ? 'dhouse-sheet' : undefined} open={sheet === 'role'} onClose={() => setSheet(null)} title="Add role" size="tall">
        {sheet === 'role' && <AddRole projectId={id} done={() => setSheet(null)} />}
      </Sheet>
      <Sheet className={district ? 'dhouse-sheet' : undefined} open={sheet === 'person'} onClose={() => setSheet(null)} title="Add person" size="tall">
        {sheet === 'person' && <AddPerson projectId={id} done={() => setSheet(null)} />}
      </Sheet>
      <Sheet className={district ? 'dhouse-sheet' : undefined} open={!!sheet && typeof sheet === 'object' && 'edit' in sheet} onClose={() => setSheet(null)} title="" label="Person on this project">
        {sheet && typeof sheet === 'object' && 'edit' in sheet && <PersonActions id={sheet.edit} issue={() => setSheet({ issue: sheet.edit })} revise={(m) => setSheet({ revise: m })} done={() => setSheet(null)} />}
      </Sheet>
      <Sheet className={district ? 'dhouse-sheet' : undefined} open={!!sheet && typeof sheet === 'object' && 'issue' in sheet} onClose={() => setSheet(null)} title={district && !canIssue ? 'Prepare credit' : 'Issue credit'} size="tall">
        {sheet && typeof sheet === 'object' && 'issue' in sheet && <IssueCredit associationId={sheet.issue} done={() => setSheet(null)} />}
      </Sheet>
      <Sheet className={district ? 'dhouse-sheet' : undefined} open={!!sheet && typeof sheet === 'object' && 'revise' in sheet} onClose={() => setSheet(null)} title="Propose revised credit" size="tall">
        {sheet && typeof sheet === 'object' && 'revise' in sheet && <ReviseCredit amendmentId={sheet.revise} done={() => setSheet(null)} />}
      </Sheet>
    </div>
  );
}

/* ------------------------------------------------------------ Share on Art and Artist */

/** Publishing is deliberate: show exactly what becomes public and what stays private. */
function ShareProject({ id, done }: { id: string; done: () => void }) {
  const { updateProject, showToast, roleStatus } = useStore();
  const p = project(id)!;
  const district = useFeatures().home === 'district' && !!p.houseId;
  const [title, setTitle] = useState(p.publicTitle ?? '');
  const shownTitle = title.trim() || `Untitled ${p.languages[0]} ${p.format.toLowerCase()}`;
  const open = world.roles.filter((r) => r.projectId === id && r.visibility === 'open' && !roleStatus[r.id]).length;
  const priv = world.roles.filter((r) => r.projectId === id && r.visibility === 'private' && !roleStatus[r.id]).length;
  const added = world.associations.filter((a) => a.projectId === id && a.status !== 'removed').length;
  const accepted = world.credits.filter((c) => c.projectId === id && c.status === 'accepted').length;
  const notAccepted = world.credits.filter((c) => c.projectId === id && c.status !== 'accepted').length;
  const visibility = (
<div className="share-lists">
        <div>
          <p className="field-label">
            <Globe2 size={13} /> Becomes public
          </p>
          <ul className="block-list">
            <li>Title: {shownTitle}</li>
            <li>
              {p.format}, {p.languages.join(', ')}, {p.stage.toLowerCase()}
            </li>
            <li>{p.houseId ? org(p.houseId).name : person(p.ownerId!).name} as the production</li>
            {p.logline && <li>Logline</li>}
            {p.artwork && <li>Artwork</li>}
            <li>{open ? `${open} open ${open === 1 ? 'role' : 'roles'}` : 'No open roles'}</li>
            <li>{accepted ? `${accepted} accepted ${accepted === 1 ? 'credit' : 'credits'}` : 'No credits yet'}</li>
          </ul>
        </div>
        <div>
          <p className="field-label">
            <Lock size={13} /> Stays private
          </p>
          <ul className="block-list">
            {title.trim() !== p.workingTitle && <li>Working title "{p.workingTitle}"</li>}
            <li>{added ? `${added} ${added === 1 ? 'person' : 'people'} added to the project` : 'People you add later'}</li>
            {priv > 0 && <li>{priv} private {priv === 1 ? 'role' : 'roles'}</li>}
            <li>{notAccepted ? `${notAccepted} ${notAccepted === 1 ? 'credit' : 'credits'} not yet accepted` : 'Credits until each person accepts'}</li>
          </ul>
        </div>
      </div>
  );
  return (
    <div className="stack">
      <div>
        <label className="field-label" htmlFor="sp-title">Public title</label>
        <input id="sp-title" className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`Untitled ${p.languages[0]} ${p.format.toLowerCase()}`} />
        <p className="meta field-hint">Leave empty to announce without a title.</p>
      </div>
      {district ? <>
        <div className="dhouse-share-preview">
          {p.artwork && <Photo media={p.artwork} showPlay={false} />}
          <div><p className="item-title" lang={scriptLang(shownTitle)}>{shownTitle}</p><p className="meta">{p.format} · {p.languages.join(', ')} · {p.stage}</p><p className="meta">{p.houseId ? org(p.houseId).name : person(p.ownerId!).name}</p>{p.logline && <p className="body">{p.logline}</p>}<p className="meta">{open} open roles · {accepted} accepted credits</p></div>
        </div>
        <p className="meta"><Lock size={13} /> People added privately and unaccepted credits stay private.</p>
        <details className="dhouse-privacy"><summary>Public and private details</summary>{visibility}</details>
      </> : visibility}
      <Button
        block
        size="l"
        onClick={() => {
          updateProject(id, { shared: true, publicTitle: title.trim() || undefined });
          done();
          showToast({ text: `Shared on Art and Artist as "${shownTitle}"`, tone: 'success' });
        }}
      >
        Share on Art and Artist
      </Button>
    </div>
  );
}

function ProjectDetails({ id, done }: { id: string; done: () => void }) {
  const { updateProject } = useStore();
  const districtFeature = useFeatures().home === 'district';
  const p = project(id)!;
  const district = districtFeature && !!p.houseId;
  const [title, setTitle] = useState(p.publicTitle ?? '');
  const [logline, setLogline] = useState(p.logline ?? '');
  const [stage, setStage] = useState(p.stage);
  const [art, setArt] = useState<Media | undefined>(p.artwork);
  const [releaseDate, setReleaseDate] = useState(p.releaseDate ?? '');
  return (
    <div className="stack">
      <div>
        <label className="field-label" htmlFor="pd-title">Public title</label>
        <input id="pd-title" className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Not announced" />
      </div>
      <div>
        <label className="field-label" htmlFor="pd-log">Logline</label>
        <textarea id="pd-log" className="field field--area" rows={3} maxLength={200} value={logline} onChange={(e) => setLogline(e.target.value)} placeholder="One line about the story" />
      </div>
      <div>
        <span className="field-label">Stage</span>
        <div className="chips">
          {STAGES.map((s) => (
            <button key={s} className={`chip ${stage === s ? 'is-on' : ''}`} aria-pressed={stage === s} onClick={() => setStage(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className="field-label">Artwork</span>
        <div className="art-pick">
          {seed.cameraRoll.slice(0, 8).map((m) => (
            <Pressable key={m.id} className={`art-thumb ${art?.id === m.id ? 'is-on' : ''}`} onClick={() => setArt(art?.id === m.id ? undefined : m)} scale={0.95}>
              <Photo media={m} showPlay={false} />
            </Pressable>
          ))}
        </div>
      </div>
      {district && <div><span className="field-label">Release date</span><DateField label="Release date" value={releaseDate} onChange={setReleaseDate} clearable /></div>}
      <Button
        block
        size="l"
        onClick={() => {
          updateProject(id, { publicTitle: title.trim() || undefined, logline: logline.trim() || undefined, stage, artwork: art, ...(district ? { releaseDate: releaseDate || undefined } : {}) });
          done();
        }}
      >
        Save
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------ Add role */

const QUICK_ROLES = ['Director of Photography', 'Colourist', 'Gaffer', 'Editor', 'Sound Recordist', 'Production Designer', 'Actor'];

/** One role object. Starts private or open; the same record is later filled or closed. */
function AddRole({ projectId, done }: { projectId: string; done: () => void }) {
  const { addRole, showToast } = useStore();
  const p = project(projectId)!;
  const district = useFeatures().home === 'district' && !!p.houseId;
  const [role, setRole] = useState('');
  const [about, setAbout] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [city, setCity] = useState('');
  const [paid, setPaid] = useState(true);
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [unit, setUnit] = useState<PayUnit>('day');
  const [qs, setQs] = useState<string[]>([]);
  const houseVerified = !p.houseId || org(p.houseId).verified;
  const [vis, setVis] = useState<'private' | 'open'>(houseVerified ? 'open' : 'private');
  return (
    <div className="stack">
      <div>
        <label className="field-label" htmlFor="ar-role">Role</label>
        <input id="ar-role" className="field" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Colourist" />
        <div className="chips chips--tight">
          {QUICK_ROLES.map((r) => (
            <button key={r} className={`chip ${role === r ? 'is-on' : ''}`} aria-pressed={role === r} onClick={() => setRole(r)}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="ar-about">What it involves</label>
        <textarea id="ar-about" className="field field--area" rows={3} maxLength={400} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="A few lines are enough" />
      </div>
      <div>
        <span className="field-label">When</span>
        <div className="field-row">
          <DateField
            className="field"
            value={start}
            onChange={(v) => {
              setStart(v);
              if (end && v && end < v) setEnd('');
            }}
            label="Starts"
            placeholder="Starts"
          />
          <DateField className="field" value={end} onChange={setEnd} label="Ends" placeholder="Ends (optional)" min={start || undefined} clearable />
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="ar-where">Where</label>
        <input id="ar-where" className="field" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
      </div>
      <div>
        <span className="field-label">Pay</span>
        <div className="chips">
          <button className={`chip ${paid ? 'is-on' : ''}`} aria-pressed={paid} onClick={() => setPaid(true)}>
            Paid
          </button>
          <button className={`chip ${!paid ? 'is-on' : ''}`} aria-pressed={!paid} onClick={() => setPaid(false)}>
            Unpaid
          </button>
        </div>
        {paid && (
          <div className="field-row field-row--pay">
            <MoneyField className="field" value={min} onChange={setMin} label="From amount" placeholder="From" />
            <MoneyField className="field" value={max} onChange={setMax} label="Up to amount" placeholder="Up to" />
            <select className="field field-select" value={unit} onChange={(e) => setUnit(e.target.value as PayUnit)} aria-label="Paid">
              {PAY_UNITS.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div>
        <span className="field-label">Questions (optional, up to 3)</span>
        {qs.map((q, i) => (
          <input key={i} className="field field--stack" aria-label={`Question ${i + 1}`} value={q} onChange={(e) => setQs((x) => x.map((y, j) => (j === i ? e.target.value : y)))} placeholder={i === 0 ? 'e.g. Which features have you worked on?' : `Question ${i + 1}`} />
        ))}
        {qs.length < 3 && (
          <button className="link" onClick={() => setQs((x) => [...x, ''])}>
            Add a question
          </button>
        )}
        <p className="meta field-hint">{district ? 'Answers are optional. Ask for a link to see their work.' : 'Answers are optional for people showing interest. To see work, ask for a link (for example "A link to a scene you lit"): nothing can be uploaded when showing interest.'}</p>
      </div>
      <div>
        <span className="field-label">Who can see it</span>
        <div className="chips">
          <button className={`chip ${vis === 'private' ? 'is-on' : ''}`} aria-pressed={vis === 'private'} onClick={() => setVis('private')}>
            <Lock size={13} /> Only {p.houseId ? org(p.houseId).name : 'you'}
          </button>
          <button className={`chip ${vis === 'open' ? 'is-on' : ''}`} aria-pressed={vis === 'open'} disabled={!houseVerified} onClick={() => setVis('open')}>
            <Globe2 size={13} /> Open on Art and Artist
          </button>
        </div>
        {!houseVerified && <p className="meta field-hint">Public roles unlock once Art and Artist verifies {org(p.houseId!).name}.</p>}
        {vis === 'open' && !p.shared && <RoleDisclosure projectId={projectId} />}
      </div>
      <Button
        block
        size="l"
        disabled={!role.trim()}
        aria-describedby="ar-missing"
        onClick={() => {
          addRole(projectId, { role: role.trim(), about: about.trim(), dates: fmtRange(start, end), city: city.trim(), paid, compensation: paid ? fmtPay(min, max, unit) : '', questions: qs, visibility: vis });
          done();
          showToast({ text: vis === 'open' ? `${role} is open on Art and Artist` : `${role} added. Only your house can see it.` });
        }}
      >
        Add role
      </Button>
      <MissingHint id="ar-missing" items={[!role.trim() && 'a role name']} verb="add the role" />
    </div>
  );
}

/* ------------------------------------------------------------ Add person */

/** Adding is private and tells the person. It is never a credit; "Add and issue credit" creates both records. */
export function AddPerson({ projectId, done, preset }: { projectId: string; done: () => void; preset?: { personId: string; role: string; fromRoleId: string } }) {
  const { addToProject, issueCredit, showToast, canIssue, viewer, blocked } = useStore();
  const districtFeature = useFeatures().home === 'district';
  const p = project(projectId)!;
  const district = districtFeature && !!p.houseId;
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<string | null>(preset?.personId ?? null);
  const [pending, setPending] = useState<{ name: string; phone: string } | null>(null);
  const [roleText, setRoleText] = useState(preset?.role ?? '');
  const [dept, setDept] = useState('');
  const [step, setStep] = useState<'find' | 'role' | 'credit'>(preset ? 'role' : 'find');
  const [line, setLine] = useState('');
  const already = world.associations.filter((a) => a.projectId === projectId && a.status !== 'removed').map((a) => a.personId);
  const pool = district ? searchablePeople(viewer.id, blocked) : seed.people;
  const results = pool.filter((x) => x.visibility === 'public' && !already.includes(x.id) && (!q || `${x.name} ${x.role}`.toLowerCase().includes(q.toLowerCase()))).slice(0, 6);
  const name = picked ? person(picked).name : pending?.name ?? '';
  const house = !!p.houseId;

  if (step === 'find')
    return (
      <div className="stack">
        {!pending ? (
          <>
            <input className="field" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people on Art and Artist" aria-label="Search people on Art and Artist" />
            <div className="list list--flush">
              {results.map((x) => (
                <PressCard
                  key={x.id}
                  className="prow"
                  onPress={() => {
                    setPicked(x.id);
                    setRoleText(x.role);
                    setStep('role');
                  }}
                  scale={0.985}
                >
                  <Avatar party={x} size={40} />
                  <div className="prow-text">
                    <p className="item-title">{x.name}</p>
                    <p className="meta">
                      {x.role} · {x.city}
                    </p>
                  </div>
                </PressCard>
              ))}
            </div>
            <button className="link" onClick={() => setPending({ name: '', phone: '' })}>
              Not on Art and Artist? Add them privately
            </button>
          </>
        ) : (
          <>
            <p className="meta">{district ? 'Private record. No public profile or credit until they join.' : "This stays inside your project. It doesn't create an Art and Artist profile, can't be found in search and can't be credited until they join."}</p>
            <label className="ob-field">
              <span className="field-label">Name</span>
              <input className="field" value={pending.name} onChange={(e) => setPending({ ...pending, name: e.target.value })} autoComplete="off" />
            </label>
            <label className="ob-field">
              <span className="field-label">{district ? 'Phone (optional)' : 'Phone (optional, to invite them to Art and Artist)'}</span>
              <input className="field" value={pending.phone} onChange={(e) => setPending({ ...pending, phone: e.target.value.replace(/(?!^\+)[^\d]/g, '').slice(0, 15) })} inputMode="tel" autoComplete="off" />
            </label>
            <Button block disabled={!pending.name.trim()} onClick={() => setStep('role')}>
              Continue
            </Button>
          </>
        )}
      </div>
    );

  const addOnly = () => {
    addToProject(projectId, picked ? { personId: picked } : { pending: pending! }, roleText.trim(), dept || 'Production', preset?.fromRoleId);
    done();
    showToast({ text: picked ? `${name} added. They've been told privately.` : `${name} added privately` });
  };

  if (step === 'role')
    return (
      <div className="stack">
        <div className="ap-who">
          {picked ? <Avatar party={person(picked)} size={44} /> : <span className="ph-initial">{name[0]}</span>}
          <span>
            <span className="item-title">{name}</span>
            <span className="meta">{picked ? person(picked).role : 'Not on Art and Artist'}</span>
          </span>
        </div>
        <div>
          <label className="field-label" htmlFor="ap-role">Working role</label>
          <input id="ap-role" className="field" value={roleText} onChange={(e) => setRoleText(e.target.value)} placeholder="e.g. 1st AC" />
          <p className="meta field-hint">You can change this any time. It isn't their credit.</p>
        </div>
        <div>
          <span className="field-label">Department</span>
          <div className="chips chips--tight">
            {DEPTS.map((d) => (
              <button key={d} className={`chip ${dept === d ? 'is-on' : ''}`} aria-pressed={dept === d} onClick={() => setDept(d)}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <p className="inline-note">
          {picked ? `${name.split(' ')[0]} is told privately that ${p.houseId ? org(p.houseId).name : 'you'} added them. Nothing becomes public.` : 'Only your house sees this.'}
        </p>
        <Button block size="l" disabled={!roleText.trim()} onClick={addOnly}>
          Add to project
        </Button>
        {house && picked && org(p.houseId!).verified && (
          <Button
            block
            size="l"
            variant="secondary"
            disabled={!roleText.trim()}
            onClick={() => {
              setLine(roleText.trim());
              setStep('credit');
            }}
          >
            Add and issue credit
          </Button>
        )}
      </div>
    );

  return (
    <CreditForm
      personId={picked!}
      projectId={projectId}
      line={line}
      setLine={setLine}
      dept={dept}
      setDept={setDept}
      cta={canIssue ? 'Add and propose credit' : 'Add and prepare credit'}
      submit={() => {
        const aid = addToProject(projectId, { personId: picked! }, roleText.trim(), dept || 'Production', preset?.fromRoleId);
        const st = issueCredit(aid, line.trim(), dept || 'Production');
        done();
        showToast({ text: st === 'proposed' ? `${name} added, and a credit proposed` : `${name} added. Credit prepared for someone with authority to issue.` });
      }}
    />
  );
}

/* ------------------------------------------------------------ Issue credit */

function CreditForm({ personId, projectId, line, setLine, dept, setDept, cta, submit, note }: { personId: string; projectId: string; line: string; setLine: (s: string) => void; dept: string; setDept: (s: string) => void; cta: string; submit: () => void; note?: string }) {
  const { canIssue } = useStore();
  const p = project(projectId)!;
  const who = person(personId);
  return (
    <div className="stack">
      <div>
        <label className="field-label" htmlFor="ic-line">Credit line</label>
        <input id="ic-line" className="field" value={line} onChange={(e) => setLine(e.target.value)} placeholder="Exactly as it should read" />
      </div>
      <div>
        <span className="field-label">Department</span>
        <div className="chips chips--tight">
          {DEPTS.map((d) => (
            <button key={d} className={`chip ${dept === d ? 'is-on' : ''}`} aria-pressed={dept === d} onClick={() => setDept(d)}>
              {d}
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className="field-label">Preview</span>
        <div className="credit-preview">
          <Avatar party={who} size={44} />
          <span>
            <span className="item-title">{who.name}</span>
            <span className="meta meta--dark">{line || 'Credit line'}</span>
            <span className="meta">
              {publicName(p)} · {org(p.houseId!).name} <Verified size={11} />
            </span>
          </span>
        </div>
      </div>
      <p className="meta">{note ?? (canIssue ? `${who.name.split(' ')[0]} is asked to accept it. It becomes public only once they accept and the project is shared.` : "You can prepare this credit. Someone with credit authority in the house has to issue it.")}</p>
      <Button block size="l" disabled={!line.trim() || !dept} onClick={submit}>
        {cta}
      </Button>
    </div>
  );
}

function IssueCredit({ associationId, done }: { associationId: string; done: () => void }) {
  const { issueCredit, showToast, canIssue } = useStore();
  const a = world.associations.find((x) => x.id === associationId)!;
  const [line, setLine] = useState(a.workingRole);
  const [dept, setDept] = useState(a.dept);
  return (
    <CreditForm
      personId={a.personId!}
      projectId={a.projectId}
      line={line}
      setLine={setLine}
      dept={dept}
      setDept={setDept}
      cta={canIssue ? 'Propose credit' : 'Prepare credit'}
      submit={() => {
        const st = issueCredit(associationId, line.trim(), dept);
        done();
        showToast({ text: st === 'proposed' ? `Credit proposed to ${person(a.personId!).name}` : 'Credit prepared. Someone with authority needs to issue it.' });
      }}
    />
  );
}

/** The house agrees with an amendment request. The accepted credit stays public until the person accepts this revision. */
function ReviseCredit({ amendmentId, done }: { amendmentId: string; done: () => void }) {
  const { proposeRevision, showToast } = useStore();
  const m = world.amendments.find((x) => x.id === amendmentId)!;
  const old = world.credits.find((x) => x.id === m.creditId)!;
  const [line, setLine] = useState(old.line);
  const [dept, setDept] = useState(old.dept);
  return (
    <div className="stack">
      <div className="group">
        <Row label="Current credit" value={old.line} chevron={false} />
        <Row label="They asked" value={m.reason} chevron={false} />
      </div>
      <CreditForm
        personId={m.personId}
        projectId={m.projectId}
        line={line}
        setLine={setLine}
        dept={dept}
        setDept={setDept}
        cta="Propose revised credit"
        note={`${person(m.personId).name.split(' ')[0]} is asked to accept the revision. Until then "${old.line}" stays their public credit, and the old version is kept in the record's history.`}
        submit={() => {
          proposeRevision(amendmentId, line.trim(), dept);
          done();
          showToast({ text: `Revised credit proposed to ${person(m.personId).name}` });
        }}
      />
    </div>
  );
}

function PersonActions({ id, issue, revise, done }: { id: string; issue: () => void; revise: (amendmentId: string) => void; done: () => void }) {
  const { editAssociation, removeAssociation, showToast, keepCredit, canIssue } = useStore();
  const district = useFeatures().home === 'district';
  const a = world.associations.find((x) => x.id === id)!;
  const p = project(a.projectId)!;
  const { current, pending, amendment } = creditState(id);
  const c = pending ?? current;
  const [roleText, setRoleText] = useState(a.workingRole);
  const [confirmRemove, setConfirmRemove] = useState(false);
  // The row that asked is replaced by the question: focus moves to its safe answer.
  useEffect(() => {
    if (confirmRemove) requestAnimationFrame(() => document.querySelector<HTMLElement>('.phone .confirm-remove [data-autofocus]')?.focus());
  }, [confirmRemove]);
  const name = a.personId ? person(a.personId).name : a.pending!.name;
  const canCredit = !!a.personId && !!p.houseId && org(p.houseId).verified && !current && (!pending || pending.status === 'correction');
  // An accepted credit is part of the person's record. The house can't erase or rewrite it; only an amendment the person accepts replaces it.
  const locked = !!current;
  const amending = amendment?.status === 'open' ? amendment : undefined;
  return (
    <div className="stack">
      <p className="title-2">{name}</p>
      {a.status === 'flagged' && <p className="inline-note">{name.split(' ')[0]} says this association isn't right. Correct the working role or remove them.</p>}
      {amending && <p className="inline-note">{name.split(' ')[0]} asked to amend "{current?.line}": {amending.reason}. It stays public as it is while you decide.</p>}
      {!c && (
        <div>
          <label className="field-label" htmlFor="pa-role">Working role</label>
          <input id="pa-role" className="field" value={roleText} onChange={(e) => setRoleText(e.target.value)} />
          {roleText !== a.workingRole && (
            <Button
              size="s"
              onClick={() => {
                editAssociation(id, { workingRole: roleText.trim() });
                done();
              }}
            >
              Save
            </Button>
          )}
        </div>
      )}
      <div className="group">
        {canCredit && <Row label={district && !canIssue ? 'Prepare credit' : c?.status === 'correction' ? 'Issue corrected credit' : 'Issue credit'} onPress={issue} />}
        {!p.houseId && <Row label={<span className="meta">Credits for independent projects aren't available yet</span>} chevron={false} />}
        {p.houseId && !org(p.houseId).verified && <Row label={<span className="meta">Credits unlock once Art and Artist verifies {org(p.houseId).name}</span>} chevron={false} />}
        {a.pending && <Row label={<span className="meta">Can be credited once they join Art and Artist</span>} chevron={false} />}
        {amending && (
          <>
            <Row label="Propose revised credit" onPress={() => revise(amending.id)} />
            <Row
              label="Keep the credit as it is"
              chevron={false}
              onPress={() => {
                keepCredit(amending.id);
                done();
                showToast({ text: `${name.split(' ')[0]} is told the credit stays as it is` });
              }}
            />
          </>
        )}
        {pending?.supersedes && <Row label={<span className="meta">Revised credit proposed. "{current?.line}" stays public until {name.split(' ')[0]} accepts it.</span>} chevron={false} />}
        {locked ? (
          <Row label={<span className="meta">Credit accepted. It's part of {name.split(' ')[0]}'s record: it can't be removed or edited, only amended at their request.</span>} chevron={false} />
        ) : (
          // Removing someone is hard to undo (their place, working role and any pending credit go):
          // one confirming step first (WCAG 3.3.4).
          confirmRemove ? (
            <div className="confirm-remove" role="group" aria-labelledby="confirm-remove-q">
              <p className="item-title" id="confirm-remove-q">
                Remove {name} from {publicName(p)}?
              </p>
              <p className="meta">Their working role{c ? ' and the pending credit' : ''} on this project go with them. You can add them again later.</p>
              <div className="confirm-remove-actions">
                <Button variant="secondary" data-autofocus onClick={() => setConfirmRemove(false)}>
                  Keep {name.split(' ')[0]}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    removeAssociation(id);
                    done();
                    showToast({ text: `${name} removed from the project` });
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <Row label={<span className="danger-text">Remove from project</span>} chevron={false} onPress={() => setConfirmRemove(true)} />
          )
        )}
      </div>
    </div>
  );
}

/* ============================================================ Person side */

/**
 * Project you're on: the person's own view of one association. Transparency, not permission: there is
 * nothing to accept about being added. It shows only what this person may see: the working title, the
 * house, their own working role, where their credit stands and who can see it. Never other people on the
 * project, other roles, anyone else's credits or the house's notes.
 */
export function AssociationScreen({ id }: { id: string }) {
  const { pop, flagAssociation, showToast, push, viewer, acting, setActing, acceptCredit, creditBusy, justAccepted, openSheet, declineRevision } = useStore();
  const district = useFeatures().home === 'district';
  const a = world.associations.find((x) => x.id === id);
  const [confirm, setConfirm] = useState(false);
  const back = (
    <header className="topbar topbar--nav">
      <IconButton label="Back" onClick={pop}>
        <ChevronLeft size={26} />
      </IconButton>
    </header>
  );
  // Only the person it is about opens this view. The house manages the same record in its workspace.
  if (!a || a.personId !== viewer.id)
    return (
      <div className={`screen${district ? ' dhouse-page dhouse-association' : ''}`}>
        {back}
        <EmptyState icon={<Lock />} title="This isn't available" body="It's private to the person and the production." />
      </div>
    );
  const p = project(a.projectId)!;
  const owner = p.houseId ? org(p.houseId) : person(p.ownerId!);
  const cs = creditState(id);
  const current = cs.current;
  const pending = cs.pending && cs.pending.status !== 'prepared' ? cs.pending : undefined;
  const revision = pending?.supersedes ? pending : undefined;
  const amendment = cs.amendment;
  const asked = amendment?.status === 'open' ? amendment : undefined;
  const kept = amendment?.status === 'kept' && !pending ? amendment : undefined;
  const isPublic = !!current && p.shared;
  const creditValue = current ? (revision ? 'Accepted · revision waiting' : asked ? 'Accepted · amendment asked' : 'Accepted') : !pending ? 'Not issued' : pending.status === 'proposed' ? 'Waiting for you' : 'Correction sent';
  const canAmend = !!current && !asked && !revision;
  return (
    <div className={`screen${district ? ' dhouse-page dhouse-association' : ''}`}>
      {back}
      <div className="title-block">
        <p className="kicker">
          {isPublic ? <Globe2 size={12} /> : <Lock size={12} />} {isPublic ? 'Your credit is public' : `Private to you and ${owner.name}`}
        </p>
        <h1 className="large-title" lang={scriptLang(p.workingTitle)}>{p.workingTitle}</h1>
        <p className="meta">
          {p.format} · {p.languages.join(', ')} · {p.stage}
        </p>
      </div>
      <PressCard className="assoc-card" onPress={() => push(p.houseId ? { name: 'org', id: p.houseId } : { name: 'profile', id: p.ownerId! })} scale={0.99}>
        <Avatar party={owner} size={40} />
        <span>
          <span className="meta">{a.status === 'removed' ? `${owner.name} had added you as` : `${owner.name} added you as`}</span>
          <span className="item-title">{a.workingRole}</span>
        </span>
      </PressCard>

      <section className="section assoc-section">
        <SectionHeader title="Where this stands" />
        <div className="group">
          <Row label="On the project" value={a.status === 'removed' ? 'Removed' : a.status === 'flagged' ? "You said it isn't right" : 'Added'} chevron={false} />
          <Row label="Credit" value={current && justAccepted === current.id ? <span className="credit-sealed">{creditValue} <CreditSeal size={22} /></span> : creditValue} chevron={false} />
          <Row label="Public" value={isPublic ? publicName(p) : 'No'} onPress={isPublic ? () => push({ name: 'work', id: p.id }) : undefined} />
        </div>
        <p className="meta settings-note">Being added isn't a credit. A credit is issued by {owner.name}, and shows publicly only once you accept it and the project is shared.</p>
      </section>

      {pending?.status === 'proposed' && (
        <section className="section assoc-section">
          <SectionHeader title={revision ? 'Revised credit' : 'Waiting for you'} />
          <div className="assoc-credit">
            <p className="meta">
              {owner.name} {p.houseId && <Verified size={12} />} {revision ? 'proposes' : 'credited you as'}
            </p>
            <p className="item-title">{pending.line}</p>
            {revision && <p className="meta">Replaces "{current?.line}". Your current credit stays public until you accept.</p>}
            {acting !== 'self' ? (
              <button className="link link--small" onClick={() => setActing('self', true, true)}>
                Switch to you to respond
              </button>
            ) : (
              <div className="pending-credit-actions">
                <Button size="s" loading={creditBusy === pending.id} onClick={() => acceptCredit(pending.id)}>
                  {revision ? 'Accept revision' : 'Accept'}
                </Button>
                {revision ? (
                  <Button size="s" variant="secondary" onClick={() => (declineRevision(pending.id), showToast({ text: `Kept "${current?.line}"` }))}>
                    Keep current
                  </Button>
                ) : (
                  <Button size="s" variant="secondary" onClick={() => openSheet({ name: 'reportCredit', title: p.workingTitle, creditId: pending.id })}>
                    Something wrong?
                  </Button>
                )}
              </div>
            )}
          </div>
        </section>
      )}
      {pending?.status === 'correction' && <p className="inline-note ws-pad">You asked: {pending.note ?? 'a correction'}. {owner.name} will send a corrected credit for you to accept.</p>}
      {current && !p.shared && <p className="inline-note ws-pad">Credit accepted. It becomes public when {owner.name} shares the project.</p>}
      {asked && <p className="inline-note ws-pad">You asked to amend "{current?.line}": {asked.reason}. It stays {p.shared ? 'public' : 'your credit'} as it is while {owner.name} reviews it.</p>}
      {kept && (
        <p className="inline-note ws-pad">
          {owner.name} kept the credit as it is, so "{current?.line}" stays your current record. If this is fraud or someone misusing your identity,{' '}
          <button className="link" onClick={() => openSheet({ name: 'report', subject: `Credit on ${publicName(p)}`, partyId: p.houseId })}>
            report it to Art and Artist
          </button>
          .
        </p>
      )}
      {(isPublic || canAmend) && (
        <div className="ws-pad assoc-actions stack">
          {isPublic && (
            <Button block variant="secondary" onClick={() => push({ name: 'work', id: p.id })}>
              View public project
            </Button>
          )}
          {canAmend && acting === 'self' && (
            <button className="link link--small" onClick={() => openSheet({ name: 'reportCredit', title: publicName(p), creditId: current!.id })}>
              Something wrong with this credit?
            </button>
          )}
        </div>
      )}
      {cs.history.length > 0 && (
        <section className="section assoc-section">
          <SectionHeader title="Earlier versions" />
          <div className="group">
            {cs.history.map((h) => (
              <Row key={h.id} label={h.line} value="Replaced" chevron={false} />
            ))}
          </div>
          <p className="meta settings-note">Kept in the credit's history. Only the current version is public.</p>
        </section>
      )}

      {a.status === 'removed' && <p className="inline-note ws-pad">{owner.name} removed this association. Nothing about it was public.</p>}
      {a.status === 'flagged' && <p className="inline-note ws-pad">You told {owner.name} this isn't right. They can correct or remove it.</p>}
      {/* Once a credit exists, "Something wrong?" on the credit is the one way to correct it. */}
      {a.status === 'added' && !pending && !current && !confirm && (
        <div className="ws-pad assoc-actions">
          <Button variant="secondary" block onClick={() => setConfirm(true)}>
            This isn't right
          </Button>
        </div>
      )}
      {confirm && a.status === 'added' && (
        <div className="ws-pad stack">
          <p className="meta">{owner.name} will be told you say this is wrong, so they can correct or remove it. Nothing else happens.</p>
          <Button
            block
            onClick={() => {
              flagAssociation(id);
              setConfirm(false);
              showToast({ text: `Told ${owner.name}` });
            }}
          >
            Tell {owner.name}
          </Button>
        </div>
      )}
    </div>
  );
}

/** What an open role on an unannounced project reveals, and what it doesn't. */
function RoleDisclosure({ projectId }: { projectId: string }) {
  const p = project(projectId)!;
  const district = useFeatures().home === 'district' && !!p.houseId;
  const owner = p.houseId ? org(p.houseId).name : person(p.ownerId!).name;
  if (district) return <div className="disclosure dhouse-role-disclosure">
    <p className="meta"><Globe2 size={12} /> Public as <b>{publicName(p)}</b> · {owner}</p>
    <p className="meta"><Lock size={12} /> Keep the working title out of the role description.</p>
    <details className="dhouse-privacy"><summary>What people can see</summary><p className="meta">The production, format, languages, stage and this role’s details are public. The working title, artwork, people added, other roles and credits stay private.</p></details>
  </div>;
  return (
    <div className="disclosure">
      <p className="meta">
        <Globe2 size={12} /> People on Art and Artist will see: <b>{publicName(p)}</b> by {owner}, {p.format.toLowerCase()}, {p.languages.join(', ')}, {p.stage.toLowerCase()}, and this role's details.
      </p>
      <p className="meta">
        <Lock size={12} /> They won't see: the working title, artwork, people on the project, other roles or any credits. Keep the title out of the description.
      </p>
    </div>
  );
}
