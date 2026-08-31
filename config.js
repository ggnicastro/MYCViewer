/**
 * Hosted-file configuration for the Protein Region Viewer.
 *
 * Put your structure in ./pdb/ and your annotation file in ./annotations/,
 * then update the two URLs below. Set autoLoad to false to start with an
 * empty viewer and use only the local file picker.
 */
window.PROTEIN_REGION_VIEWER_CONFIG = {
  title: 'Protein Region Viewer',
  subtitle: 'Color PDB residue ranges from a YAML annotation file',

  autoLoad: true,
  pdbUrl: './pdb/TelC-prok.pdb',
  yamlUrl: './annotations/demo-regions.yaml',

  // canvas | sequence | controls | sequence-controls | full
  defaultLayout: 'canvas'
};
