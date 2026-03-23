export type StepPhase =
  | 'SETUP'       // CRC: appending zeros
  | 'XOR'         // CRC: about to XOR (shows operation panel)
  | 'XOR_RESULT'  // CRC: after XOR applied
  | 'SHIFT'       // CRC: skip (MSB = 0)
  | 'REMAINDER'   // CRC: extracted remainder
  | 'FINAL'       // CRC / Hamming: final codeword
  | 'SETUP_H'     // Hamming: placing data bits
  | 'PARITY'      // Hamming: computing parity bit
  | 'DONE';       // Hamming: complete

export interface HammingParityInfo {
  parityBit: number;           // Parity bit position (1-indexed, e.g. 1, 2, 4)
  coveredPositions: number[];  // 0-indexed positions covered (for highlight alignment)
  xorTerms: string[];          // Human-readable terms, e.g. ["D1(1)", "D2(0)"]
  result: number;              // Computed parity value
}

export interface AlgorithmStep {
  title: string;
  description: string;
  /** Bit string — use '?' for un-computed parity positions */
  bits: string;
  highlight: number[];
  operation?: string;
  phase: StepPhase;
  // CRC XOR visualization
  xorWindow?: string;
  xorGenerator?: string;
  xorResult?: string;
  // Semantic bit coloring (CRC)
  dataLength?: number;
  // Hamming position labels & parity computation
  positionLabels?: string[];    // e.g. ["P1","P2","D1","P4","D2","D3","D4"]
  positionNumbers?: number[];   // e.g. [1,2,3,4,5,6,7]
  hammingParityInfo?: HammingParityInfo;
}

/**
 * Cyclic Redundancy Check (CRC) — Binary Long Division
 *
 * Algorithm (in-place XOR approach, identical to the traditional shift-register method):
 *   1. Append (g-1) zeros to data → padded dividend
 *   2. For each bit position i in [0, n):
 *      - If current[i] === '1': XOR bits [i..i+g-1] with generator
 *      - If current[i] === '0': skip
 *   3. Remainder = last (g-1) bits of the mutated array
 *   4. Codeword  = original data + remainder
 */
export function calculateCRC(
  data: string,
  generator: string
): { finalCode: string; remainder: string; steps: AlgorithmStep[] } {
  const n = data.length;
  const g = generator.length;
  const padded = data + '0'.repeat(g - 1);
  const steps: AlgorithmStep[] = [];

  // Step 0 — Preparation
  steps.push({
    title: 'Append Zeros (Preparation)',
    description: `Append ${g - 1} zero${g - 1 !== 1 ? 's' : ''} to the ${n}-bit data (generator length − 1 = ${g} − 1). Padded sequence: ${data} + ${'0'.repeat(g - 1)} = ${padded} (${n + g - 1} bits total).`,
    bits: padded,
    highlight: Array.from({ length: g - 1 }, (_, i) => n + i),
    operation: `+${g - 1} zeros`,
    phase: 'SETUP',
    dataLength: n,
  });

  const cur = padded.split('');

  for (let i = 0; i < n; i++) {
    const win = cur.slice(i, i + g).join('');
    const isOne = cur[i] === '1';

    if (isOne) {
      const xorResult = win
        .split('')
        .map((b, j) => (parseInt(b) ^ parseInt(generator[j])).toString())
        .join('');

      // XOR step — shows operation panel in UI
      steps.push({
        title: `Bit ${i + 1}: XOR with Generator`,
        description: `MSB at position ${i + 1} is 1 → XOR window "${win}" with generator "${generator}": ${win} ⊕ ${generator} = ${xorResult}`,
        bits: cur.join(''),
        highlight: Array.from({ length: g }, (_, j) => i + j),
        operation: 'XOR',
        phase: 'XOR',
        xorWindow: win,
        xorGenerator: generator,
        xorResult,
        dataLength: n,
      });

      for (let j = 0; j < g; j++) {
        cur[i + j] = (parseInt(cur[i + j]) ^ parseInt(generator[j])).toString();
      }

      // XOR result step
      steps.push({
        title: `Bit ${i + 1}: After XOR`,
        description: `Bits ${i + 1}–${i + g} updated to "${cur.slice(i, i + g).join('')}". Cursor advances to bit ${i + 2}.`,
        bits: cur.join(''),
        highlight: Array.from({ length: g }, (_, j) => i + j),
        operation: `→ ${cur.slice(i, i + g).join('')}`,
        phase: 'XOR_RESULT',
        dataLength: n,
      });
    } else {
      steps.push({
        title: `Bit ${i + 1}: Skip (MSB = 0)`,
        description: `MSB at position ${i + 1} is 0 → no XOR. Window "${win}" passes through. Cursor advances.`,
        bits: cur.join(''),
        highlight: [i],
        operation: 'SKIP',
        phase: 'SHIFT',
        dataLength: n,
      });
    }
  }

  const remainder = cur.slice(n).join('');
  const finalCode = data + remainder;

  steps.push({
    title: 'Division Complete — CRC Extracted',
    description: `All ${n} positions processed. Remainder = "${remainder}" — this is the CRC checksum (${g - 1} bits).`,
    bits: cur.join(''),
    highlight: Array.from({ length: g - 1 }, (_, i) => n + i),
    operation: `CRC = ${remainder}`,
    phase: 'REMAINDER',
    dataLength: n,
  });

  steps.push({
    title: 'Final Codeword Assembled',
    description: `Codeword = Data "${data}" (${n} bits) + CRC "${remainder}" (${g - 1} bits) = "${finalCode}" (${finalCode.length} bits total).`,
    bits: finalCode,
    highlight: Array.from({ length: finalCode.length }, (_, i) => i),
    operation: 'TRANSMITTED',
    phase: 'FINAL',
    dataLength: n,
  });

  return { finalCode, remainder, steps };
}

