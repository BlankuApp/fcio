"""Test runner script for FCIO project."""

import subprocess
import sys
import os


def run_tests():
    """Run the test suite with appropriate configurations."""

    # Ensure we're in the project root
    project_root = os.path.dirname(os.path.abspath(__file__))
    os.chdir(project_root)

    print("🧪 Running FCIO Test Suite")
    print("=" * 50)

    # Check if pytest is installed
    try:
        import pytest

        print("✅ pytest found")
    except ImportError:
        print("❌ pytest not found. Installing...")
        subprocess.run(
            [
                sys.executable,
                "-m",
                "pip",
                "install",
                "pytest",
                "pytest-mock",
                "pytest-cov",
            ]
        )

    # Run tests with coverage
    test_command = [
        sys.executable,
        "-m",
        "pytest",
        "-v",  # verbose output
        "--tb=short",  # short traceback format
        "--cov=src",  # coverage for src directory
        "--cov-report=term-missing",  # show missing lines in terminal
        "--cov-report=html:tests/htmlcov",  # generate HTML coverage report
        "tests/",  # test directory
    ]

    print("\n🏃 Running tests...")
    print(f"Command: {' '.join(test_command)}")
    print("-" * 50)

    result = subprocess.run(test_command)

    print("\n" + "=" * 50)
    if result.returncode == 0:
        print("✅ All tests passed!")
        print("📊 Coverage report generated in tests/htmlcov/")
    else:
        print("❌ Some tests failed!")

    return result.returncode


if __name__ == "__main__":
    exit_code = run_tests()
    sys.exit(exit_code)
