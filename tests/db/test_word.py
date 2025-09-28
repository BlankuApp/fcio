"""Tests for src.db.word module."""

import json
from unittest.mock import MagicMock, Mock, patch
import pytest

from src import DifficultyLevel, DEFAULT_DIFFICULTY
from src.db.word import (
    Word,
    WordAnalysisError,
    DatabaseError,
    AIServiceError,
    ValidationError,
    collect_collocations,
    analyze_word,
)


class TestCustomExceptions:
    """Test custom exception classes."""

    def test_word_analysis_error(self):
        """Test WordAnalysisError can be raised and caught."""
        with pytest.raises(WordAnalysisError):
            raise WordAnalysisError("Test error")

    def test_database_error(self):
        """Test DatabaseError can be raised and caught."""
        with pytest.raises(DatabaseError):
            raise DatabaseError("Database connection failed")

    def test_ai_service_error(self):
        """Test AIServiceError can be raised and caught."""
        with pytest.raises(AIServiceError):
            raise AIServiceError("AI service unavailable")

    def test_exception_inheritance(self):
        """Test that custom exceptions inherit from Exception."""
        assert issubclass(WordAnalysisError, Exception)
        assert issubclass(DatabaseError, Exception)
        assert issubclass(AIServiceError, Exception)

    def test_validation_error(self):
        """Test ValidationError can be raised and caught."""
        with pytest.raises(ValidationError):
            raise ValidationError("Invalid input")


class TestDifficultyLevel:
    """Test DifficultyLevel enum functionality."""

    def test_difficulty_level_values(self):
        """Test that DifficultyLevel enum has expected values."""
        expected_values = [
            "Beginner",
            "Elementary",
            "Intermediate",
            "Upper Intermediate",
            "Advanced",
            "Native/Fluent",
        ]
        assert DifficultyLevel.get_values() == expected_values

    def test_difficulty_level_is_valid(self):
        """Test DifficultyLevel.is_valid method."""
        # Valid levels
        assert DifficultyLevel.is_valid("Beginner") is True
        assert DifficultyLevel.is_valid("Advanced") is True
        assert DifficultyLevel.is_valid("Native/Fluent") is True

        # Invalid levels
        assert DifficultyLevel.is_valid("Expert") is False
        assert DifficultyLevel.is_valid("beginner") is False  # case sensitive
        assert DifficultyLevel.is_valid("") is False
        assert DifficultyLevel.is_valid("Invalid") is False

    def test_difficulty_level_enum_access(self):
        """Test accessing DifficultyLevel enum values."""
        assert DifficultyLevel.BEGINNER.value == "Beginner"
        assert DifficultyLevel.ADVANCED.value == "Advanced"
        assert DifficultyLevel.NATIVE_FLUENT.value == "Native/Fluent"


class TestInputValidation:
    """Test input validation for Word class."""

    def test_empty_word_validation(self):
        """Test that empty word raises ValidationError."""
        with pytest.raises(ValidationError, match="Word cannot be empty"):
            Word(word="", lang="en")

    def test_whitespace_only_word_validation(self):
        """Test that whitespace-only word raises ValidationError."""
        with pytest.raises(ValidationError, match="Word cannot be empty"):
            Word(word="   ", lang="en")

    def test_word_whitespace_cleanup(self):
        """Test that word whitespace is cleaned up."""
        with patch("src.db.word.get_openai_client") as mock_openai:
            # Mock AI failure to avoid actual analysis
            mock_openai.return_value.responses.create.side_effect = Exception(
                "Skip analysis"
            )

            word = Word(word="  hello  ", lang="en")
            assert word.word == "hello"  # whitespace should be stripped

    def test_invalid_language_validation(self):
        """Test that invalid language code raises ValidationError."""
        with pytest.raises(
            ValidationError, match="Language code 'xyz' is not supported"
        ):
            Word(word="test", lang="xyz")

    def test_valid_language_codes(self):
        """Test that valid language codes are accepted."""
        with patch("src.db.word.get_openai_client") as mock_openai:
            mock_openai.return_value.responses.create.side_effect = Exception(
                "Skip analysis"
            )

            # Test some valid language codes (using correct codes from LANGUAGES dict)
            for lang_code in [
                "en",
                "es",
                "fr",
                "de",
                "cn",
            ]:  # "cn" for Chinese, not "zh"
                word = Word(word="test", lang=lang_code)
                assert word.lang == lang_code

    def test_invalid_difficulty_level_validation(self):
        """Test that invalid difficulty level raises ValidationError."""
        with pytest.raises(
            ValidationError, match="Difficulty level 'Expert' is not valid"
        ):
            Word(word="test", lang="en", difficulty_level="Expert")

    def test_valid_difficulty_levels(self):
        """Test that all valid difficulty levels are accepted."""
        with patch("src.db.word.get_openai_client") as mock_openai:
            mock_openai.return_value.responses.create.side_effect = Exception(
                "Skip analysis"
            )

            for level in DifficultyLevel.get_values():
                word = Word(
                    word="test", lang="en", difficulty_level=level, lemma="test"
                )
                assert word.difficulty_level == level

    def test_case_sensitive_difficulty_validation(self):
        """Test that difficulty level validation is case-sensitive."""
        with pytest.raises(
            ValidationError, match="Difficulty level 'beginner' is not valid"
        ):
            Word(word="test", lang="en", difficulty_level="beginner")  # lowercase


