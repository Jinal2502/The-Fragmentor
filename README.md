# 🌐 ErrorVis: Error Detection & Correction Visualizer

ErrorVis is a sophisticated, interactive web application designed to visualize complex data communication algorithms. Built with a modern **SaaS dashboard** aesthetic, it allows users to simulate, animate, and analyze **Cyclic Redundancy Check (CRC)** and **Hamming Code** operations in real-time.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/frontend-React%20%2F%20Next.js-61dafb)
![FastAPI](https://img.shields.io/badge/backend-FastAPI%20%2F%20Python-009688)
![Tailwind](https://img.shields.io/badge/styling-Tailwind%20CSS-38b2ac)

---

## ✨ Key Features

- **Professional Dashboard**: Dark theme with glassmorphism effects and high-fidelity UI components.
- **Real-Time Simulation**: 
  - **CRC (Cyclic Redundancy Check)**: Visualizes bitwise XOR division and remainder calculation.
  - **Hamming Code (7,4)**: Shows parity bit placement, calculation, and single-bit error correction.
- **Interactive Error Injection**: Toggle noise injection to simulate bit flips and watch how the algorithms detect/correct them.
- **Step-by-Step Viewer**: Step forward/backward through the algorithmic process with bit-level highlighting.
- **Live Statistics**: Dynamic analysis of block size, algorithm complexity, and data integrity.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS (Lucide Icons)
- **Animations**: Framer Motion
- **HTTP Client**: Axios

### Backend
- **API Framework**: FastAPI (Python 3.12+)
- **Server**: Uvicorn
- **Algorithms**: Custom Python implementations for CRC and Hamming logic.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### 1. Setup Backend
```bash
cd server
pip install -r requirements.txt
python -m uvicorn main:app --reload
```
*The backend will run on `http://127.0.0.1:8000`*

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```
*The frontend will run on `http://localhost:3000` (or the next available port)*

---

## 📸 Core Algorithm Logic

### Cyclic Redundancy Check (CRC)
The application simulates the polynomial division process. It appends $n-1$ zeros to the data (where $n$ is the divisor length) and performs bitwise XOR steps until a final remainder is generated and appended to the codeword.

### Hamming Code
Uses parity bits at positions $2^n$ (1, 2, 4, etc.). 
- **Encoding**: Calculates parity based on overlapping data bit subsets.
- **Correction**: If a bit is flipped, the parity checking phase identifies the exact bit position using XOR logic, allowing for auto-correction.

---

## 🤝 Contributing
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

Developed with ❤️ for Data Communication studies.
