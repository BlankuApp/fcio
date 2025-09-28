"""Integration tests for Word class with mocked external services."""

import json
from unittest.mock import patch, MagicMock
import pytest

from src.db.word import Word, DatabaseError, AIServiceError


@pytest.mark.integration
class TestWordIntegration:
    """Integration tests for Word class functionality."""

    @patch("src.db.word.get_supabase_client")
    @patch("src.db.word.get_openai_client")
    @patch("src.db.word.get_prompt")
    @patch("src.db.word.get_openai_prompt_config")
    def test_complete_word_lifecycle(
        self, mock_config, mock_prompt, mock_openai, mock_supabase
    ):
        """Test complete word lifecycle: create -> analyze -> save -> load."""
        # Setup AI mocks
        mock_prompt.return_value = (
            "system msg",
            "user msg: {word} {language} {collocations}",
        )
        mock_config.return_value = {
            "model": "gpt-4o",
            "response_format": "json_object",
            "temperature": 0.7,
            "max_tokens": 1000,
        }

        # Mock AI responses
        collocation_response = MagicMock()
        collocation_response.output_text = "test collocations from AI"

        analysis_response = MagicMock()
        analysis_response.output_text = json.dumps(
            {
                "lemma": "programming",
                "difficulty_level": "Intermediate",
                "collocations": {
                    "Beginner": ["basic programming", "simple program"],
                    "Intermediate": ["object programming", "programming language"],
                },
            }
        )

        mock_openai.return_value.responses.create.side_effect = [
            collocation_response,
            analysis_response,
        ]

        # Setup database mock
        mock_db_client = MagicMock()
        mock_supabase.return_value = mock_db_client

        # Mock save response
        save_response = MagicMock()
        save_response.data = [
            {
                "id": "word-123",
                "word": "program",
                "lang": "en",
                "lemma": "programming",
                "difficulty_level": "Intermediate",
                "collocations": {
                    "Beginner": ["basic programming", "simple program"],
                    "Intermediate": ["object programming", "programming language"],
                },
            }
        ]
        mock_db_client.table.return_value.upsert.return_value.execute.return_value = (
            save_response
        )

        # Mock load response
        load_response = MagicMock()
        load_response.data = [save_response.data[0]]
        load_response.error = None
        mock_db_client.from_.return_value.select.return_value.eq.return_value.execute.return_value = load_response

        # 1. Create word (triggers AI analysis)
        word = Word(word="program", lang="en")

        # Verify AI analysis results
        assert word.word == "program"
        assert word.lang == "en"
        assert word.lemma == "programming"
        assert word.difficulty_level == "Intermediate"
        assert "Beginner" in word.collocations
        assert "Intermediate" in word.collocations

        # 2. Save to database
        word.save_to_db()

        # Verify save operation
        assert word.id == "word-123"
        mock_db_client.table.assert_called_with("words")

        # 3. Load from database
        loaded_word = Word.from_db("word-123")

        # Verify loaded word matches original
        assert loaded_word.id == word.id
        assert loaded_word.word == word.word
        assert loaded_word.lang == word.lang
        assert loaded_word.lemma == word.lemma
        assert loaded_word.difficulty_level == word.difficulty_level
        assert loaded_word.collocations == word.collocations

    @patch("src.db.word.get_supabase_client")
    @patch("src.db.word.get_openai_client")
    def test_word_creation_with_ai_failure_then_successful_save(
        self, mock_openai, mock_supabase
    ):
        """Test word creation with AI failure but successful database operations."""
        # Setup AI to fail
        mock_openai.return_value.responses.create.side_effect = AIServiceError(
            "AI service down"
        )

        # Setup successful database mock
        mock_db_client = MagicMock()
        mock_supabase.return_value = mock_db_client

        save_response = MagicMock()
        save_response.data = [
            {
                "id": "word-fallback-123",
                "word": "test",
                "lang": "en",
                "lemma": "test",
                "difficulty_level": "Beginner",
                "collocations": {},
            }
        ]
        mock_db_client.table.return_value.upsert.return_value.execute.return_value = (
            save_response
        )

        # Create word (should fallback gracefully)
        word = Word(word="test", lang="en")

        # Verify fallback values
        assert word.lemma == "test"
        assert word.difficulty_level == "Beginner"
        assert word.collocations == {}

        # Should still be able to save
        word.save_to_db()
        assert word.id == "word-fallback-123"

    @patch("src.db.word.get_supabase_client")
    @patch("src.db.word.get_openai_client")
    @patch("src.db.word.get_prompt")
    @patch("src.db.word.get_openai_prompt_config")
    def test_word_analysis_success_but_database_failure(
        self, mock_config, mock_prompt, mock_openai, mock_supabase
    ):
        """Test successful AI analysis but database save failure."""
        # Setup successful AI mocks
        mock_prompt.return_value = ("system", "user: {word} {language} {collocations}")
        mock_config.return_value = {
            "model": "gpt-4o",
            "response_format": "json_object",
            "temperature": 0.7,
            "max_tokens": 1000,
        }

        collocation_response = MagicMock()
        collocation_response.output_text = "collocations"

        analysis_response = MagicMock()
        analysis_response.output_text = json.dumps(
            {
                "lemma": "test",
                "difficulty_level": "Advanced",
                "collocations": {"Advanced": ["complex test"]},
            }
        )

        mock_openai.return_value.responses.create.side_effect = [
            collocation_response,
            analysis_response,
        ]

        # Setup database to fail
        mock_db_client = MagicMock()
        mock_supabase.return_value = mock_db_client
        mock_db_client.table.return_value.upsert.return_value.execute.side_effect = (
            Exception("DB connection lost")
        )

        # Create word (should succeed)
        word = Word(word="test", lang="en")

        # Verify AI analysis worked
        assert word.lemma == "test"
        assert word.difficulty_level == "Advanced"

        # But database save should fail
        with pytest.raises(DatabaseError, match="Error saving word 'test' to database"):
            word.save_to_db()

    @patch("src.db.word.get_openai_client")
    @patch("src.db.word.get_prompt")
    @patch("src.db.word.get_openai_prompt_config")
    def test_multiple_words_with_different_languages(
        self, mock_config, mock_prompt, mock_openai
    ):
        """Test creating multiple words with different languages."""
        # Setup mocks
        mock_prompt.return_value = ("system", "user: {word} {language} {collocations}")
        mock_config.return_value = {
            "model": "gpt-4o",
            "response_format": "json_object",
            "temperature": 0.7,
            "max_tokens": 1000,
        }

        # Mock responses for different languages
        def mock_ai_response(*args, **kwargs):
            response = MagicMock()
            # Simulate different responses based on call count
            if mock_openai.return_value.responses.create.call_count % 2 == 1:
                response.output_text = "collocations"
            else:
                response.output_text = json.dumps(
                    {
                        "lemma": "hello" if "hello" in str(args) else "hola",
                        "difficulty_level": "Beginner",
                        "collocations": {"Beginner": ["greeting"]},
                    }
                )
            return response

        mock_openai.return_value.responses.create.side_effect = mock_ai_response

        # Create words in different languages
        english_word = Word(word="hello", lang="en")
        spanish_word = Word(word="hola", lang="es")

        # Verify both were processed
        assert english_word.lang == "en"
        assert spanish_word.lang == "es"
        assert english_word.difficulty_level == "Beginner"
        assert spanish_word.difficulty_level == "Beginner"

        # Verify AI was called for both
        assert (
            mock_openai.return_value.responses.create.call_count >= 4
        )  # 2 calls per word
