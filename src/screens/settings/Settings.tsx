import { ChevronLeft } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useStore } from '../../state/store';
import { org, party, person } from '../../state/selectors';
import { Avatar, Button, IconButton, Row, Toggle, Verified } from '../../ui/primitives';

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
  const { viewer, blocked, unblock, memberships, showToast, setActing } = useStore();
  const me = person(viewer.id);
  const [who, setWho] = useState<'everyone' | 'known'>('everyone');
  return (
    <div className="settings">
      <Group title="Account">
        <Row label="Name" value={me.name} chevron={false} />
        <Row label="Phone" value="+91 98••• ••210" chevron={false} />
        <Row label="Email" value="kiran@••••.in" chevron={false} />
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

      {memberships.length > 0 && (
        <Group title="Organisations you can act for" note="A house's owner decides who can act for it. Leaving removes only your permission; your credits stay yours.">
          {memberships.map((m) => (
            <Row key={m} icon={<Avatar party={org(m)} size={32} />} label={org(m).name} value="Member" onPress={() => setActing(m)} />
          ))}
        </Group>
      )}

      <Group title="Security">
        <Row label="Two-step verification" value="On" chevron={false} />
        <Row label="Signed-in devices" value="2" chevron={false} />
        <Row label={<span className="danger-text">Sign out</span>} chevron={false} onPress={() => showToast({ text: 'Sign out is not part of the prototype' })} />
      </Group>
    </div>
  );
}

/* Hypothesis: owner plus members; credit permission is a separate grant. Needs validation with houses. */
const MEMBERS: Record<string, { name: string; role: string; credits: boolean; you?: boolean }[]> = {
  konark: [
    { name: 'Rajeev Menon', role: 'Owner', credits: true },
    { name: 'Aditi Ghosh', role: 'Member', credits: true },
    { name: 'Kiran Varma', role: 'Member', credits: false, you: true },
  ],
  tidewater: [
    { name: 'Susan Mathew', role: 'Owner', credits: true },
    { name: 'Kiran Varma', role: 'Member', credits: false, you: true },
  ],
};

function House({ id }: { id: string }) {
  const { showToast, push } = useStore();
  const o = org(id);
  const members = MEMBERS[id] ?? [];
  return (
    <div className="settings">
      <Group title="Page">
        <Row icon={<Avatar party={o} size={32} />} label={o.name} value="View" onPress={() => push({ name: 'org', id })} />
        <Row label="Edit page" onPress={() => showToast({ text: 'Editing the house page is not designed yet' })} />
        <Row label="Verification" value={<span className="inline-verified">Verified <Verified size={13} /></span>} chevron={false} />
      </Group>

      <Group title="Who can act for this house" note="Members can open roles, review interest and message as the house. Only people with credit permission can issue credits. You can't change members: only the owner can.">
        {members.map((m) => (
          <Row
            key={m.name}
            label={
              <span className="settings-label">
                <span>
                  {m.name}
                  {m.you ? ' (you)' : ''}
                </span>
                <span className="meta">
                  {m.role}
                  {m.credits ? ' · can issue credits' : ''}
                </span>
              </span>
            }
            chevron={false}
          />
        ))}
      </Group>

      <Group title="House notifications" note="These go to everyone who acts for the house.">
        <Switch label="Interest in our roles" initial />
        <Switch label="Credit corrections" sub="Someone asks to correct a credit we issued" initial />
        <Switch label="Messages to the house" initial />
      </Group>
    </div>
  );
}
