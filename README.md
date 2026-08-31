# Mol* PDB + YAML Protein Region Viewer

A static, browser-based Mol* Viewer application that loads a PDB structure and colors any number of residue ranges from a human-readable YAML annotation file.

The project is designed for GitHub Pages and does not require a build step, backend, database, or API key. Hosted files can be loaded automatically from the repository, while local PDB/YAML pairs are processed only inside the browser tab.

## Features

- Load one `.pdb` structure and one `.yaml`/`.yml` annotation file.
- Define 1, 3, 5, 10, or any other number of colored regions.
- Use inclusive `start` and `end` residue numbers.
- Select author/PDB numbering (`auth`) or sequential Mol* numbering (`label`).
- Apply regions to one chain, multiple chains, or all chains.
- Add optional descriptions, hover tooltips, and 3D labels.
- Display a generated legend with range coverage and validation warnings.
- Switch between 3D-only, sequence, controls, and full Mol* layouts.
- Load files from the repository automatically or select/drop local files.
- Download the currently loaded PDB, YAML, or a clean YAML template.
- Deploy directly with the included GitHub Pages workflow.

## Project structure

```text
.
├── .github/
│   └── workflows/
│       └── pages.yml
├── annotations/
│   ├── demo-regions.yaml
│   ├── template.yaml
│   └── README.md
├── pdb/
│   ├── demo-protein.pdb
│   └── README.md
├── .nojekyll
├── app.js
├── config.js
├── index.html
├── LICENSE
├── README.md
└── styles.css
```

The included `demo-protein.pdb` is a synthetic 60-residue structure for interface testing only. It is not a scientific model.

## Quick start

Serve the directory through a local HTTP server:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Opening `index.html` directly through a `file://` URL is not recommended because browser security rules can block repository-style `fetch()` requests.

## `config.js`

`config.js` controls the title, automatic hosted-file loading, source paths, and initial Mol* layout.

```js
window.PROTEIN_REGION_VIEWER_CONFIG = {
  title: 'Protein Region Viewer',
  subtitle: 'Color PDB residue ranges from a YAML annotation file',

  autoLoad: true,
  pdbUrl: './pdb/my-protein.pdb',
  yamlUrl: './annotations/my-protein-regions.yaml',

  defaultLayout: 'sequence-controls'
};
```

### Configuration properties

| Property | Type | Default | Description |
|---|---:|---|---|
| `title` | string | `Protein Region Viewer` | Application and browser-page title. |
| `subtitle` | string | built-in text | Description shown above the viewer controls. |
| `autoLoad` | boolean | `false` | Loads `pdbUrl` and `yamlUrl` after Mol* initializes. |
| `pdbUrl` | string | empty | Relative or CORS-enabled URL for the hosted PDB file. |
| `yamlUrl` | string | empty | Relative or CORS-enabled URL for the hosted YAML file. |
| `defaultLayout` | string | `sequence-controls` | Initial Mol* interface layout. |

For GitHub Pages, relative paths such as `./pdb/protein.pdb` are recommended. They continue to work when the site is hosted under `https://USER.github.io/REPOSITORY/`.

Set `autoLoad: false` and leave both URLs empty to use the application only as a local file viewer.

## YAML annotation format

Minimal example:

```yaml
version: 1
title: My protein regions
numbering: auth
default_chain: A

viewer:
  representation: cartoon
  base_color: "#CBD5E1"
  background: "#FFFFFF"
  show_labels: false

regions:
  - name: N-terminal domain
    start: 1
    end: 85
    color: "#2563EB"

  - name: Catalytic region
    start: 86
    end: 170
    color: "#F97316"

  - name: C-terminal domain
    start: 171
    end: 260
    color: "#10B981"
```

`start` and `end` are inclusive. The example above colors residues 1 through 85, including both endpoints.

The `regions` list has no fixed UI limit for normal use. The application accepts up to 1,000 entries as a defensive limit against accidental or maliciously large files.

## Top-level YAML properties

| Property | Required | Description |
|---|---:|---|
| `version` | No | Schema version marker. Version `1` is used by this project. |
| `title` | No | Annotation title shown above the viewer and legend. |
| `numbering` | No | Global residue numbering mode: `auth` or `label`. Default: `auth`. |
| `default_chain` | No | Default chain for regions that do not define their own chain. |
| `viewer` | No | Base representation and display settings. |
| `regions` | Yes | List of region objects. At least one enabled region is required. |

## Viewer settings in YAML

```yaml
viewer:
  representation: cartoon
  selector: protein
  base_color: "#CBD5E1"
  background: "#FFFFFF"
  show_labels: false
  show_tooltips: true
```

| Property | Default | Description |
|---|---|---|
| `representation` | `cartoon` | Base 3D representation. |
| `selector` | `protein` | Part of the structure that receives the base representation. |
| `base_color` | `#CBD5E1` | Color used outside annotated regions. |
| `background` | `#FFFFFF` | Mol* canvas background color. |
| `show_labels` | `false` | Global default for 3D region labels. |
| `show_tooltips` | `true` | Global default for region hover tooltips. |

