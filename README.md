# Mol* PDB + YAML Protein Region Viewer

A static browser application that loads one PDB structure and one YAML annotation file, renders the structure with Mol*, and applies residue-region colors in a predictable override order.

The default rendering model is intentionally simple:

1. `viewer.style` defines one global Mol* appearance.
2. The application creates one visible base representation.
3. Each enabled YAML region replaces the final color for its selected residues.
4. Later regions take priority where selections overlap.
5. Named Mol* region components can exist without drawing extra geometry.

This avoids duplicate visual layers while preserving useful component names, selections, tooltips, sequence navigation, and Mol* controls.

The project is designed for GitHub Pages. It has no build step, backend, database, or API key.

## Main features

- Load one `.pdb` file and one `.yaml` or `.yml` annotation file.
- Load hosted files automatically from the repository or select local files.
- Use one global Mol* style, including the Illustrative preset.
- Control the opacity of the single visible representation.
- Select inclusive residue ranges with `start` and `end`.
- Select exact non-contiguous residues with `positions: [2, 10, 22]`.
- Select one residue with `residue: 42`.
- Apply annotations to one chain, multiple chains, or all chains.
- Use author/PDB numbering (`auth`) or sequential polymer numbering (`label`).
- Resolve overlapping colors from top to bottom in the YAML file.
- Create named Mol* selector components without automatically drawing them again.
- Add descriptions, hover tooltips, and optional 3D labels.
- Optionally opt a region into an independent representation when a second visual is genuinely needed.
- Switch among 3D, sequence, controls, sequence-plus-controls, and full Mol* layouts.
- Download the current PDB, YAML, or a clean YAML template.
- Deploy with the included GitHub Pages workflow.

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

Run a local HTTP server from the project directory:

```bash
python3 -m http.server 8000
```

Open:

```text
http://localhost:8000
```

Opening `index.html` through a `file://` URL is not recommended because browsers can block repository-style file requests.

## `config.js`

`config.js` controls the page title, hosted-file paths, automatic loading, and the initial Mol* interface layout.

```js
window.PROTEIN_REGION_VIEWER_CONFIG = {
  title: 'Protein Region Viewer',
  subtitle: 'One base Mol* style with ordered YAML region-color overrides',

  autoLoad: true,
  pdbUrl: './pdb/my-protein.pdb',
  yamlUrl: './annotations/my-protein-regions.yaml',

  defaultLayout: 'sequence-controls'
};
```

| Property | Type | Default | Description |
|---|---:|---|---|
| `title` | string | `Protein Region Viewer` | Application and browser-page title. |
| `subtitle` | string | built-in text | Description shown above the viewer controls. |
| `autoLoad` | boolean | `false` | Loads `pdbUrl` and `yamlUrl` after Mol* initializes. |
| `pdbUrl` | string | empty | Relative or CORS-enabled URL for the PDB file. |
| `yamlUrl` | string | empty | Relative or CORS-enabled URL for the YAML file. |
| `defaultLayout` | string | `sequence-controls` | Initial Mol* interface layout. |

For GitHub Pages, relative paths such as `./pdb/protein.pdb` and `./annotations/protein.yaml` are recommended.

## Recommended YAML

```yaml
version: 1
title: My protein regions
numbering: auth
default_chain: A

viewer:
  # One global visual style.
  style: illustrative
  selector: protein

  # One opacity for the single visible representation.
  base_opacity: 0.35
  background: "#FFFFFF"

  # Create named selectors, but do not draw independent region representations.
  create_components: true
  component_visuals: false
  base_component_name: Base structure

  show_labels: false
  show_tooltips: true

regions:
  - name: N-terminal domain
    start: 1
    end: 90
    color: "#2563EB"

  - name: Catalytic residues
    positions: [102, 145, 177]
    color: "#FACC15"

  - name: C-terminal domain
    start: 200
    end: 320
    color: "#10B981"
```

This produces one visible representation. The global Illustrative style is used outside annotated regions, and each `color` entry replaces the final color for its selected residues.

## Single-visual override model

The default mode is:

```yaml
viewer:
  create_components: true
  component_visuals: false
```

These settings have different roles:

- `create_components: true` creates named Mol* selection components. They can be focused, selected, used for tooltips, and edited manually from Mol* controls.
- `component_visuals: false` prevents the application from attaching an independent representation to each region component.

As a result, the protein is not drawn twice. There is one visible structure representation and one final color per atom/residue.