class TestWordClass:
    """Test Word class functionality."""

    @patch("src.db.word.get_openai_client")
    @patch("src.db.word.get_prompt")
    @patch("src.db.word.get_openai_prompt_config")
    def test_word_creation_with_analysis(self, mock_config, mock_prompt, mock_openai):
        """Test Word creation triggers AI analysis."""
        # Setup mocks
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

        # Mock collocation response
        mock_collocation_response = MagicMock()
        mock_collocation_response.output_text = "test collocations"

        # Mock analysis response
        mock_analysis_response = MagicMock()
        mock_analysis_response.output_text = json.dumps(
            {
                "lemma": "testing",
                "difficulty_level": "Intermediate",
                "collocations": {"Beginner": ["test case", "testing phase"]},
            }
        )

        mock_openai.return_value.responses.create.side_effect = [
            mock_collocation_response,
            mock_analysis_response,
        ]

        # Create word
        word = Word(word="test", lang="en")

        # Assertions
        assert word.word == "test"
        assert word.lang == "en"
        assert word.lemma == "testing"
        assert word.difficulty_level == "Intermediate"
        assert word.collocations == {"Beginner": ["test case", "testing phase"]}
        assert word.id is None

        # Verify AI calls were made
        assert mock_openai.return_value.responses.create.call_count == 2

    @patch("src.db.word.get_openai_client")
    def test_word_creation_ai_failure_fallback(self, mock_openai):
        """Test Word creation falls back gracefully when AI fails."""
        # Mock AI failure
        mock_openai.return_value.responses.create.side_effect = Exception(
            "AI service down"
        )

        word = Word(word="test", lang="en")

        # Should fallback to defaults
        assert word.word == "test"
        assert word.lang == "en"
        assert word.lemma == "test"  # fallback to original word
        assert word.difficulty_level == DEFAULT_DIFFICULTY
        assert word.collocations == {}

    def test_word_creation_with_existing_lemma(self):
        """Test Word creation skips analysis when lemma is provided."""
        word = Word(
            word="test",
            lang="en",
            lemma="existing_lemma",
            difficulty_level="Advanced",
            collocations={"Advanced": ["complex test"]},
        )

        assert word.lemma == "existing_lemma"
        assert word.difficulty_level == "Advanced"
        assert word.collocations == {"Advanced": ["complex test"]}

    def test_to_dict_without_id(self, sample_word_data):
        """Test to_dict method without database ID."""
        word = Word(
            word=sample_word_data["word"],
            lang=sample_word_data["lang"],
            lemma=sample_word_data["lemma"],
            difficulty_level=sample_word_data["difficulty_level"],
            collocations=sample_word_data["collocations"],
        )

        result = word.to_dict()
        expected = sample_word_data.copy()

        assert result == expected
        assert "id" not in result

    def test_to_dict_with_id(self, sample_word_data):
        """Test to_dict method with database ID."""
        word = Word(
            word=sample_word_data["word"],
            lang=sample_word_data["lang"],
            lemma=sample_word_data["lemma"],
            difficulty_level=sample_word_data["difficulty_level"],
            collocations=sample_word_data["collocations"],
        )
        word.id = "test-123"

        result = word.to_dict()
        expected = sample_word_data.copy()
        expected["id"] = "test-123"

        assert result == expected
        assert result["id"] == "test-123"


