# Error Detection & Correction Visualizer

A modern React web app built with Next.js, TypeScript, Tailwind CSS, and Framer Motion to visualize error detection algorithms like CRC (Cyclic Redundancy Check) and Hamming Code.

## Features
- **Binary Data Input**: Real-time validation for binary sequences.
- **Algorithm Selection**: Choose between CRC and Hamming (7,4).
- **Step-by-Step Visualization**: Animate bit manipulation steps with Framer Motion.
- **Error Injection**: Toggle error injection to simulate noise in transmission.
- **Modern SaaS UI**: Glassmorphism based dark theme with a professional dashboard layout.
- **Responsive Design**: Works across different screen sizes.

## Tech Stack
- **Framework**: [Next.js](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **HTTP Client**: [Axios](https://axios-http.com/) (Integrated for future API expansion)

## Getting Started

### Prerequisites
- Node.js (>= 18.20.8)
- npm

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure
- `src/app/page.tsx`: Main dashboard component.
- `src/lib/algorithms.ts`: Implementation of CRC and Hamming algorithms.
- `src/lib/utils.ts`: Tailwind CSS utility functions.
