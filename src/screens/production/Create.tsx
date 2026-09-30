import { ChevronLeft, Globe2, Lock, Plus } from 'lucide-react';
import { useState } from 'react';
import * as seed from '../../data/seed';
import type { Media } from '../../data/types';
import { useStore } from '../../state/store';
import { org, person } from '../../state/selectors';
import { DEPTS, FORMATS, LANGUAGES, STAGES, project, publicName, world, type Association, type Format } from '../../state/world';
import { Avatar, Button, EmptyState, IconButton, Photo, PressCard, Pressable, Row, SectionHeader, Verified } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';

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
            <button key={f} className={`chip ${format === f ? 'is-on' : ''}`} onClick={() => setFormat(f)}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className="field-label">Language</span>
        <div className="chips">
          {LANGUAGES.map((l) => (
            <button key={l} className={`chip ${langs.includes(l) ? 'is-on' : ''}`} onClick={() => setLangs((x) => (x.includes(l) ? x.filter((y) => y !== l) : [...x, l]))}>
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

const CREDIT_LABEL = { prepared: 'Credit prepared', proposed: 'Credit proposed', accepted: 'Credited', correction: 'Correction asked' } as const;

export function HouseProjectScreen({ id }: { id: string }) {
  const { pop, push, acting, viewer, interestsReceived, roleStatus, setRoleVisibility, showToast, canIssue, proposePrepared } = useStore();
  const p = project(id);
  const [sheet, setSheet] = useState<null | 'share' | 'details' | 'role' | 'person' | { issue: string } | { edit: string }>(null);
  if (!p) return <EmptyState title="Project not found" />;
  const owner = p.houseId ? org(p.houseId).name : person(p.ownerId!).name;
  const canAct = p.houseId ? acting === p.houseId : acting === 'self' && viewer.id === p.ownerId;
  const roles = world.roles.filter((r) => r.projectId === id);
  const people = world.associations.filter((a) => a.projectId === id && a.status !== 'removed');
  const creditFor = (a: Association) => [...world.credits].reverse().find((c) => c.associationId === a.id);

  return (
    <div className="screen">
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
      <div className="title-block">
        <p className="kicker">
          {p.format} · {p.languages.join(', ')} · {p.stage}
        </p>
        <h1 className="large-title">{p.workingTitle}</h1>
        <p className="meta ws-visibility">
          {p.shared ? <Globe2 size={13} /> : <Lock size={13} />} {p.shared ? `Shared on Ana as "${publicName(p)}"` : `Only ${owner} can see this project`}
        </p>
      </div>

      {!canAct && <p className="inline-note ws-pad">You're viewing as yourself. Switch to {owner} to make changes.</p>}

      {!p.shared && (
        <div className="ws-announce">
          <p className="item-title">Not announced</p>
          <p className="meta">Add details and roles privately. Share when you're ready, and you'll see exactly what becomes public.</p>
          <Button disabled={!canAct} onClick={() => setSheet('share')}>
            Share on Ana
          </Button>
        </div>
      )}

      <section className="section">
        <SectionHeader title="Details" />
        <div className="group">
          <Row label="Public title" value={p.publicTitle ?? 'Not set'} onPress={canAct ? () => setSheet('details') : undefined} />
          <Row label="Logline" value={p.logline ? 'Added' : 'Not set'} onPress={canAct ? () => setSheet('details') : undefined} />
          <Row label="Artwork" value={p.artwork ? 'Added' : 'Not set'} onPress={canAct ? () => setSheet('details') : undefined} />
          <Row label="Stage" value={p.stage} onPress={canAct ? () => setSheet('details') : undefined} />
        </div>
        <p className="meta settings-note">{p.shared ? 'Changes to these show on the public page.' : 'Private until you share.'}</p>
      </section>

      <section className="section">
        <SectionHeader title="Roles" />
        <div className="list list--flush">
          {roles.map((r) => {
            const st = roleStatus[r.id];
            const ints = interestsReceived.filter((i) => i.opportunityId === r.id && !i.withdrawn).length;
            const label = st ? (st.state === 'filled' ? 'Filled' : 'Closed') : r.visibility === 'private' ? `Only ${owner}` : `Open on Ana${ints ? ` · ${ints} interested` : ''}`;
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
                    disabled={!canAct}
                    onClick={() => {
                      setRoleVisibility(r.id, 'open');
                      showToast({ text: `${r.role} is open on Ana${p.shared ? '' : ` as part of "${publicName(p)}"`}` });
                    }}
                  >
                    Open on Ana
                  </Button>
                ) : (
                  <Button size="s" variant="secondary" onClick={() => push({ name: 'opportunity', id: r.id })}>
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

      <section className="section">
        <SectionHeader title="On this project" />
        <p className="meta ph-note">Private to {owner} and each person. Being added isn't a credit. Issue a credit when it's earned.</p>
        <div className="list list--flush">
          {people.map((a) => {
            const c = creditFor(a);
            const who = a.personId ? person(a.personId) : null;
            return (
              <PressCard key={a.id} className="prow" onPress={() => canAct && setSheet({ edit: a.id })} scale={0.99}>
                {who ? <Avatar party={who} size={40} /> : <span className="ph-initial">{a.pending!.name[0]}</span>}
                <div className="prow-text">
                  <p className="item-title">{who?.name ?? a.pending!.name}</p>
                  <p className="meta">{c && c.status !== 'prepared' ? c.line : a.workingRole}</p>
                  {a.status === 'flagged' && <p className="meta accent">Says this isn't right</p>}
                  {c?.status === 'correction' && c.note && <p className="meta accent">Asked: {c.note}</p>}
                </div>
                <span className={`ph-state ${c?.status === 'accepted' ? 'ph-state--confirmed' : c ? 'ph-state--invited' : 'ph-state--added'}`}>
                  {c ? CREDIT_LABEL[c.status] : a.pending ? 'Not on Ana' : 'Added'}
                </span>
              </PressCard>
            );
          })}
          {!people.length && <p className="meta">No one added yet.</p>}
        </div>
        <Button block variant="outline" disabled={!canAct} onClick={() => setSheet('person')}>
          <Plus size={16} /> Add person
        </Button>
        {canIssue &&
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

      <Sheet open={sheet === 'share'} onClose={() => setSheet(null)} title="Share on Ana" size="tall">
        {sheet === 'share' && <ShareProject id={id} done={() => setSheet(null)} />}
      </Sheet>
      <Sheet open={sheet === 'details'} onClose={() => setSheet(null)} title="Details" size="tall">
        {sheet === 'details' && <ProjectDetails id={id} done={() => setSheet(null)} />}
      </Sheet>
      <Sheet open={sheet === 'role'} onClose={() => setSheet(null)} title="Add role" size="tall">
        {sheet === 'role' && <AddRole projectId={id} done={() => setSheet(null)} />}
      </Sheet>
      <Sheet open={sheet === 'person'} onClose={() => setSheet(null)} title="Add person" size="tall">
        {sheet === 'person' && <AddPerson projectId={id} done={() => setSheet(null)} />}
      </Sheet>
      <Sheet open={!!sheet && typeof sheet === 'object' && 'edit' in sheet} onClose={() => setSheet(null)} title="">
        {sheet && typeof sheet === 'object' && 'edit' in sheet && <PersonActions id={sheet.edit} issue={() => setSheet({ issue: sheet.edit })} done={() => setSheet(null)} />}
      </Sheet>
      <Sheet open={!!sheet && typeof sheet === 'object' && 'issue' in sheet} onClose={() => setSheet(null)} title="Issue credit" size="tall">
        {sheet && typeof sheet === 'object' && 'issue' in sheet && <IssueCredit associationId={sheet.issue} done={() => setSheet(null)} />}
      </Sheet>
    </div>
  );
}

/* ------------------------------------------------------------ Share on Ana */

/** Publishing is deliberate: show exactly what becomes public and what stays private. */
function ShareProject({ id, done }: { id: string; done: () => void }) {
  const { updateProject, showToast, roleStatus } = useStore();
  const p = project(id)!;
  const [title, setTitle] = useState(p.publicTitle ?? '');
  const shownTitle = title.trim() || `Untitled ${p.languages[0]} ${p.format.toLowerCase()}`;
  const open = world.roles.filter((r) => r.projectId === id && r.visibility === 'open' && !roleStatus[r.id]).length;
  const priv = world.roles.filter((r) => r.projectId === id && r.visibility === 'private' && !roleStatus[r.id]).length;
  const added = world.associations.filter((a) => a.projectId === id && a.status !== 'removed').length;
  const accepted = world.credits.filter((c) => c.projectId === id && c.status === 'accepted').length;
  const notAccepted = world.credits.filter((c) => c.projectId === id && c.status !== 'accepted').length;
  return (
    <div className="stack">
      <div>
        <label className="field-label" htmlFor="sp-title">Public title</label>
        <input id="sp-title" className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`Untitled ${p.languages[0]} ${p.format.toLowerCase()}`} />
        <p className="meta field-hint">Leave empty to announce without a title.</p>
      </div>
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
      <Button
        block
        size="l"
        onClick={() => {
          updateProject(id, { shared: true, publicTitle: title.trim() || undefined });
          done();
          showToast({ text: `Shared on Ana as "${shownTitle}"`, tone: 'success' });
        }}
      >
        Share on Ana
      </Button>
    </div>
  );
}

function ProjectDetails({ id, done }: { id: string; done: () => void }) {
  const { updateProject } = useStore();
  const p = project(id)!;
  const [title, setTitle] = useState(p.publicTitle ?? '');
  const [logline, setLogline] = useState(p.logline ?? '');
  const [stage, setStage] = useState(p.stage);
  const [art, setArt] = useState<Media | undefined>(p.artwork);
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
            <button key={s} className={`chip ${stage === s ? 'is-on' : ''}`} onClick={() => setStage(s)}>
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
      <Button
        block
        size="l"
        onClick={() => {
          updateProject(id, { publicTitle: title.trim() || undefined, logline: logline.trim() || undefined, stage, artwork: art });
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
  const [role, setRole] = useState('');
  const [about, setAbout] = useState('');
  const [dates, setDates] = useState('');
  const [city, setCity] = useState('');
  const [paid, setPaid] = useState(true);
  const [range, setRange] = useState('');
  const [qs, setQs] = useState<string[]>([]);
  const [vis, setVis] = useState<'private' | 'open'>('open');
  return (
    <div className="stack">
      <div>
        <label className="field-label" htmlFor="ar-role">Role</label>
        <input id="ar-role" className="field" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Colourist" />
        <div className="chips chips--tight">
          {QUICK_ROLES.map((r) => (
            <button key={r} className={`chip ${role === r ? 'is-on' : ''}`} onClick={() => setRole(r)}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="ar-about">What it involves</label>
        <textarea id="ar-about" className="field field--area" rows={3} maxLength={400} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="A few lines are enough" />
      </div>
      <div className="field-row">
        <div>
          <label className="field-label" htmlFor="ar-when">When</label>
          <input id="ar-when" className="field" value={dates} onChange={(e) => setDates(e.target.value)} placeholder="e.g. Nov, 30 days" />
        </div>
        <div>
          <label className="field-label" htmlFor="ar-where">Where</label>
          <input id="ar-where" className="field" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
        </div>
      </div>
      <div>
        <span className="field-label">Pay</span>
        <div className="chips">
          <button className={`chip ${paid ? 'is-on' : ''}`} onClick={() => setPaid(true)}>
            Paid
          </button>
          <button className={`chip ${!paid ? 'is-on' : ''}`} onClick={() => setPaid(false)}>
            Unpaid
          </button>
        </div>
        {paid && <input className="field" value={range} onChange={(e) => setRange(e.target.value)} placeholder="Range (optional), e.g. ₹15k–20k / day" />}
      </div>
      <div>
        <span className="field-label">Questions (optional, up to 3)</span>
        {qs.map((q, i) => (
          <input key={i} className="field field--stack" value={q} onChange={(e) => setQs((x) => x.map((y, j) => (j === i ? e.target.value : y)))} placeholder={`Question ${i + 1}`} />
        ))}
        {qs.length < 3 && (
          <button className="link" onClick={() => setQs((x) => [...x, ''])}>
            Add a question
          </button>
        )}
        <p className="meta field-hint">Answers are optional for people showing interest.</p>
      </div>
      <div>
        <span className="field-label">Who can see it</span>
        <div className="chips">
          <button className={`chip ${vis === 'private' ? 'is-on' : ''}`} onClick={() => setVis('private')}>
            <Lock size={13} /> Only {p.houseId ? org(p.houseId).name : 'you'}
          </button>
          <button className={`chip ${vis === 'open' ? 'is-on' : ''}`} onClick={() => setVis('open')}>
            <Globe2 size={13} /> Open on Ana
          </button>
        </div>
        {vis === 'open' && !p.shared && <p className="meta field-hint">The project isn't shared, so the role shows as part of "{publicName(p)}".</p>}
      </div>
      <Button
        block
        size="l"
        disabled={!role.trim()}
        onClick={() => {
          addRole(projectId, { role: role.trim(), about: about.trim(), dates: dates.trim(), city: city.trim(), paid, compensation: range.trim(), questions: qs, visibility: vis });
          done();
          showToast({ text: vis === 'open' ? `${role} is open on Ana` : `${role} added. Only your house can see it.` });
        }}
      >
        Add role
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------ Add person */

/** Adding is private and tells the person. It is never a credit; "Add and issue credit" creates both records. */
export function AddPerson({ projectId, done, preset }: { projectId: string; done: () => void; preset?: { personId: string; role: string; fromRoleId: string } }) {
  const { addToProject, issueCredit, showToast, canIssue } = useStore();
  const p = project(projectId)!;
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<string | null>(preset?.personId ?? null);
  const [pending, setPending] = useState<{ name: string; phone: string } | null>(null);
  const [roleText, setRoleText] = useState(preset?.role ?? '');
  const [dept, setDept] = useState('');
  const [step, setStep] = useState<'find' | 'role' | 'credit'>(preset ? 'role' : 'find');
  const [line, setLine] = useState('');
  const already = world.associations.filter((a) => a.projectId === projectId && a.status !== 'removed').map((a) => a.personId);
  const results = seed.people.filter((x) => x.visibility === 'public' && !already.includes(x.id) && (!q || `${x.name} ${x.role}`.toLowerCase().includes(q.toLowerCase()))).slice(0, 6);
  const name = picked ? person(picked).name : pending?.name ?? '';
  const house = !!p.houseId;

  if (step === 'find')
    return (
      <div className="stack">
        {!pending ? (
          <>
            <input className="field" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people on Ana" />
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
              Not on Ana? Add them privately
            </button>
          </>
        ) : (
          <>
            <p className="meta">This stays inside your project. It doesn't create an Ana profile, can't be found in search and can't be credited until they join.</p>
            <input className="field" value={pending.name} onChange={(e) => setPending({ ...pending, name: e.target.value })} placeholder="Name" />
            <input className="field" value={pending.phone} onChange={(e) => setPending({ ...pending, phone: e.target.value })} placeholder="Phone (to invite them to Ana)" inputMode="tel" />
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
            <span className="meta">{picked ? person(picked).role : 'Not on Ana'}</span>
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
              <button key={d} className={`chip ${dept === d ? 'is-on' : ''}`} onClick={() => setDept(d)}>
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
        {house && picked && (
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

function CreditForm({ personId, projectId, line, setLine, dept, setDept, cta, submit }: { personId: string; projectId: string; line: string; setLine: (s: string) => void; dept: string; setDept: (s: string) => void; cta: string; submit: () => void }) {
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
            <button key={d} className={`chip ${dept === d ? 'is-on' : ''}`} onClick={() => setDept(d)}>
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
      <p className="meta">{canIssue ? `${who.name.split(' ')[0]} is asked to accept it. It becomes public only once they accept and the project is shared.` : "You can prepare this credit. Someone with credit authority in the house has to issue it."}</p>
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

function PersonActions({ id, issue, done }: { id: string; issue: () => void; done: () => void }) {
  const { editAssociation, showToast } = useStore();
  const a = world.associations.find((x) => x.id === id)!;
  const p = project(a.projectId)!;
  const c = [...world.credits].reverse().find((x) => x.associationId === id);
  const [roleText, setRoleText] = useState(a.workingRole);
  const name = a.personId ? person(a.personId).name : a.pending!.name;
  const canCredit = !!a.personId && !!p.houseId && (!c || c.status === 'correction');
  return (
    <div className="stack">
      <p className="title-2">{name}</p>
      {a.status === 'flagged' && <p className="inline-note">{name.split(' ')[0]} says this association isn't right. Correct the working role or remove them.</p>}
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
        {canCredit && <Row label={c?.status === 'correction' ? 'Issue corrected credit' : 'Issue credit'} onPress={issue} />}
        {!p.houseId && <Row label={<span className="meta">Credits for independent projects aren't available yet</span>} chevron={false} />}
        {a.pending && <Row label={<span className="meta">Can be credited once they join Ana</span>} chevron={false} />}
        <Row
          label={<span className="danger-text">Remove from project</span>}
          chevron={false}
          onPress={() => {
            editAssociation(id, { status: 'removed' });
            done();
            showToast({ text: `${name} removed from the project` });
          }}
        />
      </div>
    </div>
  );
}

/* ============================================================ Person side */

/** What the person sees after being added: transparency, not permission. Nothing to accept. */
export function AssociationScreen({ id }: { id: string }) {
  const { pop, flagAssociation, showToast, push } = useStore();
  const a = world.associations.find((x) => x.id === id);
  const [confirm, setConfirm] = useState(false);
  if (!a) return <EmptyState title="Not found" />;
  const p = project(a.projectId)!;
  const owner = p.houseId ? org(p.houseId) : person(p.ownerId!);
  const credit = [...world.credits].reverse().find((c) => c.associationId === id);
  return (
    <div className="screen">
      <header className="topbar topbar--nav">
        <IconButton label="Back" onClick={pop}>
          <ChevronLeft size={26} />
        </IconButton>
      </header>
      <div className="title-block">
        <p className="kicker">
          <Lock size={12} /> Private to you and {owner.name}
        </p>
        <h1 className="large-title">{p.workingTitle}</h1>
        <p className="meta">
          {p.format} · {p.languages.join(', ')}
        </p>
      </div>
      <div className="assoc-card">
        <Avatar party={owner} size={40} />
        <span>
          <span className="meta">{owner.name} added you as</span>
          <span className="item-title">{a.workingRole}</span>
        </span>
      </div>
      <p className="body ws-pad">This means {owner.name} currently associates you with this project. It isn't a credit, and nothing about it is public.</p>
      {credit && credit.status === 'proposed' && (
        <p className="inline-note ws-pad">
          A credit is waiting for you.{' '}
          <button className="link" onClick={() => push({ name: 'profile', id: credit.personId })}>
            Review it
          </button>
        </p>
      )}
      {a.status === 'removed' && <p className="inline-note ws-pad">{owner.name} removed this association.</p>}
      {a.status === 'flagged' && <p className="inline-note ws-pad">You told {owner.name} this isn't right. They can correct or remove it.</p>}
      {a.status === 'added' && !confirm && (
        <div className="ws-pad">
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
