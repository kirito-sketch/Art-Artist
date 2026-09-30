import * as act from '../domain/actions';
import { blockedBy, discoverableProjects, discoverableRoles, notificationsFor, publicCreditsFor, publicProjects, recommendedRoles, searchableHouses, searchablePeople } from '../domain/discovery';
import { toPublicWork, world, project as wproject } from '../state/world';
import { applyOps } from './fixtures';
import { restoreCanonical } from './snapshot';

/*
 * Automated regression for rules that should never need visual judgement. Each check starts from the
 * canonical records, runs the same domain actions the app runs, and inspects the records and public
 * surfaces. A check reports:
 *   pass     the rule holds
 *   fail     the rule is broken (detail says how)
 *   missing  the prototype has no model to test it against yet
 * Checks run in node (npm run test:edge) and in the Edge Case Lab.
 */

export type Outcome = { result: 'pass' | 'fail' | 'missing'; detail: string };

export interface Check {
  id: string;
  title: string;
  run: () => Outcome;
}

const pass = (detail = 'Holds.'): Outcome => ({ result: 'pass', detail });
const fail = (detail: string): Outcome => ({ result: 'fail', detail });
const missing = (detail: string): Outcome => ({ result: 'missing', detail });

const person = (viewerId: string): act.Actor => ({ viewerId, acting: 'self', memberships: [], canIssue: false });
const member = (orgId: string, canIssue = true, viewerId = 'aditi'): act.Actor => ({ viewerId, acting: orgId, memberships: [orgId], canIssue });

/** Everything an outsider could read: public projects (with credits), open roles, house pages, people. */
function publicText(viewerId = 'kiran') {
  const works = publicProjects();
  const roles = discoverableRoles(viewerId);
  const people = searchablePeople(viewerId);
  return JSON.stringify({ works, roles, people, houses: searchableHouses() });
}

const ROLE = { role: 'Script Supervisor', about: 'A 40-day schedule.', dates: 'Feb 2027', city: 'Mumbai', paid: true, compensation: 'Paid', questions: [], visibility: 'open' as const };
const PRIVATE_TITLE = 'Operation Nightjar';

function privateProject(orgId = 'konark') {
  const id = act.createProject(member(orgId), { workingTitle: PRIVATE_TITLE, format: 'Feature', languages: ['Telugu'] });
  act.updateProject(member(orgId), id, { artwork: { id: 'secret-art', kind: 'image', src: 'images/covers/secret.jpg' }, logline: 'Unannounced.' });
  return id;
}

