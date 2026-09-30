# Product decisions

Decisions from stakeholders, newest first. These override anything older in other docs.

## 30 Sep 2026

1. **Visual direction.** Bold and Doodle are archived. Their screens stay in the prototype (panel, "Archived,
   for comparison") for stakeholder reviews, but new work is designed for **Minimal and Glass** only. The
   choice between those two is still open.
2. **Film news is optional.** Undecided whether Ana writes it, verified publications publish it, or users
   post it. The product must work completely without news; nothing in Home or navigation depends on it.
3. **Fine arts is part of Ana.** Same app, not a sister brand. Film first; fine arts (painters, galleries)
   later without rebuilding. People can belong to both domains.
4. **Profiles belong to people.** One person can work with many production houses, on several projects at
   once, freelance, and across several crafts. No employee-of-one-company model anywhere.
5. **Production houses are a separate experience.** Sales-led onboarding (not self-serve), a task-oriented
   Home, and a full lifecycle: create project, add information progressively, add cast and crew, publish
   requirements, discover people, receive interest, evaluate, collaborate, establish credits, manage the
   organisation.

## 6. Credits originate from the production (decided 30 Sep 2026)

A production adds a person to a project and assigns their role. The person receives that credit and can **accept** it or say **something's wrong** (request a correction, or dispute a credit they shouldn't have). Only accepted credits are public.

An ordinary user can never add themselves to a project, claim they worked on one, create a credit, request a credit or ask a house to "verify" a claim. If anyone could claim credits, houses would drown in verification requests and credits would stop meaning anything.

The rule is about **origin**, not about houses: a credit must come from an authorised project or production-side identity, never from the person receiving it. This does **not** mean independent projects can never carry credits.

Still open:
- Which company can issue credits when several are attached, and which members of a house may publish them.
- **Who becomes the trusted credit issuer when there is no formal production house?** (Independent films, shorts, student films, music videos.) Not designed yet. Constraint: nobody can create a project and award themselves arbitrary credits. Until it's designed, independent project pages say "Credits for independent projects are not verified yet."

## 7. Terminology

"Work" is the shared data concept only. People see Project, Film or Series in film (Exhibition or Show in fine arts later). The system word never reaches the interface.

## 8. Individual Home is Large Cards

The Large Cards Home is the canonical individual Home. The full-screen Slides Home is archived in the prototype controls for stakeholder comparison only. Future work (discovery, recommendations, opportunities, project and production cards, posts) is designed for Large Cards. This is separate from the house Home.

## 9. One primary design by default

New product work gets one implementation. We reason through the problem, document uncertainty and alternatives in writing, build the strongest hypothesis, validate, and revisit only on evidence. A second built version needs a genuinely important hypothesis or an explicit request. Existing alternatives stay in the prototype archive and are not maintained.

- House Home: **Slate** is primary. Pulse and Queue are archived references.
- House profile: **Work first** is primary. Hiring first is an archived reference.
- Responses to roles: **one Interest model** is primary. The separate Respond form is archived and marked *validate*.

## 10. Visual implementation baseline (for confirmation)

Minimal and Glass were both active. To avoid building everything twice, **new work is designed and checked in Minimal only**. Glass, Bold and Doodle stay in the archive, unmaintained. *Flagged for the product owner to confirm.* If Glass should be primary instead, new work moves to Glass, not to both.
