# Detect Auto Client

Frontend for the Detect Auto AI Diagnostic Tool.

## Features

- Next.js 13 with App Router
- React and TypeScript
- shadcn/ui components
- Real-time diagnostic chat with WebSockets
- Parts prediction and repair summary generation

## Getting Started

### Prerequisites

- Node.js 16+
- Backend API running (see ../server)

### Installation

1. Install dependencies:
   \`\`\`
   npm install
   \`\`\`

2. Set environment variables:
   Create a `.env.local` file with:
   \`\`\`
   NEXT_PUBLIC_API_URL=http://localhost:8000
   \`\`\`

3. Run the development server:
   \`\`\`
   npm run dev
   \`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

\`\`\`
client/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   ├── dashboard/          # Dashboard pages
│   ├── login/              # Login page
│   └── register/           # Registration page
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── landing-*.tsx       # Landing page components
│   └── dashboard-*.tsx     # Dashboard components
├── lib/                    # Utility functions
│   ├── api.ts              # API client
│   └── utils.ts            # Helper functions
└── public/                 # Static assets
\`\`\`

## API Integration

The frontend communicates with the backend API using the client defined in `lib/api.ts`. This includes:

- Authentication (register, login, logout)
- Session management
- WebSocket connection for real-time diagnostics
- Parts prediction and repair summary generation

## Deployment

To build the application for production:

\`\`\`
npm run build
\`\`\`

Then, to start the production server:

\`\`\`
npm start
