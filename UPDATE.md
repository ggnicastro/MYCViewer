# Component-only update

This update corrects the rendering model:

- the full-protein `Base structure` representation has been removed;
- YAML regions retain their independent Mol* component representations;
- `viewer.component_*` properties define global defaults;
- each region may override representation, color theme, color, opacity, and visibility;
- component representations are visible by default;
- the custom YAML annotation sidebar has been removed;
- the Mol* viewer now uses the full available workspace width.

## Files to replace

Replace these files in the existing repository:

```text
app.js
index.html
styles.css
README.md
UPDATE.md
annotations/template.yaml
annotations/README.md
```

You may also replace `annotations/demo-regions.yaml` when you use the included demonstration.

Keep your own files:

```text
config.js
pdb/
annotations/your-file.yaml
.github/
```

## YAML migration

Remove base-only properties:

```yaml
viewer:
  base_opacity: 0.35
  base_color: "#CBD5E1"
  base_color_theme: illustrative
  base_component_name: Base structure
```

Use component defaults instead:

```yaml
viewer:
  style: illustrative
  component_representation: spacefill
  component_color_theme: illustrative
  component_opacity: 0.45
  components_visible: true
```

A region can then override those defaults:

```yaml
regions:
  - name: Blue domain
    start: 1
    end: 100
    color: "#2563EB"

  - name: Active-site atoms
    positions: [120, 155, 188]
    component_representation: ball_and_stick
    component_color_theme: element-symbol
    component_opacity: 1.0
```

There is no custom annotation panel beside the viewer. Use a layout containing **Controls** to manage the named components in Mol*.

The updated `index.html` uses `?v=7` for local assets. After GitHub Actions finishes, reload the site. In Safari, use **Develop → Empty Caches** followed by `Command + R` when necessary.
