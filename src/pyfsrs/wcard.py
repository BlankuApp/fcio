from dataclasses import dataclass
from datetime import datetime

from src import LANGUAGES, console, get_openai_client, get_supabase_client, status
from src.prompts import get_prompt, get_openai_prompt_config
from src.pyfsrs.card import Card, State


@dataclass(init=False)
class WCard(Card):
    """An AI Flashcard for a word in a foreign language."""

    def __init__(
        self,
        word: str,
        lang: str,
        collocations: list[str] | None = None,
        id: str | None = None,
        state: State = State.Learning,
        step: int | None = None,
        stability: float | None = None,
        difficulty: float | None = None,
        due: datetime | None = None,
        last_review: datetime | None = None,
    ) -> None:
        super().__init__(
            id=id,
            state=state,
            step=step,
            stability=stability,
            difficulty=difficulty,
            due=due,
            last_review=last_review,
        )
        status.start()
        # Initialize private attributes first
        self._word: str
        self._lang: str
        self._collocations: list[str] = []

        self.word = word
        self.lang = lang

        if collocations is None:
            collocations = self._get_collocations()
            print("Raw collocations:", collocations)
            processed = self._post_process(collocations)
            self.word = processed.get("lemma", self.word)
            self.collocations = processed.get("collocations", [])
        else:
            self.collocations = collocations
        console.log("WCard created")
        status.stop()

    @property
    def word(self) -> str:
        return self._word

    @word.setter
    def word(self, value: str) -> None:
        if not value:
            raise ValueError("Word cannot be empty")
        if not isinstance(value, str):
            raise TypeError("Word must be a string")
        if len(value) > 100:
            raise ValueError("Word is too long")
        self._word = value

    @property
    def lang(self) -> str:
        return self._lang

    @lang.setter
    def lang(self, value: str) -> None:
        if value not in list(LANGUAGES.keys()):
            raise ValueError(
                f"Invalid language code: {value}. Must be one of {list(LANGUAGES.keys())}"
            )
        self._lang = value

    @property
    def collocations(self) -> list[str] | None:
        return self._collocations

    @collocations.setter
    def collocations(self, value: list[str] | None) -> None:
        if value is not None:
            if not isinstance(value, list):
                raise TypeError("Collocations must be a list of strings or None")
            if not all(isinstance(item, str) for item in value):
                raise TypeError("All collocations must be strings")
        else:
            value = WCard.get_collocations(self.word, self.lang)
        self._collocations = value

    def _post_process(self, collocations_str: str) -> dict:
        with status:
            status.update(f"[bold green]Processing collocations for '{self.word}'...")

            # Get formatted prompt messages
            system_message, user_message = get_prompt(
                "word_analysis_simple",
                word=self.word,
                language=LANGUAGES.get(self.lang, "English"),
                collocations=collocations_str,
            )

            # Get OpenAI configuration for this prompt
            config = get_openai_prompt_config("word_analysis_simple")

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
                                "text": user_message,
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
        json_result = eval(response.output_text)
        return json_result

    def _get_collocations(self) -> str:
        with status:
            status.update(f"[bold green]Fetching collocations for '{self.word}'...")

            # Get formatted prompt messages
            system_message, user_message = get_prompt(
                "collocations_simple",
                word=self.word,
                language=LANGUAGES.get(self.lang, "English"),
            )

            # Get OpenAI configuration for this prompt
            config = get_openai_prompt_config("collocations_simple")

            response = get_openai_client().responses.create(
                model=config["model"],
                input=[
                    {
                        "role": "system",
                        "content": system_message,
                    },
                    {
                        "role": "user",
                        "content": user_message,
                    },
                ],
                text={"format": {"type": config["response_format"]}},
                reasoning={},
                tools=[
                    {
                        "type": "web_search_preview",
                        "filters": None,
                        "search_context_size": "medium",
                        "user_location": {
                            "type": "approximate",
                            "city": None,
                            "country": None,
                            "region": None,
                            "timezone": None,
                        },
                    }
                ],
                tool_choice={"type": "web_search_preview"},
                temperature=config["temperature"],
                max_output_tokens=config["max_tokens"],
                top_p=1,
                store=False,
                include=["web_search_call.action.sources"],
            )
        return response.output_text

    def to_dict(self) -> dict:
        data = super().to_dict()
        data.update(
            {
                "word": self.word,
                "lang": self.lang,
                "collocations": str(self.collocations),
            }
        )
        return data

    @classmethod
    def from_dict(cls, data: dict) -> "WCard":
        return cls(
            word=data.get("word", ""),
            lang=data.get("lang", "en"),
            collocations=eval(data.get("collocations", "[]")),
            id=data.get("id"),
            state=State(data.get("state", State.Learning)),
            step=data.get("step"),
            stability=data.get("stability"),
            difficulty=data.get("difficulty"),
            due=datetime.fromisoformat(data["due"]) if data.get("due") else None,
            last_review=datetime.fromisoformat(data["last_review"])
            if data.get("last_review")
            else None,
        )

    @classmethod
    def from_supabase(cls, id: str) -> "WCard":
        """Fetch a WCard from Supabase by its ID."""
        client = get_supabase_client()
        response = client.table("wcard").select("*").eq("id", id).execute()
        data = response.data[0]
        return cls.from_dict(data)

    def save_to_supabase(
        self, user_id: str = "b5568900-5da0-4e6b-bf8d-0b2d51f993b6"
    ) -> None:
        """Save the WCard to Supabase."""
        client = get_supabase_client()
        data = self.to_dict()
        data["user_id"] = user_id
        try:
            client.table("wcard").upsert(data).execute()
        except Exception as e:
            print(f"Error saving WCard to Supabase: {e}")


if __name__ == "__main__":
    card = WCard(word="management", lang="en")
    print(card)
