import { motion } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';
import { spring } from './motion';

/*
 * Credit accepted (signature, Level 3). The record is stamped, not celebrated: a ring is drawn
 * (the waiting state closing), the verification mark settles into it, and the ring falls away,
 * leaving the permanent mark. About 0.9 s. No confetti, no bounce, no sound.
 */
export function CreditSeal({ size = 28 }: { size?: number }) {
  const r = size / 2 - 2;
  return (
    <span className="credit-seal" style={{ width: size, height: size }} role="img" aria-label="Credit accepted and verified">
      <motion.svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 0.75, duration: 0.3 }} aria-hidden>
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={1.6} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, ease: [0.65, 0, 0.35, 1] }} />
      </motion.svg>
      <motion.span className="credit-seal-mark" initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...spring.settle, delay: 0.38 }}>
        <BadgeCheck size={size * 0.72} strokeWidth={2.2} />
      </motion.span>
    </span>
  );
}