/**
 * Hamming(n, k) — Generalized single-bit error correction code
 *
 * Works for any k data bits (1 ≤ k ≤ ~26).
 *
 * Algorithm:
 *   1. Find r = min integer where 2^r ≥ k + r + 1
 *   2. n = k + r  (total codeword bits)
 *   3. Parity positions = powers of 2: 1, 2, 4, 8, …
 *   4. Data bits fill the remaining positions (in order)
 *   5. Each P_i covers all positions j ≠ i where (j & i) ≠ 0
 *      P_i = XOR of data-bit values at those positions (even parity)
 *   6. Final codeword = bits at positions 1…n
 */
export function calculateHamming(data: string): { finalCode: string; steps: AlgorithmStep[] } {
  const k = data.length;
  if (k === 0) return { finalCode: '', steps: [] };

  // ── Step 1: Find r ────────────────────────────────────────────────────────
  let r = 1;
  while ((1 << r) < k + r + 1) r++;
  const n = k + r;

  const steps: AlgorithmStep[] = [];

  // Build iteration table for the description
  const rCheck: string[] = [];
  for (let rr = 1; rr <= r; rr++) {
    const pow = 1 << rr;
    const need = k + rr + 1;
    rCheck.push(`2^${rr}=${pow} ${pow >= need ? '≥' : '<'} ${need}${pow >= need ? ' ✓' : ''}`)
  }

  steps.push({
    title: 'Step 1 — Find Number of Parity Bits (r)',
    description:
      `k = ${k} data bit${k > 1 ? 's' : ''}. ` +
      `Minimum r where 2ʳ ≥ k + r + 1: ${rCheck.join('  |  ')}. ` +
      `✓ r = ${r}  →  n = k + r = ${k} + ${r} = ${n} total bits.`,
    bits: data,
    highlight: Array.from({ length: k }, (_, i) => i),
    operation: `r = ${r}`,
    phase: 'SETUP_H',
  });

  // ── Build position map ────────────────────────────────────────────────────
  const paritySet = new Set<number>();
  for (let i = 0; i < r; i++) paritySet.add(1 << i); // positions 1, 2, 4, …

  const positionLabels: string[] = [];
  const positionNumbers: number[] = Array.from({ length: n }, (_, i) => i + 1);

  let dIdx = 0;
  for (let pos = 1; pos <= n; pos++) {
    positionLabels.push(paritySet.has(pos) ? `P${pos}` : `D${++dIdx}`);
  }

  // bits array (1-indexed; index 0 unused). '?' = unset parity.
  const bits: (number | '?')[] = ['?' as const];
  dIdx = 0;
  for (let pos = 1; pos <= n; pos++) {
    bits.push(paritySet.has(pos) ? '?' : parseInt(data[dIdx++] ?? '0'));
  }

  const toStr = () => bits.slice(1).map(b => String(b)).join('');

  // ── Step 2: Position layout ───────────────────────────────────────────────
  const parPosList = [...paritySet].sort((a, b) => a - b);
  const datPosList = positionNumbers.filter(p => !paritySet.has(p));

  steps.push({
    title: 'Step 2 — Assign Bit Positions',
    description:
      `Parity positions (powers of 2): ${parPosList.join(', ')}. ` +
      `Data positions: ${datPosList.join(', ')}. ` +
      `'?' marks unset parity bits.`,
    bits: toStr(),
    highlight: parPosList.map(p => p - 1),
    operation: `n = ${n}`,
    phase: 'SETUP_H',
    positionLabels,
    positionNumbers,
  });

  // ── Step 3: Place data bits ───────────────────────────────────────────────
  steps.push({
    title: 'Step 3 — Place Data Bits',
    description:
      `Data "${data}" placed in positions ${datPosList.join(', ')}. ` +
      `Parity slots remain '?' until computed.`,
    bits: toStr(),
    highlight: datPosList.map(p => p - 1),
    operation: 'DATA',
    phase: 'SETUP_H',
    positionLabels,
    positionNumbers,
  });

  // ── Steps 4+: Compute each parity bit ────────────────────────────────────
  for (let stepNum = 0; stepNum < parPosList.length; stepNum++) {
    const parPos = parPosList[stepNum];
    const bitIndex = Math.log2(parPos); // which bit of the position index (0-based)

    // All positions (≠ parPos) where bit `parPos` is set in binary position number
    const covered: number[] = []; // 1-indexed
    for (let pos = 1; pos <= n; pos++) {
      if (pos !== parPos && (pos & parPos) !== 0) covered.push(pos);
    }

    const coveredVals = covered.map(pos => (typeof bits[pos] === 'number' ? (bits[pos] as number) : 0));
    const parVal = coveredVals.reduce((acc, v) => acc ^ v, 0);
    bits[parPos] = parVal;

    const xorTerms = covered.map((pos, i) => `${positionLabels[pos - 1]}(${coveredVals[i]})`);
    const coveredPosStr = [parPos, ...covered].join(', ');

    steps.push({
      title: `Step ${4 + stepNum} — Compute P${parPos}`,
      description:
        `P${parPos} covers positions where bit-${bitIndex} of the position index is 1: [${coveredPosStr}]. ` +
        `P${parPos} = ${covered.map((p, i) => `pos${p}(${coveredVals[i]})`).join(' ⊕ ')} = ${parVal}.`,
      bits: toStr(),
      highlight: [parPos - 1, ...covered.map(p => p - 1)],
      operation: `P${parPos} = ${parVal}`,
      phase: 'PARITY',
      positionLabels,
      positionNumbers,
      hammingParityInfo: {
        parityBit: parPos,
        coveredPositions: covered.map(p => p - 1),
        xorTerms,
        result: parVal,
      },
    });
  }

  // ── Final codeword ────────────────────────────────────────────────────────
  const finalCode = bits.slice(1).map(b => String(b)).join('');

  steps.push({
    title: `Final Codeword — Hamming(${n}, ${k})`,
    description:
      `Complete ${n}-bit Hamming(${n},${k}) codeword: ${finalCode}. ` +
      `Parity bits at [${parPosList.join(', ')}] enable single-bit error detection & correction.`,
    bits: finalCode,
    highlight: Array.from({ length: n }, (_, i) => i),
    operation: 'CODEWORD',
    phase: 'FINAL',
    positionLabels,
    positionNumbers,
  });

  return { finalCode, steps };
}