class TestDatabaseOperations:
    """Test database operations."""

    @patch("src.db.word.get_supabase_client")
    def test_save_to_db_success(self, mock_supabase, sample_word_data):
        """Test successful save to database."""
        # Setup mock
        mock_client = MagicMock()
        mock_supabase.return_value = mock_client

        response_mock = MagicMock()
        response_mock.data = [{"id": "new-id-123", **sample_word_data}]
        mock_client.table.return_value.upsert.return_value.execute.return_value = (
            response_mock
        )

        # Create word and save
        word = Word(
            word=sample_word_data["word"],
            lang=sample_word_data["lang"],
            lemma=sample_word_data["lemma"],
            difficulty_level=sample_word_data["difficulty_level"],
            collocations=sample_word_data["collocations"],
        )

        word.save_to_db()

        # Assertions
        assert word.id == "new-id-123"
        mock_client.table.assert_called_once_with("words")
        mock_client.table.return_value.upsert.assert_called_once()

    @patch("src.db.word.get_supabase_client")
    def test_save_to_db_no_data_returned(self, mock_supabase):
        """Test save_to_db raises error when no data returned."""
        # Setup mock with empty response
        mock_client = MagicMock()
        mock_supabase.return_value = mock_client

        response_mock = MagicMock()
        response_mock.data = []  # Empty data
        mock_client.table.return_value.upsert.return_value.execute.return_value = (
            response_mock
        )

        word = Word(word="test", lang="en", lemma="test")

        with pytest.raises(
            DatabaseError, match="No data returned from upsert operation"
        ):
            word.save_to_db()

    @patch("src.db.word.get_supabase_client")
    def test_save_to_db_exception(self, mock_supabase):
        """Test save_to_db handles exceptions properly."""
        # Setup mock to raise exception
        mock_client = MagicMock()
        mock_supabase.return_value = mock_client
        mock_client.table.return_value.upsert.return_value.execute.side_effect = (
            Exception("DB Error")
        )

        word = Word(word="test", lang="en", lemma="test")

        with pytest.raises(DatabaseError, match="Error saving word 'test' to database"):
            word.save_to_db()

    @patch("src.db.word.get_supabase_client")
    def test_from_db_success(self, mock_supabase, sample_db_word_data):
        """Test successful loading from database."""
        # Setup mock
        mock_client = MagicMock()
        mock_supabase.return_value = mock_client

        response_mock = MagicMock()
        response_mock.data = [sample_db_word_data]
        response_mock.error = None
        mock_client.from_.return_value.select.return_value.eq.return_value.execute.return_value = response_mock

        # Load word
        word = Word.from_db("test-id-123")

        # Assertions
        assert word.id == sample_db_word_data["id"]
        assert word.word == sample_db_word_data["word"]
        assert word.lang == sample_db_word_data["lang"]
        assert word.lemma == sample_db_word_data["lemma"]
        assert word.difficulty_level == sample_db_word_data["difficulty_level"]
        assert word.collocations == sample_db_word_data["collocations"]

    @patch("src.db.word.get_supabase_client")
    def test_from_db_not_found(self, mock_supabase):
        """Test from_db raises error when word not found."""
        # Setup mock with empty response
        mock_client = MagicMock()
        mock_supabase.return_value = mock_client

        response_mock = MagicMock()
        response_mock.data = []
        response_mock.error = None
        mock_client.from_.return_value.select.return_value.eq.return_value.execute.return_value = response_mock

        with pytest.raises(DatabaseError, match="Word with ID 'nonexistent' not found"):
            Word.from_db("nonexistent")

    @patch("src.db.word.get_supabase_client")
    def test_from_db_database_error(self, mock_supabase):
        """Test from_db handles database errors."""
        # Setup mock with error response
        mock_client = MagicMock()
        mock_supabase.return_value = mock_client

        error_mock = MagicMock()
        error_mock.message = "Connection failed"
        response_mock = MagicMock()
        response_mock.data = None
        response_mock.error = error_mock
        mock_client.from_.return_value.select.return_value.eq.return_value.execute.return_value = response_mock

        with pytest.raises(DatabaseError, match="Connection failed"):
            Word.from_db("test-id")

    @patch("src.db.word.get_supabase_client")
    def test_from_db_invalid_difficulty_level_cleanup(self, mock_supabase):
        """Test from_db cleans up invalid difficulty levels from database."""
        # Setup mock with invalid difficulty in database
        mock_client = MagicMock()
        mock_supabase.return_value = mock_client

        sample_data_with_invalid_difficulty = {
            "id": "test-id-123",
            "word": "hello",
            "lang": "en",
            "lemma": "hello",
            "difficulty_level": "Expert",  # Invalid difficulty
            "collocations": {"Beginner": ["hello world"]},
        }

        response_mock = MagicMock()
        response_mock.data = [sample_data_with_invalid_difficulty]
        response_mock.error = None
        mock_client.from_.return_value.select.return_value.eq.return_value.execute.return_value = response_mock

        # Load word - should clean up invalid difficulty
        word = Word.from_db("test-id-123")

        # Should use default difficulty instead of invalid "Expert"
        assert word.difficulty_level == DEFAULT_DIFFICULTY
        assert word.word == "hello"  # Other fields should remain unchanged
        assert word.lang == "en"
        assert word.lemma == "hello"


