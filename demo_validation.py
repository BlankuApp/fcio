"""
Demonstration script for Word class validation features.
This shows how the new validation system works.
"""

from src import DifficultyLevel
from src.db.word import Word, ValidationError


def demo_validation():
    """Demonstrate the Word class validation features."""

    print("🧪 Word Class Validation Demo")
    print("=" * 50)

    # 1. DifficultyLevel Enum
    print("\n📊 DifficultyLevel Enum:")
    print(f"Available levels: {DifficultyLevel.get_values()}")
    print(f"Is 'Beginner' valid? {DifficultyLevel.is_valid('Beginner')}")
    print(f"Is 'Expert' valid? {DifficultyLevel.is_valid('Expert')}")

    # 2. Empty word validation
    print("\n❌ Testing Empty Word Validation:")
    try:
        Word(word="", lang="en")
    except ValidationError as e:
        print(f"✅ Caught expected error: {e}")

    # 3. Whitespace-only word validation
    print("\n❌ Testing Whitespace Word Validation:")
    try:
        Word(word="   ", lang="en")
    except ValidationError as e:
        print(f"✅ Caught expected error: {e}")

    # 4. Invalid language validation
    print("\n❌ Testing Invalid Language Validation:")
    try:
        Word(word="test", lang="xyz")
    except ValidationError as e:
        print(f"✅ Caught expected error: {e}")

    # 5. Invalid difficulty validation
    print("\n❌ Testing Invalid Difficulty Validation:")
    try:
        Word(word="test", lang="en", difficulty_level="Expert")
    except ValidationError as e:
        print(f"✅ Caught expected error: {e}")

    # 6. Valid word creation (will fail gracefully due to missing AI service)
    print("\n✅ Testing Valid Word Creation:")
    try:
        # This will trigger AI analysis which will fail, but should fallback gracefully
        word = Word(word="hello", lang="en", lemma="hello", difficulty_level="Beginner")
        print(f"✅ Successfully created word: {word.word}")
        print(f"   Language: {word.lang}")
        print(f"   Lemma: {word.lemma}")
        print(f"   Difficulty: {word.difficulty_level}")
    except Exception as e:
        print(f"⚠️  Word creation failed (expected due to missing AI service): {e}")

    # 7. Whitespace cleanup
    print("\n🧹 Testing Whitespace Cleanup:")
    try:
        word = Word(
            word="  hello world  ",
            lang="en",
            lemma="hello world",
            difficulty_level="Elementary",
        )
        print(f"✅ Word cleaned: '{word.word}' (whitespace removed)")
    except Exception as e:
        print(f"⚠️  Cleanup test failed: {e}")

    print("\n" + "=" * 50)
    print("✅ Validation demo completed!")


if __name__ == "__main__":
    demo_validation()
