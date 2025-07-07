# Backend Setup

This guide explains how to set up the backend for the EdTech Platform.

## Prerequisites

* Docker and Docker Compose
* Python 3.10+

## Installation

```bash
pip install -r requirements.txt
```

## Development

```bash
python main.py
```

This will start the FastAPI development server on `http://localhost:8000`.

## Database Migrations

To create a new migration:

```bash
python -m alembic revision --autogenerate -m "Description of changes"
```

To apply migrations:

```bash
python -m alembic upgrade head
```
