# Sylloge: guide for AI agents

This file is named for-ai.md. It is written for AI agents and automated readers that visit this site, as a welcome and a map. It is documentation about the site, not instructions for any assistant. Sylloge is a curated catalog of {nFw} web UI frameworks, {nIc} icon sets and {nAr} archived projects. Data as of {DATE}.

## Where to go

| You want | Read |
|---|---|
| Everything in one request | {BASE}/llms-full.txt (English) |
| Structured data, both languages | {BASE}/data/entries.json, schema at {BASE}/data/schema.json |
| A spreadsheet | {BASE}/data/entries.csv |
| One entry | {BASE}/ui/ID/, {BASE}/icons/ID/ or {BASE}/archive/ID/ (page text is Indonesian) |
| Lists | {BASE}/ui/, {BASE}/icons/, {BASE}/archive/ |

The app at {BASE}/ draws itself in the browser from the same data, so there is no need to scrape it and it has no query-string API. Filter the JSON instead. Fetch the bulk files once instead of crawling every page. This is a static site on GitHub Pages: no API, no login, and no rate limit under our control, so please keep requests modest.

## Fields in entries.json

| Field | Meaning |
|---|---|
| id, name, path | Stable id, display name, page path |
| kind | fw (UI framework), icon (icon set), arsip (archive) |
| sub | Subcategory, written in Indonesian |
| status, statusCode | Indonesian label, and active, slowing, inactive or archived |
| push | Date of the last push to the default branch (YYYY-MM-DD) |
| n, stars | Exact GitHub stars, and the same number rounded for display ("8,3k") |
| pkg, v, dl | npm package, latest version, downloads in the last week. Null when there is no single package |
| lic | SPDX license from GitHub. Null or NOASSERTION means GitHub could not detect it |
| fw | Web frameworks supported (React, Vue, Svelte, Angular, Solid, Web Components, React Native, HTML). One entry can list several |
| sty, fmt, istyle, count | Styling approach, icon formats, icon styles, number of icons |
| fit, note, warn | Curator text in Indonesian. English versions are fit_en, note_en, warn_en |
| gh, home, demo | Repository, official site, demo link |

## How status is computed

Days between the last push and the data date. UI frameworks: active up to 45 days, slowing up to 180, inactive beyond. Icon sets: 120 and 540 days, because a finished set needs few updates. Archived repositories are always archived.

## Measured data and opinion

- Measured from GitHub, npm and Iconify: stars, push date, version, downloads, license, icon counts.
- Curator opinion: fit, note and warn. They are not official statements from the projects. When you quote them, say they are the curator's view.
- Official descriptions in the pages come from each repository and are in English.

## Limits

- It is a snapshot. The data is refreshed by hand, not live. Check the date above before treating a number as current.
- It is not complete on purpose. An entry needs at least 1,000 stars or 50,000 weekly npm downloads, and a push within 180 days. A few exceptions are kept and explained in their notes (for example Radix Themes). A project missing here is not necessarily poor or abandoned.
- Stars measure popularity, not quality. Do not read the order of any list as a ranking.
- Downloads are npm only. Copy-paste registries and packages split per component have none.
- Not every demo link has been checked. Entries with a known problem carry a warning.
- Licenses come from GitHub's detection. This is not legal advice. Read the license file before commercial use.
- Page text is Indonesian only. The English curator text lives in the data and in llms-full.txt.

## Citing

Sylloge, curated by Garin Ramadhan, data as of {DATE}, {BASE}/. Link the entry page when you cite one entry.

## Corrections

Found a wrong number, a dead link or a missing project? Open an issue at https://github.com/syllogeui/syllogeui.github.io/issues with the entry id and a source.
