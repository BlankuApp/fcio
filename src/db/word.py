"""Word data model with AI-powered analysis and database operations."""

import json
import logging
from dataclasses import dataclass
from typing import Any

from src import (
    LANGUAGES,
    get_openai_client,
    get_supabase_client,
    DifficultyLevel,
    DEFAULT_DIFFICULTY,
)
from src.prompts import get_prompt, get_openai_prompt_config

# Setup logging
logger = logging.getLogger(__name__)

# Type variable for class methods
WordType = type["Word"]

# Constants
DEFAULT_TEMPERATURE = 0.7
DEFAULT_MAX_TOKENS = 1000


# Custom Exceptions
class ValidationError(Exception):
    """Raised when input validation fails."""

    pass


class WordAnalysisError(Exception):
    """Raised when word analysis fails."""

    pass


class DatabaseError(Exception):
    """Raised when database operations fail."""

    pass


class AIServiceError(Exception):
    """Raised when AI service calls fail."""

    pass


@dataclass
class Word:
    """A word model with AI-powered analysis and database persistence.

    This class represents a word with its linguistic analysis including
    difficulty level and collocations, determined through AI processing.

    Attributes:
        word: The original word or phrase (cannot be empty)
        lang: Language code from supported LANGUAGES dict (e.g., 'en', 'es')
        lemma: Base form of the word
        difficulty_level: Difficulty level from DifficultyLevel enum
        collocations: Dictionary of collocations categorized by proficiency level
        id: Database identifier (None for unsaved instances)

    Raises:
        ValidationError: If word is empty, lang is unsupported, or difficulty_level is invalid
    """

    word: str
    lang: str
    lemma: str = ""
    difficulty_level: str = DEFAULT_DIFFICULTY
    collocations: dict[str, list[str]] | None = None
    id: str | None = None

    def __post_init__(self) -> None:
        """Initialize word analysis after dataclass creation."""
        # Validate inputs
        self._validate_inputs()

        if not self.lemma:
            try:
                collocations_str = self._collect_collocations()
                analysis = self._analyze_word(collocations_str)
                self.lemma = analysis.get("lemma", self.word)
                difficulty = analysis.get("difficulty_level", DEFAULT_DIFFICULTY)

                # Validate AI-returned difficulty level
                if DifficultyLevel.is_valid(difficulty):
                    self.difficulty_level = difficulty
                else:
                    logger.warning(
                        f"Invalid difficulty level from AI: {difficulty}, using default"
                    )
                    self.difficulty_level = DEFAULT_DIFFICULTY

                self.collocations = analysis.get("collocations", {})
                logger.info(f"Successfully analyzed word: {self.word}")
            except Exception as e:
                logger.error(f"Failed to analyze word '{self.word}': {e}")
                self.lemma = self.word
                self.difficulty_level = DEFAULT_DIFFICULTY
                self.collocations = {}

    def _validate_inputs(self) -> None:
        """Validate word input parameters.

        Raises:
            ValidationError: If any validation fails.
        """
        # Validate word is not empty
        if not self.word or not self.word.strip():
            raise ValidationError("Word cannot be empty or whitespace only")

        # Clean and reassign word (remove extra whitespace)
        self.word = self.word.strip()

        # Validate language code
        if self.lang not in LANGUAGES:
            valid_languages = ", ".join(sorted(LANGUAGES.keys()))
            raise ValidationError(
                f"Language code '{self.lang}' is not supported. "
                f"Valid languages: {valid_languages}"
            )

        # Validate difficulty level if provided
        if self.difficulty_level and not DifficultyLevel.is_valid(
            self.difficulty_level
        ):
            valid_levels = ", ".join(DifficultyLevel.get_values())
            raise ValidationError(
                f"Difficulty level '{self.difficulty_level}' is not valid. "
                f"Valid levels: {valid_levels}"
            )

    def to_dict(self) -> dict[str, Any]:
        """Convert word instance to dictionary representation.

        Returns:
            Dictionary containing all word attributes, excluding None values.
        """
        result = {
            "word": self.word,
            "lang": self.lang,
            "lemma": self.lemma,
            "difficulty_level": self.difficulty_level,
            "collocations": self.collocations,
        }
        if self.id is not None:
            result["id"] = self.id
        return result

    def save_to_db(self) -> None:
        """Save word instance to database using upsert operation.

        Raises:
            DatabaseError: If database operation fails.
        """
        client = get_supabase_client()
        data = self.to_dict()
        try:
            response = client.table("words").upsert(data).execute()
            if response.data:
                self.id = response.data[0]["id"]
                logger.info(
                    f"Successfully saved word to database: {self.word} (ID: {self.id})"
                )
            else:
                raise DatabaseError("No data returned from upsert operation")
        except Exception as e:
            error_msg = f"Error saving word '{self.word}' to database: {e}"
            logger.error(error_msg)
            raise DatabaseError(error_msg) from e

    @classmethod
    def from_db(cls, word_id: str) -> "Word":
        """Load word instance from database by ID.

        Args:
            word_id: Database identifier for the word.

        Returns:
            Word instance populated from database.

        Raises:
            DatabaseError: If word not found or database operation fails.
        """
        client = get_supabase_client()
        try:
            response = client.from_("words").select("*").eq("id", word_id).execute()
            if response.error or not response.data:
                error_msg = (
                    f"Word with ID '{word_id}' not found"
                    if not response.data
                    else response.error.message
                )
                raise DatabaseError(error_msg)

            data = response.data[0]
            # Create instance without triggering analysis
            instance = cls.__new__(cls)
            instance.word = data.get(
                "word", data["lemma"]
            )  # fallback for backward compatibility
            instance.lang = data["lang"]
            instance.lemma = data["lemma"]

            # Validate and clean difficulty level from database
            db_difficulty = data["difficulty_level"]
            if DifficultyLevel.is_valid(db_difficulty):
                instance.difficulty_level = db_difficulty
            else:
                logger.warning(
                    f"Invalid difficulty level in database: {db_difficulty}, using default"
                )
                instance.difficulty_level = DEFAULT_DIFFICULTY

            instance.collocations = data["collocations"]
            instance.id = data["id"]

            # Validate the loaded instance
            try:
                instance._validate_inputs()
            except ValidationError as e:
                logger.warning(f"Loaded word data validation failed: {e}")
                # Don't raise error for existing data, just log warning

            logger.info(
                f"Successfully loaded word from database: {instance.word} (ID: {word_id})"
            )
            return instance

        except Exception as e:
            error_msg = f"Error fetching word from database (ID: {word_id}): {e}"
            logger.error(error_msg)
            raise DatabaseError(error_msg) from e

    def _collect_collocations(self) -> str:
        """Collect collocations for the word using AI service.

        Returns:
            String containing formatted collocations.

        Raises:
            AIServiceError: If AI service call fails.
        """
        try:
            # Get formatted prompt messages
            system_message, user_message = get_prompt(
                "collocations",
                word=self.word,
                language=LANGUAGES.get(self.lang, "English"),
            )

            # Get OpenAI configuration for this prompt
            config = get_openai_prompt_config("collocations")

            response = get_openai_client().responses.create(
                model=config["model"],
                input=[
                    {
                        "role": "developer",
                        "content": {
                            "type": "input_text",
                            "text": system_message,
                        },
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "input_text",
                                "text": user_message.format(
                                    word=self.word,
                                    language=LANGUAGES.get(self.lang, "English"),
                                ),
                            }
                        ],
                    },
                ],
                text={
                    "format": {"type": config["response_format"]},
                    "verbosity": "medium",
                },
                reasoning={"effort": "medium", "summary": None},
                tools=[],
                store=False,
                include=[
                    "reasoning.encrypted_content",
                    "web_search_call.action.sources",
                ],
            )
            return response.output_text
        except Exception as e:
            error_msg = f"Failed to collect collocations for word '{self.word}': {e}"
            logger.error(error_msg)
            raise AIServiceError(error_msg) from e

    def _analyze_word(self, collocations_str: str | None = None) -> dict[str, Any]:
        """Analyze word using AI to determine lemma, difficulty, and collocations.

        Args:
            collocations_str: Pre-collected collocations string, if available.

        Returns:
            Dictionary containing analysis results.

        Raises:
            AIServiceError: If AI service call fails.
            WordAnalysisError: If analysis results are invalid.
        """
        if collocations_str is None:
            collocations_str = self._collect_collocations()

        try:
            # Get formatted prompt messages
            system_message, user_message = get_prompt(
                "word_analysis",
                word=self.word,
                language=LANGUAGES.get(self.lang, "English"),
                collocations=collocations_str,
            )

            # Get OpenAI configuration for this prompt
            config = get_openai_prompt_config("word_analysis")

            response = get_openai_client().responses.create(
                model=config["model"],
                input=[
                    {
                        "role": "system",
                        "content": [
                            {
                                "type": "input_text",
                                "text": system_message,
                            },
                        ],
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "input_text",
                                "text": user_message.format(
                                    word=self.word, collocations=collocations_str
                                ),
                            }
                        ],
                    },
                ],
                text={"format": {"type": config["response_format"]}},
                reasoning={},
                tools=[],
                temperature=config["temperature"],
                max_output_tokens=config["max_tokens"],
                top_p=1,
                store=False,
                include=["web_search_call.action.sources"],
            )

            # Parse JSON response safely
            try:
                result = json.loads(response.output_text)
            except json.JSONDecodeError as json_error:
                error_msg = f"Invalid JSON response from AI service: {json_error}"
                logger.error(error_msg)
                raise WordAnalysisError(error_msg) from json_error

            # Validate required fields
            if not isinstance(result, dict):
                raise WordAnalysisError("AI response is not a dictionary")

            return result

        except AIServiceError:
            # Re-raise AI service errors
            raise
        except Exception as e:
            error_msg = f"Failed to analyze word '{self.word}': {e}"
            logger.error(error_msg)
            raise AIServiceError(error_msg) from e


# Utility functions (maintaining backward compatibility)
def collect_collocations(word: str, lang: str) -> str:
    """Collect collocations for a word using AI service.

    This function is provided for backward compatibility.
    Consider using the Word class directly for new code.

    Args:
        word: The word to analyze.
        lang: Language code.

    Returns:
        String containing formatted collocations.
    """
    temp_word = Word.__new__(Word)
    temp_word.word = word
    temp_word.lang = lang
    return temp_word._collect_collocations()


def analyze_word(
    word: str, lang: str, collocations_str: str | None = None
) -> dict[str, Any]:
    """Analyze a word using AI service.

    This function is provided for backward compatibility.
    Consider using the Word class directly for new code.

    Args:
        word: The word to analyze.
        lang: Language code.
        collocations_str: Pre-collected collocations, if available.

    Returns:
        Dictionary containing analysis results.
    """
    temp_word = Word.__new__(Word)
    temp_word.word = word
    temp_word.lang = lang
    return temp_word._analyze_word(collocations_str)
