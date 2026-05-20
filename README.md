# Fleet Management Frontend

React-based web dashboard for real-time fleet monitoring. Visualizes live vehicle locations received from GPS trackers via the fleet management backend.

Part of a fleet management platform — works alongside the [ESP32 firmware](https://github.com/sirineelayeb/fleet-management-firmware) and [Node.js backend](https://github.com/sirineelayeb/fleet-management-backend).

---

## Features

- Live vehicle location tracking on an interactive map
- License plate recognition event display (via LPR service integration)
- Vehicle list with status indicators
- Responsive UI built with Tailwind CSS

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | JavaScript |
| Framework | React 19 |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Linting | ESLint |
| Deployment | Vercel |

---

## Project Structure

```
fleet-management-frontend/
├── public/               # Static assets
├── src/                  # Application source
├── index.html            # HTML entry point
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # Tailwind configuration
├── postcss.config.js     # PostCSS configuration
├── eslint.config.js      # ESLint configuration
├── vercel.json           # Vercel deployment config
└── package.json
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/sirineelayeb/fleet-management-frontend.git
cd fleet-management-frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 4. Run the development server

```bash
npm run dev
```

App available at: `http://localhost:5173`

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

---

## Deployment

The app is deployed on Vercel. The `vercel.json` configures client-side routing rewrites so React Router works correctly on page reload.

Live demo: [fleet-management-frontend-ebon.vercel.app](https://fleet-management-frontend-ebon.vercel.app)

---


## License

MIT

---

## Author

**Syrine Elayeb** — PFE internship project