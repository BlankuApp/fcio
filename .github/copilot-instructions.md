# AI Coding Agent Instructions for FCIO (AI FlashCards)

## Project Overview
FCIO is an AI-powered flashcard application built with Streamlit that uses the FSRS (Free Spaced Repetition Scheduler) algorithm for intelligent card scheduling. The app analyzes words/phrases using OpenAI's API to determine difficulty levels and generate contextual collocations.

## Architecture & Key Components

### Core Modules (`src/`)
- **`pyfsrs/`**: FSRS algorithm implementation with `Card`, `Scheduler`, `ReviewLog` classes
- **`db/`**: Data models and database operations, primarily `Word` class for AI-powered word analysis
- **`__init__.py`**: Global configuration, Supabase/OpenAI client initialization, language constants

### Web Interface (`web/`)
- **`main_page.py`**: Landing page for unauthenticated users
- **`user_page.py`**: User dashboard with profile management
- **`log_tools.py`**: Authentication modals and utilities

### Entry Point
- **`st_main.py`**: Streamlit app with navigation and authentication flow

## Critical Patterns & Conventions

### Data Models
Use dataclasses with custom `__new__` methods for AI-powered initialization:
```python
@dataclass(init=False)
class Word:
    def __new__(cls, word: str, lang: str):
        # AI analysis happens here
        analysis = analyze_word(word, lang, collocations_str)
        instance = super().__new__(cls)
        # Set attributes from AI response
```

### Authentication Flow
- Supabase-based auth with token persistence via cookies
- Session state managed in `st.session_state["auth"]`
- Automatic token refresh on app startup

### AI Integration
- OpenAI client initialized lazily via `get_openai_client()`
- Uses structured prompts with JSON output format
- Word analysis includes lemma extraction, difficulty assessment, and collocation categorization by proficiency level

### Database Operations
- Supabase client for CRUD operations
- Tables: `words` (with upsert pattern), user metadata in auth
- Error handling with custom exceptions

### Language Support
- 50+ languages supported via `LANGUAGES` dict in `src/__init__.py`
- Language codes used throughout (e.g., "en", "es", "zh")

## Development Workflow

### Environment Setup
```bash
conda activate jvd310
streamlit run st_main.py
```


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

### State Management
- Use `st.session_state` for auth and user data
- Cookie persistence for cross-session auth
- `st.rerun()` for state updates requiring re-render

## File Organization
- `src/` for reusable business logic
- `web/` for Streamlit page components
- Flat structure at root for app entry points
- `__pycache__/` directories present (standard Python)