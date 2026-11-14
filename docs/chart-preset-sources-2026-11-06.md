# Chart preset sources (2026-11-06)

The six preset files in `data/chart-presets/` are metadata snapshots for library import. Each is a bare `Chart[]`; no audio or note data is included. Numeric `level_value` is populated only when the source provides a chart constant or rating. Cover art is linked by direct HTTP(S) URL and not bundled in the preset.

The maimai preset uses the project identifier `maimai-dx`; the filename remains `maimai.json`.

| Game | Charts / songs | Source | Cover URL coverage | Limitations and rights |
|---|---:|---|---:|---|
| Phigros | 1,037 / 327 | [Catrong/phi-plugin info.csv](https://github.com/Catrong/phi-plugin/blob/master/resources/info/info.csv); artwork from [phi-plugin-ill](https://github.com/Catrong/phi-plugin-ill) | 327 / 327 | Community data; constants from EZ/HD/IN/AT columns, not integer display levels. Redistribution terms are not independently confirmed. |
| Rotaeno | 1,770 / 434 | [Rotaeno Wiki song list](https://wikiwiki.jp/rotaeno/%E6%A5%BD%E6%9B%B2%E4%B8%80%E8%A6%A7), last modified 2026-09-19; cover from verified Rotaeno Wiki per-song detail page attachments | 145 / 434 | 434 populated title/artist pairs across 428 distinct titles. Source publishes displayed levels, not constants; all `level_value` values are null. The snapshot is behind the Wiki’s current version; no API identified. Artwork URL coverage is partial because per-song Wiki page attachments must be matched individually; only main artwork attachments were used, excluding headers and sidebars. Verified artwork currently covers 145/434 songs; the remaining links are left null pending a matching attachment. |
| Arcaea | 1,869 / 573 | [TechnicalVessel chart list CSV](https://github.com/TechnicalVessel/Arcaea-Chart-List/blob/main/arcaea_chart_list.csv); [Arcaea Wiki title index](https://wikiwiki.jp/arcaea/%E3%82%BF%E3%82%A4%E3%83%88%E3%83%AB%E9%A0%86) for covers | 492 / 573 | Community chart list; `CC` used as constant and display level never substituted. Wiki attachment URLs were checked as image resources; nonstandard names, missing attachments, and unresolved pages remain blank. Reuse license for chart list/artwork is not confirmed. |
| maimai DX | 5,578 / 1,404 | [Diving-Fish public music_data API](https://www.diving-fish.com/api/maimaidxprober/music_data), [cover documentation](https://www.diving-fish.com/maimaidx/prober/) | 1,404 / 1,404 | Community API, not Sega’s official dataset. Cover IDs follow the API documentation; special IDs may require source-specific exceptions. Four charts with whitespace-only title placeholder ID 11422 were excluded. Reuse license not confirmed. |
| CHUNITHM | 6,657 / 1,621 | [Diving-Fish public CHUNITHM music_data API](https://www.diving-fish.com/api/chunithmprober/music_data); [LXNS jacket assets](https://assets2.lxns.net/chunithm/jacket/) | 1,621 / 1,621 | Community API, not Sega’s official dataset. Jacket URLs use source song IDs. LXNS documents rate limiting; reuse license not confirmed. |
| Paradigm: Reboot | 1,326 / 434 | Existing project snapshot `data/paradigm-reboot/charts.json`, provenance in adjacent manifest (retrieved 2026-10-26) | 434 / 434 | Snapshot may be outdated (latest included chart version 4.12.0). Existing API’s public `/cover/{filename}` route used. Reuse license for artwork not confirmed. |

## Rotaeno correction audit

The prior Rotaeno extraction did not suffer UTF-8 corruption. Its parser used the wrong column offset for some 8-cell directory tables that have a leading unlock/rank/navigation column before `Song`. Consequently the leading cell was read as the title, the source title as artist, and artist/version/difficulty cells shifted. `rotaeno-corrections.json` maps the 65 affected chart keys to corrected keys and records 13 removed false IV-Alpha rows. The source detail pages show I/II/III/IV; the extra Alpha entries were parser artifacts. The final 1,770 rows match parsed source directory charts.

Examples (before → after):

- `-` / `今天不是明天` → `今天不是明天` / `PIKASONIC feat. 兰音Reine`
- `1` / `Full Circle` → `Full Circle` / `VITICZ`
- `4` / `IGNITE` → `IGNITE` / `USAO & Massive New Krew`

Rotaeno Wiki table header colors: I `#32cd32`, II `#0099ff`, III `#ff6600`, IV `#9400d3`, IV-α `#b38cdb`. The false IV-Alpha records listed in the correction file were removed.

## Arcaea identity correction and audit

Arcaea contained two title collisions: `Genesis` by Iris vs. `Genesis` by Morrigan feat.Lily, and `Quon` by Feryquitous vs. `Quon` by DJ Noriken. Song/chart keys now include artist identity for the colliding title groups. `arcaea-corrections.json` carries old-to-new key mappings for 13 chart rows so an importer can migrate those records. The source CSV was checked against preset title/artist fields; no row-level title/artist mismatch was found. Arcaea Wiki cover paths use the actual per-song attachment filename; Genesis/Quon collision covers map to their composer-specific Wiki detail pages. Verified artwork currently covers 492/573 songs.

Arcaea Wiki difficulty colors: PST `Deepskyblue`, PRS `Mediumseagreen`, FTR `Mediumvioletred`, ETR `Slateblue`, BYD `Firebrick`.

## Cover URL checks

On 2026-11-06 one image per game was requested and returned HTTP 200 with image MIME type: Phigros `image/png` (1,771,641 bytes), Rotaeno `image/webp` (46,890 bytes), Arcaea `image/jpeg` (299,487 bytes), maimai `image/png` (239,530 bytes), CHUNITHM `image/png` (31,034 bytes), Paradigm: Reboot `image/jpeg` (159,390 bytes). Small local review fixtures are in `.local/artwork-review-fixtures/`; images are not bundled into the chart preset JSON.

## Normalization and licensing

- Unknown artists and game versions are empty strings; unknown levels are null. Fetch date is not treated as a game version.
- `song_key` preserves a source identifier where available; Rotaeno keys use title/artist identity because its directory does not publish stable machine IDs. Arcaea duplicate titles are disambiguated by artist.
- Preset metadata is sourced from community resources except where noted. Sources and image hosts remain subject to their own terms; explicit redistribution permission was not established for several community datasets or game jacket artwork. URLs are optional and blank where no specific public image was verified.
- Public downloads were parsed as data only; no downloaded code was executed. Counts are parsed coverage and are not a claim of full current-game completeness.
