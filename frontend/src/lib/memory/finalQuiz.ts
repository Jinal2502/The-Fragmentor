export const FINAL_QUIZ_PASS_THRESHOLD = 5
export const FINAL_QUIZ_TOTAL = 8

export interface QuizQuestion {
  id: number
  question: string
  options: [string, string, string, string]
  /** 0–3 index of correct option */
  correctIndex: number
  explanation: string
}

export const FINAL_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'Which component directly interacts with RAM for instruction execution?',
    options: ['Disk', 'CPU', 'Secondary Memory Controller', 'I/O Device'],
    correctIndex: 1,
    explanation: 'The CPU directly accesses RAM (not disk), which is why RAM speed matters.',
  },
  {
    id: 2,
    question: 'Internal fragmentation occurs when:',
    options: [
      'Memory is insufficient',
      'Free memory is scattered',
      'Allocated block has unused space',
      'Process is too large',
    ],
    correctIndex: 2,
    explanation: 'Waste happens inside allocated memory.',
  },
  {
    id: 3,
    question: 'External fragmentation can be reduced using:',
    options: ['Paging', 'Compaction', 'Segmentation', 'Swapping'],
    correctIndex: 1,
    explanation: 'Compaction merges scattered free spaces into one block.',
  },
  {
    id: 4,
    question: 'Which allocation strategy may create very small unusable memory holes?',
    options: ['First Fit', 'Next Fit', 'Best Fit', 'Worst Fit'],
    correctIndex: 2,
    explanation: 'Best fit picks the smallest hole — the leftover can become useless.',
  },
  {
    id: 5,
    question: 'Why can Worst Fit sometimes perform better than Best Fit?',
    options: [
      'Uses smallest block',
      'Reduces page faults',
      'Leaves larger reusable free space',
      'Faster execution',
    ],
    correctIndex: 2,
    explanation: 'A bigger leftover hole can still be used later.',
  },
  {
    id: 6,
    question: 'In paging, logical address consists of:',
    options: [
      'Frame number + offset',
      'Page number + offset',
      'Segment number + offset',
      'Block number + offset',
    ],
    correctIndex: 1,
    explanation: 'The CPU generates a logical address; the MMU translates it.',
  },
  {
    id: 7,
    question: 'Why must page size be equal to frame size?',
    options: [
      'To reduce internal fragmentation',
      'To simplify address mapping',
      'To increase RAM size',
      'To avoid segmentation',
    ],
    correctIndex: 1,
    explanation: 'Equal sizes make page-to-frame mapping straightforward.',
  },
  {
    id: 8,
    question: 'Which bit in page table indicates whether page is in memory or not?',
    options: ['Dirty bit', 'Reference bit', 'Present/Absent bit', 'Protection bit'],
    correctIndex: 2,
    explanation: 'If absent, a page fault occurs on access.',
  },
]

export function scoreQuiz(answers: (number | null)[]): number {
  return FINAL_QUIZ_QUESTIONS.reduce((acc, q, i) => {
    if (answers[i] === q.correctIndex) return acc + 1
    return acc
  }, 0)
}

export function hasPassed(score: number): boolean {
  return score >= FINAL_QUIZ_PASS_THRESHOLD
}
