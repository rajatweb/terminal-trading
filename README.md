# Terminal Trading App

A modern, responsive trading terminal interface built with **Next.js**, **TypeScript**, and **Tailwind CSS**. Features a powerful charting engine using **D3.js** with advanced drawing tools and technical indicators.

![GitHub Actions Workflow Status](https://github.com/rajatweb/terminal-trading/actions/workflows/deploy.yml/badge.svg)

## 🚀 Features

*   **Interactive Charting**: Custom-built candlestick chart using D3.js.
*   **Drawing Tools**: 
    *   Trendlines, Rays, Horizontal/Vertical Lines
    *   Fibonacci Retracements, Price Ranges
    *   Interactive drag-and-drop and resizing
*   **Technical Indicators**:
    *   Moving Averages (EMA, SMA, HMA, VWAP)
    *   Bollinger Bands, RSI, MACD
    *   Volume Histogram
*   **Trading Interface**:
    *   Simulated Order Placement (Entry, SL, TP)
    *   Position Management Panel
    *   Interactive visual order editing on chart
*   **Responsive Design**: Optimized for different screen sizes with a clean, dark-themed UI.

## 🛠️ Tech Stack

*   **Framework**: [Next.js Double](https://nextjs.org/) (React)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS & Shadcn UI (Radix Primitives)
*   **Visualization**: D3.js
*   **Animations**: Framer Motion
*   **State Management**: Zustand
*   **Icons**: Lucide React

## 📦 Getting Started

### Prerequisites

*   Node.js 18+ 
*   npm / yarn / pnpm

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/rajatweb/terminal-trading.git
    cd terminal-trading
    ```

2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) with your browser.

## 🚢 Deployment

This project is configured to deploy automatically to **GitHub Pages** using GitHub Actions.

### How it works

1.  The project uses `next export` configuration (`output: 'export'` in `next.config.ts`) to generate a static HTML/CSS/JS site.
2.  On every push to the `master` branch, the `.github/workflows/deploy.yml` workflow is triggered.
3.  It builds the project and deploys the `out` directory to the `gh-pages` environment.

### Manual Build

To build the project locally for production:

```bash
npm run build
```

The static output will be in the `out/` directory.

## 📜 License

This project is open source and available under the [MIT License](LICENSE).
