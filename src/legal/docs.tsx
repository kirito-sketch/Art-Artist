import { useStore } from '../state/store';

/**
 * Legal and policy surfaces. PLACEHOLDER CONTENT: the structure and plain-language summaries are
 * product design; none of this is legal text. Every surface shows "Draft for legal review".
 */
export type DocId = 'terms' | 'privacy' | 'conduct' | 'reporting' | 'blocking' | 'authority';

interface Doc {
  title: string;
  version: string;
  summary: string[];
  sections: { h: string; body: string }[];
}

export const DOCS: Record<DocId, Doc> = {
  terms: {
    title: 'Terms of Service',
    version: 'Draft 0.3',
    summary: [
      'Art and Artist is for people and organisations who make films to find each other, work together and keep a true record of their work.',
      'You must be 18 or older and use your real identity.',
      'Credits on Art and Artist come from productions. You can accept or correct a credit, never create one for yourself.',
      'Anyone acting for a production house must be authorised by it and is responsible for what they publish for it.',
      'Art and Artist never charges anyone to apply for a role or audition, and doesn’t allow others to.',
    ],
    sections: [
      { h: '1. Who can use Art and Artist', body: 'Placeholder. Eligibility, age (18+ at launch), one account per person, accurate identity.' },
      { h: '2. Your account and identities', body: 'Placeholder. Personal account; acting for organisations you are authorised by; security of sign-in.' },
      { h: '3. Credits and project records', body: 'Placeholder. Production-issued credits, acceptance and correction, why accepted credits remain part of a project’s record.' },
      { h: '4. Roles, interest and messages', body: 'Placeholder. Posting roles, showing interest, no fees to apply, conduct in messages.' },
      { h: '5. Content you share', body: 'Placeholder. Ownership of your work, licence to display it on Art and Artist, removal.' },
      { h: '6. Safety, reporting and enforcement', body: 'Placeholder. Community guidelines, reports, warnings, removal, restriction, suspension, requesting a review.' },
      { h: '7. Ending your account', body: 'Placeholder. Deactivation, deletion, what remains (see Privacy Policy).' },
      { h: '8. Changes to these terms', body: 'Placeholder. How material changes are announced and when agreement is asked again.' },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    version: 'Draft 0.3',
    summary: [
      'We collect what you give us (profile, work, messages) and basic usage data to run Art and Artist.',
      'Your phone number is used to verify and link invitations. It is never shown on your profile.',
      'Private project information stays with the production and the people it involves until the production shares it.',
      'You can download your data and delete your account. Accepted credits stay on the films they belong to, without a link to your profile.',
      'We never sell your personal data.',
    ],
    sections: [
      { h: '1. What we collect', body: 'Placeholder. Account, profile, work, messages, device and usage data, consent records.' },
      { h: '2. Why we use it', body: 'Placeholder. Running Art and Artist, matching, safety and moderation, communication you agree to.' },
      { h: '3. Who can see what', body: 'Placeholder. Public profile, private project associations, unaccepted credits, messages.' },
      { h: '4. Phone numbers and invitations', body: 'Placeholder. Verification and linking of production invitations; never public.' },
      { h: '5. Keeping and deleting data', body: 'Placeholder. Retention, 30-day deactivation, deletion, what remains as part of project records. Requires legal review, including applicable data protection law.' },
      { h: '6. Your choices and rights', body: 'Placeholder. Access, correction, download, deletion, marketing preferences, contact.' },
    ],
  },
  conduct: {
    title: 'Community and professional conduct',
    version: 'Draft 0.3',
    summary: [
      'Be who you are. No fake profiles and no pretending to be a person or a production.',
      'No asking for money to apply, audition or be considered.',
      'No harassment, threats or unwanted advances, in public or in messages.',
      'Describe roles and projects honestly.',
      'Share only work you made or have the right to share.',
    ],
    sections: [
      { h: 'Why these rules exist', body: 'Placeholder. Art and Artist works only if people can trust who they are dealing with.' },
      { h: 'What happens if rules are broken', body: 'Placeholder. Warnings, content removal, restrictions, suspension; how to request a review.' },
    ],
  },
  reporting: {
    title: 'How reporting works',
    version: 'Draft 0.3',
    summary: [
      'You can report a person, a production, a project, a role, a post or a message from its menu.',
      'Art and Artist’s team reviews reports, most within 24 hours, and urgent safety reports first.',
      'The person you report is never told who reported them.',
      'You’ll hear back when we’ve reviewed it. For privacy, we don’t share the exact action taken.',
    ],
    sections: [],
  },
  blocking: {
    title: 'How blocking works',
    version: 'Draft 0.3',
    summary: [
      'Blocking hides you from each other: profiles, work, roles, search, interest and messages.',
      'They aren’t told.',
      'Shared credits stay on both profiles. Credits are a record, not a connection.',
      'Unblock any time from their page or Settings.',
    ],
    sections: [],
  },
  authority: {
    title: 'Acting for an organisation',
    version: 'Draft 0.3',
    summary: [
      'You confirm you’re authorised by the organisation to act for it on Art and Artist.',
      'What you publish for it (projects, roles, messages, credits) is on its behalf.',
      'The organisation can remove your access at any time. Your own profile and credits stay yours.',
    ],
    sections: [{ h: 'Responsibility and liability', body: 'Placeholder. Requires legal review.' }],
  },
};

export function DraftTag() {
  return <span className="draft-tag">Draft for legal review</span>;
}

export function LegalDocView({ id }: { id: DocId }) {
  const d = DOCS[id];
  return (
    <div className="legal">
      <DraftTag />
      <p className="meta">
        {d.title} · {d.version}
      </p>
      <h3 className="legal-h">In short</h3>
      <ul className="legal-summary">
        {d.summary.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      {d.sections.length > 0 && (
        <>
          <h3 className="legal-h">Full text</h3>
          {d.sections.map((s) => (
            <div key={s.h} className="legal-section">
              <p className="item-title">{s.h}</p>
              <p className="meta">{s.body}</p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/** Legal document as a pushed screen (from Settings). */
export function LegalScreen({ id }: { id: DocId }) {
  const { pop } = useStore();
  return (
    <div className="screen">
      <header className="topbar topbar--nav">
        <button className="link" onClick={pop}>
          Back
        </button>
      </header>
      <div className="title-block">
        <h1 className="large-title">{DOCS[id].title}</h1>
      </div>
      <div className="ws-pad">
        <LegalDocView id={id} />
      </div>
    </div>
  );
}
