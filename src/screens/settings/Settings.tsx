import { Bell, Building2, Check, ChevronLeft, CircleHelp, Info, Monitor, Moon, Palette, Shield, Sun, UserRound } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useStore } from '../../state/store';
import { org, party, person } from '../../state/selectors';
import { usePref } from '../../state/settingsPrefs';
import { ACCOUNTS, type Provider } from '../../domain/accounts';
import { originOf, setAppearance, useAppearance, type Appearance } from '../../ui/theme';
import { rovingKeys } from '../../ui/a11y';
import { useFeatures } from '../../ui/features';
import { ANA_PROTOTYPE_VERSION } from '../../version';
import { Avatar, Button, IconButton, Row, Toggle, Verified } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';

/*
 * Settings follow the identity you're acting as, and never mix.
 *  Personal: a short index of groups; each group is its own page (docs/SETTINGS.md).
 *  House:    the page, who can act for it, credit permission, the house's notifications, verification.
 * A house has no "team" product: members are a permission list that lives here.
 * Appearance is a setting of this device, so both reach the same Appearance page.
 */

export type SettingsPage = 'account' | 'houses' | 'appearance' | 'notifications' | 'privacy' | 'help' | 'about';

const TITLES: Record<SettingsPage, string> = {
  account: 'Account',
  houses: 'Houses you act for',
  appearance: 'Appearance',
  notifications: 'Notifications',
  privacy: 'Privacy and safety',
  help: 'Help and support',
  about: 'About Art and Artist',
};

const APPEARANCE: { id: Appearance; label: string; sub: string }[] = [
  { id: 'system', label: 'System', sub: "Follows your phone's appearance setting." },
  { id: 'light', label: 'Light', sub: 'Always light, whatever your phone is set to.' },
  { id: 'dark', label: 'Dark', sub: 'Always dark, whatever your phone is set to.' },
];

function Group({ title, note, children }: { title?: string; note?: ReactNode; children: ReactNode }) {
  return (
    <section className="settings-group">
      {title && <h2 className="settings-h">{title}</h2>}
      <div className="group">{children}</div>
      {note && <p className="meta settings-note">{note}</p>}
    </section>
  );
}

function Switch({ id, label, sub, initial }: { id: string; label: string; sub?: string; initial: boolean }) {
  const [on, setOn] = usePref(id, initial);
  return (
    <Row
      label={
        <span className="settings-label">
          <span>{label}</span>
          {sub && <span className="meta">{sub}</span>}
        </span>
      }
    >
      <Toggle on={on} onChange={setOn} label={label} />
    </Row>
  );
}

/** Appearance belongs to this device, from either identity's settings. */
function AppearanceRow() {
  const appearance = useAppearance();
  return <NavRow icon={<Palette size={19} />} label="Appearance" value={APPEARANCE.find((a) => a.id === appearance)!.label} page="appearance" />;
}

function NavRow({ icon, label, value, page }: { icon: ReactNode; label: string; value?: string; page: SettingsPage }) {
  const { push } = useStore();
  return <Row icon={<span className="settings-icon">{icon}</span>} label={label} value={value} onPress={() => push({ name: 'settings', page })} />;
}

export function SettingsScreen({ page }: { page?: SettingsPage }) {
  const { pop, acting } = useStore();
  const district = useFeatures().home === 'district' && acting !== 'self';
  const house = acting !== 'self';
  const title = page ? TITLES[page] : house ? 'House settings' : 'Settings';
  return (
    <div className={`screen${district ? ' dhouse-page' : ''}`}>
      <header className="topbar topbar--nav">
        <IconButton label="Back" onClick={pop}>
          <ChevronLeft size={26} />
        </IconButton>
      </header>
      <div className="title-block">
        <h1 className="large-title">{title}</h1>
        {!page && house && <p className="meta">For {org(acting).name}. Your personal settings are on your own profile.</p>}
      </div>
      {page === 'appearance' ? <AppearancePage /> : page && !house ? <PersonalPage page={page} /> : house ? <House id={acting} /> : <Personal />}
    </div>
  );
}

