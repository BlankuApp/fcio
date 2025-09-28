
Test Requirements for FCIO
==========================

This file documents the testing setup for the FCIO project.

## Test Structure

- `tests/` - Main test directory
- `tests/conftest.py` - Pytest configuration and shared fixtures
- `tests/db/test_word.py` - Unit tests for Word class
- `tests/test_integration.py` - Integration tests
- `pytest.ini` - Pytest configuration

## Running Tests

### Install Test Dependencies
```bash
pip install pytest pytest-mock pytest-cov
```

### Run All Tests
```bash
pytest
```

### Run Specific Test Categories
```bash
# Run only unit tests
pytest -m unit

# Run only integration tests  
pytest -m integration

# Run tests with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/db/test_word.py

# Run specific test class
pytest tests/db/test_word.py::TestWordClass

# Run specific test method
pytest tests/db/test_word.py::TestWordClass::test_word_creation_with_analysis
```

## Test Coverage

The test suite covers:

### Word Class (`src/db/word.py`)
- ✅ Custom exception classes
- ✅ Word creation and initialization 
- ✅ AI analysis integration
- ✅ Database operations (save/load)
- ✅ Error handling and fallback behavior
- ✅ Edge cases and validation
- ✅ Backward compatibility functions

### Test Categories
- **Unit Tests**: Test individual methods and functions in isolation
- **Integration Tests**: Test complete workflows with mocked external services
- **Edge Case Tests**: Test error conditions and boundary cases

## Mocking Strategy

Tests use comprehensive mocking for external dependencies:

- **OpenAI Client**: Mocked to return predictable responses
- **Supabase Client**: Mocked for database operations
- **Prompt Functions**: Mocked to avoid dependency on config files

## Test Data

Fixtures provide consistent test data:
- `sample_word_data`: Standard word data structure
- `sample_db_word_data`: Database response format
- `sample_ai_analysis`: AI service response format

## Best Practices

1. **Isolation**: Each test is independent and can run in any order
2. **Mocking**: External services are always mocked
3. **Coverage**: Aim for >90% code coverage
4. **Documentation**: Each test has clear docstrings
5. **Naming**: Descriptive test names that explain what is being tested

## Future Enhancements

- Add performance tests for AI operations
- Add tests for concurrent word creation
- Add property-based testing with hypothesis
- Add mutation testing with mutmut
"""