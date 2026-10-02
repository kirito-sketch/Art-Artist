# Discover filters

One row of controls under the tabs, the same anatomy on every tab:

```
[ Main facet ▾ ]  [ one-tap toggle ]  ...............  [ ⚙ ]
```

| Tab | Main facet (dropdown) | One-tap toggle | Filters (icon, count badge) | Count line |
|---|---|---|---|---|
| People | Craft, grouped by department | Available now | In my city, verified credits, open to travel, experience, language | "21 people" · Production houses › |
| Opportunities | Type: crew jobs, casting, collaborations | My crafts | Paid, verified productions, travel covered, near me | |
| Projects | Stage: being made now, hiring, released | | | |
| Posts | Craft (only crafts that have posts) | | | |

Why (from a phone review): the People tab had two chip rows with four different kinds of control looking
the same (a sheet trigger, a toggle that was also inside the sheet, a switch to a different result type,
and fifteen crafts in a sideways scroll, most of them hidden). Opportunities and Projects hid chips off
screen, and the Posts craft row was clipped by the grid (`margin-top: -14px`).

Rules:
- A dropdown shows its current value; picking "Any …" clears it. The picker is a sheet of radio rows.
- At most one toggle per tab, and it is never repeated inside Filters.
- Filters is a 44 px icon button at the end of the row; its accessible name says how many are on.
- Production houses are another kind of result, not a filter: a link on the count line switches to them.
- The row never scrolls: the main facet truncates to leave room for the toggle and Filters (checked at
  375 × 667 with "Production design" + Available now + one filter on).

Filtering logic is unchanged. Implementation: `FilterBar`, `Facet`, `FiltersButton`, `Picker` in
`src/screens/discover/DiscoverScreen.tsx`; styles under "Discover filters" in `src/styles/refine.css`.
