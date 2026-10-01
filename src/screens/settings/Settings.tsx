import { Bookmark, ChevronLeft, List } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useStore } from '../../state/store';
import { org, party, person } from '../../state/selectors';
import { Avatar, Button, IconButton, Row, Toggle, Verified } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';

/*
 * Settings follow the identity you're acting as, and never mix.
 *  Personal: your account, privacy, your notifications, blocked people, houses you can act for, security.
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

function Personal() {
  const { viewer, blocked, unblock, memberships, setActing, push, startEntry, saved, openSheet } = useStore();
  const [signOut, setSignOut] = useState(false);
  const me = person(viewer.id);
  const [who, setWho] = useState<'everyone' | 'known'>('everyone');
  return (
    <div className="settings">
      <Group title="Account">
        <Row label="Name" value={me.name} chevron={false} />
        <Row label="Phone" value="+91 98••• ••210" chevron={false} />
        <Row label="Email" value={`${me.name.split(" ")[0].toLowerCase()}@••••.in`} chevron={false} />
      </Group>

      <Group title="Your content" note="Private to you. Also on your profile.">
        <Row icon={<Bookmark size={18} />} label="Saved" value={saved.length ? String(saved.length) : undefined} onPress={() => push({ name: 'saved' })} />
        <Row icon={<List size={18} />} label="Your activity" onPress={() => openSheet({ name: 'activity' })} />
      </Group>

      <Group title="Privacy and discoverability" note="Credits you've accepted are always public on the project. That's what makes them credible.">
        <Switch label="Show me in search" sub="People and productions can find your profile" initial />
        <Switch label="Show when I'm available" sub="On your profile and in role matching" initial />
        <Row label="Who can message me" value={who === 'everyone' ? 'Everyone' : 'People I know'} onPress={() => setWho((w) => (w === 'everyone' ? 'known' : 'everyone'))} />
      </Group>

      <Group title="Notifications" note="Notifications for a house you act for are set in that house's settings.">
        <Switch label="Credits" sub="A production credits you, or answers a correction" initial />
        <Switch label="Messages" initial />
        <Switch label="Interest in your collaborations" initial />
        <Switch label="Roles that match you" initial={false} />
      </Group>

      <Group title="Blocked">
        {blocked.length ? (
          blocked.map((id) => {
            const p = party(id)!;
            return (
              <Row key={id} icon={<Avatar party={p} size={32} />} label={p.name}>
                <Button size="s" variant="secondary" onClick={() => unblock(id)}>
                  Unblock
                </Button>
              </Row>
            );
          })
        ) : (
          <Row label={<span className="meta">No one blocked</span>} />
        )}
      </Group>

      <Group title="Organisations you can act for" note="A house's owner decides who can act for it. Leaving removes only your permission; your credits stay yours.">
        {memberships.map((m) => (
          <Row key={m} icon={<Avatar party={org(m)} size={32} />} label={org(m).name} value={org(m).verified ? 'Member' : 'Verification pending'} onPress={() => setActing(m)} />
        ))}
        <Row label="Set up a production house" onPress={() => push({ name: 'houseSetup' })} />
      </Group>

      <Group title="Legal and safety">
        <Row label="Terms of Service" onPress={() => push({ name: 'legal', doc: 'terms' })} />
        <Row label="Privacy Policy" onPress={() => push({ name: 'legal', doc: 'privacy' })} />
        <Row label="Community guidelines" onPress={() => push({ name: 'legal', doc: 'conduct' })} />
        <Row label="How reporting works" onPress={() => push({ name: 'legal', doc: 'reporting' })} />
        <Row label="How blocking works" onPress={() => push({ name: 'legal', doc: 'blocking' })} />
      </Group>

      <Group title="Your data">
        <Row label="Agreements, download, delete account" onPress={() => push({ name: 'yourData' })} />
      </Group>

      <Group title="Help">
        <Row label="Contact support" value="support@artandartist.film" chevron={false} />
      </Group>

      <Group title="Security">
        <Row label="Two-step verification" value="On" chevron={false} />
        <Row label="Signed-in devices" value="2" chevron={false} />
        <Row label="Sign out" chevron={false} onPress={() => setSignOut(true)} />
      </Group>
      <Sheet open={signOut} onClose={() => setSignOut(false)} title="Sign out?">
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
  const { showToast, push, canIssue } = useStore();
  const o = org(id);
  const members = (MEMBERS[id] ?? []).map((m) => (m.you ? { ...m, credits: canIssue } : m));
  return (
    <div className="settings">
      <Group title="Page">
        <Row icon={<Avatar party={o} size={32} />} label={o.name} value="View" onPress={() => push({ name: 'org', id })} />
        <Row label="Edit page" onPress={() => showToast({ text: 'Editing the house page is not designed yet' })} />
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

      <Group
        title="Credit authority"
        note={
          <>
            <b>Fixed:</b> credits on this house's projects come from the house, never from the person credited.
            <br />
            <b>Open question:</b> who inside the house holds this (owner only, chosen members, or a person per project), and how it works with co-productions. The list above is a prototype assumption.
          </>
        }
      >
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
