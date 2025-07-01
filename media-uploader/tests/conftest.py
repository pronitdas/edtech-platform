import os
import pytest
import dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from neo4j import GraphDatabase

# Load test environment variables
dotenv.load_dotenv(dotenv.find_dotenv('.env.test'))

from models import Base
from seed_postgres import create_test_data
from seed_neo4j import create_test_nodes, create_test_relationships
from knowledge_graph import Neo4jGraphService

# Get database configuration from environment
TEST_POSTGRES_URL = os.getenv('DATABASE_URL')
TEST_NEO4J_URL = os.getenv('NEO4J_URI')
TEST_NEO4J_AUTH = (os.getenv('NEO4J_USER'), os.getenv('NEO4J_PASSWORD'))

@pytest.fixture(scope="session")
def postgres_engine():
    """Create test database and return engine."""
    # Create test database engine
    engine = create_engine(TEST_POSTGRES_URL)
    
    # Create all tables
    Base.metadata.drop_all(engine)  # Clean slate
    Base.metadata.create_all(engine)
    
    yield engine
    
    # Cleanup after all tests
    Base.metadata.drop_all(engine)

@pytest.fixture(scope="session")
def neo4j_driver():
    """Create Neo4j test database connection."""
    driver = GraphDatabase.driver(
        TEST_NEO4J_URL,
        auth=TEST_NEO4J_AUTH
    )
    
    # Verify connection
    with driver.session() as session:
        session.run("MATCH (n) DETACH DELETE n")  # Clean slate
    
    yield driver
    
    # Cleanup after all tests
    with driver.session() as session:
        session.run("MATCH (n) DETACH DELETE n")
    driver.close()

@pytest.fixture
def db_session(postgres_engine):
    """Create a new database session for a test."""
    SessionLocal = sessionmaker(bind=postgres_engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()  # Rollback uncommitted changes
        session.close()

@pytest.fixture
def graph_db(neo4j_driver):
    """Create a Neo4j graph service instance for testing."""
    graph = Neo4jGraphService(driver=neo4j_driver)
    try:
        yield graph
    finally:
        # Clean up any test data
        with neo4j_driver.session() as session:
            session.run("MATCH (n) DETACH DELETE n")

@pytest.fixture
def seeded_postgres(db_session):
    """Fixture that provides a database session with seeded test data."""
    create_test_data(db_session)
    db_session.commit()
    yield db_session
    # Cleanup is handled by db_session fixture

@pytest.fixture
def seeded_neo4j(graph_db):
    """Fixture that provides a Neo4j connection with seeded test data."""
    # Create schema constraints first
    graph_db.create_schema_constraints()
    
    # Create test nodes and get their IDs
    node_ids = create_test_nodes(graph_db)
    
    # Create relationships between nodes
    create_test_relationships(graph_db, node_ids)
    
    yield graph_db
    # Cleanup is handled by graph_db fixture

@pytest.fixture
def test_client():
    """Fixture for test client - can be expanded based on your web framework."""
    # TODO: Add your test client setup here
    # For example, if using FastAPI:
    # from fastapi.testclient import TestClient
    # from main import app
    # return TestClient(app)
    pass