/**
 * Cyclic Redundancy Check (CRC) Calculation
 * @param data Binary string (e.g., "1011")
 * @param generator Binary string (e.g., "1101")
 */
export function calculateCRC(data: string, generator: string) {
  const n = data.length;
  const g = generator.length;
  let paddedData = data + '0'.repeat(g - 1);
  const steps: { title: string; description: string; bits: string; highlight: number[]; operation?: string }[] = [];

  steps.push({
    title: 'CRC Encoding: Preparation',
    description: `Append ${g - 1} zeros to the data as padding for the ${g}-bit divisor.`,
    bits: paddedData,
    highlight: Array.from({ length: g - 1 }, (_, i) => n + i),
    operation: 'INIT'
  });

  let current = paddedData.split('');
  
  for (let i = 0; i < n; i++) {
    const isOne = current[i] === '1';
    
    steps.push({
      title: `Step ${i + 1}: Check MSB`,
      description: isOne 
        ? `Leading bit is 1, so we XOR the next ${g} bits with generator ${generator}.` 
        : `Leading bit is 0, skipping division for this position.`,
      bits: current.join(''),
      highlight: [i],
      operation: isOne ? 'XOR' : 'SKIP'
    });

    if (isOne) {
      const highlightRange = Array.from({ length: g }, (_, j) => i + j);
      
      for (let j = 0; j < g; j++) {
        current[i + j] = (parseInt(current[i + j]) ^ parseInt(generator[j])).toString();
      }

      steps.push({
        title: `Step ${i + 1}: XOR Result`,
        description: `Result of bitwise XOR between data and generator.`,
        bits: current.join(''),
        highlight: highlightRange,
        operation: `XOR ${generator}`
      });
    }
  }

  const remainder = current.slice(n).join('');
  const finalCode = data + remainder;

  steps.push({
    title: 'Final Remainder',
    description: `The calculated CRC checksum (remainder) is ${remainder}.`,
    bits: current.join(''),
    highlight: Array.from({ length: g - 1 }, (_, i) => n + i),
    operation: 'REMAINDER'
  });

  steps.push({
    title: 'Complete Codeword',
    description: 'Final transmitted codeword (Original Data + CRC Checksum).',
    bits: finalCode,
    highlight: Array.from({ length: finalCode.length }, (_, i) => i),
    operation: 'FINAL'
  });

  return { finalCode, steps };
}

/**
 * Hamming Code (7,4) Generation
 * @param data 4-bit binary string
 */
export function calculateHamming(data: string) {
  if (data.length !== 4) return { finalCode: data, steps: [] };

  const d = data.split('').map(Number);
  // Positions: 1  2  3  4  5  6  7
  // Bits:      P1 P2 D1 P4 D2 D3 D4
  let bits = [0, 0, 0, d[0], 0, d[1], d[2], d[3]]; // Using index 1 to 7

  const steps: { title: string; description: string; bits: string; highlight: number[]; operation?: string }[] = [];

  steps.push({
    title: 'Hamming(7,4): Preparation',
    description: 'Data bits are placed in positions 3, 5, 6, 7. Leave 1, 2, 4 for parity bits.',
    bits: `PP${d[0]}P${d[1]}${d[2]}${d[3]}`,
    highlight: [2, 4, 5, 6],
    operation: 'SETUP'
  });

  // P1 = D1 ^ D2 ^ D4 = pos 3 ^ 5 ^ 7
  bits[1] = bits[3] ^ bits[5] ^ bits[7];
  steps.push({
    title: 'Parity P1 Calculation',
    description: `P1 checks odd positions (sum bits at 1,3,5,7). XORing [?, ${d[0]}, ${d[1]}, ${d[3]}] results in ${bits[1]}.`,
    bits: `${bits[1]}P${d[0]}P${d[1]}${d[2]}${d[3]}`,
    highlight: [0, 2, 4, 6],
    operation: `P1 = ${bits[1]}`
  });

  // P2 = D1 ^ D3 ^ D4 = pos 3 ^ 6 ^ 7
  bits[2] = bits[3] ^ bits[6] ^ bits[7];
  steps.push({
    title: 'Parity P2 Calculation',
    description: `P2 checks bits having 2nd bit set in binary (2,3,6,7). XORing [?, ${d[0]}, ${d[2]}, ${d[3]}] results in ${bits[2]}.`,
    bits: `${bits[1]}${bits[2]}${d[0]}P${d[1]}${d[2]}${d[3]}`,
    highlight: [1, 2, 5, 6],
    operation: `P2 = ${bits[2]}`
  });

  // P4 = D2 ^ D3 ^ D4 = pos 5 ^ 6 ^ 7
  bits[4] = bits[5] ^ bits[6] ^ bits[7];
  steps.push({
    title: 'Parity P4 Calculation',
    description: `P4 checks bits having 3rd bit set in binary (4,5,6,7). XORing [?, ${d[1]}, ${d[2]}, ${d[3]}] results in ${bits[4]}.`,
    bits: `${bits[1]}${bits[2]}${d[0]}${bits[4]}${d[1]}${d[2]}${d[3]}`,
    highlight: [3, 4, 5, 6],
    operation: `P4 = ${bits[4]}`
  });

  const finalCode = bits.slice(1).join('');
  steps.push({
    title: 'Final Codeword (ECC Ready)',
    description: 'All parity bits calculated using Even Parity. Total 7 bits encoded.',
    bits: finalCode,
    highlight: [0, 1, 2, 3, 4, 5, 6],
    operation: 'DONE'
  });

  return { finalCode, steps };
}