### Color precedence

Colors are evaluated in YAML order. A later entry replaces an earlier entry where they overlap.

```yaml
regions:
  - name: Whole domain
    start: 1
    end: 100
    color: "#2563EB"

  - name: Active-site residues
    positions: [12, 45, 88]
    color: "#FACC15"
```

The domain is blue except residues 12, 45, and 88, which are yellow.

## Illustrative style

Use:

```yaml
viewer:
  style: illustrative
```

Unless explicitly overridden, the project configures the base view with the main ingredients of Mol*'s Illustrative quick style:

- `spacefill` representation;
- native `illustrative` color theme;
- ignore-light rendering;
- outline postprocessing;
- ambient-occlusion/SSAO postprocessing.

To use Illustrative rendering with cartoon geometry:

```yaml
viewer:
  style: illustrative
  representation: cartoon
```

To keep the Illustrative geometry/postprocessing but use one fixed color outside annotated regions:

```yaml
viewer:
  style: illustrative
  base_color_theme: uniform
  base_color: "#CBD5E1"
```

With the native Illustrative color theme, `base_color` is not used unless `base_color_theme` is changed to `uniform`.

## Base opacity

```yaml
viewer:
  base_opacity: 0.35
```

Accepted values range from `0` to `1`:

```text
0.00 = fully transparent
0.25 = 25% opaque
0.50 = 50% opaque
1.00 = fully opaque
```

In strict single-visual mode, region colors are part of the same representation and therefore inherit the same opacity. A different opacity for one region requires an independent representation and is no longer strict single-visual mode.

## Residue selection forms

Each region must use exactly one selection form.

### Inclusive range

```yaml
- name: Catalytic domain
  start: 40
  end: 120
  color: "#DC2626"
```

Both endpoints are included.

### Exact positions

```yaml
- name: Catalytic residues
  positions: [42, 77, 105]
  color: "#FACC15"
```

The positions are deduplicated and sorted internally. They form one logical region and one named component.

### One residue

```yaml
- name: Catalytic lysine
  residue: 42
  color: "#DC2626"
```

`position: 42` is also accepted.

Do not combine `positions` with `start`/`end` in the same region.

## Chains

### One default chain

```yaml
default_chain: A
```

### Per-region chain

```yaml
- name: Chain B insertion
  chain: B
  start: 100
  end: 155
  color: "#F97316"
```

### Multiple chains

```yaml
- name: Conserved motif
  chains: [A, B, C]
  positions: [42, 77, 105]
  color: "#8B5CF6"
```

### All chains

Use:

```yaml
chain: all
```

or omit `default_chain`, `chain`, and `chains`.

## Numbering

### Author/PDB numbering

```yaml
numbering: auth
```

This uses residue numbers written in the PDB file and is usually the appropriate choice for selections copied from publications, PyMOL, or PDB-based analyses.

### Sequential polymer numbering

```yaml
numbering: label
```

This uses sequential polymer positions generated by Mol*. A region can override the global mode:

```yaml
- name: Sequential segment
  numbering: label
  start: 1
  end: 50
  color: "#EC4899"
```

## Named Mol* components

With:

```yaml
viewer:
  create_components: true
  component_visuals: false
```

Mol* receives a base component and one named selector component per enabled region:

```text
Base structure
N-terminal domain
Catalytic residues
C-terminal domain
```

The region components do not have automatic visual representations. They are still useful for:

- focusing the camera;
- selecting a region;
- showing hover tooltips;
- adding a representation manually through Mol* controls;
- inspecting the region in the sequence and state hierarchy.

Use a layout containing controls:

```text
Controls + 3D
Sequence + controls
Full Mol* interface
```

## Optional independent visual

A region can deliberately opt into a second representation:

```yaml
- name: Active-site atoms
  positions: [42, 77, 105]
  color: "#FACC15"

  component_visual: true
  component_representation: ball_and_stick
  component_color_theme: element-symbol
  component_opacity: 1.0
  component_visible: true
```

This is useful for atom-colored ball-and-stick, a surface, or another geometry that cannot be expressed inside the single base representation.

It also means the selected atoms are represented both in the base view and in the independent visual. Omit `component_visual` when strict single-visual behavior is required.

Global defaults for opt-in independent visuals can be defined under `viewer`:

```yaml
viewer:
  component_visuals: false
  component_representation: cartoon
  component_color_theme: uniform
  component_opacity: 1.0
  components_visible: false
```