/** The index: groups of pages, then Sign out. Nothing is changed here, everything is one tap away. */
function Personal() {
  const { memberships, startEntry } = useStore();
  const [signOut, setSignOut] = useState(false);
  return (
    <div className="settings settings--index">
      <Group title="Account">
        <NavRow icon={<UserRound size={19} />} label="Account" page="account" />
        {memberships.length > 0 && <NavRow icon={<Building2 size={19} />} label="Houses you act for" value={String(memberships.length)} page="houses" />}
      </Group>

      <Group title="Preferences">
        <AppearanceRow />
        <NavRow icon={<Bell size={19} />} label="Notifications" page="notifications" />
      </Group>

      <Group title="Privacy and safety">
        <NavRow icon={<Shield size={19} />} label="Privacy and safety" page="privacy" />
      </Group>

      <Group title="Support">
        <NavRow icon={<CircleHelp size={19} />} label="Help and support" page="help" />
        <NavRow icon={<Info size={19} />} label="About Art and Artist" page="about" />
      </Group>

      <section className="settings-group settings-group--end">
        <div className="group">
          <Row label="Sign out" chevron={false} onPress={() => setSignOut(true)} />
        </div>
      </section>

      <Sheet open={signOut} onClose={() => setSignOut(false)} title="Sign out?" close={false}>
        <div className="stack">
          <p className="meta">You'll need to sign in again on this phone.</p>
          <Button block size="l" onClick={() => startEntry('signin', "You've signed out.")}>
            Sign out
          </Button>
          <Button block size="l" variant="secondary" onClick={() => setSignOut(false)}>
            Cancel
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function PersonalPage({ page }: { page: SettingsPage }) {
  const { blocked, unblock, memberships, setActing, push } = useStore();
  const [who, setWho] = usePref<string>('who-can-message', 'everyone');
  const [sheet, setSheet] = useState<'message' | 'blocked' | 'problem' | null>(null);
  const { showToast } = useStore();
  const copySupport = () => {
    const done = () => showToast({ text: 'Support email copied' });
    try {
      navigator.clipboard.writeText('support@artandartist.film').then(done, done);
    } catch {
      done();
    }
  };
  const whoLabel: Record<string, string> = { everyone: 'Everyone', known: 'People I know' };

  if (page === 'account') return <AccountPage />;

  if (page === 'houses')
    return (
      <div className="settings">
        {/* Individuals don't set up production houses from the app; houses join through Art and Artist (invites, verification).
            Tapping a house opens its settings as the house (the identity switcher is on your profile). */}
        <Group note="A house's owner decides who can act for it.">
          {memberships.map((m) => (
            <Row key={m} icon={<Avatar party={org(m)} size={32} />} label={org(m).name} value={org(m).verified ? 'Member' : 'Verification pending'} onPress={() => setActing(m)} />
          ))}
        </Group>
      </div>
    );

  if (page === 'notifications')
    return (
      <div className="settings">
        <Group note={memberships.length ? 'Each house you act for has its own notification settings.' : undefined}>
          <Switch id="n-credits" label="Credits" sub="A production credits you, or answers a correction" initial />
          <Switch id="n-messages" label="Messages" initial />
          <Switch id="n-interest" label="Interest in your collaborations" initial />
          <Switch id="n-roles" label="Roles that match you" initial={false} />
        </Group>
      </div>
    );

  if (page === 'privacy')
    return (
      <div className="settings">
        <Group title="Visibility" note="Credits you've accepted are always public on their project.">
          <Switch id="p-search" label="Show me in search" sub="People and productions can find your profile" initial />
          <Switch id="p-available" label="Show when I'm available" sub="On your profile and in role matching" initial />
        </Group>
        <Group title="Messages">
          <Row label="Who can message me" value={whoLabel[who]} onPress={() => setSheet('message')} />
        </Group>
        <Group title="Safety">
          <Row label="Blocked accounts" value={blocked.length ? String(blocked.length) : 'None'} chevron={blocked.length > 0} onPress={blocked.length ? () => setSheet('blocked') : undefined} />
          <Row label="How blocking works" onPress={() => push({ name: 'legal', doc: 'blocking' })} />
          <Row label="How reporting works" onPress={() => push({ name: 'legal', doc: 'reporting' })} />
        </Group>

        <Sheet open={sheet === 'message'} onClose={() => setSheet(null)} title="Who can message me">
          <div className="picker" role="radiogroup" aria-label="Who can message me">
            {(['everyone', 'known'] as const).map((k) => (
              <button
                key={k}
                role="radio"
                aria-checked={who === k}
                className={`picker-row ${who === k ? 'is-on' : ''}`}
                onClick={() => {
                  setWho(k);
                  setSheet(null);
                }}
              >
                <span>{whoLabel[k]}</span>
                {who === k && <Check size={18} strokeWidth={2.4} aria-hidden />}
              </button>
            ))}
          </div>
        </Sheet>

        <Sheet open={sheet === 'blocked'} onClose={() => setSheet(null)} title="Blocked accounts">
          <div className="group settings-blocked">
            {blocked.map((id) => {
              const p = party(id)!;
              return (
                <Row key={id} icon={<Avatar party={p} size={32} />} label={p.name}>
                  <Button size="s" variant="secondary" onClick={() => unblock(id)}>
                    Unblock
                  </Button>
                </Row>
              );
            })}
            {!blocked.length && <p className="meta">No one blocked.</p>}
          </div>
        </Sheet>
      </div>
    );

  if (page === 'help')
    return (
      <div className="settings">
        <Group>
          <Row label="Contact support" value="support@artandartist.film" chevron={false} onPress={copySupport} />
          <Row label="Report a problem" onPress={() => setSheet('problem')} />
          <Row label="Community guidelines" onPress={() => push({ name: 'legal', doc: 'conduct' })} />
        </Group>
        <ProblemSheet open={sheet === 'problem'} onClose={() => setSheet(null)} />
      </div>
    );

  // about
  return (
    <div className="settings">
      <Group>
        <Row label="Terms of Service" onPress={() => push({ name: 'legal', doc: 'terms' })} />
        <Row label="Privacy Policy" onPress={() => push({ name: 'legal', doc: 'privacy' })} />
        <Row label="Version" value={ANA_PROTOTYPE_VERSION} chevron={false} />
      </Group>
    </div>
  );
}

/** System, Light or Dark. Applies at once, no Save; stored on this device. */
function AppearancePage() {
  const appearance = useAppearance();
  const district = useFeatures().home === 'district';
  const icons = { system: Monitor, light: Sun, dark: Moon };
  const descriptions = { system: 'Follow device appearance', light: 'Always use light mode', dark: 'Always use dark mode' };
  return (
    <div className="settings">
      <section className="settings-group">
        <div className={`group picker settings-radio ${district ? 'appearance-options' : ''}`} role="radiogroup" aria-label="Appearance" onKeyDown={district ? (e) => rovingKeys(e) : undefined}>
          {APPEARANCE.map((a) => {
            const Icon = icons[a.id];
            return (
              <button key={a.id} role="radio" aria-checked={appearance === a.id} tabIndex={district ? appearance === a.id ? 0 : -1 : undefined} className={`picker-row ${appearance === a.id ? 'is-on' : ''}`} onClick={(e) => setAppearance(a.id, originOf(e.currentTarget))}>
                {district && <span className="appearance-icon" aria-hidden><Icon size={22} /></span>}
                <span className="settings-label">
                  <span>{a.label}</span>
                  <span className="meta">{district ? descriptions[a.id] : a.sub}</span>
                </span>
                {district ? <span className={`appearance-check ${appearance === a.id ? 'is-on' : ''}`} aria-hidden>{appearance === a.id && <Check size={14} strokeWidth={2.8} />}</span> : appearance === a.id && <Check size={18} strokeWidth={2.4} aria-hidden />}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* Hypothesis: owner plus members; credit permission is a separate grant. Needs validation with houses. */

/* ---------------------------------------------------------------- Account: every row does something. */

const mask = {
  phone: (v: string) => v.replace(/\D/g, '').replace(/^(?:91)?(\d{2})\d{6}(\d{2})$/, '+91 $1••• •••$2'),
  email: (v: string) => v.replace(/^(.).*?(@.+)$/, '$1•••$2'),
};

/** Change phone or email: enter it, confirm the code sent to it, done. Nothing changes until the code is confirmed. */
function ChangeSheet({ kind, open, onClose, onSaved }: { kind: 'phone' | 'email'; open: boolean; onClose: () => void; onSaved: (v: string) => void }) {
  const [step, setStep] = useState<'enter' | 'code'>('enter');
  const [value, setValue] = useState('');
  const [code, setCode] = useState('');
  const [tried, setTried] = useState(false);
  const valid = kind === 'phone' ? /^\+?[\d\s-]{10,15}$/.test(value.trim()) : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const close = () => (setStep('enter'), setValue(''), setCode(''), setTried(false), onClose());
  const noun = kind === 'phone' ? 'phone number' : 'email address';
  return (
    <Sheet open={open} onClose={close} title={kind === 'phone' ? 'Change phone number' : 'Change email'}>
      {step === 'enter' ? (
        <form className="set-form" noValidate onSubmit={(e) => (e.preventDefault(), setTried(true), valid && setStep('code'))}>
          <label className="field-label" htmlFor={`chg-${kind}`}>New {noun}</label>
          <input id={`chg-${kind}`} className="field" type={kind === 'phone' ? 'tel' : 'email'} inputMode={kind === 'phone' ? 'tel' : 'email'} value={value} onChange={(e) => setValue(e.target.value)} placeholder={kind === 'phone' ? '+91 98765 43210' : 'you@example.com'} aria-invalid={tried && !valid ? true : undefined} />
          {tried && !valid && <p className="meta danger-text" role="alert">Enter a valid {noun}.</p>}
          <p className="meta">{kind === 'phone' ? "We'll text a 6-digit code to the new number. Projects waiting on your old number aren't moved automatically." : "We'll email a 6-digit code to the new address. You'll sign in with it from then on."}</p>
          <Button block type="submit">Send code</Button>
        </form>
      ) : (
        <form className="set-form" noValidate onSubmit={(e) => (e.preventDefault(), code.length === 6 && (onSaved(mask[kind](value.trim())), close()))}>
          <label className="field-label" htmlFor={`chg-${kind}-code`}>Code sent to {value.trim()}</label>
          <input id={`chg-${kind}-code`} className="field code-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="••••••" />
          <p className="meta">Prototype: any 6 digits work.</p>
          <div className="set-actions">
            <Button block type="submit" disabled={code.length !== 6}>Confirm</Button>
            <Button block variant="plain" type="button" onClick={() => setStep('enter')}>Use a different {noun}</Button>
          </div>
        </form>
      )}
    </Sheet>
  );
}

const PROVIDERS: { id: Provider; label: string }[] = [
  { id: 'apple', label: 'Apple' },
  { id: 'google', label: 'Google' },
  { id: 'email', label: 'Email' },
];

function AccountPage() {
  const { viewer, push, showToast } = useStore();
  const me = person(viewer.id);
  const record = ACCOUNTS.find((a) => a.viewerId === viewer.id);
  const [phone, setPhone] = usePref<string>('acct-phone', '+91 98••• ••210');
  const [email, setEmail] = usePref<string>('acct-email', `${me.name.split(' ')[0].toLowerCase()}@••••.in`);
  const [apple, setApple] = usePref<boolean>('signin-apple', !!record?.identities.some((i) => i.provider === 'apple'));
  const [google, setGoogle] = usePref<boolean>('signin-google', !!record?.identities.some((i) => i.provider === 'google'));
  const [mail, setMail] = usePref<boolean>('signin-email', record ? record.identities.some((i) => i.provider === 'email') : true);
  const [twoStep, setTwoStep] = usePref<boolean>('acct-2sv', true);
  const [othersOut, setOthersOut] = usePref<boolean>('acct-devices-out', false);
  const [sheet, setSheet] = useState<'phone' | 'email' | 'twostep' | 'devices' | Provider | null>(null);
  const on: Record<Provider, [boolean, (v: boolean) => void]> = { apple: [apple, setApple], google: [google, setGoogle], email: [mail, setMail] };
  const connected = PROVIDERS.filter((p) => on[p.id][0]).length;
  const prov = sheet === 'apple' || sheet === 'google' || sheet === 'email' ? PROVIDERS.find((p) => p.id === sheet)! : null;

  return (
    <div className="settings">
      <Group title="Account">
        <Row label="Name" value={me.name} onPress={() => push({ name: 'editProfile' })} />
        <Row label="Phone" value={phone} onPress={() => setSheet('phone')} />
        <Row label="Email" value={email} onPress={() => setSheet('email')} />
      </Group>
      <Group title="Ways to sign in" note="Art and Artist never links sign-in methods on its own. Connecting one asks you to sign in with it once.">
        {PROVIDERS.map((p) => (
          <Row key={p.id} label={p.label} value={on[p.id][0] ? 'Connected' : 'Connect'} onPress={() => setSheet(p.id)} />
        ))}
      </Group>
      <Group title="Security">
        <Row label="Two-step verification" value={twoStep ? 'On' : 'Off'} onPress={() => setSheet('twostep')} />
        <Row label="Signed-in devices" value={othersOut ? '1' : '2'} onPress={() => setSheet('devices')} />
      </Group>
      <Group title="Your data">
        <Row label="Agreements and download" onPress={() => push({ name: 'yourData' })} />
      </Group>
      <section className="settings-group settings-group--end">
        <div className="group">
          <Row label={<span className="danger-text">Delete account</span>} chevron={false} onPress={() => push({ name: 'yourData', step: 'delete' })} />
        </div>
      </section>

      <ChangeSheet kind="phone" open={sheet === 'phone'} onClose={() => setSheet(null)} onSaved={(v) => (setPhone(v), showToast({ text: 'Phone number updated' }))} />
      <ChangeSheet kind="email" open={sheet === 'email'} onClose={() => setSheet(null)} onSaved={(v) => (setEmail(v), showToast({ text: 'Email updated' }))} />

      <Sheet open={!!prov} onClose={() => setSheet(null)} title={prov ? (on[prov.id][0] ? prov.label : `Connect ${prov.label}`) : ''}>
        {prov && (
          <div className="set-form">
            {on[prov.id][0] ? (
              <>
                <p className="meta">You can sign in with {prov.label}.</p>
                {connected > 1 ? (
                  <Button block variant="outline" onClick={() => (on[prov.id][1](false), setSheet(null), showToast({ text: `${prov.label} removed` }))}>
                    Remove {prov.label}
                  </Button>
                ) : (
                  <p className="meta">This is your only way to sign in, so it can't be removed. Connect another one first.</p>
                )}
              </>
            ) : (
              <>
                <p className="meta">Sign in with {prov.label} once to connect it to this account. You'll be able to use either from then on.</p>
                <Button block onClick={() => (on[prov.id][1](true), setSheet(null), showToast({ text: `${prov.label} connected` }))}>
                  Continue with {prov.label}
                </Button>
                <p className="meta">Prototype: the provider is simulated.</p>
              </>
            )}
          </div>
        )}
      </Sheet>

      <Sheet open={sheet === 'twostep'} onClose={() => setSheet(null)} title="Two-step verification">
        <div className="set-form">
          <div className="group">
            <Row label="Ask for a code on new devices">
              <Toggle on={twoStep} onChange={(v) => (setTwoStep(v), showToast({ text: v ? 'Two-step verification on' : 'Two-step verification off' }))} label="Two-step verification" />
            </Row>
          </div>
          <p className="meta">When you sign in on a new device, we also send a code to {phone}. Accepting credits and acting for a house always ask for it.</p>
        </div>
      </Sheet>

      <Sheet open={sheet === 'devices'} onClose={() => setSheet(null)} title="Signed-in devices">
        <div className="set-form">
          <div className="group">
            <Row label={<span className="settings-label"><span>iPhone · this device</span><span className="meta">Hyderabad · Active now</span></span>} chevron={false} />
            {!othersOut && (
              <Row label={<span className="settings-label"><span>iPad</span><span className="meta">Hyderabad · 3 days ago</span></span>} chevron={false}>
                <Button size="s" variant="outline" onClick={() => (setOthersOut(true), showToast({ text: 'Signed out of iPad' }))}>Sign out</Button>
              </Row>
            )}
          </div>
          {!othersOut ? (
            <Button block variant="outline" onClick={() => (setOthersOut(true), showToast({ text: 'Signed out of all other devices' }))}>Sign out of all other devices</Button>
          ) : (
            <p className="meta">Only this device is signed in.</p>
          )}
          <p className="meta">Don't recognise a device? Sign it out, then change your password for that sign-in method.</p>
        </div>
      </Sheet>
    </div>
  );
}

/** Report a problem with the app. Goes to support; the reply comes by email. */
function ProblemSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { showToast } = useStore();
  const [text, setText] = useState('');
  return (
    <Sheet open={open} onClose={onClose} title="Report a problem">
      <form className="set-form" noValidate onSubmit={(e) => (e.preventDefault(), text.trim() && (setText(''), onClose(), showToast({ text: "Sent. We'll reply by email within 2 working days." })))}>
        <label className="field-label" htmlFor="problem-text">What went wrong?</label>
        <textarea id="problem-text" className="field" rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="What you were doing, and what happened" />
        <p className="meta">We include your app version ({ANA_PROTOTYPE_VERSION}) and device. To report a person or post, use Report on it instead.</p>
        <Button block type="submit" disabled={!text.trim()}>Send</Button>
      </form>
    </Sheet>
  );
}

const MEMBERS: Record<string, { name: string; role: string; credits: boolean; you?: boolean }[]> = {
  konark: [
    { name: 'Rajeev Menon', role: 'Owner', credits: true },
    { name: 'Aditi Ghosh', role: 'Member', credits: true, you: true },
  ],
  tidewater: [
    { name: 'Susan Mathew', role: 'Owner', credits: true },
    { name: 'Aditi Ghosh', role: 'Member', credits: false, you: true },
  ],
};

function House({ id }: { id: string }) {
  const { push, canIssue, leaveHouse } = useStore();
  const o = org(id);
  const members = (MEMBERS[id] ?? []).map((m) => (m.you ? { ...m, credits: canIssue } : m));
  const owner = members.find((m) => m.role === 'Owner');
  const youOwn = members.some((m) => m.you && m.role === 'Owner');
  const [sheet, setSheet] = useState<'verify' | 'leave' | null>(null);
  return (
    <div className="settings">
      <Group title="Page">
        <Row icon={<Avatar party={o} size={32} />} label={o.name} value="View" onPress={() => push({ name: 'org', id })} />
        <Row
          label="Verification"
          value={o.verified ? <span className="inline-verified">Verified <Verified size={13} /></span> : <span className="set-pending">Pending</span>}
          onPress={() => setSheet('verify')}
        />
      </Group>

      <Group title="Who can act for this house" note={`Members can open roles, review interest and message as the house. ${youOwn ? 'You' : `Only the owner${owner ? `, ${owner.name},` : ''}`} can add or remove people.`}>
        {members.map((m) => (
          <Row
            key={m.name}
            label={
              <span className="settings-label">
                <span>
                  {m.name}
                  {m.you ? ' (you)' : ''}
                </span>
                <span className="meta">{m.role}</span>
              </span>
            }
            chevron={false}
          />
        ))}
      </Group>

      {/* Open question (not shown to houses): who inside the house holds credit authority (owner only, chosen
          members, or a person per project), and how it works with co-productions. The list is a prototype assumption. */}
      <Group title="Credit authority" note="Credits on this house's projects are issued by the house, never by the person credited.">
        <Row label="Can issue credits" value={members.filter((m) => m.credits).map((m) => m.name.split(' ')[0]).join(', ')} chevron={false} />
      </Group>

      <Group title="House notifications" note="These go to everyone who acts for the house.">
        <Switch id={`h-${id}-interest`} label="Interest in our roles" initial />
        <Switch id={`h-${id}-corrections`} label="Credit corrections" sub="Someone asks to correct a credit we issued" initial />
        <Switch id={`h-${id}-messages`} label="Messages to the house" initial />
      </Group>

      {/* A setting of this phone, not of the house: the same page as from personal settings. */}
      <Group title="This device">
        <AppearanceRow />
      </Group>

      {!youOwn && (
        <section className="settings-group settings-group--end">
          <div className="group">
            <Row label={<span className="danger-text">Stop acting for {o.name}</span>} chevron={false} onPress={() => setSheet('leave')} />
          </div>
        </section>
      )}

      <Sheet open={sheet === 'verify'} onClose={() => setSheet(null)} title={o.verified ? 'Verified house' : 'Verification pending'}>
        <div className="set-form">
          {o.verified ? (
            <p className="meta">Art and Artist checked {o.name}'s company documents. The house can publish roles, issue credits, share projects and appear in search.</p>
          ) : (
            <>
              <p className="meta">Art and Artist is checking {o.name}'s company documents. Until then the house can prepare privately: its page, private projects and members.</p>
              <p className="meta">Public roles, credits, sharing and search unlock once it's verified. We'll tell you here and by email.</p>
            </>
          )}
        </div>
      </Sheet>

      <Sheet open={sheet === 'leave'} onClose={() => setSheet(null)} title={`Stop acting for ${o.name}?`}>
        <div className="set-form">
          <p className="meta">You'll no longer be able to open roles, review interest, message or issue credits as {o.name}. Everything you did for the house stays with the house. Your own profile and credits don't change.</p>
          <p className="meta">To act for it again, {owner ? owner.name : 'the owner'} has to add you.</p>
          <div className="set-actions">
            <Button block variant="danger" onClick={() => leaveHouse(id)}>Stop acting for {o.name}</Button>
            <Button block variant="plain" onClick={() => setSheet(null)}>Cancel</Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
