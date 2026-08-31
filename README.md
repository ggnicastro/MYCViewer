# Mol* PDB + YAML Protein Region Viewer

A static, browser-based Mol* Viewer application that loads one PDB structure and one YAML annotation file, colors residue ranges, and creates a separately named Mol* component for every enabled region.

The project is designed for GitHub Pages and does not require a build step, backend, database, or API key. Hosted files can load automatically from the repository. Local PDB/YAML pairs are processed only inside the browser tab.

## What the application creates

For one PDB/YAML pair, the viewer builds two complementary layers:

1. **Colored base view** — one compact protein representation, with YAML regions colored in file order.
2. **Named region components** — one independent Mol* component per enabled region, each with its own selector, name, representation type, color, opacity, visibility, tooltip, and optional 3D label.

The region components are hidden initially by default. This prevents their geometry from being drawn on top of the already colored base view. In a layout containing the Mol* **Controls** panel, use the eye control beside the region representation to show it, then hide **Base structure** to isolate that region.

## Features

- Load one `.pdb` structure and one `.yaml`/`.yml` annotation file.
- Define 1, 3, 5, 10, or any other practical number of residue regions.
- Color every region on a single compact base representation.
- Create one named Mol* component for every enabled YAML region.
- Show, hide, focus, and restyle generated components from the standard Mol* controls.
- Choose global or per-region component names, representation types, and opacity.
- Choose whether components start visible or hidden.
- Use inclusive `start` and `end` residue numbers.
- Select author/PDB numbering (`auth`) or sequential Mol* numbering (`label`).
- Apply regions to one chain, multiple chains, or all chains.
- Add descriptions, hover tooltips, and optional 3D labels.
- Display a generated legend with component status, range coverage, and validation warnings.
- Switch between 3D-only, sequence, controls, and full Mol* layouts without reloading the structure.
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
├── UPDATE.md
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

`config.js` controls the application title, automatic hosted-file loading, source paths, and initial Mol* layout.

```js
window.PROTEIN_REGION_VIEWER_CONFIG = {
  title: 'Protein Region Viewer',
  subtitle: 'Color PDB residue ranges and create named Mol* components from YAML',

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

For GitHub Pages, relative paths such as `./pdb/protein.pdb` are recommended. They continue to work when the site is hosted under a repository path.

Set `autoLoad: false` and leave both URLs empty to use the application only as a local file viewer.

## YAML annotation format

Minimal example with generated components:

```yaml
version: 1
title: My protein regions
numbering: auth
default_chain: A

viewer:
  representation: cartoon
  base_color: "#CBD5E1"
  background: "#FFFFFF"

  create_components: true
  component_representation: cartoon
  components_visible: false
  component_opacity: 1.0
  base_component_name: Base structure

regions:
  - name: N-terminal domain
    start: 1
    end: 85
    color: "#2563EB"

  - name: Catalytic region
    start: 86
    end: 170
    color: "#F97316"
    component_name: Catalytic region atoms
    component_representation: ball_and_stick
    component_opacity: 0.9

  - name: C-terminal domain
    start: 171
    end: 260
    color: "#10B981"
```

`start` and `end` are inclusive. The example colors residues 1 through 85, including both endpoints.

The `regions` list accepts up to 1,000 entries as a defensive limit. Because each component consumes Mol* state and rendering resources, the application also limits YAML-generated component nodes to 250. Disable `create_component`, `tooltip`, or `label` on entries that do not need independent component nodes.

## Top-level YAML properties

| Property | Required | Description |
|---|---:|---|
| `version` | No | Schema version marker. Version `1` is used by this project. |
| `title` | No | Annotation title shown above the viewer and legend. |
| `numbering` | No | Global residue numbering mode: `auth` or `label`. Default: `auth`. |
| `default_chain` | No | Default chain for regions that do not define their own chain. |
| `viewer` | No | Base view, component, tooltip, label, and canvas settings. |
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

  create_components: true
  component_representation: cartoon
  components_visible: false
  component_opacity: 1.0
  base_component_name: Base structure
```

