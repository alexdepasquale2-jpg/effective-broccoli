/**
 * The vessel's colours were argued over for a length of time the Kor decline
 * to record. The compromise: a near-black that is not black (the Sha refuse
 * true black, on the grounds that nothing is), and three tongue-colours that
 * remain distinguishable to the roughly one in twelve human males whose eyes
 * do not separate red from green — which is why Vel is orange and not red,
 * and Kor is cyan-blue and not green.
 */
export const PALETTE = {
  void: '#07070d',
  deep: '#0b0d18',
  field: '#12162a',
  line: 'rgba(150,178,255,0.16)',
  lineBright: 'rgba(170,200,255,0.34)',
  veil: '#05060c',
  veilEdge: 'rgba(120,140,200,0.13)',
  seed: '#f2ead9',
  seedDim: 'rgba(242,234,217,0.45)',
  braid: '#ffe9a8',
  text: '#e8eaf6',
  dim: 'rgba(232,234,246,0.55)',
  faint: 'rgba(232,234,246,0.3)',
  warn: '#ff8f6a',
};

export const withAlpha = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
