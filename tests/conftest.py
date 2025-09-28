"""Pytest configuration and fixtures for FCIO tests."""

import json
from unittest.mock import MagicMock, Mock
from typing import Any, Dict

import pytest


@pytest.fixture
def mock_openai_client():
    """Mock OpenAI client with configurable responses."""
    client = MagicMock()

    # Default successful response
    response = MagicMock()
    response.output_text = '{"lemma": "test", "difficulty_level": "Beginner", "collocations": {"Beginner": ["test word", "word test"]}}'
    client.responses.create.return_value = response

    return client


@pytest.fixture
def mock_supabase_client():
    """Mock Supabase client with configurable database responses."""
    client = MagicMock()

    # Default successful responses
    table_mock = MagicMock()
    client.table.return_value = table_mock
    client.from_.return_value = table_mock

    # Upsert response
    upsert_response = MagicMock()
    upsert_response.data = [
        {
            "id": "test-id-123",
            "word": "test",
            "lang": "en",
            "lemma": "test",
            "difficulty_level": "Beginner",
            "collocations": {},
        }
    ]
    upsert_response.error = None
    table_mock.upsert.return_value.execute.return_value = upsert_response

    # Select response
    select_response = MagicMock()
    select_response.data = [
        {
            "id": "test-id-123",
            "word": "test",
            "lang": "en",
            "lemma": "test",
            "difficulty_level": "Beginner",
            "collocations": {},
        }
    ]
    select_response.error = None
    table_mock.select.return_value.eq.return_value.execute.return_value = (
        select_response
    )

    return client


@pytest.fixture
def mock_get_openai_client(mock_openai_client):
    """Mock the get_openai_client function."""
    return mock_openai_client


@pytest.fixture
def mock_get_supabase_client(mock_supabase_client):
    """Mock the get_supabase_client function."""
    return mock_supabase_client


@pytest.fixture
def mock_prompt_functions():
    """Mock prompt-related functions."""
    return {
        "get_prompt": Mock(
            return_value=(
                "System message",
                "User message: {word} {language} {collocations}",
            )
        ),
        "get_openai_prompt_config": Mock(
            return_value={
                "model": "gpt-4o",
                "response_format": "json_object",
                "temperature": 0.7,
                "max_tokens": 1000,
            }
        ),
    }


@pytest.fixture
def sample_word_data():
    """Sample word data for testing."""
    return {
        "word": "hello",
        "lang": "en",
        "lemma": "hello",
        "difficulty_level": "Beginner",
        "collocations": {
            "Beginner": ["hello world", "say hello"],
            "Elementary": ["hello there", "hello everyone"],
        },
        "id": None,
    }


@pytest.fixture
def sample_db_word_data():
    """Sample word data from database."""
    return {
        "id": "test-id-123",
        "word": "hello",
        "lang": "en",
        "lemma": "hello",
        "difficulty_level": "Beginner",
        "collocations": {
            "Beginner": ["hello world", "say hello"],
            "Elementary": ["hello there", "hello everyone"],
        },
    }


@pytest.fixture
def sample_ai_analysis():
    """Sample AI analysis response."""
    return {
        "lemma": "hello",
        "difficulty_level": "Beginner",
        "collocations": {
            "Beginner": ["hello world", "say hello"],
            "Elementary": ["hello there", "hello everyone"],
        },
    }


@pytest.fixture
def sample_collocations_string():
    """Sample collocations string from AI."""
    return """
    Beginner Level:
    - hello world
    - say hello
    
    Elementary Level:
    - hello there
    - hello everyone
    """