| Property | Default | Description |
|---|---|---|
| `representation` | `cartoon` | Representation used by the compact colored base view. |
| `selector` | `protein` | Part of the structure that receives the base representation. |
| `base_color` | `#CBD5E1` | Color used outside annotated regions. |
| `background` | `#FFFFFF` | Mol* canvas background color. |
| `show_labels` | `false` | Global default for 3D region labels. |
| `show_tooltips` | `true` | Global default for region hover tooltips. |
| `create_components` | `true` | Creates a separately named Mol* component for every enabled region. |
| `component_representation` | same as `representation` | Default representation type for generated region components. |
| `components_visible` | `false` | Determines whether generated component representations are visible immediately after loading. |
| `component_opacity` | `1.0` | Default opacity of generated component representations, from `0` to `1`. |
| `base_component_name` | `Base structure` | Name assigned to the compact base component in Mol*. |

Supported representation values:

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

## Mol* region components

Each enabled region can become a standard component in the Mol* structure hierarchy. Its name defaults to the YAML `name` field and can be overridden with `component_name`.

With this YAML:

```yaml
regions:
  - name: RNase H insertion
    start: 120
    end: 185
    color: "#8B5CF6"

  - name: Zinc-binding region
    start: 240
    end: 275
    color: "#F59E0B"
```

Mol* receives components named:

```text
Base structure
RNase H insertion
Zinc-binding region
```

### Managing components in the viewer

Choose one of these layouts:

```text
Controls + 3D
Sequence + controls
Full Mol* interface
```

Then use the right-side Mol* controls to:

- show or hide an individual region;
- focus the camera on a region;
- change its representation type;
- change its color or other visual parameters;
- hide `Base structure` and isolate only selected regions.

### Why components are hidden by default

The base component already contains the complete protein and carries all YAML colors. Drawing every independent region component at the same time would duplicate geometry and can make the image heavier or visually confusing.

The recommended default is therefore:

```yaml
viewer:
  create_components: true
  components_visible: false
```

The colored base view appears immediately, while the named components remain available in Mol* for interactive inspection.

To show all region components immediately:

```yaml
viewer:
  components_visible: true
```

To disable independent components and keep only base coloring:

```yaml
viewer:
  create_components: false
```

Tooltips or 3D labels can still require internal selection nodes even when visual component representations are disabled.

## Region properties

Canonical region syntax:

```yaml
- name: RNA-binding insertion
  chain: A
  numbering: auth
  start: 120
  end: 185
  color: "#8B5CF6"

  create_component: true
  component_name: RNA-binding insertion atoms
  component_representation: ball_and_stick
  component_opacity: 0.85
  component_visible: false

  label: false
  tooltip: true
  description: Optional explanatory text.
  enabled: true
```

| Property | Required | Description |
|---|---:|---|
| `name` | Yes | Region name shown in the legend, tooltip, and Mol* component hierarchy. |
| `start` | Yes | First residue number, inclusive. |
| `end` | Yes | Last residue number, inclusive. |
| `color` | Yes | Region color for both the base color layer and generated component. |
| `chain` | No | One chain identifier. Overrides `default_chain`. |
| `chains` | No | List of chain identifiers, for example `[A, B]`. |
| `numbering` | No | Per-region override: `auth` or `label`. |
| `create_component` | No | Per-region override for independent component representation creation. |
| `component_name` | No | Name shown for the region in the Mol* component hierarchy; defaults to `name`. |
| `component_representation` | No | Per-region component representation override. |
| `component_opacity` | No | Per-region opacity override from `0` to `1`. |
| `component_visible` | No | Per-region initial visibility override. |
| `label` | No | Adds the region name as a 3D label. |
| `tooltip` | No | Enables/disables the region hover tooltip. |
| `description` | No | Additional legend and tooltip text. |
| `enabled` | No | Set to `false` to keep the entry in YAML without rendering it. |

Convenience aliases are also accepted:

- `begin` or `from` for `start`;
- `stop` or `to` for `end`;
- `colour` for `color`;
- `chain_id` for `chain`;
- `residue` for a one-residue region, replacing both `start` and `end`;
- camelCase equivalents such as `createComponent`, `componentName`, `componentRepresentation`, `componentOpacity`, and `componentVisible`.

Example of one residue:

```yaml
- name: Catalytic lysine
  residue: 42
  color: "#DC2626"
  component_representation: ball_and_stick
```

