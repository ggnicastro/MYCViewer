# Update: single visible representation with ordered region overrides

This version changes the default region-component behavior to match a strict single-visual workflow.

## What changed

- `viewer.style` defines one global base appearance.
- The base structure has one visible representation.
- Every region's `color` replaces the final color for its selector.
- Later YAML entries take priority in overlaps.
- `create_components: true` creates named selector components without drawing extra geometry.
- New `component_visuals: false` is the default.
- New per-region `component_visual: true` deliberately opts into an independent representation.
- `base_opacity` applies to the whole single representation, including region-color overrides.

## Recommended YAML

```yaml
viewer:
  style: illustrative
  selector: protein
  base_opacity: 0.35
  create_components: true
  component_visuals: false

regions:
  - name: Domain
    start: 1
    end: 100
    color: "#2563EB"

  - name: Active site
    positions: [12, 45, 88]
    color: "#FACC15"
```

## Updating an existing deployment

Replace:

```text
app.js
index.html
README.md
UPDATE.md
annotations/template.yaml
annotations/demo-regions.yaml
annotations/README.md
```

Keep your existing:

```text
config.js
pdb/
annotations/your-own-files.yaml
.github/
```

Then add to your YAML:

```yaml
viewer:
  component_visuals: false
```

Remove any per-region `component_visual: true` entries unless you intentionally want an additional representation.

The updated `index.html` uses `?v=6` for local assets to reduce stale-cache problems in Safari.