// ─── Error Verification ───────────────────────────────────────────────────────

/**
 * Verify a received CRC codeword.
 * Divides the full received string by the generator.
 * Remainder = 0…0 → no error. Anything else → error detected.
 */
export function verifyCRC(
  received: string,
  generator: string
): { remainder: string; isValid: boolean } {
  const g = generator.length
  if (!received || received.length < g) return { remainder: '', isValid: false }

  const cur = received.split('')
  const n = cur.length

  for (let i = 0; i <= n - g; i++) {
    if (cur[i] === '1') {
      for (let j = 0; j < g; j++) {
        cur[i + j] = (parseInt(cur[i + j]) ^ parseInt(generator[j])).toString()
      }
    }
  }

  const remainder = cur.slice(n - (g - 1)).join('')
  return { remainder, isValid: !remainder.includes('1') }
}

export interface HammingParityCheck {
  parityBit: number      // e.g. 1, 2, 4, 8
  coveredPositions: number[]  // 1-indexed
  xorValue: number       // 0 = pass, 1 = fail
  pass: boolean
}

export interface HammingCheckResult {
  syndrome: number          // decimal syndrome value (= error position, 0 = no error)
  syndromeStr: string       // binary syndrome string, MSB first
  errorPos: number          // 1-indexed error position, 0 = no error
  isValid: boolean
  corrected: string         // codeword with the error flipped
  parityChecks: HammingParityCheck[]
}

/**
 * Verify a received Hamming codeword.
 * Computes the syndrome from each parity group.
 * syndrome = 0 → no error; syndrome = N → error at bit N (1-indexed).
 */
export function verifyHamming(codeword: string): HammingCheckResult {
  const n = codeword.length
  const checks: HammingParityCheck[] = []
  let syndrome = 0
  let r = 0
  while ((1 << r) <= n) r++  // count parity bits

  for (let i = 0; i < r; i++) {
    const parPos = 1 << i
    if (parPos > n) break

    const coveredPositions: number[] = []
    let xorValue = 0

    for (let pos = 1; pos <= n; pos++) {
      if (pos & parPos) {
        coveredPositions.push(pos)
        xorValue ^= parseInt(codeword[pos - 1])
      }
    }

    const pass = xorValue === 0
    checks.push({ parityBit: parPos, coveredPositions, xorValue, pass })
    if (!pass) syndrome += parPos
  }

  const isValid = syndrome === 0
  const errorPos = syndrome

  let corrected = codeword
  if (!isValid && errorPos >= 1 && errorPos <= n) {
    const bits = codeword.split('')
    bits[errorPos - 1] = bits[errorPos - 1] === '0' ? '1' : '0'
    corrected = bits.join('')
  }

  // Build syndrome string MSB first (r bits wide)
  const syndromeStr = syndrome.toString(2).padStart(r, '0')

  return { syndrome, syndromeStr, errorPos, isValid, corrected, parityChecks: checks }
}
