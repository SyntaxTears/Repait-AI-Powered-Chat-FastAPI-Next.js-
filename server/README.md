# Detect Auto API

Backend API for the Detect Auto AI Diagnostic Tool.

## Features

- FastAPI REST API
- WebSocket support for real-time diagnostics
- JWT Authentication
- PostgreSQL database with SQLAlchemy ORM
- Alembic migrations
- OpenAI integration for AI features

## Getting Started

### Prerequisites

- Python 3.9+
- PostgreSQL (or use Docker)
- OpenAI API key

### Installation

1. Clone the repository
2. Create a virtual environment:
   \`\`\`
   python -m venv venv
   source venv/bin/activate # On Windows: venv\Scripts\activate
   \`\`\`
3. Install dependencies:
   \`\`\`
   pip install -r requirements.txt
   \`\`\`

### Environment Variables

Create a `.env` file with the following variables:

\`\`\`
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/detect_auto
OPENAI_API_KEY=your_openai_api_key
\`\`\`

### Database Setup

Run migrations to set up the database:

\`\`\`
alembic upgrade head
\`\`\`

### Running the Server

\`\`\`
python run.py
\`\`\`

Or with uvicorn directly:

\`\`\`
uvicorn app.main:app --reload
\`\`\`

### Docker

You can also use Docker Compose to run the application:

\`\`\`
docker-compose up
\`\`\`

## API Documentation

Once the server is running, you can access the API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
