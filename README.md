# The Fragmentor

An interactive **operating systems memory lab** built as a single-page Next.js app. Students walk through a fixed syllabus—concept, hands-on simulation, visual, and takeaway—for each unit, then complete a short multiple-choice quiz. Everything runs in the browser; there is no backend.

## Contents

| Phase | Topic |
|--------|--------|
| 0 | Memory hierarchy and access costs |
| 1 | Contiguous memory: fixed and variable partitions |
| 2 | Placement strategies: first, next, best, and worst fit |
| 3 | Paging, MMU, and page tables |
| 4 | Inverted page table |
| 5 | Thrashing and multiprogramming |
| 6 | Final quiz (eight questions; pass threshold is configurable in code) |

Simulation logic lives under `frontend/src/lib/memory/` (pure TypeScript). UI and phase copy live under `frontend/src/components/fragmentor/`.

## Tech stack

- [Next.js](https://nextjs.org/) (App Router)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Recharts](https://recharts.org/) (thrashing chart)
- [Lucide React](https://lucide.dev/) (icons)

## Prerequisites

- Node.js 18 or newer recommended
- npm

## Run locally

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts (from `frontend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server (after `build`) |
| `npm run lint` | ESLint |

## Repository layout

```
The Fragmentor/
├── README.md
└── frontend/
    ├── src/
    │   ├── app/              # Next.js app shell, `page.tsx` → LabShell
    │   ├── components/fragmentor/  # Lab shell, nav, phases
    │   └── lib/memory/       # Simulators, quiz data, shared tokens
    └── package.json
```

## License

Add a license file if you intend to open-source the project under a specific terms.
