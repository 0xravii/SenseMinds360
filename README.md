# SenseMinds 360

SenseMinds 360 is a comprehensive monitoring and management dashboard for AI systems, providing real-time insights into system status, alerts, logs, and an interactive AI assistant.

## Getting Started

To get started with SenseMinds 360, follow these steps:

### 1. Clone the repository

```bash
git clone <repository-url>
cd sense-minds-360
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### 3. Environment Variables

Create a `.env.local` file in the root of the project based on the `.env.example` (if available) or the following structure:

```
NEXT_PUBLIC_API_MOCK_MODE=true
NEXT_PUBLIC_REALTIME_MOCK_MODE=true
```

- `NEXT_PUBLIC_API_MOCK_MODE`: Set to `true` to use mock data for API calls. Set to `false` to connect to a real backend (requires further configuration).
- `NEXT_PUBLIC_REALTIME_MOCK_MODE`: Set to `true` to simulate real-time events. Set to `false` to connect to a real-time service (requires further configuration).

### 4. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `src/app`: Next.js App Router pages (Home, Analyzer, Logs, Settings).
- `src/components`: Reusable UI components, including `shadcn/ui` components and custom components like `AppShell`, `DashboardCard`, `AlertsPanel`, etc.
- `src/lib`: Utility functions.
- `src/services`: API client and real-time service for data fetching and event handling.
- `src/types`: TypeScript type definitions for data models.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
