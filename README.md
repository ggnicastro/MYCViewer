<div align="center">

# Mol* YAML Component Viewer

**Build interactive protein scenes from a PDB structure and a human-readable YAML component map.**

[![Mol*](https://img.shields.io/badge/Mol*-5.11.0-111827?style=flat-square)](https://molstar.org/)
[![YAML](https://img.shields.io/badge/YAML-js--yaml%205.4.1-CB171E?style=flat-square)](https://github.com/nodeca/js-yaml)
[![GitHub Pages](https://img.shields.io/badge/deployment-GitHub%20Pages-222222?style=flat-square&logo=github)](https://pages.github.com/)
[![License: MIT](https://img.shields.io/badge/license-MIT-2563EB?style=flat-square)](LICENSE)

</div>

## Overview

Mol* YAML Component Viewer is a zero-build, static web application for presenting annotated protein structures. It loads one PDB file and one YAML document, converts each YAML region into a named Mol* component, and renders the resulting scene directly in the browser.

The scene contains:

- a translucent white **Base structure** cartoon for whole-chain context;
- one native Mol* component for each enabled YAML region;
- independent representation, color theme, opacity, visibility, tooltip, and label settings per region;
- residue selections defined as ranges, exact positions, or single residues;
- optional Mol* Illustrative rendering and post-processing;
- hidden hydrogens by default;
- switchable 3D, sequence, controls, and full-interface layouts.

No server-side application, database, bundler, or build pipeline is required. The project can be hosted as-is on GitHub Pages.

## Highlights

- **YAML-driven scenes** — keep structural annotations readable, version-controlled, and separate from the PDB file.
- **Native Mol* components** — every region appears in the Mol* component hierarchy and can be focused, hidden, or restyled.
- **Flexible residue selection** — use inclusive ranges, exact residue lists, or a single position.
- **Global defaults with local overrides** — define a common style once and override only the regions that need different rendering.
- **Illustrative mode** — enable Mol* Illustrative colors, ignore-light rendering, outlines, and ambient occlusion from YAML.
- **Clean context layer** — the complete chain is shown as a white cartoon at `0.2` opacity beneath the annotated components.
- **Hydrogen-free views** — hydrogens are hidden globally and ignored by atomistic component representations.
- **Static hosting** — deploy through the included GitHub Actions workflow.
- **Local-file support** — inspect unpublished PDB and YAML files without uploading them to a server.

## Quick start

### 1. Add your files

Place the structure and annotation files in the repository:

```text
pdb/my-protein.pdb
annotations/my-protein.yaml
```

### 2. Configure the viewer

Edit `config.js`:

```js
window.PROTEIN_REGION_VIEWER_CONFIG = {
  title: 'My protein',
  subtitle: 'Functional regions and structural features',

  autoLoad: true,
  pdbUrl: './pdb/my-protein.pdb',
  yamlUrl: './annotations/my-protein.yaml',

  // canvas | sequence | controls | sequence-controls | full
  defaultLayout: 'canvas'
};
```

`canvas` is the default **3D only** layout.

### 3. Define the components

Create `annotations/my-protein.yaml`:

```yaml
version: 1
title: My protein component scene
numbering: auth
default_chain: A

viewer:
  style: illustrative
  component_representation: spacefill
  component_color_theme: illustrative
  component_opacity: 0.45
  components_visible: true
  background: "#FFFFFF"

regions:
  - name: N-terminal domain
    start: 1
    end: 90
    color: "#2563EB"

  - name: Active-site atoms
    positions: [102, 145, 177]
    component_representation: ball_and_stick
    component_color_theme: element-symbol
    component_opacity: 1.0

  - name: C-terminal surface
    start: 200
    end: 320
    component_representation: surface
    component_color_theme: uniform
    component_color: "#F97316"
    component_opacity: 0.65
```

### 4. Publish

Push the repository to GitHub, then select **Settings → Pages → GitHub Actions**. The included workflow publishes the site from the `main` branch.

## Scene model

### Base structure

The viewer automatically creates a context component before the YAML regions:

```text
Base structure
├── representation: cartoon
├── color: #FFFFFF
├── opacity: 0.2
└── hydrogens: hidden
```

Its selection is determined by `default_chain`:

- `default_chain: A` selects the complete chain `A`;
- `default_chain: [A, B]` selects complete chains `A` and `B`;
- omitting `default_chain` selects all protein chains.

The base component is intentionally subtle. Region components are rendered afterward and remain visually dominant.

### Region components

Each enabled entry in `regions` creates a named Mol* component and, by default, one representation. Components are independent: each may use a different representation, color theme, opacity, or initial visibility.

The native Mol* hierarchy therefore follows this pattern:

```text
Base structure
N-terminal domain
Active-site atoms
C-terminal surface
...
```

## Application configuration

`config.js` controls file loading and the initial interface layout.

| Property | Type | Default | Description |
|---|---:|---:|---|
| `title` | string | project title | Main application title |
| `subtitle` | string | project subtitle | Supporting text below the title |
| `autoLoad` | boolean | `true` | Loads the configured PDB and YAML on startup |
| `pdbUrl` | string | demo path | Repository-relative or absolute PDB URL |
| `yamlUrl` | string | demo path | Repository-relative or absolute YAML URL |
| `defaultLayout` | string | `canvas` | Initial Mol* interface layout |

### Layouts

| Value | Interface |
|---|---|
| `canvas` | 3D only |
| `sequence` | Sequence panel + 3D |
| `controls` | Mol* controls + 3D |
| `sequence-controls` | Sequence panel + controls + 3D |
| `full` | Full Mol* interface, including data tree and log |

The layout selector remains available after startup, so changing `defaultLayout` does not remove access to the other views.

## YAML reference

### Top-level structure

```yaml
version: 1
title: Optional scene title
numbering: auth
default_chain: A

viewer:
  # global component defaults

regions:
  # one or more region definitions
```

### Residue numbering

Use PDB author numbering:

```yaml
numbering: auth
```

Use sequential polymer numbering generated by Mol*:

```yaml
numbering: label
```

A region can override the global mode:

```yaml
- name: Sequential segment
  numbering: label
  start: 1
  end: 50
```

### Chain selection

Apply regions to a default chain:

```yaml
default_chain: A
```

Select one chain for a specific region:

```yaml
- name: Chain B domain
  chain: B
  start: 10
  end: 80
```

Select multiple chains:

```yaml
- name: Conserved motif
  chains: [A, B, C]
  positions: [42, 77, 105]
```

Select all chains:

```yaml
- name: Shared terminal region
  chain: all
  start: 1
  end: 15
```

### Selection forms

Every region uses exactly one selection form.

#### Inclusive range

```yaml
- name: Catalytic domain
  start: 80
  end: 160
```

Both `start` and `end` are included.

#### Exact positions

```yaml
- name: Catalytic residues
  positions: [2, 10, 22]
```

All positions are grouped into one named component. Duplicate positions are removed and the list is sorted internally.

#### Single residue

```yaml
- name: Catalytic lysine
  residue: 42
```

Do not combine `positions` with `start`/`end` in the same region.

## Viewer defaults

Properties under `viewer` provide defaults for the YAML region components.

```yaml
viewer:
  style: illustrative
  component_representation: spacefill
  component_color_theme: illustrative
  component_opacity: 0.45
  components_visible: true

  background: "#FFFFFF"
  create_components: true
  show_labels: false
  show_tooltips: true
```

| Property | Description |
|---|---|
| `style` | Global visual preset: `default` or `illustrative` |
| `component_representation` | Default geometry for region components |
| `component_color_theme` | Default Mol* color theme |
| `component_color` | Default fixed color when the theme is `uniform` |
| `component_opacity` | Default opacity from `0` to `1` |
| `components_visible` | Initial visibility of region representations |
| `background` | Viewer background color |
| `create_components` | Enables representation creation by default |
| `show_labels` | Enables 3D labels by default |
| `show_tooltips` | Enables region tooltips by default |
| `postprocessing` | Optional Mol* outline and SSAO settings |

These defaults apply to region components only. The Base structure remains a white cartoon at `0.2` opacity.

## Region overrides

A region inherits the viewer defaults and may override any component property:

```yaml
- name: Active-site atoms
  positions: [44, 79, 133]

  component_name: Active-site atoms
  component_representation: ball_and_stick
  component_color_theme: element-symbol
  component_opacity: 1.0
  component_visible: true

  tooltip: true
  label: false
  description: Residues forming the predicted catalytic site.
```

The effective value is resolved in this order:

1. region property;
2. corresponding `viewer` default;
3. built-in application default.

### Region properties

| Property | Description |
|---|---|
| `name` | Region name and default Mol* component name |
| `enabled` | Includes or excludes the region |
| `start`, `end` | Inclusive residue range |
| `positions` | Exact residue list |
| `residue` | Single residue selection |
| `chain`, `chains` | Chain override |
| `numbering` | `auth` or `label` override |
| `color` | Shorthand for a uniform component color |
| `create_component` | Enables or suppresses the region representation |
| `component_name` | Name shown in the Mol* component hierarchy |
| `component_representation` | Region-specific representation |
| `component_color_theme` | Region-specific Mol* color theme |
| `component_color` | Region-specific fixed color |
| `component_opacity` | Region-specific opacity |
| `component_visible` | Initial visibility |
| `tooltip` | Enables the Mol* hover tooltip |
| `label` | Enables a 3D label |
| `description` | Additional tooltip text |

### `color` shorthand

This concise form:

```yaml
- name: Blue domain
  start: 1
  end: 100
  color: "#2563EB"
```

is equivalent to:

```yaml
- name: Blue domain
  start: 1
  end: 100
  component_color_theme: uniform
  component_color: "#2563EB"
```

An explicit `component_color_theme` takes priority over `color`:

```yaml
- name: Atom-colored site
  positions: [25, 80, 121]
  color: "#FACC15"
  component_representation: ball_and_stick
  component_color_theme: element-symbol
```

The component above uses native element colors rather than the yellow shorthand color.

## Illustrative style

Enable Mol* Illustrative rendering with:

```yaml
viewer:
  style: illustrative
```

Unless explicitly overridden, the preset supplies:

- `spacefill` representation;
- `illustrative` color theme;
- ignore-light rendering;
- outlines;
- ambient occlusion/SSAO.

A region can still override the global style:

```yaml
- name: Active-site atoms
  positions: [44, 79, 133]
  component_representation: ball_and_stick
  component_color_theme: element-symbol
  component_opacity: 1.0
```

The Illustrative post-processing applies to the scene, while the Base structure remains a translucent white cartoon.

## Representations

Supported `component_representation` values:

| Value | Typical use |
|---|---|
| `cartoon` | Protein domains and secondary structure |
| `backbone` | Lightweight polymer trace |
| `ball_and_stick` | Active sites and atomic contacts |
| `line` | Compact atomistic views |
| `spacefill` | Molecular volume and Illustrative scenes |
| `surface` | Accessible surface and pocket context |
| `putty` | Variable-width polymer representation |
| `carbohydrate` | Carbohydrate structures |

Hydrogens are hidden automatically for atomistic representations.

## Color themes

Common `component_color_theme` values include:

| Value | Result |
|---|---|
| `uniform` | One fixed color from `component_color` or `color` |
| `default` | Representation-specific Mol* default |
| `element-symbol` | Element/CPK atom colors |
| `chain-id` | Color by chain |
| `residue-name` | Color by residue type |
| `secondary-structure` | Color by secondary structure |
| `sequence-id` | Sequence-position gradient |
| `hydrophobicity` | Hydrophobicity scale |
| `molecule-type` | Protein, nucleic acid, ligand, water, and related types |
| `illustrative` | Mol* Illustrative color theme |
| `uncertainty` | Coordinate uncertainty/B-factor-based coloring |
| `occupancy` | Atomic occupancy |
| `formal-charge` | Formal charge |

The aliases `atom`, `element`, and `cpk` are normalized to `element-symbol`.

## Advanced Mol* parameters

Representation parameters can be defined globally:

```yaml
viewer:
  component_representation_params:
    ignoreLight: true
```

A region mapping is merged over the global mapping:

```yaml
- name: Detailed surface
  start: 50
  end: 150
  component_representation: surface
  component_representation_params:
    quality: high
```

Color-theme parameters can also be passed through:

```yaml
viewer:
  component_color_theme: chain-id
  component_color_theme_params:
    asymId: auth
```

Post-processing options:

```yaml
viewer:
  postprocessing:
    enable_outline: true
    enable_ssao: true
```

These advanced mappings are passed to Mol* and therefore depend on the selected representation or color theme.

## Component visibility and overlap

Show every region initially:

```yaml
viewer:
  components_visible: true
```

Start one representation hidden:

```yaml
- name: Optional surface
  start: 200
  end: 300
  component_representation: surface
  component_visible: false
```

Hidden components remain available in the native Mol* controls.

Region components are independent representations. When selections overlap, both geometries are drawn over the shared residues. This is useful for highlighting an active site with ball-and-stick over a domain surface, but non-overlapping selections are recommended when duplicate geometry is not desired.

## Local files and privacy

The toolbar can load a local `.pdb` file and a local `.yaml`/`.yml` file. File contents are read by the browser and are not uploaded by this application.

For reliable local testing, serve the repository through HTTP instead of opening `index.html` with a `file://` URL:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## Downloads

After a scene loads, the interface provides:

- **Download PDB** — downloads the active structure source;
- **Download YAML** — downloads the active annotation source;
- **YAML template** — downloads a reusable annotation template.

For local inputs, the original selected files are used.

## GitHub Pages deployment

The repository includes `.github/workflows/pages.yml`.

1. Create a GitHub repository.
2. Place the project files at the repository root.
3. Push to the `main` branch.
4. Open **Settings → Pages**.
5. Select **GitHub Actions** as the source.
6. Open the **Actions** tab and confirm that the deployment completes successfully.

A project site is typically published at:

```text
https://USERNAME.github.io/REPOSITORY/
```

Paths in `config.js` are case-sensitive on GitHub Pages.

## Repository structure

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

## Safety limits

The browser application applies defensive limits to prevent accidental resource exhaustion:

| Resource | Limit |
|---|---:|
| PDB file size | 50 MB |
| YAML file size | 2 MB |
| YAML regions | 1,000 |
| Positions per region | 5,000 |
| Generated Mol* components | 250 |
| Selector expressions | 25,000 |

Large structures and many simultaneous surface or spacefill representations may still be constrained by available GPU memory.

## Troubleshooting

### The viewer opens but no structure appears

- Confirm that `pdbUrl` and `yamlUrl` point to existing files.
- Check filename capitalization.
- Confirm that the YAML contains at least one enabled region matching the PDB.
- Verify that at least one matching region has `create_component: true`.
- Open the browser developer console for validation details.

### A region does not match residues

- Verify whether the annotation uses `auth` or `label` numbering.
- Check the chain ID in the PDB.
- Confirm that `start`, `end`, `positions`, or `residue` refer to residues present in the selected chain.

### A fixed color is not used

An explicit non-uniform `component_color_theme` overrides `color` and `component_color`. Use:

```yaml
component_color_theme: uniform
component_color: "#2563EB"
```

### Two representations occupy the same residues

The YAML entries overlap. This is expected for independent Mol* components. Adjust the residue selections, hide one component, or use the overlap intentionally for a secondary highlight.

### The sequence panel is missing

Choose `Sequence + 3D`, `Sequence + controls`, or `Full Mol* interface` from the layout selector.

### Safari shows an older version

After a GitHub Pages deployment, use **Develop → Empty Caches**, then reload with `Command + R`. Confirm that the latest GitHub Actions run completed successfully.

## Included demo

The repository includes a synthetic demonstration PDB and a matching YAML annotation. They are intended only to validate the interface and configuration workflow and must not be treated as scientific reference data.

## Dependencies

- [Mol* Viewer 5.11.0](https://molstar.org/)
- [js-yaml 5.4.1](https://github.com/nodeca/js-yaml)
- GitHub Pages and GitHub Actions for optional static deployment

Dependencies are loaded from jsDelivr; no package installation is required for normal use.

## License

This project is available under the [MIT License](LICENSE).