Per-region properties override those defaults.

### Native Mol* color themes for opt-in visuals

Useful values for `component_color_theme` include:

```text
uniform
default
element-symbol
chain-id
residue-name
secondary-structure
sequence-id
hydrophobicity
molecule-type
illustrative
uncertainty
occupancy
formal-charge
```

For atom/CPK-style colors:

```yaml
component_representation: ball_and_stick
component_color_theme: element-symbol
```

Aliases `atom`, `element`, and `cpk` are normalized to `element-symbol`.

## Region properties

```yaml
- name: RNA-binding insertion
  chain: A
  numbering: auth
  start: 120
  end: 185
  color: "#8B5CF6"

  create_component: true
  component_name: RNA-binding insertion

  label: false
  tooltip: true
  description: Optional explanatory text.
  enabled: true
```

| Property | Required | Description |
|---|---:|---|
| `name` | Yes | Region name shown in the legend and Mol* hierarchy. |
| `start` | Conditional | First residue of an inclusive range. |
| `end` | Conditional | Last residue of an inclusive range. |
| `positions` | Conditional | Exact residue list, for example `[2, 10, 22]`. |
| `residue` | Conditional | One-residue shortcut. |
| `color` | Yes | Final color override for the region in the base view. |
| `chain` | No | One chain identifier. |
| `chains` | No | Multiple chain identifiers. |
| `numbering` | No | Per-region `auth` or `label` override. |
| `create_component` | No | Creates a named selector component; inherits `viewer.create_components`. |
| `component_name` | No | Name shown in the Mol* hierarchy; defaults to `name`. |
| `component_visual` | No | Adds an independent representation; default `false`. |
| `component_representation` | No | Representation for an opt-in visual. |
| `component_color_theme` | No | Native Mol* color theme for an opt-in visual. |
| `component_color` | No | Fixed color for an opt-in `uniform` visual. |
| `component_color_theme_params` | No | Advanced native theme parameters. |
| `component_opacity` | No | Opacity of an opt-in visual. |
| `component_visible` | No | Initial visibility of an opt-in visual. |
| `tooltip` | No | Enables a hover tooltip. |
| `label` | No | Adds a 3D label. |
| `description` | No | Additional legend and tooltip text. |
| `enabled` | No | Set to `false` to retain but ignore an entry. |

## Viewer settings

| Property | Default | Description |
|---|---|---|
| `style` | `default` | Global base style: `default` or `illustrative`. |
| `representation` | `cartoon`; `spacefill` under Illustrative | Geometry of the single base representation. |
| `selector` | `protein` | Static selector for the base representation. |
| `base_opacity` | `1.0` | Opacity of the single visible base representation. |
| `base_color_theme` | `uniform`; `illustrative` under Illustrative | Native Mol* base color theme outside overrides. |
| `base_color` | `#CBD5E1` | Fixed base color when `base_color_theme: uniform`. |
| `background` | `#FFFFFF` | Canvas background color. |
| `create_components` | `true` | Creates named region selector components. |
| `component_visuals` | `false` | Attaches independent region representations globally. |
| `show_tooltips` | `true` | Adds hover tooltips to region components. |
| `show_labels` | `false` | Adds region names as 3D labels. |
| `base_component_name` | `Base structure` | Name of the complete base component. |
| `component_representation` | base representation | Default geometry for opt-in visuals. |
| `component_color_theme` | `uniform` | Default color theme for opt-in visuals. |
| `component_color` | region color | Optional fixed default color for opt-in visuals. |
| `component_opacity` | `1.0` | Default opacity for opt-in visuals. |
| `components_visible` | `false` | Default initial visibility for opt-in visuals. |

Advanced mappings are supported through:

```yaml
viewer:
  base_color_theme_params: {}
  base_representation_params: {}
  postprocessing: {}
  component_color_theme_params: {}
```

These values are passed to the pinned Mol* version and therefore use Mol* parameter names.

## Layout options

| `defaultLayout` | Interface |
|---|---|
| `canvas` | 3D canvas only. |
| `sequence` | Sequence panel and 3D canvas. |
| `controls` | 3D canvas and right-side Mol* controls. |
| `sequence-controls` | Sequence, 3D canvas, and controls. |
| `full` | Sequence, left data tree, right controls, and bottom log. |

`sequence-controls` is recommended for normal use.

