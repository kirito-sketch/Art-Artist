# Settings

## Before (audit)

One long page (about 2.1 screens for an individual, 2.4 for a house member), every control exposed at once:

| Group | Contents |
|---|---|
| Account and security | Name (opens Edit profile), Phone, Email, Two-step verification, Signed-in devices |
| Privacy and safety | Show me in search (toggle), Show when I'm available (toggle), Who can message me (sheet), Blocked accounts (sheet) |
| Notifications | Credits, Messages, Interest in your collaborations, Roles that match you (toggles) |
| Houses you act for | One row per house (members only) |
| Help and legal | Contact support, Terms, Privacy Policy, Community guidelines, How reporting works, How blocking works |
| Your data | Agreements and download |
| (end) | Sign out, Delete account |

Nothing was duplicated, but six groups and 24 rows on one page made it slow to scan, and toggles, links and
read-only values were mixed at the same level. There was no Appearance setting.

## After

The main page is an index of groups; each group is its own page (back returns to Settings). No setting was
removed; one was added (Appearance).

```
Settings
ACCOUNT
  Account                          >   Name, Phone, Email · Two-step verification, Signed-in devices ·
                                       Agreements and download · Delete account
  Houses you act for           2   >   members only
PREFERENCES
  Appearance              System   >   System / Light / Dark
  Notifications                    >   4 toggles
PRIVACY AND SAFETY
  Privacy and safety               >   Visibility (2 toggles) · Who can message me · Blocked accounts,
                                       How blocking works, How reporting works
SUPPORT
  Help and support                 >   Contact support, Community guidelines
  About Art and Artist             >   Terms of Service, Privacy Policy, Version

Sign out
```

- 7 navigation rows (6 without a house) instead of 24 mixed rows; fits on one screen.
- Delete account moved into Account (with the data it affects); Sign out stays on the index.
- The two "how it works" safety documents moved from legal to Privacy and safety, where blocking and
  reporting are; Terms and Privacy Policy are under About.
- House settings keep their own page (page, members, credit authority, house notifications) and gain a
  "This device" group with Appearance, because appearance is a setting of the phone, not of the person or
  the house.
- Toggles keep their state when moving between pages (`src/state/settingsPrefs.ts`, in memory like the rest
  of the prototype's account data). Appearance is the one setting stored on the device.

Implementation: `src/screens/settings/Settings.tsx` (`SettingsScreen page=…`); route
`{ name: 'settings', page }`.

## To reconsider later (not changed)

- **Who can message me** is not enforced anywhere (heuristic audit F11). It needs a product decision before
  it can stay.
- **Phone, Email, Two-step verification, Signed-in devices** are read-only placeholders. Each should open its
  own flow (change number, verify email, manage devices) or be removed.
- **Roles that match you** (off by default) overlaps with Home's intent; it may belong with the intent sheet.
- **Contact support** is a plain address with no action (mailto or an in-app form would make it usable).
- **House notifications** are toggles "for everyone who acts for the house" but changed by any member; who is
  allowed to change them is undefined.
