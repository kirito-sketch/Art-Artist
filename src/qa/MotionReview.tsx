import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { Check, Compass, House, MessageCircle, PenLine, Plus, UserSearch } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { CreditSeal } from '../ui/CreditSeal';
import { ObjectTile } from '../ui/compose';
import { dur, spring } from '../ui/motion';
import { Button, FollowButton, Photo, PressCard } from '../ui/primitives';
import { INTERACTIONS, type Interaction } from './motionInventory';
import './specimen.css';

/*
 * Motion review (?motion): internal tooling, not part of the stakeholder console. Every entry of
 * the inventory with its purpose, normal and reduced behaviour, and a live demo where one fits in
 * isolation. Turn on the OS "reduce motion" setting to see the reduced versions.
 */

const still = (src: string) => ({ id: src, kind: 'image' as const, src: `images/covers/${src}.jpg` });

const DEMOS: Record<string, () => ReactNode> = {
  nav: NavDemo,
  create: CreateDemo,
  grid: GridDemo,
  press: () => (
    <PressCard className="mr-card" onPress={() => undefined} scale={0.98}>
      <Photo media={still('neela')} showPlay={false} />
    </PressCard>
  ),
  follow: FollowDemo,
  save: SaveDemo,
  interest: InterestDemo,
  object: () => (
    <div className="band band--sand mr-band">
      <div className="object-grid">
        <ObjectTile kind="lens" label="Cinematography" meta="Hover or press" onPress={() => undefined} />
        <ObjectTile kind="microphone" label="Sound" meta="Focus with Tab" onPress={() => undefined} />
      </div>
    </div>
  ),
  credit: CreditDemo,
  identity: IdentityDemo,
};

export function MotionReview() {
  return (
    <div className="spec">
      <header className="spec-head">
        <h1>Ana motion review</h1>
        <p>Internal. Inventory, purpose, reduced-motion behaviour and live demos. Spec: docs/MOTION_MICROINTERACTION_SYSTEM.md.</p>
      </header>
      {INTERACTIONS.map((it) => (
        <Entry key={it.id} it={it} demo={DEMOS[it.id]} />
      ))}
    </div>
  );
}

function Entry({ it, demo: Demo }: { it: Interaction; demo?: () => ReactNode }) {
  return (
    <section className="spec-block mr-entry" id={it.id}>
      <h2 className="spec-block-title">
        {it.name} <span className="mr-level">Level {it.level}</span> <span className={`mr-status mr-status--${it.status.replace(' ', '-')}`}>{it.status}</span>
      </h2>
      <dl className="mr-facts">
        <dt>Where</dt>
        <dd>{it.where}</dd>
        <dt>Why it moves</dt>
        <dd>{it.why}</dd>
        <dt>Normal</dt>
        <dd>{it.normal}</dd>
        <dt>Reduced motion</dt>
        <dd>{it.reduced}</dd>
      </dl>
      {Demo && (
        <div className="spec-block-body canvas mr-demo">
          <Demo />
        </div>
      )}
    </section>
  );
}

function NavDemo() {
  const [on, setOn] = useState(0);
  const icons = [House, Compass, MessageCircle];
  return (
    <LayoutGroup id="nav-demo">
      <div className="tabbar-pill mr-pill">
        {icons.map((Icon, i) => (
          <motion.button key={i} className={`tab-item ${on === i ? 'is-on' : ''}`} whileTap={{ scale: 0.88 }} transition={spring.press} onClick={() => setOn(i)} aria-label={`Tab ${i + 1}`}>
            {on === i && <motion.span layoutId="demo-well" className="tab-well" transition={spring.snappy} />}
            <motion.span className="tab-icon" animate={{ y: on === i ? -2 : 0 }} transition={spring.snappy}>
              <Icon size={24} strokeWidth={on === i ? 2.4 : 1.9} />
            </motion.span>
            {on === i && <motion.span layoutId="demo-mark" className="tab-mark" transition={spring.snappy} />}
          </motion.button>
        ))}
      </div>
    </LayoutGroup>
  );
}