## Per-region component examples

Create a surface component only for one domain:

```yaml
- name: Membrane-facing domain
  start: 20
  end: 140
  color: "#0EA5E9"
  component_name: Membrane-facing surface
  component_representation: surface
  component_opacity: 0.65
```

Make an active site visible at startup while other components remain hidden:

```yaml
viewer:
  components_visible: false

regions:
  - name: Active site
    start: 45
    end: 52
    color: "#DC2626"
    component_representation: ball_and_stick
    component_visible: true
```

Keep one annotated range colored but omit its independent visual component:

```yaml
- name: Low-confidence tail
  start: 300
  end: 350
  color: "#94A3B8"
  create_component: false
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

Base-view colors are applied in YAML order. When two enabled regions overlap, the later entry takes color priority in the overlapping residues.

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

Residues 45–52 appear red in the base view because the active-site entry comes later.

Independent region components remain separate even when their selectors overlap. This makes it possible to toggle or restyle each overlapping region independently.

## Mol* layout options

The layout selector changes which standard Mol* interface regions are visible without reloading the PDB or rebuilding the annotation scene.

| `defaultLayout` value | Interface shown |
|---|---|
| `canvas` | 3D canvas only. |
| `sequence` | Amino-acid/nucleic-acid sequence above the 3D canvas. |
| `controls` | 3D canvas with the right-side Mol* controls. |
| `sequence-controls` | Sequence panel, 3D canvas, and right-side controls. |
| `full` | Sequence, left data tree, right controls, and bottom log. |

`sequence-controls` is the recommended default because it exposes both the polymer sequence and the component controls.

The generated components still exist in `canvas` or `sequence` layouts, but those layouts hide the right-side control panel used to manage them.

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
- unsupported base or component representation values;
- unsupported selector values;
- component opacity outside `0`–`1`;
- more than 250 YAML-generated component nodes;
- invalid color syntax;
- a PDB with no `ATOM` records.

After parsing the PDB, each enabled region receives a lightweight residue-coverage check. `NO MATCH` in the legend means that no parsed PDB residue matched that chain/range combination. Common causes are:

- the wrong chain identifier;
- `auth`/`label` numbering mismatch;
- a range outside the structure;
- a PDB containing only a fragment of the expected sequence.

A warning does not prevent other valid regions from loading.

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

The HTML uses version query strings:

```html
<link rel="stylesheet" href="./styles.css?v=2">
<script src="./config.js?v=2"></script>
<script defer src="./app.js?v=2"></script>
```

After a future major update, change all three values from `v=2` to `v=3`.

## Browser console API

The page exposes a small helper API:

```js
ProteinRegionViewer.getState()
ProteinRegionViewer.loadConfigured()
ProteinRegionViewer.loadSelectedFiles()
ProteinRegionViewer.reload()
ProteinRegionViewer.setLayout('full')
```

`getState()` returns file names, layout, region ranges, colors, chains, residue coverage, component creation state, component name, representation, opacity, and initial visibility.

## Technical implementation

The browser parses YAML with `js-yaml`, validates it, and translates each enabled region into a MolViewSpec residue selector.

The generated MolViewSpec scene contains:

- one base component and base representation;
- one color node per enabled YAML region on the base representation;
- one additional component per region when `create_component` is enabled;
- one independently colored representation under each generated region component, with optional opacity;
- optional tooltip and label nodes.

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

A small MolViewSpec custom loading extension reads metadata attached to the generated component and representation nodes. During scene loading it assigns the YAML component names and applies the initial hidden state when `component_visible: false`. This avoids fragile post-load matching by component position.

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

### The components do not appear in the interface

- Choose `controls`, `sequence-controls`, or `full` so the right-side Mol* controls are visible.
- Expand the structure/component section in the Mol* controls.
- Confirm `viewer.create_components` is not `false`.
- Confirm the region does not set `create_component: false`.
- Reload after changing the YAML.

### The components are listed but not visible in 3D

This is the expected default when:

```yaml
components_visible: false
```

Use the eye control beside the desired region representation. Hide `Base structure` to view that region by itself. Alternatively, set `component_visible: true` for one region or `components_visible: true` globally.

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
