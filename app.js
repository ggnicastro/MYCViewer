(() => {
  'use strict';

  const APP_VERSION = '1.2.0';
  const MAX_PDB_BYTES = 50 * 1024 * 1024;
  const MAX_YAML_BYTES = 2 * 1024 * 1024;
  const MAX_REGIONS = 1000;
  const MAX_COMPONENTS = 250;
  const REGION_COMPONENT_CUSTOM_KEY = 'protein_region_viewer_component';
  const DEFAULT_LAYOUT = 'sequence-controls';
  const DEFAULT_BASE_COLOR = '#CBD5E1';
  const DEFAULT_BACKGROUND = '#FFFFFF';

  const LAYOUTS = Object.freeze({
    canvas: Object.freeze({
      label: '3D only',
      showControls: false,
      regionState: Object.freeze({ left: 'hidden', top: 'hidden', right: 'hidden', bottom: 'hidden' })
    }),
    sequence: Object.freeze({
      label: 'Sequence + 3D',
      showControls: true,
      regionState: Object.freeze({ left: 'hidden', top: 'full', right: 'hidden', bottom: 'hidden' })
    }),
    controls: Object.freeze({
      label: 'Controls + 3D',
      showControls: true,
      regionState: Object.freeze({ left: 'hidden', top: 'hidden', right: 'full', bottom: 'hidden' })
    }),
    'sequence-controls': Object.freeze({
      label: 'Sequence + controls',
      showControls: true,
      regionState: Object.freeze({ left: 'hidden', top: 'full', right: 'full', bottom: 'hidden' })
    }),
    full: Object.freeze({
      label: 'Full Mol* interface',
      showControls: true,
      regionState: Object.freeze({ left: 'full', top: 'full', right: 'full', bottom: 'full' })
    })
  });

  const REPRESENTATIONS = new Set([
    'cartoon', 'backbone', 'ball_and_stick', 'line', 'spacefill', 'carbohydrate', 'surface', 'putty'
  ]);
  const BASE_SELECTORS = new Set(['all', 'polymer', 'protein', 'nucleic', 'branched', 'ligand', 'ion', 'water', 'coarse']);

  // MolViewSpec supports custom loading extensions. The YAML scene adds
  // metadata to component and representation nodes; this extension converts
  // that metadata into native Mol* component names and initial visibility.
  const REGION_COMPONENT_MVS_EXTENSION = Object.freeze({
    id: 'protein-region-viewer-components',
    description: 'Name YAML-defined Mol* components and apply initial visibility',
    createExtensionContext: () => ({}),
    action: (updateTarget, node) => {
      const metadata = node?.custom?.[REGION_COMPONENT_CUSTOM_KEY];
      if (!isPlainObject(metadata)) return;

      if (node.kind === 'component') {
        const label = cleanString(metadata.label);
        if (label) {
          updateTarget.update.to(updateTarget.selector).update(params => {
            if (params && typeof params === 'object') params.label = label;
          });
        }
      }

      if (metadata.hidden === true) {
        updateTarget.update.to(updateTarget.selector).updateState({ isHidden: true });
      }
    }
  });

  const elements = {
    brandTitle: document.getElementById('brandTitle'),
    brandSubtitle: document.getElementById('brandSubtitle'),
    pageTitle: document.getElementById('pageTitle'),
    pageSubtitle: document.getElementById('pageSubtitle'),
    layoutSelect: document.getElementById('layoutSelect'),
    loadConfiguredButton: document.getElementById('loadConfiguredButton'),
    choosePdbButton: document.getElementById('choosePdbButton'),
    chooseYamlButton: document.getElementById('chooseYamlButton'),
    loadLocalButton: document.getElementById('loadLocalButton'),
    pdbFileInput: document.getElementById('pdbFileInput'),
    yamlFileInput: document.getElementById('yamlFileInput'),
    pdbFilePill: document.getElementById('pdbFilePill'),
    yamlFilePill: document.getElementById('yamlFilePill'),
    viewerCard: document.getElementById('viewerCard'),
    viewerState: document.getElementById('viewerState'),
    structureTitle: document.getElementById('structureTitle'),
    viewerOverlay: document.getElementById('viewerOverlay'),
    overlayTitle: document.getElementById('overlayTitle'),
    overlayDetail: document.getElementById('overlayDetail'),
    overlayConfiguredButton: document.getElementById('overlayConfiguredButton'),
    overlayLocalButton: document.getElementById('overlayLocalButton'),
    dropZone: document.getElementById('dropZone'),
    dropOverlay: document.getElementById('dropOverlay'),
    fullscreenButton: document.getElementById('fullscreenButton'),
    sourceSummary: document.getElementById('sourceSummary'),
    reloadButton: document.getElementById('reloadButton'),
    downloadPdbButton: document.getElementById('downloadPdbButton'),
    downloadYamlButton: document.getElementById('downloadYamlButton'),
    downloadTemplateButton: document.getElementById('downloadTemplateButton'),
    annotationTitle: document.getElementById('annotationTitle'),
    annotationSummary: document.getElementById('annotationSummary'),
    regionCount: document.getElementById('regionCount'),
    legendList: document.getElementById('legendList'),
    toast: document.getElementById('toast')
  };

  const config = normalizeConfig(window.PROTEIN_REGION_VIEWER_CONFIG || {});
  const state = {
    viewer: null,
    selectedPdbFile: null,
    selectedYamlFile: null,
    current: null,
    loadGeneration: 0,
    toastTimer: null,
    dragDepth: 0,
    fallbackFullscreen: false
  };

  function normalizeLayout(value) {
    const raw = String(value || '').trim().toLowerCase();
    const aliases = {
      '3d': 'canvas',
      viewer: 'canvas',
      structure: 'canvas',
      'sequence+3d': 'sequence',
      'controls+3d': 'controls',
      'sequence+controls': 'sequence-controls',
      interface: 'full'
    };
    const candidate = aliases[raw] || raw;
    return Object.prototype.hasOwnProperty.call(LAYOUTS, candidate) ? candidate : DEFAULT_LAYOUT;
  }

  function normalizeConfig(raw) {
    const title = cleanString(raw.title) || 'Protein Region Viewer';
    const subtitle = cleanString(raw.subtitle) || 'Color PDB residue ranges and create named Mol* components from YAML';
    return {
      title,
      subtitle,
      autoLoad: Boolean(raw.autoLoad),
      pdbUrl: cleanString(raw.pdbUrl || raw.structureUrl || ''),
      yamlUrl: cleanString(raw.yamlUrl || raw.annotationUrl || ''),
      defaultLayout: normalizeLayout(raw.defaultLayout || raw.layout)
    };
  }

  function cleanString(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function isPlainObject(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
  }

  function toBoolean(value, fallback) {
    if (value === undefined || value === null || value === '') return fallback;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    const text = String(value).trim().toLowerCase();
    if (['true', 'yes', 'on', '1'].includes(text)) return true;
    if (['false', 'no', 'off', '0'].includes(text)) return false;
    return fallback;
  }

  function normalizeColor(value, fallback, path) {
    const raw = cleanString(value || fallback);
    if (/^#[0-9a-f]{3}$/i.test(raw)) {
      return `#${raw.slice(1).split('').map(char => char + char).join('').toUpperCase()}`;
    }
    if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toUpperCase();
    if (/^[a-z]+$/i.test(raw)) {
      const excluded = new Set(['transparent', 'currentcolor', 'inherit', 'initial', 'unset', 'revert', 'revertlayer']);
      const probe = document.createElement('span');
      probe.style.color = '';
      probe.style.color = raw;
      if (probe.style.color && !excluded.has(raw.toLowerCase())) return raw.toLowerCase();
    }
    throw new Error(`${path} must be a hexadecimal color such as #2563EB or a valid X11 color name.`);
  }

  function normalizeRepresentation(value, fallback, path) {
    const normalized = cleanString(value ?? fallback).toLowerCase().replaceAll('-', '_');
    if (!REPRESENTATIONS.has(normalized)) {
      throw new Error(`${path} "${normalized}" is not supported.`);
    }
    return normalized;
  }

  function numberInRange(value, fallback, path, min = 0, max = 1) {
    if (value === undefined || value === null || value === '') return fallback;
    const parsed = typeof value === 'number' ? value : Number(String(value).trim());
    if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
      throw new Error(`${path} must be a number from ${min} to ${max}.`);
    }
    return parsed;
  }

  function normalizeNumbering(value, fallback = 'auth') {
    const normalized = cleanString(value || fallback).toLowerCase();
    if (normalized === 'author') return 'auth';
    if (normalized === 'sequential') return 'label';
    if (normalized !== 'auth' && normalized !== 'label') {
      throw new Error(`numbering must be "auth" or "label", not "${normalized}".`);
    }
    return normalized;
  }

  function normalizeChains(value, fallback = null) {
    const source = value === undefined || value === null || value === '' ? fallback : value;
    if (source === undefined || source === null || source === '') return [];
    const list = Array.isArray(source) ? source : String(source).split(',');
    const normalized = [];
    for (const item of list) {
      const chain = String(item ?? '').trim();
      if (!chain || chain === '*' || chain.toLowerCase() === 'all') return [];
      if (!normalized.includes(chain)) normalized.push(chain);
    }
    return normalized;
  }

  function integerField(value, path) {
    const parsed = typeof value === 'number' ? value : Number(String(value).trim());
    if (!Number.isInteger(parsed) || Math.abs(parsed) > 100000000) {
      throw new Error(`${path} must be an integer residue number.`);
    }
    return parsed;
  }

  function parseYamlAnnotation(text, filename = 'annotation.yaml') {
    const yamlApi = window.jsyaml || window.jsYaml || window.JSYAML || window['js-yaml'];
    if (!yamlApi || typeof yamlApi.load !== 'function') {
      throw new Error('The YAML parser did not load. Check the js-yaml CDN request.');
    }

    let raw;
    try {
      raw = yamlApi.load(text, {
        filename,
        maxDepth: 50,
        maxAliases: 1000,
        maxTotalMergeKeys: 1000
      });
    } catch (error) {
      const message = error?.mark
        ? `${error.reason || error.message} at line ${error.mark.line + 1}, column ${error.mark.column + 1}`
        : error?.message || String(error);
      throw new Error(`Invalid YAML: ${message}`);
    }

    if (!isPlainObject(raw)) throw new Error('The YAML document must contain a top-level mapping/object.');
    const viewerRaw = isPlainObject(raw.viewer) ? raw.viewer : {};
    const globalNumbering = normalizeNumbering(raw.numbering ?? viewerRaw.numbering ?? 'auth');
    const defaultChains = normalizeChains(raw.default_chain ?? raw.defaultChain ?? raw.chain ?? null);
    const regionsRaw = raw.regions;
    if (!Array.isArray(regionsRaw)) throw new Error('The YAML file must contain a regions: list.');
    if (regionsRaw.length > MAX_REGIONS) throw new Error(`The YAML file contains more than ${MAX_REGIONS} regions.`);

    const representationRaw = normalizeRepresentation(
      viewerRaw.representation ?? raw.representation ?? 'cartoon',
      'cartoon',
      'viewer.representation'
    );
    const componentRepresentationRaw = normalizeRepresentation(
      viewerRaw.component_representation ?? viewerRaw.componentRepresentation,
      representationRaw,
      'viewer.component_representation'
    );
    const baseSelector = cleanString(viewerRaw.selector || raw.selector || 'protein').toLowerCase();
    if (!BASE_SELECTORS.has(baseSelector)) throw new Error(`viewer.selector "${baseSelector}" is not supported.`);

    const annotation = {
      version: String(raw.version ?? 1),
      title: cleanString(raw.title) || filename,
      numbering: globalNumbering,
      defaultChains,
      viewer: {
        representation: representationRaw,
        selector: baseSelector,
        baseColor: normalizeColor(viewerRaw.base_color ?? viewerRaw.baseColor ?? raw.base_color, DEFAULT_BASE_COLOR, 'viewer.base_color'),
        background: normalizeColor(viewerRaw.background ?? raw.background, DEFAULT_BACKGROUND, 'viewer.background'),
        showLabels: toBoolean(viewerRaw.show_labels ?? viewerRaw.showLabels ?? raw.show_labels, false),
        showTooltips: toBoolean(viewerRaw.show_tooltips ?? viewerRaw.showTooltips ?? raw.show_tooltips, true),
        createComponents: toBoolean(viewerRaw.create_components ?? viewerRaw.createComponents, true),
        componentRepresentation: componentRepresentationRaw,
        componentsVisible: toBoolean(viewerRaw.components_visible ?? viewerRaw.componentsVisible, false),
        componentOpacity: numberInRange(
          viewerRaw.component_opacity ?? viewerRaw.componentOpacity,
          1,
          'viewer.component_opacity'
        ),
        baseComponentName: cleanString(viewerRaw.base_component_name ?? viewerRaw.baseComponentName) || 'Base structure'
      },
      regions: []
    };

    regionsRaw.forEach((entry, index) => {
      const path = `regions[${index}]`;
      if (!isPlainObject(entry)) throw new Error(`${path} must be an object.`);
      const enabled = toBoolean(entry.enabled, true);
      const name = cleanString(entry.name || entry.label || entry.title);
      if (!name) throw new Error(`${path}.name is required.`);

      const singleResidue = entry.residue ?? entry.position;
      const startValue = entry.start ?? entry.begin ?? entry.from ?? singleResidue;
      const endValue = entry.end ?? entry.stop ?? entry.to ?? singleResidue;
      if (startValue === undefined || endValue === undefined) {
        throw new Error(`${path} requires start and end residue numbers.`);
      }
      const start = integerField(startValue, `${path}.start`);
      const end = integerField(endValue, `${path}.end`);
      if (start > end) throw new Error(`${path}.start (${start}) cannot be greater than end (${end}).`);

      const numbering = normalizeNumbering(entry.numbering, globalNumbering);
      const chainValue = entry.chains ?? entry.chain ?? entry.chain_id ?? entry.chainId;
      const chains = normalizeChains(chainValue, defaultChains);
      const color = normalizeColor(entry.color ?? entry.colour, '', `${path}.color`);
      const description = cleanString(entry.description || entry.note || '');
      const createComponent = toBoolean(
        entry.create_component ?? entry.createComponent ?? entry.component,
        annotation.viewer.createComponents
      );
      const componentName = cleanString(entry.component_name ?? entry.componentName) || name;
      const componentRepresentation = normalizeRepresentation(
        entry.component_representation ?? entry.componentRepresentation ?? entry.representation,
        annotation.viewer.componentRepresentation,
        `${path}.component_representation`
      );
      const componentOpacity = numberInRange(
        entry.component_opacity ?? entry.componentOpacity,
        annotation.viewer.componentOpacity,
        `${path}.component_opacity`
      );

      annotation.regions.push({
        index,
        enabled,
        name,
        start,
        end,
        color,
        numbering,
        chains,
        label: toBoolean(entry.label_3d ?? entry.show_label ?? entry.label, annotation.viewer.showLabels),
        tooltip: toBoolean(entry.tooltip, annotation.viewer.showTooltips),
        description,
        createComponent,
        componentName,
        componentRepresentation,
        componentOpacity,
        componentVisible: toBoolean(
          entry.component_visible ?? entry.componentVisible,
          annotation.viewer.componentsVisible
        )
      });
    });

    const enabledCount = annotation.regions.filter(region => region.enabled).length;
    if (enabledCount === 0) throw new Error('The YAML file does not contain any enabled regions.');

    const componentNodeCount = annotation.regions.filter(createsMvsComponent).length;
    if (componentNodeCount > MAX_COMPONENTS) {
      throw new Error(
        `The YAML file would create ${componentNodeCount} Mol* components. ` +
        `The safety limit is ${MAX_COMPONENTS}; disable create_component, tooltip, or label on some entries.`
      );
    }
    return annotation;
  }

  function parsePdbInfo(text) {
    const chains = new Map();
    let atomCount = 0;
    let heteroAtomCount = 0;
    let inFirstModel = true;
    let sawModel = false;

    for (const line of text.split(/\r?\n/)) {
      const record = line.slice(0, 6).trim();
      if (record === 'MODEL') {
        if (!sawModel) {
          sawModel = true;
          inFirstModel = true;
        } else {
          inFirstModel = false;
        }
        continue;
      }
      if (record === 'ENDMDL' && sawModel && inFirstModel) {
        inFirstModel = false;
        continue;
      }
      if (sawModel && !inFirstModel) continue;
      if (record !== 'ATOM' && record !== 'HETATM') continue;
      if (record === 'HETATM') heteroAtomCount += 1;
      if (record !== 'ATOM') continue;

      atomCount += 1;
      const chain = line.length > 21 ? line.slice(21, 22).trim() : '';
      const authSeq = Number.parseInt(line.slice(22, 26).trim(), 10);
      const insertion = line.length > 26 ? line.slice(26, 27).trim() : '';
      const residueName = line.length > 20 ? line.slice(17, 20).trim() : '';
      if (!Number.isInteger(authSeq)) continue;

      if (!chains.has(chain)) chains.set(chain, { chain, residues: [], seen: new Set(), authNumbers: new Set(), labelNumbers: new Set() });
      const item = chains.get(chain);
      const key = `${authSeq}:${insertion}:${residueName}`;
      if (!item.seen.has(key)) {
        item.seen.add(key);
        item.residues.push({ authSeq, insertion, residueName, labelSeq: item.residues.length + 1 });
        item.authNumbers.add(authSeq);
        item.labelNumbers.add(item.residues.length);
      }
    }

    if (atomCount === 0) throw new Error('The PDB file does not contain any ATOM records.');
    const chainItems = Array.from(chains.values()).map(item => ({
      ...item,
      minAuth: item.residues.length ? Math.min(...item.residues.map(residue => residue.authSeq)) : null,
      maxAuth: item.residues.length ? Math.max(...item.residues.map(residue => residue.authSeq)) : null
    }));
    return { atomCount, heteroAtomCount, chains: chainItems };
  }

  function regionCoverage(region, pdbInfo) {
    const targetChains = region.chains.length
      ? pdbInfo.chains.filter(item => region.chains.includes(item.chain))
      : pdbInfo.chains;
    let matched = 0;
    for (const chain of targetChains) {
      const numbers = region.numbering === 'auth' ? chain.authNumbers : chain.labelNumbers;
      for (const value of numbers) {
        if (value >= region.start && value <= region.end) matched += 1;
      }
    }
    const missingChains = region.chains.filter(chain => !pdbInfo.chains.some(item => item.chain === chain));
    return { matched, missingChains };
  }

  function makeSelector(region) {
    const chainKey = region.numbering === 'auth' ? 'auth_asym_id' : 'label_asym_id';
    const startKey = region.numbering === 'auth' ? 'beg_auth_seq_id' : 'beg_label_seq_id';
    const endKey = region.numbering === 'auth' ? 'end_auth_seq_id' : 'end_label_seq_id';
    const expression = chain => {
      const selector = { [startKey]: region.start, [endKey]: region.end };
      if (chain !== null && chain !== undefined) selector[chainKey] = chain;
      return selector;
    };
    if (region.chains.length === 0) return expression(null);
    if (region.chains.length === 1) return expression(region.chains[0]);
    return region.chains.map(expression);
  }

  function regionTooltip(region) {
    const chainText = region.chains.length ? `chain ${region.chains.join(', ')}` : 'all chains';
    const base = `${region.name} · ${chainText} · ${region.numbering} residues ${region.start}–${region.end}`;
    return region.description ? `${base} · ${region.description}` : base;
  }

  function createsMvsComponent(region) {
    return region.enabled && (region.createComponent || region.tooltip || region.label);
  }

  function buildMvsData(pdbObjectUrl, annotation) {
    const extension = window.molstar?.PluginExtensions?.mvs;
    if (!extension?.MVSData?.createBuilder || typeof extension.loadMVS !== 'function') {
      throw new Error('The MolViewSpec extension is not available in the loaded Mol* bundle.');
    }

    const builder = extension.MVSData.createBuilder();
    builder.canvas({ background_color: annotation.viewer.background });
    const structure = builder
      .download({ url: pdbObjectUrl })
      .parse({ format: 'pdb' })
      .modelStructure({});

    const component = structure.component({
      selector: annotation.viewer.selector,
      ref: 'yaml-base-structure',
      custom: {
        [REGION_COMPONENT_CUSTOM_KEY]: {
          label: annotation.viewer.baseComponentName,
          role: 'base'
        }
      }
    });
    const representation = component.representation({ type: annotation.viewer.representation });
    representation.color({ color: annotation.viewer.baseColor });

    for (const region of annotation.regions) {
      if (!region.enabled) continue;
      const selector = makeSelector(region);

      // Preserve the compact, single-representation coloring behavior.
      // The independent component representation is created in addition to
      // this color layer and is hidden by default unless YAML requests it.
      representation.color({ color: region.color, selector });

      if (!createsMvsComponent(region)) continue;
      const componentRef = `yaml-region-${region.index + 1}`;
      const regionComponent = structure.component({
        selector,
        ref: componentRef,
        custom: {
          [REGION_COMPONENT_CUSTOM_KEY]: {
            label: region.componentName,
            role: 'region',
            regionIndex: region.index
          }
        }
      });

      if (region.createComponent) {
        const regionRepresentation = regionComponent.representation({
          type: region.componentRepresentation,
          ref: `${componentRef}-representation`,
          custom: {
            [REGION_COMPONENT_CUSTOM_KEY]: {
              hidden: !region.componentVisible,
              role: 'region-representation',
              regionIndex: region.index
            }
          }
        });
        regionRepresentation.color({ color: region.color });
        if (region.componentOpacity < 1) {
          regionRepresentation.opacity({ opacity: region.componentOpacity });
        }
      }
      if (region.tooltip) regionComponent.tooltip({ text: regionTooltip(region) });
      if (region.label) regionComponent.label({ text: region.name });
    }

    const mvsData = builder.getState();
    if (typeof extension.MVSData.isValid === 'function' && !extension.MVSData.isValid(mvsData)) {
      const issues = typeof extension.MVSData.validationIssues === 'function'
        ? extension.MVSData.validationIssues(mvsData)
        : 'Unknown validation issue';
      throw new Error(`The generated MolViewSpec scene is invalid: ${String(issues)}`);
    }
    return mvsData;
  }

  async function readSource(source, maxBytes, label) {
    if (source.kind === 'file') {
      if (!(source.file instanceof File)) throw new Error(`${label} file is missing.`);
      if (source.file.size > maxBytes) throw new Error(`${label} exceeds the ${formatBytes(maxBytes)} limit.`);
      return { text: await source.file.text(), name: source.file.name, sourceLabel: 'local file' };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch(source.url, { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error(`${label} request returned HTTP ${response.status}.`);
      const blob = await response.blob();
      if (blob.size > maxBytes) throw new Error(`${label} exceeds the ${formatBytes(maxBytes)} limit.`);
      return { text: await blob.text(), name: source.name || filenameFromUrl(source.url), sourceLabel: source.url };
    } catch (error) {
      if (error?.name === 'AbortError') throw new Error(`${label} request timed out.`);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async function loadPair(pdbSource, yamlSource, sourceKind) {
    if (!state.viewer) {
      showToast('Mol* is still initializing.');
      return false;
    }

    const generation = ++state.loadGeneration;
    setBusy(true);
    showOverlay('loading', 'Loading PDB + YAML', 'Reading files, validating residue ranges, and building the Mol* scene…');
    setViewerStatus('loading', 'Loading');

    try {
      const [pdbResult, yamlResult] = await Promise.all([
        readSource(pdbSource, MAX_PDB_BYTES, 'PDB'),
        readSource(yamlSource, MAX_YAML_BYTES, 'YAML')
      ]);
      if (generation !== state.loadGeneration) return false;

      const annotation = parseYamlAnnotation(yamlResult.text, yamlResult.name);
      const pdbInfo = parsePdbInfo(pdbResult.text);
      const regions = annotation.regions.map(region => ({ ...region, coverage: regionCoverage(region, pdbInfo) }));
      annotation.regions = regions;

      const pdbBlob = new Blob([pdbResult.text], { type: 'chemical/x-pdb' });
      const pdbObjectUrl = URL.createObjectURL(pdbBlob);
      try {
        const mvsData = buildMvsData(pdbObjectUrl, annotation);
        await window.molstar.PluginExtensions.mvs.loadMVS(state.viewer.plugin, mvsData, {
          sourceUrl: undefined,
          sanityChecks: true,
          replaceExisting: true,
          extensions: [REGION_COMPONENT_MVS_EXTENSION]
        });
      } finally {
        setTimeout(() => URL.revokeObjectURL(pdbObjectUrl), 1000);
      }
      if (generation !== state.loadGeneration) return false;

      state.current = {
        sourceKind,
        pdbText: pdbResult.text,
        yamlText: yamlResult.text,
        pdbName: safeFilename(pdbResult.name, 'structure.pdb'),
        yamlName: safeFilename(yamlResult.name, 'regions.yaml'),
        annotation,
        pdbInfo,
        pdbSource,
        yamlSource
      };

      renderCurrentState();
      applyLayout(elements.layoutSelect.value, false);
      hideOverlay();
      const enabledCount = annotation.regions.filter(region => region.enabled).length;
      const componentCount = annotation.regions.filter(
        region => region.enabled && region.createComponent && region.coverage.matched > 0
      ).length;
      const warnings = annotation.regions.filter(region => region.enabled && region.coverage.matched === 0).length;
      setViewerStatus(warnings ? 'warning' : 'ready', warnings ? `${warnings} range warning${warnings === 1 ? '' : 's'}` : 'Loaded');
      showToast(
        `Loaded ${enabledCount} colored region${enabledCount === 1 ? '' : 's'}` +
        (componentCount ? ` and created ${componentCount} Mol* component${componentCount === 1 ? '' : 's'}.` : '.')
      );
      return true;
    } catch (error) {
      if (generation !== state.loadGeneration) return false;
      console.error(error);
      setViewerStatus('error', 'Load failed');
      showOverlay('error', 'Could not load the files', error?.message || String(error));
      showToast(error?.message || 'Could not load the PDB and YAML files.', 6500);
      return false;
    } finally {
      if (generation === state.loadGeneration) setBusy(false);
    }
  }

  function configuredSources() {
    if (!config.pdbUrl || !config.yamlUrl) return null;
    return {
      pdb: { kind: 'url', url: config.pdbUrl, name: filenameFromUrl(config.pdbUrl) || 'structure.pdb' },
      yaml: { kind: 'url', url: config.yamlUrl, name: filenameFromUrl(config.yamlUrl) || 'regions.yaml' }
    };
  }

  async function loadConfigured() {
    const sources = configuredSources();
    if (!sources) {
      showToast('Add pdbUrl and yamlUrl to config.js first.');
      return false;
    }
    return loadPair(sources.pdb, sources.yaml, 'configured');
  }

  async function loadSelectedFiles() {
    if (!state.selectedPdbFile || !state.selectedYamlFile) {
      showToast('Select one PDB file and one YAML file.');
      return false;
    }
    return loadPair(
      { kind: 'file', file: state.selectedPdbFile },
      { kind: 'file', file: state.selectedYamlFile },
      'local'
    );
  }

  async function reloadCurrent() {
    if (!state.current) return false;
    if (state.current.sourceKind === 'local') {
      return loadSelectedFiles();
    }
    return loadConfigured();
  }

  function renderCurrentState() {
    const current = state.current;
    if (!current) return;
    const annotation = current.annotation;
    const enabledRegions = annotation.regions.filter(region => region.enabled);
    const chainLabels = current.pdbInfo.chains.map(item => displayChain(item.chain)).join(', ') || 'none';
    const warningCount = enabledRegions.filter(region => region.coverage.matched === 0).length;

    elements.structureTitle.textContent = annotation.title || current.pdbName;
    elements.sourceSummary.textContent = `${current.pdbName} + ${current.yamlName} · ${current.pdbInfo.atomCount.toLocaleString()} polymer atoms`;
    elements.annotationTitle.textContent = annotation.title;
    elements.regionCount.textContent = String(enabledRegions.length);
    elements.annotationSummary.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'summary-grid';
    appendSummaryRow(grid, 'Numbering', annotation.numbering === 'auth' ? 'Author/PDB residue IDs' : 'Sequential label IDs');
    appendSummaryRow(grid, 'Chains in PDB', chainLabels);
    appendSummaryRow(grid, 'Base view', `${annotation.viewer.representation.replaceAll('_', ' ')} · ${annotation.viewer.baseColor}`);
    const configuredComponents = enabledRegions.filter(region => region.createComponent);
    const matchingComponents = configuredComponents.filter(region => region.coverage.matched > 0);
    const visibleComponents = matchingComponents.filter(region => region.componentVisible).length;
    appendSummaryRow(
      grid,
      'Mol* components',
      configuredComponents.length
        ? `${matchingComponents.length} matching of ${configuredComponents.length} configured · ${visibleComponents} visible initially`
        : 'Disabled'
    );
    appendSummaryRow(grid, 'Validation', warningCount ? `${warningCount} range warning${warningCount === 1 ? '' : 's'}` : 'All enabled ranges matched residues');
    elements.annotationSummary.appendChild(grid);

    elements.legendList.innerHTML = '';
    for (const region of annotation.regions) {
      const item = document.createElement('div');
      item.className = 'legend-item';
      if (!region.enabled) item.style.opacity = '0.48';

      const swatch = document.createElement('span');
      swatch.className = 'legend-swatch';
      swatch.style.background = region.color;

      const copy = document.createElement('div');
      copy.className = 'legend-copy';
      const title = document.createElement('strong');
      title.textContent = region.name;
      const meta = document.createElement('span');
      const chainText = region.chains.length ? region.chains.map(displayChain).join(', ') : 'all chains';
      meta.textContent = `${chainText} · ${region.numbering} ${region.start}–${region.end} · ${region.coverage.matched} matched`;
      copy.append(title, meta);
      if (region.description) {
        const description = document.createElement('small');
        description.textContent = region.description;
        copy.appendChild(description);
      }

      const badge = document.createElement('span');
      if (!region.enabled) {
        badge.className = 'legend-label-badge';
        badge.textContent = 'OFF';
      } else if (region.coverage.matched === 0) {
        badge.className = 'legend-warning';
        badge.textContent = 'NO MATCH';
        const missing = region.coverage.missingChains.length
          ? ` Missing chain(s): ${region.coverage.missingChains.join(', ')}.`
          : '';
        item.title = `This range did not match any parsed PDB residues.${missing}`;
      } else if (region.createComponent) {
        badge.className = 'legend-label-badge';
        badge.textContent = 'COMPONENT';
        badge.title = `${region.componentName} · ${region.componentRepresentation.replaceAll('_', ' ')} · ` +
          `${Math.round(region.componentOpacity * 100)}% opacity · ${region.componentVisible ? 'visible' : 'hidden'} at load`;
      } else if (region.label) {
        badge.className = 'legend-label-badge';
        badge.textContent = '3D LABEL';
      }

      item.append(swatch, copy, badge);
      elements.legendList.appendChild(item);
    }

    elements.reloadButton.disabled = false;
    elements.downloadPdbButton.disabled = false;
    elements.downloadYamlButton.disabled = false;
  }

  function appendSummaryRow(parent, label, value) {
    const key = document.createElement('strong');
    key.textContent = label;
    const text = document.createElement('span');
    text.textContent = value;
    parent.append(key, text);
  }

  function displayChain(chain) {
    return chain === '' ? '(blank)' : chain;
  }

  function applyLayout(value, announce = true) {
    const layoutName = normalizeLayout(value);
    elements.layoutSelect.value = layoutName;
    if (!state.viewer?.plugin?.layout?.setProps) return layoutName;
    const definition = LAYOUTS[layoutName];
    try {
      state.viewer.plugin.layout.setProps({
        showControls: definition.showControls,
        controlsDisplay: 'reactive',
        regionState: { ...definition.regionState }
      });
      state.viewer.handleResize();
      setTimeout(() => state.viewer?.handleResize(), 150);
      if (announce) showToast(`Layout: ${definition.label}.`);
    } catch (error) {
      console.error('Could not update Mol* layout:', error);
      showToast('Could not update the Mol* layout.');
    }
    return layoutName;
  }

  function showOverlay(mode, title, detail) {
    elements.viewerOverlay.dataset.mode = mode;
    elements.overlayTitle.textContent = title;
    elements.overlayDetail.textContent = detail;
    elements.viewerOverlay.classList.add('is-visible');
  }

  function hideOverlay() {
    elements.viewerOverlay.classList.remove('is-visible');
  }

  function setViewerStatus(status, text) {
    elements.viewerState.dataset.state = status;
    elements.viewerState.lastChild.textContent = text;
  }

  function setBusy(busy) {
    for (const button of [
      elements.loadConfiguredButton, elements.choosePdbButton, elements.chooseYamlButton,
      elements.loadLocalButton, elements.reloadButton
    ]) {
      button.disabled = busy || (button === elements.loadLocalButton && !(state.selectedPdbFile && state.selectedYamlFile)) || (button === elements.reloadButton && !state.current);
    }
    elements.loadConfiguredButton.disabled = busy || !configuredSources();
  }

  function updateSelectedFiles() {
    updateFilePill(elements.pdbFilePill, 'PDB', state.selectedPdbFile);
    updateFilePill(elements.yamlFilePill, 'YAML', state.selectedYamlFile);
    elements.loadLocalButton.disabled = !(state.selectedPdbFile && state.selectedYamlFile);
  }

  function updateFilePill(element, type, file) {
    element.dataset.state = file ? 'ready' : 'empty';
    element.querySelector('strong').textContent = type;
    element.querySelector('span').textContent = file ? `${file.name} · ${formatBytes(file.size)}` : 'No local file selected';
    element.title = file ? file.name : '';
  }

  function choosePdb() {
    elements.pdbFileInput.value = '';
    elements.pdbFileInput.click();
  }

  function chooseYaml() {
    elements.yamlFileInput.value = '';
    elements.yamlFileInput.click();
  }

  function handleDroppedFiles(files) {
    let pdb = null;
    let yaml = null;
    for (const file of files) {
      const lower = file.name.toLowerCase();
      if (!pdb && lower.endsWith('.pdb')) pdb = file;
      if (!yaml && (lower.endsWith('.yaml') || lower.endsWith('.yml'))) yaml = file;
    }
    if (!pdb || !yaml) {
      showToast('Drop one .pdb file and one .yaml or .yml file.');
      return;
    }
    state.selectedPdbFile = pdb;
    state.selectedYamlFile = yaml;
    updateSelectedFiles();
    loadSelectedFiles();
  }

  function isFullscreen() {
    return document.fullscreenElement === elements.viewerCard || document.webkitFullscreenElement === elements.viewerCard || state.fallbackFullscreen;
  }

  async function toggleFullscreen() {
    if (isFullscreen()) {
      if (state.fallbackFullscreen) {
        state.fallbackFullscreen = false;
        elements.viewerCard.classList.remove('is-fallback-fullscreen');
        document.body.classList.remove('has-fallback-fullscreen');
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } else {
      try {
        if (elements.viewerCard.requestFullscreen) {
          await elements.viewerCard.requestFullscreen();
        } else if (elements.viewerCard.webkitRequestFullscreen) {
          elements.viewerCard.webkitRequestFullscreen();
        } else {
          throw new Error('Fullscreen API unavailable');
        }
      } catch (error) {
        state.fallbackFullscreen = true;
        elements.viewerCard.classList.add('is-fallback-fullscreen');
        document.body.classList.add('has-fallback-fullscreen');
      }
    }
    requestViewerResize();
  }

  function requestViewerResize() {
    requestAnimationFrame(() => state.viewer?.handleResize());
    setTimeout(() => state.viewer?.handleResize(), 180);
  }

  function downloadText(text, filename, type) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeFilename(filename, 'download.txt');
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadTemplate() {
    const template = `version: 1\ntitle: My protein regions\nnumbering: auth\ndefault_chain: A\n\nviewer:\n  representation: cartoon\n  base_color: \"#CBD5E1\"\n  background: \"#FFFFFF\"\n  show_labels: false\n  show_tooltips: true\n\n  # Keep the colored base structure and also create one named Mol* component\n  # for each region. Independent component representations are hidden initially\n  # to avoid drawing the same residues twice. Open a layout with Controls and\n  # use the component eye icons to show, hide, isolate, or restyle each region.\n  create_components: true\n  component_representation: cartoon\n  components_visible: false\n  component_opacity: 1.0\n  base_component_name: Base structure\n\nregions:\n  - name: Region 1\n    start: 1\n    end: 25\n    color: \"#2563EB\"\n\n  - name: Region 2\n    start: 26\n    end: 50\n    color: \"#F97316\"\n    component_name: Region 2 surface\n    component_representation: surface\n    component_opacity: 0.65\n    component_visible: false\n`;
    downloadText(template, 'protein-regions-template.yaml', 'application/yaml;charset=utf-8');
  }

  function filenameFromUrl(url) {
    try {
      const pathname = new URL(url, window.location.href).pathname;
      return decodeURIComponent(pathname.split('/').filter(Boolean).pop() || '');
    } catch {
      return String(url).split('/').pop()?.split('?')[0] || '';
    }
  }

  function safeFilename(value, fallback) {
    const normalized = cleanString(value).replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_');
    return normalized || fallback;
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes < 1024) return `${Math.max(0, bytes || 0)} B`;
    const units = ['KB', 'MB', 'GB'];
    let value = bytes / 1024;
    let index = 0;
    while (value >= 1024 && index < units.length - 1) {
      value /= 1024;
      index += 1;
    }
    return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
  }

  function showToast(message, duration = 3200) {
    clearTimeout(state.toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add('is-visible');
    state.toastTimer = setTimeout(() => elements.toast.classList.remove('is-visible'), duration);
  }

  function bindEvents() {
    elements.layoutSelect.addEventListener('change', event => applyLayout(event.target.value));
    elements.loadConfiguredButton.addEventListener('click', loadConfigured);
    elements.choosePdbButton.addEventListener('click', choosePdb);
    elements.chooseYamlButton.addEventListener('click', chooseYaml);
    elements.loadLocalButton.addEventListener('click', loadSelectedFiles);
    elements.overlayConfiguredButton.addEventListener('click', loadConfigured);
    elements.overlayLocalButton.addEventListener('click', choosePdb);
    elements.reloadButton.addEventListener('click', reloadCurrent);
    elements.downloadPdbButton.addEventListener('click', () => {
      if (state.current) downloadText(state.current.pdbText, state.current.pdbName, 'chemical/x-pdb;charset=utf-8');
    });
    elements.downloadYamlButton.addEventListener('click', () => {
      if (state.current) downloadText(state.current.yamlText, state.current.yamlName, 'application/yaml;charset=utf-8');
    });
    elements.downloadTemplateButton.addEventListener('click', downloadTemplate);
    elements.fullscreenButton.addEventListener('click', toggleFullscreen);

    elements.pdbFileInput.addEventListener('change', event => {
      state.selectedPdbFile = event.target.files?.[0] || null;
      updateSelectedFiles();
      if (state.selectedPdbFile && !state.selectedYamlFile) setTimeout(chooseYaml, 120);
    });
    elements.yamlFileInput.addEventListener('change', event => {
      state.selectedYamlFile = event.target.files?.[0] || null;
      updateSelectedFiles();
    });

    for (const eventName of ['dragenter', 'dragover']) {
      elements.dropZone.addEventListener(eventName, event => {
        event.preventDefault();
        if (eventName === 'dragenter') state.dragDepth += 1;
        elements.dropOverlay.classList.add('is-visible');
      });
    }
    elements.dropZone.addEventListener('dragleave', event => {
      event.preventDefault();
      state.dragDepth = Math.max(0, state.dragDepth - 1);
      if (state.dragDepth === 0) elements.dropOverlay.classList.remove('is-visible');
    });
    elements.dropZone.addEventListener('drop', event => {
      event.preventDefault();
      state.dragDepth = 0;
      elements.dropOverlay.classList.remove('is-visible');
      handleDroppedFiles(Array.from(event.dataTransfer?.files || []));
    });

    for (const eventName of ['fullscreenchange', 'webkitfullscreenchange']) {
      document.addEventListener(eventName, requestViewerResize);
    }
    window.addEventListener('resize', requestViewerResize);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && state.fallbackFullscreen) toggleFullscreen();
    });
  }

  async function initializeViewer() {
    elements.brandTitle.textContent = config.title;
    elements.brandSubtitle.textContent = 'PDB + YAML region components';
    elements.pageTitle.textContent = config.title;
    elements.pageSubtitle.textContent = config.subtitle;
    document.title = config.title;
    elements.layoutSelect.value = config.defaultLayout;
    elements.loadConfiguredButton.disabled = !configuredSources();
    elements.overlayConfiguredButton.disabled = !configuredSources();
    bindEvents();
    updateSelectedFiles();

    try {
      if (!window.molstar?.Viewer?.create) throw new Error('Mol* did not load from the CDN.');
      state.viewer = await window.molstar.Viewer.create('molstarViewer', {
        layoutIsExpanded: false,
        layoutShowControls: true,
        layoutShowRemoteState: false,
        layoutShowSequence: true,
        layoutShowLog: true,
        layoutShowLeftPanel: true,
        layoutControlsDisplay: 'reactive',
        collapseLeftPanel: false,
        collapseRightPanel: false,
        viewportShowExpand: false,
        viewportShowToggleFullscreen: false,
        viewportShowControls: true,
        viewportShowSettings: true,
        viewportShowSelectionMode: true,
        viewportShowAnimation: true,
        viewportShowTrajectoryControls: true,
        viewportShowScreenshotControls: true,
        viewportShowReset: true,
        viewportBackgroundColor: DEFAULT_BACKGROUND,
        powerPreference: 'high-performance',
        illumination: false
      });
      applyLayout(config.defaultLayout, false);
      setViewerStatus('idle', 'Ready');
      showOverlay('empty', 'Load a PDB + YAML pair', 'Use the configured repository files, select two local files, or drag the pair onto this viewer.');
      if (config.autoLoad && configuredSources()) await loadConfigured();
    } catch (error) {
      console.error(error);
      setViewerStatus('error', 'Initialization failed');
      showOverlay('error', 'Mol* Viewer could not start', error?.message || String(error));
    }
  }

  window.ProteinRegionViewer = Object.freeze({
    version: APP_VERSION,
    loadConfigured,
    loadSelectedFiles,
    reload: reloadCurrent,
    setLayout: value => applyLayout(value),
    getState: () => ({
      version: APP_VERSION,
      layout: elements.layoutSelect.value,
      configured: { ...config },
      selectedFiles: {
        pdb: state.selectedPdbFile?.name || null,
        yaml: state.selectedYamlFile?.name || null
      },
      current: state.current ? {
        sourceKind: state.current.sourceKind,
        pdbName: state.current.pdbName,
        yamlName: state.current.yamlName,
        title: state.current.annotation.title,
        regionCount: state.current.annotation.regions.filter(region => region.enabled).length,
        regions: state.current.annotation.regions.map(region => ({
          name: region.name,
          start: region.start,
          end: region.end,
          color: region.color,
          numbering: region.numbering,
          chains: [...region.chains],
          matchedResidues: region.coverage.matched,
          createComponent: region.createComponent,
          componentName: region.componentName,
          componentRepresentation: region.componentRepresentation,
          componentOpacity: region.componentOpacity,
          componentVisible: region.componentVisible
        }))
      } : null
    })
  });

  initializeViewer();
})();