export const CHECKS: Check[] = [
  {
    id: 'AC-01',
    title: 'Private project never enters public search',
    run: () => {
      const id = privateProject();
      act.addRole(member('konark'), id, ROLE);
      const leaked = publicProjects().filter((w) => !wproject(w.id)?.shared);
      if (leaked.length) return fail(`Unshared projects in public projects: ${leaked.map((w) => w.id).join(', ')}`);
      if (publicProjects().some((w) => w.id === id)) return fail('The new private project is public.');
      const privateRoles = discoverableRoles('kiran').filter((r) => world.roles.find((x) => x.id === r.id)?.visibility === 'private');
      if (privateRoles.length) return fail(`Private roles discoverable: ${privateRoles.map((r) => r.id).join(', ')}`);
      return pass('No unshared project or private role appears in public search.');
    },
  },
  {
    id: 'AC-02',
    title: 'Private working title never appears publicly',
    run: () => {
      const id = privateProject();
      act.addRole(member('konark'), id, ROLE);
      act.updateProject(member('konark'), id, { stage: 'Pre-production' });
      const text = publicText();
      const kaalRoles = discoverableRoles('kiran').filter((r) => world.roles.find((x) => x.id === r.id)?.projectId === 'kaal');
      if (text.includes(PRIVATE_TITLE)) return fail(`"${PRIVATE_TITLE}" appears on a public surface.`);
      if (kaalRoles.some((r) => /Kaal/.test(r.project))) return fail('Kaal\'s working title appears on a public role.');
      return pass('Public surfaces show "Untitled …" for unshared projects.');
    },
  },
  {
    id: 'AC-03',
    title: 'Private artwork never appears on a public role',
    run: () => {
      const id = privateProject();
      const rid = act.addRole(member('konark'), id, ROLE);
      act.updateProject(member('konark'), id, { stage: 'Shooting' });
      const r = world.roles.find((x) => x.id === rid)!;
      if (r.media?.id === 'secret-art') return fail('The role carries the private project artwork.');
      return pass('Roles on unshared projects use the generic image.');
    },
  },
  {
    id: 'AC-04',
    title: 'Unaccepted credit never appears publicly',
    run: () => {
      applyOps(['proposed:tara:neela:Journalist:Cast', 'proposed:kiran:kaal:DoP:Camera']);
      act.acceptCredit(person('kiran'), world.credits.find((c) => c.personId === 'kiran' && c.projectId === 'kaal')!.id);
      const w = toPublicWork(wproject('neela')!)!;
      if (w.credits.some((c) => c.personId === 'tara')) return fail('A proposed credit shows on the public project page.');
      if (publicCreditsFor('tara').some((c) => c.projectId === 'neela')) return fail('A proposed credit shows on the public profile.');
      if (publicCreditsFor('kiran').some((c) => c.projectId === 'kaal')) return fail('A credit accepted on a private project is public.');
      const prepared = world.credits.filter((c) => c.status !== 'accepted');
      if (publicProjects().some((pw) => pw.credits.some((c) => prepared.some((p) => p.personId === c.personId && p.projectId === pw.id && p.line === c.role))))
        return fail('A prepared, proposed or correction credit is public.');
      return pass('Only accepted credits on shared projects are public.');
    },
  },
  {
    id: 'AC-05',
    title: 'Accepted credit survives removing the association',
    run: () => {
      const c = world.credits.find((x) => x.personId === 'kiran' && x.projectId === 'neeliraat' && x.status === 'accepted')!;
      act.removeAssociation(member('konark'), c.associationId);
      if (!world.credits.some((x) => x.id === c.id && x.status === 'accepted')) return fail('The accepted credit was deleted.');
      if (!toPublicWork(wproject('neeliraat')!)!.credits.some((x) => x.personId === 'kiran')) return fail('The credit left the film page.');
      if (!publicCreditsFor('kiran').some((x) => x.id === c.id)) return fail('The credit left the profile.');
      return pass('Removing Kiran from Neeli Raat kept his accepted credit on the film and profile.');
    },
  },
  { id: 'AC-06', title: 'Accepted credit survives account deletion', run: () => missing('There is no account-deletion action in the prototype to test. The rule is written in Your data (Draft for legal review).') },
  {
    id: 'AC-07',
    title: 'An individual cannot issue a credit',
    run: () => {
      const kiran = { ...person('kiran'), canIssue: true };
      const aid = act.addToProject(kiran, 'salt', { personId: 'kiran' }, 'Director of Photography', 'Camera');
      try {
        act.issueCredit(kiran, aid, 'Director of Photography', 'Camera');
      } catch {
        /* a refusal by exception still counts only if nothing was written */
      }
      const made = world.credits.find((c) => c.associationId === aid);
      if (made) return fail(`A credit (${made.status}) was created by Kiran on his own independent project. The action has no issuer check.`);
      return pass('Refused.');
    },
  },
  {
    id: 'AC-08',
    title: 'An unverified house cannot issue a credit',
    run: () => {
      applyOps(['unverify:konark']);
      const aid = world.associations.find((a) => a.projectId === 'neela' && a.personId === 'sana')!.id;
      act.issueCredit(member('konark'), aid, '1st AC', 'Camera');
      const c = world.credits.find((x) => x.associationId === aid);
      if (c && c.status !== 'prepared') return fail(`Credit ${c.status} while Konark is unverified. The action has no verification check (the screen hides it).`);
      return pass('Refused or held as prepared.');
    },
  },
  {
    id: 'AC-09',
    title: 'An unverified house cannot publish a public role',
    run: () => {
      applyOps(['unverify:konark']);
      const rid = act.addRole(member('konark'), 'neela', ROLE);
      const priv = world.roles.find((r) => r.id === 'r-neela-private-0')!;
      act.setRoleVisibility(member('konark'), priv.id, 'open');
      const open = [rid, priv.id].filter((id) => world.roles.find((r) => r.id === id)?.visibility === 'open');
      if (open.length) return fail(`${open.length} role(s) opened publicly while Konark is unverified. The action has no verification check (the screen disables it).`);
      return pass('Refused.');
    },
  },
  {
    id: 'AC-10',
    title: 'A member without credit authority can only prepare a credit',
    run: () => {
      const aid = world.associations.find((a) => a.projectId === 'neela' && a.personId === 'sana')!.id;
      const before = world.notifications.length;
      const st = act.issueCredit(member('konark', false), aid, '1st AC', 'Camera');
      if (st !== 'prepared') return fail(`Status was ${st}.`);
      if (world.notifications.length !== before) return fail('The person was notified of a prepared credit.');
      return pass('Held as prepared; Sana was not asked to accept.');
    },
  },
  {
    id: 'AC-11',
    title: 'A revoked member cannot continue house actions',
    run: () => {
      const revoked: act.Actor = { viewerId: 'aditi', acting: 'konark', memberships: ['tidewater'], canIssue: true };
      const aid = world.associations.find((a) => a.projectId === 'neela' && a.personId === 'sana')!.id;
      const rid = act.addRole(revoked, 'neela', ROLE);
      act.issueCredit(revoked, aid, '1st AC', 'Camera');
      const wrote = [world.roles.some((r) => r.id === rid) && 'opened a role', world.credits.some((c) => c.associationId === aid) && 'issued a credit'].filter(Boolean);
      if (wrote.length) return fail(`After losing Konark access, Aditi still ${wrote.join(' and ')}. Actions do not check membership.`);
      return pass('Refused.');
    },
  },
  {
    id: 'AC-12',
    title: 'Blocked people and houses are excluded from discovery',
    run: () => {
      act.block(person('kiran'), 'tidewater');
      act.block(person('kiran'), 'vikram');
      const blocked = blockedBy('kiran');
      if (searchablePeople('kiran').some((p) => blocked.includes(p.id))) return fail('A blocked person is searchable.');
      if (searchableHouses(blocked).some((o) => blocked.includes(o.id))) return fail('A blocked house is searchable.');
      const roles = discoverableRoles('kiran').filter((r) => blocked.includes(r.orgId ?? r.authorId ?? ''));
      if (roles.length) return fail(`Roles from blocked parties still listed in Discover: ${roles.map((r) => `${r.role} (${r.orgId ?? r.authorId})`).join(', ')}.`);
      const recs = recommendedRoles('kiran', 'cinematographer').filter((r) => blocked.includes(r.orgId ?? r.authorId ?? ''));
      if (recs.length) return fail(`Blocked parties still recommended on Home: ${recs.map((r) => r.role).join(', ')}.`);
      if (discoverableProjects(blocked).some((w) => w.orgIds[0] === 'tidewater')) return fail('Projects led by a blocked house are still suggested.');
      return pass('Excluded everywhere.');
    },
  },
  {
    id: 'AC-13',
    title: 'Retry does not duplicate an Interest',
    run: () => {
      act.sendInterest(person('kiran'), 'o-neela-dop', 'First try');
      act.sendInterest(person('kiran'), 'o-neela-dop', 'Retry');
      const n = world.interests.filter((i) => i.personId === 'kiran' && i.opportunityId === 'o-neela-dop' && !i.withdrawn).length;
      return n === 1 ? pass('One Interest after a retry.') : fail(`${n} Interests after a retry.`);
    },
  },
  { id: 'AC-14', title: 'Retry does not duplicate a message', run: () => missing('Messages live in per-session state, not the shared records. The retry path reuses the message id (verify by hand in EC-MSG-002).') },
  {
    id: 'AC-15',
    title: 'Retry does not duplicate a project',
    run: () => {
      const before = world.projects.length;
      const d = { workingTitle: 'Retry Test', format: 'Feature' as const, languages: ['Telugu'] };
      act.createProject(member('konark'), d);
      act.createProject(member('konark'), d);
      const n = world.projects.length - before;
      return n === 1 ? pass('One project.') : fail(`${n} projects from one create plus a retry. Create has no request key, so a retry after a timeout makes a duplicate.`);
    },
  },
  {
    id: 'AC-16',
    title: 'Retry does not duplicate a credit',
    run: () => {
      const aid = world.associations.find((a) => a.projectId === 'neela' && a.personId === 'sana')!.id;
      act.issueCredit(member('konark'), aid, '1st AC', 'Camera');
      act.issueCredit(member('konark'), aid, '1st AC', 'Camera');
      const n = world.credits.filter((c) => c.associationId === aid).length;
      return n === 1 ? pass('One open credit per association.') : fail(`${n} credits for one association.`);
    },
  },
  {
    id: 'AC-17',
    title: 'A closed or filled role cannot receive new Interest',
    run: () => {
      applyOps(['closeRole:o-neela-dop']);
      act.sendInterest(person('tara'), 'o-neela-dop', '');
      if (world.interests.some((i) => i.personId === 'tara' && i.opportunityId === 'o-neela-dop')) return fail('Interest was recorded on a closed role. The action does not check role status (the screen hides the button).');
      return pass('Refused.');
    },
  },
  {
    id: 'AC-18',
    title: 'A filled role cannot be reopened as the same record',
    run: () => {
      applyOps(['fillRole:o-neela-dop']);
      act.reopenRole(member('konark'), 'o-neela-dop');
      if (!world.roleStatus['o-neela-dop']) return fail('The filled role reopened. Reopen does not check filled versus closed (the screen offers Hire again instead).');
      return pass('Filled stays filled.');
    },
  },
  {
    id: 'AC-19',
    title: 'A pending phone record never appears publicly',
    run: () => {
      applyOps(['pending:neela:Ravi Kumar:+91 98480 00000']);
      const text = publicText() + JSON.stringify(toPublicWork(wproject('neela')!));
      if (text.includes('Ravi Kumar') || text.includes('98480')) return fail('The pending person is visible publicly.');
      return pass('Not on any public surface.');
    },
  },
  {
    id: 'AC-20',
    title: 'Removing an association with no credit leaves no public trace',
    run: () => {
      const aid = act.addToProject(member('konark'), 'neela', { personId: 'omar' }, 'Camera Assistant', 'Camera');
      act.issueCredit(member('konark'), aid, 'Camera Assistant', 'Camera');
      act.removeAssociation(member('konark'), aid);
      if (world.credits.some((c) => c.associationId === aid)) return fail('An unaccepted credit survived removal.');
      if (JSON.stringify(toPublicWork(wproject('neela')!)).includes('omar') || publicCreditsFor('omar').length) return fail('Omar still shows publicly.');
      return pass('No credit, no public trace.');
    },
  },
  { id: 'AC-21', title: 'A deleted account cannot silently reclaim its old identity', run: () => missing('No account-deletion or re-registration model in the prototype.') },
  {
    id: 'AC-22',
    title: 'House actions cannot run while acting personally',
    run: () => {
      const personal: act.Actor = { viewerId: 'aditi', acting: 'self', memberships: ['konark', 'tidewater'], canIssue: true };
      const rid = act.addRole(personal, 'neela', ROLE);
      const aid = act.addToProject(personal, 'neela', { personId: 'nikhil' }, '2nd AC', 'Camera');
      const wrote = [world.roles.some((r) => r.id === rid) && 'opened a role', world.associations.some((a) => a.id === aid) && 'added someone'].filter(Boolean);
      if (wrote.length) return fail(`Acting personally, Aditi ${wrote.join(' and ')} on Konark's Neela Akasham. Actions do not check the acting identity.`);
      return pass('Refused.');
    },
  },
  {
    id: 'AC-23',
    title: 'Personal credit acceptance cannot run as a house',
    run: () => {
      applyOps(['proposed:aditi:neela:Line Producer:Production']);
      const c = world.credits.find((x) => x.personId === 'aditi' && x.projectId === 'neela')!;
      act.acceptCredit(member('konark'), c.id);
      if (c.status === 'accepted') return fail('Aditi accepted her credit while acting as Konark. Accept does not check identity (the profile hides it).');
      return pass('Refused.');
    },
  },
  {
    id: 'AC-24',
    title: 'One event produces one notification',
    run: () => {
      const before = world.notifications.filter((n) => n.forId === 'konark').length;
      act.sendInterest(person('kiran'), 'o-neela-dop', '');
      act.sendInterest(person('kiran'), 'o-neela-dop', '');
      const aid = world.associations.find((a) => a.projectId === 'neela' && a.personId === 'sana')!.id;
      const sanaBefore = world.notifications.filter((n) => n.toPersonId === 'sana').length;
      act.issueCredit(member('konark'), aid, '1st AC', 'Camera');
      act.issueCredit(member('konark'), aid, '1st AC', 'Camera');
      const houseN = world.notifications.filter((n) => n.forId === 'konark').length - before;
      const sanaN = world.notifications.filter((n) => n.toPersonId === 'sana').length - sanaBefore;
      if (houseN > 1 || sanaN > 1) return fail(`A retried Interest made ${houseN} house notifications; a re-issued credit made ${sanaN} for Sana.`);
      return pass('One notification per event.');
    },
  },
  { id: 'AC-25', title: 'Deleting an account cannot orphan a sole house owner', run: () => missing('There is no ownership model: membership is a list, and Your data only blocks deletion for houses created in the session. Aditi, the only member of Konark, is not blocked.') },
  {
    id: 'AC-26',
    title: 'An unverified house never appears in search',
    run: () => {
      applyOps(['unverify:konark']);
      return searchableHouses().some((o) => o.id === 'konark') ? fail('Unverified Konark is searchable.') : pass('Not searchable.');
    },
  },
  {
    id: 'AC-27',
    title: 'A member who lost access receives none of the house\'s notifications',
    run: () => {
      const list = notificationsFor('aditi', ['tidewater']);
      return list.some((n) => n.forId === 'konark') ? fail('Konark notifications still reach Aditi.') : pass('Scoped to current memberships.');
    },
  },
  {
    id: 'AC-28',
    title: 'Every notification has exactly one owner',
    run: () => {
      act.sendInterest(person('kiran'), 'o-neela-dop', '');
      act.addToProject(member('konark'), 'neela', { personId: 'omar' }, 'Camera Assistant', 'Camera');
      const bad = world.notifications.filter((n) => Number(!!n.forId) + Number(!!n.toPersonId) !== 1);
      return bad.length ? fail(`${bad.length} notification(s) with no owner or two owners: ${bad.map((n) => n.id).join(', ')}`) : pass('One owner each.');
    },
  },
  {
    id: 'AC-29',
    title: 'Blocking never removes anyone from a film\'s credits',
    run: () => {
      act.block(person('kiran'), 'vikram');
      act.block(person('tara'), 'bluelotus');
      const w = toPublicWork(wproject('monsoon')!)!;
      const tara = publicCreditsFor('tara');
      // Blocks are records of their own and never touch credits; the public film and profile are unchanged.
      if (!w.credits.some((c) => c.personId === 'vikram')) return fail('Vikram missing from Monsoon Letters.');
      if (!tara.some((c) => c.projectId === 'faultlines')) return fail('Tara\'s Blue Lotus credit missing.');
      return pass('Records are independent of blocks.');
    },
  },
  {
    id: 'AC-30',
    title: 'Every credit points to a real association and project',
    run: () => {
      const orphans = world.credits.filter((c) => !wproject(c.projectId) || !world.associations.some((a) => a.id === c.associationId));
      return orphans.length ? fail(`${orphans.length} orphan credit(s).`) : pass(`${world.credits.length} credits, none orphaned.`);
    },
  },
  {
    id: 'AC-31',
    title: 'A house message reaches the person from the house, in one shared thread',
    run: () => {
      const t = act.startThread(member('konark'), 'tara', { kind: 'casting', label: 'Casting', detail: 'Supporting · Journalist · Neela Akasham', refId: 'o-neela-journalist' })!;
      act.sendThreadMessage(member('konark'), t, 'Can you do a reading on Friday?', '10:00');
      const th = world.threads.find((x) => x.id === t)!;
      if (!th.sides.includes('konark') || th.sides.includes('aditi')) return fail(`Thread sides are ${th.sides.join(' and ')}; the house, not the member, is the identity.`);
      if (th.messages[0].from !== 'konark') return fail(`Message is from ${th.messages[0].from}.`);
      const n = notificationsFor('tara', []).find((x) => x.route?.id === t);
      if (!n || n.actorId !== 'konark' || n.text.includes('Aditi')) return fail('Tara is not told by Konark Pictures, or the member is named.');
      act.sendThreadMessage(person('tara'), t, 'Yes, Friday works.', '10:05');
      if (world.threads.find((x) => x.id === t)!.messages.length !== 2) return fail('The reply did not land in the same thread.');
      return pass('One thread, Konark on one side, Tara on the other; the member is never named.');
    },
  },
  {
    id: 'AC-32',
    title: 'Reviewing or withdrawing Interest never deletes the record',
    run: () => {
      act.sendInterest(person('tara'), 'o-neela-journalist', 'Free all of November.');
      const rec = () => world.interests.filter((i) => i.personId === 'tara' && i.opportunityId === 'o-neela-journalist');
      const id = rec()[0].id;
      act.reviewInterest(member('konark'), id, 'messaged');
      act.reviewInterest(member('konark'), id, 'notNow');
      act.withdrawInterest(person('tara'), 'o-neela-journalist');
      const r = rec();
      if (r.length !== 1) return fail(`${r.length} records for one person and role.`);
      if (!r[0].withdrawn) return fail('Withdrawal not recorded.');
      return pass('One record; the house sees "No longer interested".');
    },
  },
  {
    id: 'AC-33',
    title: 'Filling a role tells everyone else, by public name only',
    run: () => {
      const id = privateProject();
      const rid = act.addRole(member('konark'), id, ROLE);
      act.sendInterest(person('tara'), rid, '');
      act.sendInterest(person('kiran'), rid, '');
      act.closeRole(member('konark'), rid, 'filled', 'Filled through Ana', 'tara');
      const kiran = world.notifications.filter((n) => n.toPersonId === 'kiran' && n.route?.id === rid);
      const tara = world.notifications.filter((n) => n.toPersonId === 'tara' && n.route?.id === rid);
      if (kiran.length !== 1) return fail(`Kiran got ${kiran.length} outcome notifications.`);
      if (tara.length) return fail('The chosen person was told the role is filled.');
      if (kiran[0].text.includes(PRIVATE_TITLE)) return fail('The outcome names the working title.');
      return pass(kiran[0].text);
    },
  },
  {
    id: 'AC-34',
    title: 'A block closes a thread both ways and leaves shared records in place',
    run: () => {
      const t = act.startThread(member('konark'), 'kiran', { kind: 'project', label: 'Direct', detail: 'Direct message', refId: 'direct' })!;
      act.sendThreadMessage(member('konark'), t, 'Hello', '10:00');
      const before = { credits: world.credits.length, assoc: world.associations.length, interests: world.interests.length };
      act.block(person('kiran'), 'konark');
      if (act.sendThreadMessage(member('konark'), t, 'Still there?', '10:01')) return fail('The house can still send.');
      if (act.sendThreadMessage(person('kiran'), t, 'Bye', '10:02')) return fail('The person who blocked can still send.');
      if (act.sendInterest(person('kiran'), 'o-neela-dop', '')) return fail('Interest still reaches a blocked house.');
      if (world.threads.find((x) => x.id === t)!.messages.length !== 1) return fail('History changed.');
      const after = { credits: world.credits.length, assoc: world.associations.length, interests: world.interests.length };
      if (JSON.stringify(before) !== JSON.stringify(after)) return fail(`Records changed: ${JSON.stringify(before)} → ${JSON.stringify(after)}`);
      return pass('Closed both ways; history, credits, associations and Interest unchanged.');
    },
  },
  {
    id: 'AC-35',
    title: 'A credit notification opens the person\'s own project view, and a correction reissue is one record',
    run: () => {
      const aid = act.addToProject(member('konark'), 'neela', { personId: 'tara' }, 'Journalist', 'Cast');
      act.issueCredit(member('konark'), aid, 'Anjali (Sister)', 'Cast');
      const c1 = world.credits.find((c) => c.associationId === aid)!;
      const n = notificationsFor('tara', []).find((x) => x.text.includes('Anjali (Sister)'));
      if (n?.route?.name !== 'association' || n.route.id !== aid) return fail(`Credit notification routes to ${n?.route?.name}.`);
      act.requestCorrection(person('tara'), c1.id, 'Wrong role');
      act.issueCredit(member('konark'), aid, 'Anjali (Journalist)', 'Cast');
      const all = world.credits.filter((c) => c.associationId === aid);
      if (all.length !== 1 || all[0].status !== 'proposed') return fail(`${all.length} credit records after reissue.`);
      act.acceptCredit(person('tara'), all[0].id);
      const pub = toPublicWork(wproject('neela')!)!.credits.filter((c) => c.personId === 'tara');
      if (pub.length !== 1 || pub[0].role !== 'Anjali (Journalist)') return fail('Public project does not show exactly the accepted line.');
      if (!publicCreditsFor('tara').some((c) => c.id === all[0].id)) return fail('Profile does not read the same record.');
      return pass('Notification → project view; one record from issue to acceptance, read by the project page and the profile.');
    },
  },
  {
    id: 'AC-36',
    title: 'An accepted credit is amended only by a revision the person accepts',
    run: () => {
      const aid = act.addToProject(member('konark'), 'neela', { personId: 'tara' }, 'Journalist', 'Cast');
      act.issueCredit(member('konark'), aid, 'Anjali (Sister)', 'Cast');
      const first = world.credits.find((c) => c.associationId === aid)!;
      act.acceptCredit(person('tara'), first.id);
      const line = () => toPublicWork(wproject('neela')!)!.credits.filter((c) => c.personId === 'tara').map((c) => c.role);
      // Neither side can rewrite it directly.
      act.requestCorrection(person('tara'), first.id, 'Wrong role');
      if (first.status !== 'accepted') return fail(`"Something wrong?" on an accepted credit changed it to ${first.status}.`);
      if (act.issueCredit(member('konark'), aid, 'Journalist', 'Cast')) return fail('The house issued a new credit over an accepted one.');
      const m = world.amendments.find((x) => x.creditId === first.id && x.status === 'open');
      if (!m) return fail('No amendment request was recorded.');
      // Agreed: revised, still the old one public until accepted.
      const rev = act.proposeRevision(member('konark'), m.id, 'Anjali (Journalist)', 'Cast')!;
      if (JSON.stringify(line()) !== '["Anjali (Sister)"]') return fail('The credit changed publicly before the person accepted the revision.');
      act.acceptCredit(person('tara'), rev);
      if (JSON.stringify(line()) !== '["Anjali (Journalist)"]') return fail(`After accepting, public shows ${line()}.`);
      if ((first.status as string) !== 'superseded' || !world.credits.includes(first)) return fail('The previous version was not kept as history.');
      // Not agreed: the accepted credit stays.
      const m2 = act.requestAmendment(person('tara'), rev, 'Name misspelled')!;
      act.keepCredit(member('konark'), m2);
      if (JSON.stringify(line()) !== '["Anjali (Journalist)"]') return fail('Keeping the credit changed it.');
      return pass('Stays public while unresolved; replaced only on acceptance; old version kept; "keep" leaves it as is.');
    },
  },
  {
    id: 'AC-37',
    title: 'A personally blocked member cannot reach the person through the house',
    run: () => {
      act.block(person('tara'), 'aditi');
      const aditi = member('konark', true, 'aditi');
      const ravi = member('konark', true, 'ravi');
      if (act.startThread(aditi, 'tara', { kind: 'project', label: 'Direct', detail: 'Direct message', refId: 'direct' })) return fail('Aditi started a conversation as Konark.');
      const t = act.startThread(ravi, 'tara', { kind: 'project', label: 'Direct', detail: 'Direct message', refId: 'direct' });
      if (!t) return fail('Another Konark member was stopped, though Tara did not block Konark.');
      if (!act.sendThreadMessage(ravi, t, 'Hello from Konark', '10:00')) return fail('Another member could not send.');
      if (act.sendThreadMessage(aditi, t, 'Me too', '10:01')) return fail('Aditi sent in the Konark thread.');
      const th = world.threads.find((x) => x.id === t)!;
      if (th.messages[0].from !== 'konark' || th.messages[0].by !== 'ravi') return fail('The house identity or the internal sender was not kept.');
      act.block(person('tara'), 'konark');
      if (act.sendThreadMessage(ravi, t, 'Again', '10:02')) return fail('Blocking the house did not stop its members.');
      return pass('Blocked human stopped under the house identity; other members unaffected until the house is blocked.');
    },
  },
];

/** Runs each check from the canonical records and restores them afterwards. */
export function runChecks(ids?: string[]) {
  const out: Record<string, Outcome> = {};
  CHECKS.filter((c) => !ids || ids.includes(c.id)).forEach((c) => {
    restoreCanonical();
    try {
      out[c.id] = c.run();
    } catch (e) {
      out[c.id] = fail(`Threw: ${(e as Error).message}`);
    }
    restoreCanonical();
  });
  return out;
}

export const checkById = (id: string) => CHECKS.find((c) => c.id === id);
