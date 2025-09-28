"""
Prompt management system for FCIO application.
Handles loading, saving, and validating AI prompts from configuration files.
"""

import json
from typing import Dict, Any, Optional
from pathlib import Path


class PromptManager:
    """Manages AI prompts configuration for the FCIO application."""

    def __init__(self, config_path: str = None):
        """Initialize the prompt manager with a configuration file path."""
        if config_path is None:
            # Default to config/prompts.json relative to the project root
            project_root = Path(__file__).parent.parent
            config_path = project_root / "config" / "prompts.json"

        self.config_path = Path(config_path)
        self._prompts = None
        self._ensure_config_exists()

    def _ensure_config_exists(self):
        """Ensure the configuration file and directory exist."""
        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.config_path.exists():
            # Create default configuration if it doesn't exist
            default_config = self._get_default_config()
            self._save_config(default_config)

    def _get_default_config(self) -> Dict[str, Any]:
        """Get the default prompts configuration."""
        return {
            "prompts": {},
            "metadata": {
                "version": "1.0.0",
                "last_updated": "2025-09-28",
                "created_by": "AI Assistant",
                "description": "Configuration file for AI prompts used in FCIO application",
            },
        }

    def _load_config(self) -> Dict[str, Any]:
        """Load the prompts configuration from file."""
        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError) as e:
            raise Exception(f"Failed to load prompts configuration: {e}")

    def _save_config(self, config: Dict[str, Any]):
        """Save the prompts configuration to file."""
        try:
            with open(self.config_path, "w", encoding="utf-8") as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
        except Exception as e:
            raise Exception(f"Failed to save prompts configuration: {e}")

    def reload_prompts(self):
        """Reload prompts from the configuration file."""
        self._prompts = None
        return self.get_all_prompts()

    def get_all_prompts(self) -> Dict[str, Any]:
        """Get all prompts from the configuration."""
        if self._prompts is None:
            config = self._load_config()
            self._prompts = config.get("prompts", {})
        return self._prompts

    def get_prompt(self, prompt_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific prompt by ID."""
        prompts = self.get_all_prompts()
        return prompts.get(prompt_id)

    def set_prompt(self, prompt_id: str, prompt_config: Dict[str, Any]):
        """Set or update a prompt configuration."""
        # Validate the prompt configuration
        self._validate_prompt_config(prompt_config)

        # Load current configuration
        config = self._load_config()

        # Update the specific prompt
        if "prompts" not in config:
            config["prompts"] = {}

        config["prompts"][prompt_id] = prompt_config

        # Update metadata
        from datetime import datetime

        config["metadata"]["last_updated"] = datetime.now().strftime("%Y-%m-%d")

        # Save configuration
        self._save_config(config)

        # Reload cached prompts
        self._prompts = None

    def delete_prompt(self, prompt_id: str) -> bool:
        """Delete a prompt by ID. Returns True if deleted, False if not found."""
        config = self._load_config()

        if "prompts" in config and prompt_id in config["prompts"]:
            del config["prompts"][prompt_id]

            # Update metadata
            from datetime import datetime

            config["metadata"]["last_updated"] = datetime.now().strftime("%Y-%m-%d")

            # Save configuration
            self._save_config(config)

            # Reload cached prompts
            self._prompts = None
            return True

        return False

    def _validate_prompt_config(self, prompt_config: Dict[str, Any]):
        """Validate a prompt configuration structure."""
        required_fields = [
            "name",
            "description",
            "system_message",
            "user_message_template",
        ]

        for field in required_fields:
            if field not in prompt_config:
                raise ValueError(f"Missing required field: {field}")

        # Validate system_message is a string
        if not isinstance(prompt_config["system_message"], str):
            raise ValueError("system_message must be a string")

        # Validate user_message_template is a string
        if not isinstance(prompt_config["user_message_template"], str):
            raise ValueError("user_message_template must be a string")

    def format_prompt(self, prompt_id: str, **kwargs) -> tuple[str, str]:
        """
        Format a prompt with the given parameters.
        Returns a tuple of (formatted_system_message, formatted_user_message).
        """
        prompt_config = self.get_prompt(prompt_id)
        if not prompt_config:
            raise ValueError(f"Prompt '{prompt_id}' not found")

        # Format system message
        try:
            system_message = prompt_config["system_message"].format(**kwargs)
        except KeyError as e:
            raise ValueError(f"Missing parameter for system message: {e}")

        # Format user message
        try:
            user_message = prompt_config["user_message_template"].format(**kwargs)
        except KeyError as e:
            raise ValueError(f"Missing parameter for user message: {e}")

        return system_message, user_message

    def get_metadata(self) -> Dict[str, Any]:
        """Get the configuration metadata."""
        config = self._load_config()
        return config.get("metadata", {})

    def get_prompt_names(self) -> Dict[str, str]:
        """Get a mapping of prompt IDs to their display names."""
        prompts = self.get_all_prompts()
        return {pid: config.get("name", pid) for pid, config in prompts.items()}


# Global instance for easy access
_prompt_manager = None


def get_prompt_manager() -> PromptManager:
    """Get the global prompt manager instance."""
    global _prompt_manager
    if _prompt_manager is None:
        _prompt_manager = PromptManager()
    return _prompt_manager


def get_prompt(prompt_id: str, **kwargs) -> tuple[str, str]:
    """
    Convenience function to get and format a prompt.
    Returns a tuple of (formatted_system_message, formatted_user_message).
    """
    return get_prompt_manager().format_prompt(prompt_id, **kwargs)


def get_openai_prompt_config(prompt_id: str) -> Dict[str, Any]:
    """
    Get OpenAI API configuration for a prompt.
    Returns model, response_format, temperature, etc.
    """
    prompt_config = get_prompt_manager().get_prompt(prompt_id)
    if not prompt_config:
        raise ValueError(f"Prompt '{prompt_id}' not found")

    return {
        "model": prompt_config.get("model", "gpt-4o-mini"),
        "response_format": prompt_config.get("response_format", "json_object"),
        "temperature": prompt_config.get("temperature", 1),
        "max_tokens": prompt_config.get("max_tokens", 2048),
    }
