# Athar — From Learning to Impact

Athar is a training management and impact assessment system designed for King Saud University. It supports the training journey from course registration and learning to attendance, evaluation, and training impact measurement.

## Technologies Used

- **Frontend:** React, Vite, JavaScript, CSS
- **Backend:** Python, FastAPI
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy
- **Authentication:** JWT

## Key Features

- Training course management.
- Trainee registration and enrollment request management.
- Trainer application management.
- Training content and session management.
- Attendance tracking and learning content completion.
- Training evaluations and impact assessment.
- Notifications and dashboards.
- Password recovery support.

## Prerequisites

Make sure the following tools are installed:

- Python
- Node.js and npm
- PostgreSQL

## Getting Started

### 1. Clone the Repository

Clone the repository and switch to the development branch:

```bash
git clone https://github.com/tasnim-2003/Training-Project.git
cd Training-Project
git switch tasnim-development
```

### 2. Configure the Database

Create a PostgreSQL database, then create a `.env` file in the project root directory.

Add the following environment variable and replace the placeholders with your database credentials:

```env
DATABASE_URL=postgresql://USERNAME:PASSWORD@HOST:5432/DATABASE_NAME
```

**Important:** Never commit your `.env` file, database credentials, or other secrets to GitHub.

### 3. Set Up and Run the Backend

From the project root directory, create a Python virtual environment:

```bash
python -m venv .venv
```

Activate it in Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install the project dependencies if a `requirements.txt` file is available:

```bash
pip install -r requirements.txt
```

Start the FastAPI server using the project's configured application entry point:

```bash
python -m uvicorn app.app:app --reload
```

Once the server is running, the API documentation should be available at:

http://127.0.0.1:8000/docs

### 4. Set Up and Run the Frontend

Open a separate terminal window and run:

```bash
cd frontend
npm install
npm run dev
```

Open the frontend URL displayed in the terminal after Vite starts.

## Notes

- PostgreSQL must be configured before using features that depend on the database.
- Required environment variables must be configured before starting the application.
- Uploaded training materials may need to be transferred separately if they are not included in the Git repository.
- Do not share environment files or actual database credentials.

## Project Information

- **Project Name:** Athar — From Learning to Impact
- **Institution:** King Saud University
- **Purpose:** Training management, evaluation, and impact assessment.
