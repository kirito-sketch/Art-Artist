import { ChevronLeft } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useStore } from '../../state/store';
import { org, party, person } from '../../state/selectors';
import { Avatar, Button, IconButton, Row, Toggle, Verified } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';

/*
 * Settings follow the identity you're acting as, and never mix.
 *  Personal: account and security, privacy and safety, your notifications, houses you act for, help, your data.
 *  House:    the page, who can act for it, credit permission, the house's notifications, verification.
 * A house has no "team" product: members are a permission list that lives here.
 */

function Group({ title, note, children }: { title: string; note?: ReactNode; children: ReactNode }) {
  return (
    <section className="settings-group">
      <h2 className="settings-h">{title}</h2>
      <div className="group">{children}</div>
      {note && <p className="meta settings-note">{note}</p>}
    </section>
  );
}

function Switch({ label, sub, initial }: { label: string; sub?: string; initial: boolean }) {
  const [on, setOn] = useState(initial);
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

export function SettingsScreen() {
  const { pop, acting } = useStore();
  return (
    <div className="screen">
      <header className="topbar topbar--nav">
        <IconButton label="Back" onClick={pop}>
          <ChevronLeft size={26} />
        </IconButton>
      </header>
      <div className="title-block">
        <h1 className="large-title">{acting === 'self' ? 'Settings' : 'House settings'}</h1>
        {acting !== 'self' && <p className="meta">For {org(acting).name}. Your personal settings are on your own profile.</p>}
      </div>
      {acting === 'self' ? <Personal /> : <House id={acting} />}
    </div>
  );
}

/**
 * Personal settings: configuration of the account, never the professional profile (craft, bio,
 * availability, portfolio and credits are in Edit profile; Saved and Your activity are on your profile).
 * Six short groups, then Sign out (quiet) and Delete account (destructive) on their own
 * (docs/NOTIFICATIONS_SETTINGS_AUDIT.md S1–S8).
 */
function Personal() {
  const { viewer, blocked, unblock, memberships, setActing, push, startEntry } = useStore();
  const [signOut, setSignOut] = useState(false);
  const [sheet, setSheet] = useState<'message' | 'blocked' | null>(null);
  const me = person(viewer.id);
  const [who, setWho] = useState<'everyone' | 'known'>('everyone');
  const whoLabel = { everyone: 'Everyone', known: 'People I know' };
  return (
    <div className="settings">
      <Group title="Account and security">
        <Row label="Name" value={me.name} onPress={() => push({ name: 'editProfile' })} />
        <Row label="Phone" value="+91 98••• ••210" chevron={false} />
        <Row label="Email" value={`${me.name.split(' ')[0].toLowerCase()}@••••.in`} chevron={false} />
        <Row label="Two-step verification" value="On" chevron={false} />
        <Row label="Signed-in devices" value="2" chevron={false} />
      </Group>

      <Group title="Privacy and safety" note="Credits you've accepted are always public on their project.">
        <Switch label="Show me in search" sub="People and productions can find your profile" initial />
        <Switch label="Show when I'm available" sub="On your profile and in role matching" initial />
        <Row label="Who can message me" value={whoLabel[who]} onPress={() => setSheet('message')} />
        <Row label="Blocked accounts" value={blocked.length ? String(blocked.length) : 'None'} chevron={blocked.length > 0} onPress={blocked.length ? () => setSheet('blocked') : undefined} />
      </Group>

      <Group title="Notifications" note={memberships.length ? "Each house you act for has its own notification settings." : undefined}>
        <Switch label="Credits" sub="A production credits you, or answers a correction" initial />
        <Switch label="Messages" initial />
        <Switch label="Interest in your collaborations" initial />
        <Switch label="Roles that match you" initial={false} />
      </Group>

      {/* Individuals don't set up production houses from the app; houses join through Art and Artist (invites, verification).
          Tapping a house opens its settings as the house (the identity switcher is on your profile). */}
      {memberships.length > 0 && (
        <Group title="Houses you act for" note="A house's owner decides who can act for it.">
          {memberships.map((m) => (
            <Row key={m} icon={<Avatar party={org(m)} size={32} />} label={org(m).name} value={org(m).verified ? 'Member' : 'Verification pending'} onPress={() => setActing(m)} />
          ))}
        </Group>
      )}

      <Group title="Help and legal">
        <Row label="Contact support" value="support@artandartist.film" chevron={false} />
        <Row label="Terms of Service" onPress={() => push({ name: 'legal', doc: 'terms' })} />
        <Row label="Privacy Policy" onPress={() => push({ name: 'legal', doc: 'privacy' })} />
        <Row label="Community guidelines" onPress={() => push({ name: 'legal', doc: 'conduct' })} />
        <Row label="How reporting works" onPress={() => push({ name: 'legal', doc: 'reporting' })} />
        <Row label="How blocking works" onPress={() => push({ name: 'legal', doc: 'blocking' })} />
      </Group>

      <Group title="Your data">
        <Row label="Agreements and download" onPress={() => push({ name: 'yourData' })} />
      </Group>

      <section className="settings-group settings-group--end">
        <div className="group">
          <Row label="Sign out" chevron={false} onPress={() => setSignOut(true)} />
          <Row label={<span className="danger-text">Delete account</span>} chevron={false} onPress={() => push({ name: 'yourData', step: 'delete' })} />
        </div>
      </section>

      <Sheet open={sheet === 'message'} onClose={() => setSheet(null)} title="Who can message me">
        <div className="intent-list" role="radiogroup" aria-label="Who can message me">
          {(['everyone', 'known'] as const).map((k) => (
            <button
              key={k}
              role="radio"
              aria-checked={who === k}
              className={`intent-option ${who === k ? 'is-on' : ''}`}
              onClick={() => {
                setWho(k);
                setSheet(null);
              }}
            >
              <span className="intent-option-label">{whoLabel[k]}</span>
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
        <Switch label="Interest in our roles" initial />
        <Switch label="Credit corrections" sub="Someone asks to correct a credit we issued" initial />
        <Switch label="Messages to the house" initial />
      </Group>
    </div>
  );
}
