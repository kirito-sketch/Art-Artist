import { AlertCircle, Clock3, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Media, Org, Person } from '../data/types';
import { CRAFT_OBJECTS } from '../ui/craft';
import { CallSheet, displayTitle, keepSeparators, FrameLabel, HouseFeature, ObjectTile, PortraitCard, PosterTile } from '../ui/compose';
import { Avatar } from '../ui/primitives';
import './specimen.css';

/*
 * Visual Composition System specimen (?specimen). A design-system test page only: every block
 * uses the real components with stress fixtures (long, short, Telugu and mixed strings, portrait
 * crop targets, the Object Tile slot). It is not a product surface and ships no product copy.
 */

const still = (src: string): Media => ({ id: src, kind: 'image', src: `images/${src}.jpg` });
const person = (id: string, name: string, role: string, photo?: string): Person => ({ id, kind: 'person', name, role, craft: 'cinematographer', city: 'Hyderabad', tone: 1, photo });
const house = (id: string, name: string): Org => ({ id, kind: 'org', name, city: 'Hyderabad', tone: 2, verified: true, about: '' });
const noop = () => undefined;

const PEOPLE = [
  person('s1', 'Ria', 'Editor'),
  person('s2', 'Venkata Subrahmanya Lakshminarayana Sastry', 'Director of Photography'),
  person('s3', 'Kiran Varma', 'Cinematographer'),
  person('s4', 'శ్రీనివాస్ రెడ్డి', 'సినిమాటోగ్రాఫర్'),
  person('s5', 'Anvi రెడ్డి', 'Sound recordist'),
];

const PROJECTS = ['Kaavu', 'The Long Afternoon of the Monsoon Letters', 'Fault Lines · Season 2', 'నీలి ఆకాశం', 'Neela Akasham · నీల ఆకాశం'];
const ROLES = ['Editor', 'Director of Photography', 'Second Assistant Camera and Focus Puller (B Unit)', 'సహాయ దర్శకుడు', 'Colourist · కలరిస్ట్'];
const HOUSES = ['Konark Pictures', 'Sri Venkateswara Creations and Tidewater Films Collective', 'కోణార్క్ పిక్చర్స్'];

function Block({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section className="spec-block" id={id}>
      <h2 className="spec-block-title">{title}</h2>
      {note && <p className="spec-block-note">{note}</p>}
      <div className="spec-block-body canvas">{children}</div>
    </section>
  );
}