Supported `representation` values:

```text
cartoon
backbone
ball_and_stick
line
spacefill
carbohydrate
surface
putty
```

Supported base `selector` values:

```text
all
polymer
protein
nucleic
branched
ligand
ion
water
coarse
```

Colors may be six-digit hexadecimal values such as `#2563EB`, three-digit shorthand such as `#26E`, or X11 color names such as `red` and `steelblue`.

## Region properties

Canonical region syntax:

```yaml
- name: RNA-binding insertion
  chain: A
  numbering: auth
  start: 120
  end: 185
  color: "#8B5CF6"
  label: false
  tooltip: true
  description: Optional explanatory text.
  enabled: true
```

| Property | Required | Description |
|---|---:|---|
| `name` | Yes | Region name shown in the legend and tooltip. |
| `start` | Yes | First residue number, inclusive. |
| `end` | Yes | Last residue number, inclusive. |
| `color` | Yes | Region color. |
| `chain` | No | One chain identifier. Overrides `default_chain`. |
| `chains` | No | List of chain identifiers, for example `[A, B]`. |
| `numbering` | No | Per-region override: `auth` or `label`. |
| `label` | No | Adds the region name as a 3D label. |
| `tooltip` | No | Enables/disables the region hover tooltip. |
| `description` | No | Additional legend and tooltip text. |
| `enabled` | No | Set to `false` to keep the entry in YAML without rendering it. |

Convenience aliases are also accepted:

- `begin` or `from` for `start`.
- `stop` or `to` for `end`.
- `colour` for `color`.
- `chain_id` for `chain`.
- `residue` for a one-residue region, replacing both `start` and `end`.

Example of one residue:

```yaml
- name: Catalytic lysine
  residue: 42
  color: "#DC2626"
```

## Chain selection

Use a global default chain:

```yaml
default_chain: A
```

Override it for one region:

```yaml
- name: Chain B domain
  chain: B
  start: 10
  end: 70
  color: "#10B981"
```

Apply one region to several chains:

```yaml
- name: Conserved repeat
  chains: [A, B, C]
  start: 25
  end: 50
  color: "#F59E0B"
```

Apply a region to every chain by omitting `default_chain`, `chain`, and `chains`, or by writing:

```yaml
chain: all
```

Blank PDB chain identifiers are shown as `(blank)` in the legend. For a blank chain, omitting the chain selector is usually simplest.

## `auth` versus `label` numbering

### `auth`

```yaml
numbering: auth
```

Uses the residue identifiers written by the structure author in the PDB file. This is usually the correct mode when ranges come from a publication, UniProt mapping, PyMOL selection, or an existing PDB-based analysis. Author numbering can contain gaps and insertion codes.

### `label`

```yaml
numbering: label
```

Uses sequential polymer residue numbering generated by Mol*. This generally starts at 1 for each polymer chain and avoids gaps.

The application performs a lightweight PDB-side coverage check. For `label` ranges, this check approximates Mol* label numbering by residue order in each PDB chain. Mol* remains the source of truth for the rendered selector.

Version 1 of this YAML format accepts integer ranges. It does not separately target insertion codes such as `42A` versus `42B`; an `auth` range containing residue number 42 can include matching insertion-code residues.

## Overlapping regions

Region colors are applied in YAML order. When two enabled regions overlap, the later entry takes color priority in the overlapping residues.

```yaml
regions:
  - name: Whole domain
    start: 1
    end: 100
    color: "#2563EB"

  - name: Active site inside the domain
    start: 45
    end: 52
    color: "#DC2626"
```

Residues 45–52 appear red because the active-site entry comes later.

## Mol* layout options

The layout selector changes which standard Mol* interface regions are visible without reloading the PDB or rebuilding the annotation scene.

| `defaultLayout` value | Interface shown |
|---|---|
| `canvas` | 3D canvas only. |
| `sequence` | Amino-acid/nucleic-acid sequence above the 3D canvas. |
| `controls` | 3D canvas with the right-side Mol* controls. |
| `sequence-controls` | Sequence panel, 3D canvas, and right-side controls. |
| `full` | Sequence, left data tree, right controls, and bottom log. |

`sequence-controls` is the recommended default for protein inspection.

## Hosted repository mode

1. Copy a PDB file into `pdb/`.
2. Copy its YAML annotation into `annotations/`.
3. Update `config.js`:

```js
window.PROTEIN_REGION_VIEWER_CONFIG = {
  title: 'My annotated protein',
  subtitle: 'Functional regions and insertions',
  autoLoad: true,
  pdbUrl: './pdb/my-protein.pdb',
  yamlUrl: './annotations/my-protein.yaml',
  defaultLayout: 'sequence-controls'
};
```