## Hosted repository mode

1. Place the PDB in `pdb/`.
2. Place the YAML in `annotations/`.
3. Update `config.js`.
4. Commit and push to the branch published by GitHub Pages.

Example:

```js
window.PROTEIN_REGION_VIEWER_CONFIG = {
  title: 'My annotated protein',
  subtitle: 'Functional regions',
  autoLoad: true,
  pdbUrl: './pdb/my-protein.pdb',
  yamlUrl: './annotations/my-protein.yaml',
  defaultLayout: 'sequence-controls'
};
```

Paths are case-sensitive on GitHub Pages.

## Local file mode

Select or drop one PDB and one YAML file. Local files are read inside the browser tab and are not uploaded by this application.

The download buttons return the original selected files.

## Validation

The application checks:

- PDB and YAML file sizes;
- YAML syntax and object structure;
- required region names and colors;
- integer residue positions;
- mutually exclusive selection forms;
- supported representations, styles, and color themes;
- missing chains;
- exact positions not found in the PDB;
- configured safety limits.

The legend displays `NO MATCH` or `PARTIAL` when a selection does not fully match the parsed PDB.

Defensive limits include:

- 1,000 YAML regions;
- 5,000 exact positions in one region;
- 25,000 selector expressions after chain expansion;
- 250 generated Mol* component nodes;
- 50 MB PDB file;
- 2 MB YAML file.

## GitHub Pages deployment

1. Put the project files at the repository root.
2. Open **Settings → Pages**.
3. Select **GitHub Actions** as the source.
4. Push to `main`.

The included workflow is:

```text
.github/workflows/pages.yml
```

## Safari cache

The local assets use versioned query strings in `index.html`, for example:

```html
<link rel="stylesheet" href="./styles.css?v=6">
<script src="./config.js?v=6"></script>
<script defer src="./app.js?v=6"></script>
```

After publishing another update, change the number to force a fresh browser request.

In Safari, you can also use:

```text
Develop → Empty Caches
```

then reload with `Command + R`.

## Browser console API

The page exposes:

```js
ProteinRegionViewer.version
ProteinRegionViewer.loadConfigured()
ProteinRegionViewer.loadSelectedFiles()
ProteinRegionViewer.reload()
ProteinRegionViewer.setLayout('full')
ProteinRegionViewer.getState()
```

`getState()` reports the normalized base style, component mode, residue selections, matching counts, and opt-in visual settings.

## Troubleshooting

### I see duplicate geometry

Make sure the YAML contains:

```yaml
viewer:
  component_visuals: false
```

Also remove `component_visual: true` from individual regions.

### A region is not colored

Check:

- the chain identifier;
- `auth` versus `label` numbering;
- the residue numbers;
- YAML indentation;
- whether a later region intentionally replaces its color.

### `base_opacity` also changes region opacity

That is expected in single-visual mode because all region colors belong to the same representation. Per-region opacity requires an independent visual.

### `style: illustrative` still shows cartoon

Remove an explicit `representation: cartoon`, or set:

```yaml
viewer:
  representation: spacefill
```

### A named component is not visible in 3D

That is expected when `component_visuals: false`. The component is a selector, not an automatic second representation. Use Mol* controls to add a representation manually, or explicitly set `component_visual: true` for that region.

### A ball-and-stick visual is one fixed color

Use:

```yaml
component_color_theme: element-symbol
```

### The sequence panel is missing

Select `Sequence + 3D`, `Sequence + controls`, or `Full Mol* interface`.

## Security and privacy

- Local files remain in the browser tab.
- The application has no upload endpoint.
- Hosted files are fetched only from their configured URLs.
- YAML is parsed as data and is not evaluated as JavaScript.
- File-size, nesting, alias, component, and selector limits reduce accidental browser lockups.

## Mol* and MolViewSpec

This project uses Mol* Viewer and its MolViewSpec extension. MolViewSpec color selections support ordered overrides: later selections replace earlier colors where they overlap. Named components and visual representations are separate concepts, which allows this project to preserve region components without automatically drawing duplicate geometry.

Documentation:

- Mol*: <https://molstar.org/>
- MolViewSpec: <https://molstar.org/mol-view-spec-docs/>
- Selectors: <https://molstar.org/mol-view-spec-docs/selectors/>
- Annotations and override order: <https://molstar.org/mol-view-spec-docs/annotations/>

## License

See `LICENSE`.
