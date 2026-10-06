import { Bell, Building2, Check, ChevronLeft, CircleHelp, Info, Monitor, Moon, Palette, Shield, Sun, UserRound } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useStore } from '../../state/store';
import { org, party, person } from '../../state/selectors';
import { usePref } from '../../state/settingsPrefs';
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
  const { viewer, blocked, unblock, memberships, setActing, push } = useStore();
  const me = person(viewer.id);
  const [who, setWho] = usePref<string>('who-can-message', 'everyone');
  const [sheet, setSheet] = useState<'message' | 'blocked' | null>(null);
  const whoLabel: Record<string, string> = { everyone: 'Everyone', known: 'People I know' };

  if (page === 'account')
    return (
      <div className="settings">
        <Group title="Account">
          <Row label="Name" value={me.name} onPress={() => push({ name: 'editProfile' })} />
          <Row label="Phone" value="+91 98••• ••210" chevron={false} />
          <Row label="Email" value={`${me.name.split(' ')[0].toLowerCase()}@••••.in`} chevron={false} />
        </Group>
        <Group title="Security">
          <Row label="Two-step verification" value="On" chevron={false} />
          <Row label="Signed-in devices" value="2" chevron={false} />
        </Group>
        <Group title="Your data">
          <Row label="Agreements and download" onPress={() => push({ name: 'yourData' })} />
        </Group>
        <section className="settings-group settings-group--end">
          <div className="group">
            <Row label={<span className="danger-text">Delete account</span>} chevron={false} onPress={() => push({ name: 'yourData', step: 'delete' })} />
          </div>
        </section>
      </div>
    );

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
          <Row label="Contact support" value="support@artandartist.film" chevron={false} />
          <Row label="Community guidelines" onPress={() => push({ name: 'legal', doc: 'conduct' })} />
        </Group>
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
  const { push, canIssue } = useStore();
  const o = org(id);
  const members = (MEMBERS[id] ?? []).map((m) => (m.you ? { ...m, credits: canIssue } : m));
  return (
    <div className="settings">
      <Group title="Page">
        <Row icon={<Avatar party={o} size={32} />} label={o.name} value="View" onPress={() => push({ name: 'org', id })} />
        <Row label="Verification" value={<span className="inline-verified">Verified <Verified size={13} /></span>} chevron={false} />
      </Group>

      <Group title="Who can act for this house" note="Members can open roles, review interest and message as the house. Only the owner can change members.">
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
    </div>
  );
}