4. Commit and push to the branch published by GitHub Pages.

The two files load automatically when the page opens.

## Local file mode

Use **Choose PDB** and **Choose YAML**, then click **Load selected pair**. You may also drop both files onto the viewer.

Local files are read with the browser File API and are not uploaded by this application. The Mol* scene is built from an in-memory Blob URL that is revoked after loading.

File-size limits:

- PDB: 50 MB.
- YAML: 2 MB.

These limits are defined at the top of `app.js` and can be adjusted for trusted deployments.

## Validation and warnings

The application rejects malformed YAML and invalid region definitions, including:

- missing `regions` list;
- missing name, range, or color;
- non-integer residue numbers;
- `start` greater than `end`;
- unsupported representation or selector values;
- invalid color syntax;
- a PDB with no `ATOM` records.

After parsing the PDB, each enabled region receives a lightweight residue-coverage check. `NO MATCH` in the legend means that no parsed PDB residue matched that chain/range combination. Common causes are:

- the wrong chain identifier;
- `auth`/`label` numbering mismatch;
- a range outside the structure;
- a PDB containing only a fragment of the expected sequence.

A warning does not prevent the other valid regions from loading.

## GitHub Pages deployment

The repository includes `.github/workflows/pages.yml`.

1. Create a GitHub repository.
2. Put all project files at the repository root.
3. Push to the `main` branch.
4. Open **Settings → Pages**.
5. Select **GitHub Actions** as the source.
6. Open the **Actions** tab and run **Deploy GitHub Pages**, or push another commit.

The project URL normally has this form:

```text
https://YOUR-USER.github.io/YOUR-REPOSITORY/
```

## Safari cache

Safari may continue using an older `config.js`, `app.js`, or `styles.css` after a deployment.

To force a fresh copy:

1. Enable **Safari → Settings → Advanced → Show features for web developers**.
2. Use **Develop → Empty Caches**.
3. Reload with `Command + R`.

The HTML already uses version query strings:

```html
<link rel="stylesheet" href="./styles.css?v=1">
<script src="./config.js?v=1"></script>
<script defer src="./app.js?v=1"></script>
```

After a major update, change all three values from `v=1` to `v=2`.

## Browser console API

The page exposes a small helper API:

```js
ProteinRegionViewer.getState()
ProteinRegionViewer.loadConfigured()
ProteinRegionViewer.loadSelectedFiles()
ProteinRegionViewer.reload()
ProteinRegionViewer.setLayout('full')
```

`getState()` returns file names, layout, region ranges, colors, chains, and the number of residues found by the lightweight PDB coverage check.

## Technical implementation

The browser parses YAML with `js-yaml`, validates it, and translates each enabled region into a MolViewSpec residue selector. A base MolViewSpec representation is colored first, followed by one color node per region. The generated scene is passed to Mol* with `loadMVS(..., { replaceExisting: true })`.

For `auth` numbering, selectors use:

```js
{
  auth_asym_id: 'A',
  beg_auth_seq_id: 10,
  end_auth_seq_id: 50
}
```

For `label` numbering, selectors use:

```js
{
  label_asym_id: 'A',
  beg_label_seq_id: 10,
  end_label_seq_id: 50
}
```

The application pins Mol* `5.11.0` and `js-yaml` `5.4.1` in `index.html` for reproducible deployments.

## Troubleshooting

### The page loads, but the configured pair does not

- Confirm both URLs in `config.js` are correct and case-sensitive.
- Open each URL directly in the browser.
- Confirm GitHub Actions completed successfully.
- Confirm the files were committed, not only added locally.
- For external URLs, confirm the host allows CORS.

### The PDB loads, but no region is colored

- Check whether the legend displays `NO MATCH`.
- Confirm chain IDs and residue ranges.
- Try changing `numbering: auth` to `numbering: label`, or vice versa.
- Confirm the base selector is appropriate; `protein` excludes nucleic acids.

### The sequence panel is missing

Choose **Sequence + 3D**, **Sequence + controls**, or **Full Mol* interface**. A sequence panel can only display polymer sequences recognized in the loaded structure.

### The viewer is blank

- Confirm browser hardware acceleration and WebGL2 support.
- Inspect the browser console for CDN, PDB parsing, or YAML errors.
- Test with the included demo pair.

### The full interface is crowded on a small screen

Use `sequence`, `controls`, or `canvas`, then open the viewer fullscreen.

## Security and privacy

- Local files are not uploaded by this project.
- YAML text is parsed as data and is not executed as JavaScript.
- UI text is inserted through DOM text nodes rather than HTML interpolation.
- The project validates YAML structure, values, colors, and file sizes.
- External PDB/YAML URLs are subject to the external host's privacy and CORS policies.

## License

MIT. See [`LICENSE`](LICENSE).

Mol* is a separate open-source project. Cite the Mol* and MolViewSpec publications when appropriate for scientific work.