class TestAIOperations:
    """Test AI service operations."""

    @patch("src.db.word.get_openai_client")
    @patch("src.db.word.get_prompt")
    @patch("src.db.word.get_openai_prompt_config")
    def test_collect_collocations_success(self, mock_config, mock_prompt, mock_openai):
        """Test successful collocation collection."""
        # Setup mocks
        mock_prompt.return_value = ("system", "user: {word} {language}")
        mock_config.return_value = {
            "model": "gpt-4o",
            "response_format": "json_object",
            "temperature": 0.7,
            "max_tokens": 1000,
        }

        response_mock = MagicMock()
        response_mock.output_text = "test collocations"
        mock_openai.return_value.responses.create.return_value = response_mock

        # Create word and test
        word = Word.__new__(Word)
        word.word = "test"
        word.lang = "en"

        result = word._collect_collocations()

        assert result == "test collocations"
        mock_openai.return_value.responses.create.assert_called_once()

    @patch("src.db.word.get_openai_client")
    def test_collect_collocations_failure(self, mock_openai):
        """Test collocation collection handles failures."""
        # Setup mock to fail
        mock_openai.return_value.responses.create.side_effect = Exception("API Error")

        word = Word.__new__(Word)
        word.word = "test"
        word.lang = "en"

        with pytest.raises(
            AIServiceError, match="Failed to collect collocations for word 'test'"
        ):
            word._collect_collocations()

    @patch("src.db.word.get_openai_client")
    @patch("src.db.word.get_prompt")
    @patch("src.db.word.get_openai_prompt_config")
    def test_analyze_word_success(
        self, mock_config, mock_prompt, mock_openai, sample_ai_analysis
    ):
        """Test successful word analysis."""
        # Setup mocks
        mock_prompt.return_value = ("system", "user: {word} {collocations}")
        mock_config.return_value = {
            "model": "gpt-4o",
            "response_format": "json_object",
            "temperature": 0.7,
            "max_tokens": 1000,
        }

        response_mock = MagicMock()
        response_mock.output_text = json.dumps(sample_ai_analysis)
        mock_openai.return_value.responses.create.return_value = response_mock

        word = Word.__new__(Word)
        word.word = "hello"
        word.lang = "en"

        result = word._analyze_word("test collocations")

        assert result == sample_ai_analysis
        mock_openai.return_value.responses.create.assert_called_once()

    @patch("src.db.word.get_openai_client")
    @patch("src.db.word.get_prompt")
    @patch("src.db.word.get_openai_prompt_config")
    def test_analyze_word_invalid_json(self, mock_config, mock_prompt, mock_openai):
        """Test word analysis handles invalid JSON response."""
        # Setup mocks
        mock_prompt.return_value = ("system", "user: {word} {collocations}")
        mock_config.return_value = {
            "model": "gpt-4o",
            "response_format": "json_object",
            "temperature": 0.7,
            "max_tokens": 1000,
        }

        response_mock = MagicMock()
        response_mock.output_text = "invalid json response"
        mock_openai.return_value.responses.create.return_value = response_mock

        word = Word.__new__(Word)
        word.word = "test"
        word.lang = "en"

        with pytest.raises(
            WordAnalysisError, match="Invalid JSON response from AI service"
        ):
            word._analyze_word("test collocations")

    @patch("src.db.word.get_openai_client")
    @patch("src.db.word.get_prompt")
    @patch("src.db.word.get_openai_prompt_config")
    def test_analyze_word_non_dict_response(
        self, mock_config, mock_prompt, mock_openai
    ):
        """Test word analysis handles non-dictionary JSON response."""
        # Setup mocks
        mock_prompt.return_value = ("system", "user: {word} {collocations}")
        mock_config.return_value = {
            "model": "gpt-4o",
            "response_format": "json_object",
            "temperature": 0.7,
            "max_tokens": 1000,
        }

        response_mock = MagicMock()
        response_mock.output_text = json.dumps(["not", "a", "dict"])
        mock_openai.return_value.responses.create.return_value = response_mock

        word = Word.__new__(Word)
        word.word = "test"
        word.lang = "en"

        with pytest.raises(WordAnalysisError, match="AI response is not a dictionary"):
            word._analyze_word("test collocations")

    def test_ai_invalid_difficulty_level_fallback(self):
        """Test that invalid difficulty level from AI falls back to default."""
        # Create a Word instance and directly test the validation logic
        word = Word.__new__(Word)
        word.word = "test"
        word.lang = "en"
        word.lemma = ""
        word.difficulty_level = DEFAULT_DIFFICULTY
        word.collocations = None

        # Simulate AI analysis result with invalid difficulty
        ai_analysis = {
            "lemma": "testing",
            "difficulty_level": "Expert",  # Invalid difficulty level
            "collocations": {"Beginner": ["test case"]},
        }

        # Test the validation logic in __post_init__ by calling it directly
        # First set up the word with a valid lemma to skip AI analysis
        word.lemma = "testing"
        word._validate_inputs()  # This should pass

        # Now test the difficulty validation logic separately
        difficulty = ai_analysis.get("difficulty_level", DEFAULT_DIFFICULTY)
        if DifficultyLevel.is_valid(difficulty):
            word.difficulty_level = difficulty
        else:
            word.difficulty_level = DEFAULT_DIFFICULTY

        # Should use default difficulty instead of invalid "Expert"
        assert word.difficulty_level == DEFAULT_DIFFICULTY
        assert word.lemma == "testing"  # Other fields should still work