export function Specimen() {
  return (
    <div className="spec">
      <header className="spec-head">
        <h1>Ana visual composition specimen</h1>
        <p>Design-system test only. Real components, stress fixtures.</p>
      </header>

      <Block id="display" title="Display title: one per screen, stepped by length" note="40 / 36 / 32 / 30 floor · three lines, then clamp · Telugu starts one step down">
        {ROLES.map((r) => {
          const d = displayTitle(r);
          return (
            <div key={r} className="spec-display">
              <span className="spec-size">{d['data-display']}px</span>
              <h1 className="large-title display-title" {...d}>
                {keepSeparators(r)}
              </h1>
              <p className="meta">Konark Pictures · Hyderabad</p>
            </div>
          );
        })}
      </Block>

      <Block id="lead" title="Display title on the dark lead">
        {PROJECTS.map((t) => (
          <div key={t} className="spec-lead">
            <p className="slate-lead-title display-title" {...displayTitle(t)}>
              {keepSeparators(t)}
            </p>
          </div>
        ))}
      </Block>

      <Block id="names" title="Person names: display (profile) and card">
        {PEOPLE.map((p) => (
          <div key={p.id} className="spec-display">
            <p className="spec-size">{displayTitle(p.name)['data-display']}px</p>
            <h1 className="large-title display-title display-title--name" {...displayTitle(p.name)}>
              {p.name}
            </h1>
          </div>
        ))}
        <div className="portrait-rail">
          {PEOPLE.map((p, i) => (
            <PortraitCard key={p.id} person={p} still={i % 2 ? still('covers/quiet-hours') : undefined} context="Credited on Kaavu" onPress={noop} />
          ))}
        </div>
      </Block>

      <Block id="posters" title="Project titles on the rail" note="Two lines then ellipsis; title cards hold four">
        <div className="poster-rail">
          {PROJECTS.map((t, i) => (
            <PosterTile key={t} title={t} lead={i === 0} media={i === 2 ? still('covers/faultlines') : undefined} locked={i === 3} meta="Konark Pictures" label={i === 2 ? <FrameLabel>Pre-production</FrameLabel> : i === 4 ? <FrameLabel>ప్రీ-ప్రొడక్షన్</FrameLabel> : undefined} onPress={noop} />
          ))}
        </div>
      </Block>

      <Block id="houses" title="House names">
        {HOUSES.map((h) => (
          <HouseFeature key={h} house={house(h, h)} still={still('covers/neela')} line="Now making Neela Akasham · Hiring 2" onPress={noop} />
        ))}
      </Block>

      <Block id="labels" title="Caps labels: Latin and Telugu (localisation fixture)" note="Telugu keeps slot, weight and colour; no case transform, no tracking, +1px optical size">
        <div className="spec-photo">
          <img src="images/covers/backwaters.jpg" alt="" />
          <div className="spec-labels">
            <FrameLabel>Pre-production</FrameLabel>
            <FrameLabel>ప్రీ-ప్రొడక్షన్</FrameLabel>
          </div>
          <div className="spec-labels spec-labels--low">
            <FrameLabel tone="urgent">Closes in 4 days</FrameLabel>
            <FrameLabel tone="urgent">4 రోజుల్లో ముగుస్తుంది</FrameLabel>
          </div>
        </div>
        <div className="spec-row">
          <FrameLabel tone="paper">Interest sent</FrameLabel>
          <FrameLabel tone="paper">ఆసక్తి పంపారు</FrameLabel>
        </div>
        <CallSheet
          items={[
            { label: 'Location', value: 'Hyderabad & Araku' },
            { label: 'ప్రదేశం', value: 'హైదరాబాద్ & అరకు' },
            { label: 'Pay', value: '₹2.4L for the schedule' },
            { label: 'పారితోషికం', value: '₹2.4L షెడ్యూల్‌కి' },
          ]}
        />
      </Block>

      <Block id="objects" title="Object Tile: fixed slot, placeholder asset" note="Dashed square = the asset slot a supplied WebP/PNG fills. Layout does not depend on the asset.">
        <div className="band band--sand spec-band">
          <div className="object-grid spec-slots">
            {CRAFT_OBJECTS.map((c) => (
              <ObjectTile key={c.kind} kind={c.kind} label={c.label} meta="6 open roles" onPress={noop} />
            ))}
            <ObjectTile kind="lens" label="ఛాయాగ్రహణం" meta="6 ఓపెన్ పాత్రలు" onPress={noop} />
            <ObjectTile kind="timeline" label="Set decoration and props department" meta="People and work" onPress={noop} />
          </div>
        </div>
      </Block>

      <Block id="portraits" title="Portrait crop and fallback" note="Crop targets stand in for supplied portraits (none are in the repo). Face centre sits at 36% height.">
        <div className="spec-row spec-row--faces">
          {[26, 40, 64, 96].map((s) => (
            <Avatar key={s} party={person('c' + s, 'Kiran Varma', 'Cinematographer', 'images/qa/crop-portrait.jpg')} size={s} />
          ))}
          {[26, 40, 64, 96].map((s) => (
            <Avatar key={'f' + s} party={PEOPLE[2]} size={s} />
          ))}
          {[40, 64].map((s) => (
            <Avatar key={'t' + s} party={PEOPLE[3]} size={s} />
          ))}
        </div>
        <div className="portrait-rail">
          <PortraitCard person={person('c1', 'Kiran Varma', 'Cinematographer', 'images/qa/crop-square.jpg')} still={still('covers/backwaters')} context="Credited on Monsoon Letters" onPress={noop} />
          <PortraitCard person={person('c2', 'Tara Menon', 'Actor', 'images/qa/crop-landscape.jpg')} still={still('covers/salt-water')} context="Worked with Konark" onPress={noop} />
          <PortraitCard person={PEOPLE[2]} still={still('covers/neela')} context="No photo: initials" onPress={noop} />
        </div>
      </Block>

      <Block id="surfaces" title="Surfaces and colour balance" note="Paper ground, raised white, quiet tint, one sand field, graphite anchor">
        <div className="spec-surfaces">
          {[
            ['base', 'Paper · ground'],
            ['raised', 'Raised white · objects on paper'],
            ['tint', 'Tint · quiet section'],
            ['sand', 'Sand · one expressive field'],
            ['dark', 'Graphite · title cards, media'],
          ].map(([k, l]) => (
            <div key={k} className={`spec-surface spec-surface--${k}`}>
              <span className="item-title">{l}</span>
              <span className="meta">Secondary text</span>
              <span className="spec-caps">Caps label</span>
            </div>
          ))}
        </div>
      </Block>

      <Block id="red" title="Ana green marks; red means danger" note="Five states told apart by structure and language first. Attention uses the Ana green dot; red appears only for errors and destructive confirmations">
        <div className="spec-states">
          <div className="spec-state">
            <Clock3 size={16} />
            <span>
              <b>Waiting</b> · Credit sent. Waiting for Kiran.
            </span>
          </div>
          <div className="spec-state">
            <span className="around-flag-dot" style={{ marginLeft: 0 }} />
            <span>
              <b>Attention</b> · 2 to review
            </span>
          </div>
          <div className="spec-state">
            <span className="record-mark" style={{ width: 28, height: 28 }}>
              ↺
            </span>
            <span>
              <b>Correction</b> · You said this isn't right. Waiting on the house.
            </span>
          </div>
          <div className="spec-state spec-state--error">
            <AlertCircle size={16} />
            <span>
              <b>Error</b> · Couldn't send. Check your connection and try again.
            </span>
          </div>
          <div className="spec-state">
            <Trash2 size={16} />
            <span>
              <b>Destructive</b> · Only inside a confirmation, as the one red button.
            </span>
          </div>
        </div>
      </Block>
    </div>
  );
}
