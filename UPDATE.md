# Base-context update

This is a deliberately small change to the component-based viewer.

## What changed

- An automatic Mol* component named `Base structure` is created before the YAML region components.
- It selects the complete chain or chains declared by `default_chain`.
- When `default_chain` is omitted or set to `all`, it selects all protein chains.
- Its representation is always `cartoon`.
- Its color is always white (`#FFFFFF`).
- Its opacity is always `0.2`.
- YAML region components are created afterwards and keep all existing inheritance and per-region override behavior.
- Mol* hydrogen display is set to `Hide All`.
- Atomistic region representations are also generated with hydrogen drawing disabled.

No sidebar, layout, file-loading, download, YAML selection, component-color, or component-representation behavior was otherwise changed.

## Files to replace

Replace only:

```text
app.js
index.html
```

The included `README.md` is documentation only.

Keep your existing:

```text
styles.css
config.js
pdb/
annotations/your-file.yaml
.github/
```

No YAML migration is required.

The new `index.html` loads `app.js?v=8`. After GitHub Actions finishes, Safari should fetch the new script. If it does not, use **Develop → Empty Caches**, then press `Command + R`.