function CreateDemo() {
  const [open, setOpen] = useState(false);
  return (
    <LayoutGroup id="create-demo">
      <div className="mr-create">
        <AnimatePresence>
          {open && (
            <motion.div layoutId="demo-create" className="mr-create-surface" style={{ borderRadius: 26 }} initial={{ backgroundColor: '#c4412e' }} animate={{ backgroundColor: '#ffffff' }} exit={{ backgroundColor: '#c4412e' }} transition={spring.sheet}>
              <div className="group create-rows">
                <div className="row"><PenLine size={20} /> Post</div>
                <div className="row"><UserSearch size={20} /> Looking for someone</div>
                <div className="row"><Plus size={20} /> Start an independent project</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button className="tab-create" whileTap={{ scale: 0.86 }} transition={spring.press} onClick={() => setOpen((o) => !o)} aria-label={open ? 'Close' : 'Create'}>
          {!open && <motion.span layoutId="demo-create" className="tab-create-disc" style={{ borderRadius: 26 }} transition={spring.sheet} />}
          <motion.span className="tab-create-icon" animate={{ rotate: open ? 45 : 0 }} transition={spring.snappy}>
            <Plus size={24} strokeWidth={2.4} color="#fff" />
          </motion.span>
        </motion.button>
      </div>
    </LayoutGroup>
  );
}

function GridDemo() {
  const [open, setOpen] = useState<string | null>(null);
  const ids = ['neela', 'backwaters', 'neon-monsoon', 'salt-water', 'journalist', 'coastline'];
  return (
    <LayoutGroup id="grid-demo">
      <div className="mr-grid">
        {ids.map((id) => (
          <button key={id} className="post-tile" onClick={() => setOpen(id)} aria-label={`Open ${id}`}>
            {open !== id && (
              <motion.div layoutId={`demo-post-${id}`} className="post-tile-media" transition={spring.push}>
                <Photo media={still(id)} showPlay={false} />
              </motion.div>
            )}
          </button>
        ))}
        <AnimatePresence>
          {open && (
            <motion.div className="mr-post" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: dur.micro }} onClick={() => setOpen(null)}>
              <motion.div layoutId={`demo-post-${open}`} className="mr-post-media" transition={spring.push}>
                <Photo media={still(open)} showPlay={false} />
              </motion.div>
              <p className="meta">Tap to go back to the grid</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}

function FollowDemo() {
  const [on, setOn] = useState(false);
  return (
    <div className="spec-row">
      <FollowButton on={on} onToggle={() => setOn((x) => !x)} name="Vikram Sen" />
      <FollowButton on={on} onToggle={() => setOn((x) => !x)} size="m" />
    </div>
  );
}

function SaveDemo() {
  const [on, setOn] = useState(false);
  return (
    <motion.button className={`save save--floating mr-save ${on ? 'is-on' : ''}`} whileTap={{ scale: 0.8 }} transition={spring.press} onClick={() => setOn((x) => !x)} aria-pressed={on} aria-label="Save">
      <motion.span key={String(on)} initial={{ scale: on ? 0.5 : 1 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 700, damping: 14 }} style={{ display: 'inline-flex' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
        </svg>
      </motion.span>
    </motion.button>
  );
}

function InterestDemo() {
  const [state, setState] = useState<'open' | 'sending' | 'sent' | 'withdrawn'>('open');
  const send = () => {
    setState('sending');
    window.setTimeout(() => setState('sent'), 900);
  };
  const left = {
    open: ['₹15k / day', 'Closes 20 Oct'],
    sending: ['₹15k / day', 'Closes 20 Oct'],
    sent: ['Interest sent', 'Tidewater will message you if it’s a fit'],
    withdrawn: ['No longer interested', 'Withdrawn. You can show interest again.'],
  }[state];
  return (
    <div className="booking mr-booking">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={state === 'sending' ? 'open' : state} className="booking-left" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: dur.micro }}>
          <p className="item-title booking-done">
            {left[0]}
            {state === 'sent' && (
              <motion.span className="booking-check" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...spring.settle, delay: 0.12 }}>
                <Check size={14} strokeWidth={3} />
              </motion.span>
            )}
          </p>
          <p className="meta">{left[1]}</p>
        </motion.div>
      </AnimatePresence>
      {state === 'sent' ? (
        <Button variant="secondary" onClick={() => setState('withdrawn')}>
          Withdraw
        </Button>
      ) : (
        <Button loading={state === 'sending'} onClick={send}>
          {state === 'sending' ? 'Sending…' : 'Show interest'}
        </Button>
      )}
    </div>
  );
}

function CreditDemo() {
  const [n, setN] = useState(0);
  return (
    <div className="spec-row">
      <span className="credit-sealed item-title">
        Accepted {n > 0 && <CreditSeal key={n} size={24} />}
      </span>
      <Button size="s" variant="secondary" onClick={() => setN((x) => x + 1)}>
        Accept credit
      </Button>
    </div>
  );
}

function IdentityDemo() {
  const [n, setN] = useState(0);
  const [house, setHouse] = useState(false);
  return (
    <div className="mr-identity">
      <Button
        size="s"
        variant="secondary"
        onClick={() => {
          setHouse((h) => !h);
          setN((x) => x + 1);
        }}
      >
        Switch to {house ? 'you' : 'Konark Pictures'}
      </Button>
      <AnimatePresence>
        {n > 0 && (
          <motion.div key={n} className="identity-shift mr-shift" initial={{ opacity: 0, y: 18, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1, transition: spring.settle }} exit={{ opacity: 0, y: 8 }} onAnimationComplete={() => window.setTimeout(() => setN(0), 1200)}>
            <span className="avatar" style={{ width: 26, height: 26, fontSize: 9, background: '#f4efe6', color: '#151413' }}>
              {house ? 'KP' : 'KV'}
            </span>
            <span>
              <span className="identity-shift-label">{house ? 'Acting for the house' : 'Acting as you'}</span>
              <span className="identity-shift-name">{house ? 'Konark Pictures' : 'Kiran Varma'}</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
