# AI Coding Agent Instructions for FCIO (AI FlashCards)

## Project Overview
FCIO is an AI-powered flashcard application built with Streamlit that uses the FSRS (Free Spaced Repetition Scheduler) algorithm for intelligent card scheduling. The app analyzes words/phrases using OpenAI's API to determine difficulty levels and generate contextual collocations with comprehensive input validation and error handling.

## Architecture & Key Components

### Core Modules (`src/`)
- **`pyfsrs/`**: FSRS algorithm implementation with `Card`, `Scheduler`, `ReviewLog` classes
- **`db/`**: Data models and database operations, primarily `Word` class for AI-powered word analysis with validation
- **`__init__.py`**: Global configuration, Supabase/OpenAI client initialization, language constants, `DifficultyLevel` enum

### Web Interface (`web/`)
- **`main_page.py`**: Landing page for unauthenticated users
- **`user_page.py`**: User dashboard with profile management and word creation interface using validation
- **`log_tools.py`**: Authentication modals and utilities with DifficultyLevel enum integration
- **`admin_page.py`**: Admin interface for prompt management

### Entry Point
- **`st_main.py`**: Streamlit app with navigation and authentication flow

## Critical Patterns & Conventions

### Data Models
Use dataclasses with `__post_init__` for AI-powered initialization and validation:
```python
@dataclass
class Word:
    word: str
    lang: str
    lemma: str = ""
    difficulty_level: str = DEFAULT_DIFFICULTY
    
    def __post_init__(self) -> None:
        # Validate inputs first
        self._validate_inputs()
        # Then perform AI analysis if needed
        if not self.lemma:
            # AI analysis happens here
```

### Authentication Flow
- Supabase-based auth with token persistence via cookies
- Session state managed in `st.session_state["auth"]`
- Automatic token refresh on app startup

### AI Integration
- OpenAI client initialized lazily via `get_openai_client()`
- Uses structured prompts with JSON output format
- Word analysis includes lemma extraction, difficulty assessment, and collocation categorization by proficiency level

### Input Validation & Data Integrity
- Comprehensive input validation using `ValidationError` exception
- `DifficultyLevel` enum for type-safe difficulty levels: "Beginner", "Elementary", "Intermediate", "Upper Intermediate", "Advanced", "Native/Fluent"
- Language validation against supported `LANGUAGES` dict
- Word validation (non-empty, whitespace cleanup)
- AI response validation with graceful fallbacks

### Database Operations
- Supabase client for CRUD operations
- Tables: `words` (with upsert pattern), user metadata in auth
- Error handling with custom exceptions: `DatabaseError`, `AIServiceError`, `WordAnalysisError`, `ValidationError`

### Language Support
- 50+ languages supported via `LANGUAGES` dict in `src/__init__.py`
- Language codes used throughout (e.g., "en", "es", "cn" for Chinese)
- All language codes validated against supported list

## Development Workflow

### Environment Setup
**CRITICAL: Always activate the virtual environment first!**
```bash
# For PowerShell (Windows)
conda activate jvd310; cd "path/to/fcio"

# Then run commands:
streamlit run st_main.py
python -m pytest tests/
python demo_validation.py
```

**AI Agent Note**: Before running any Python commands, tests, or scripts, ALWAYS use:
`conda activate jvd310; cd "c:\Users\eskan\Documents\GitHub\fcio"`


### Key Dependencies
- `streamlit` + `streamlit-cookies-controller` for web UI
- `supabase-py` for backend services
- `openai` for AI features
- `python-dotenv` for configuration
- `rich` for console output

## Common Patterns

### Client Initialization
Always use getter functions for lazy loading:
```python
client = get_supabase_client()  # Not direct instantiation
ai_client = get_openai_client()
```

### Error Handling
Wrap database operations in try-catch with descriptive messages:
```python
try:
    response = client.table("words").upsert(data).execute()
except Exception as e:
    raise Exception(f"Error saving word: {e}")
```

### Validation Patterns
Always validate inputs and use proper exceptions:
```python
# Import validation components
from src import DifficultyLevel, DEFAULT_DIFFICULTY
from src.db.word import ValidationError

# Validate difficulty levels
if not DifficultyLevel.is_valid(user_input):
    raise ValidationError(f"Invalid difficulty: {user_input}")

# Use enum values
valid_levels = DifficultyLevel.get_values()
```

### State Management
- Use `st.session_state` for auth and user data
- Cookie persistence for cross-session auth
- `st.rerun()` for state updates requiring re-render

## File Organization
- `src/` for reusable business logic
- `web/` for Streamlit page components
- Flat structure at root for app entry points
- `tests/` for comprehensive test suite
- `__pycache__/` directories present (standard Python)

## Testing
- Use `pytest` for testing with proper environment activation
- Comprehensive test coverage in `tests/db/test_word.py`
- Run tests: `conda activate jvd310; cd "path/to/fcio"; python -m pytest tests/`
- Validation demo: `python demo_validation.py`