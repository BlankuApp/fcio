from src import LANGUAGES, get_openai_client, get_supabase_client
from src.prompts import get_prompt, get_openai_prompt_config
from dataclasses import dataclass


@dataclass(init=False)
class Word:
    lang: str
    lemma: str
    difficulty_level: str
    id: str | None = None
    collocations: dict[str, list[str]] | None

    def __new__(cls, word: str, lang: str):
        collocations_str = collect_collocations(word, lang)
        analysis = analyze_word(word, lang, collocations_str)
        instance = super(Word, cls).__new__(cls)
        instance.lang = lang
        instance.lemma = analysis.get("lemma", word)
        instance.difficulty_level = analysis.get("difficulty_level", "Beginner")
        instance.collocations = analysis.get("collocations", {})

        return instance

    def to_dict(self) -> dict:
        output = {
            "lang": self.lang,
            "lemma": self.lemma,
            "difficulty_level": self.difficulty_level,
            "collocations": self.collocations,
        }
        if self.id is not None:
            output["id"] = self.id
        return output

    def to_db(self):
        client = get_supabase_client()
        data = self.to_dict()
        try:
            response = client.table("words").upsert(data).execute()
            self.id = response.data[0]["id"]
        except Exception as e:
            raise Exception(f"Error saving word to database: {e}")

    @classmethod
    def from_db(cls, word_id: str) -> "Word":
        client = get_supabase_client()
        response = client.from_("words").select("*").eq("id", word_id).execute()
        if response.error or not response.data:
            raise Exception(
                f"Error fetching word from database: {response.error.message if response.error else 'No data found'}"
            )
        data = response.data[0]
        instance = cls.__new__(cls, data["lemma"], data["lang"])
        instance.id = data["id"]
        instance.difficulty_level = data["difficulty_level"]
        instance.collocations = data["collocations"]
        return instance


def collect_collocations(word: str, lang: str) -> str:
    # Get formatted prompt messages
    system_message, user_message = get_prompt(
        "collocations", word=word, language=LANGUAGES.get(lang, "English")
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
                            word=word, language=LANGUAGES.get(lang, "English")
                        ),
                    }
                ],
            },
        ],
        text={"format": {"type": config["response_format"]}, "verbosity": "medium"},
        reasoning={"effort": "medium", "summary": None},
        tools=[],
        store=False,
        include=["reasoning.encrypted_content", "web_search_call.action.sources"],
    )
    return response.output_text


def analyze_word(word: str, lang: str, collocations_str: str | None) -> dict:
    if collocations_str is None:
        collocations_str = collect_collocations(word, lang)

    # Get formatted prompt messages
    system_message, user_message = get_prompt(
        "word_analysis",
        word=word,
        language=LANGUAGES.get(lang, "English"),
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
                            word=word, collocations=collocations_str
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
    json_result = eval(response.output_text)
    return json_result