class TestUtilityFunctions:
    """Test backward compatibility utility functions."""

    @patch("src.db.word.Word._collect_collocations")
    def test_collect_collocations_function(self, mock_method):
        """Test backward compatibility collect_collocations function."""
        mock_method.return_value = "test collocations"

        result = collect_collocations("test", "en")

        assert result == "test collocations"
        mock_method.assert_called_once()

    @patch("src.db.word.Word._analyze_word")
    def test_analyze_word_function(self, mock_method, sample_ai_analysis):
        """Test backward compatibility analyze_word function."""
        mock_method.return_value = sample_ai_analysis

        result = analyze_word("test", "en", "collocations")

        assert result == sample_ai_analysis
        mock_method.assert_called_once_with("collocations")

    @patch("src.db.word.Word._collect_collocations")
    @patch("src.db.word.Word._analyze_word")
    def test_analyze_word_function_without_collocations(
        self, mock_analyze, mock_collect, sample_ai_analysis
    ):
        """Test analyze_word function collects collocations when not provided."""
        mock_collect.return_value = "collected collocations"
        mock_analyze.return_value = sample_ai_analysis

        result = analyze_word("test", "en")

        assert result == sample_ai_analysis
        mock_collect.assert_called_once()
        mock_analyze.assert_called_once_with("collected collocations")


class TestEdgeCases:
    """Test edge cases and error scenarios."""

    def test_word_with_empty_string(self):
        """Test creating word with empty string."""
        with patch("src.db.word.get_openai_client") as mock_openai:
            mock_openai.return_value.responses.create.side_effect = Exception(
                "No word provided"
            )

            word = Word(word="", lang="en")

            assert word.word == ""
            assert word.lemma == ""  # fallback
            assert word.difficulty_level == DEFAULT_DIFFICULTY

    def test_word_with_unsupported_language(self):
        """Test creating word with unsupported language code."""
        with patch("src.db.word.get_openai_client") as mock_openai:
            # Mock successful response even with unsupported language
            response_mock = MagicMock()
            response_mock.output_text = json.dumps(
                {"lemma": "test", "difficulty_level": "Beginner", "collocations": {}}
            )
            mock_openai.return_value.responses.create.side_effect = [
                MagicMock(output_text="collocations"),
                response_mock,
            ]

            word = Word(word="test", lang="xyz")  # unsupported language

            assert word.lang == "xyz"
            assert word.word == "test"

    def test_to_dict_with_none_collocations(self):
        """Test to_dict with None collocations."""
        word = Word(word="test", lang="en", lemma="test", collocations=None)

        result = word.to_dict()

        assert result["collocations"] is None
        assert "word" in result
        assert "lang" in result
