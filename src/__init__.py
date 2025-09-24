import os

from dotenv import load_dotenv
from supabase import Client as SB_Client, create_client
import openai
from rich.console import Console

console = Console()
status = console.status("[bold green]Starting...")

load_dotenv()

# Most spoken languages
LANGUAGES = {
    "en": "English",
    "cn": "Chinese",
    "hi": "Hindi",
    "es": "Spanish",
    "ar": "Arabic",
    "fr": "French",
    "bn": "Bengali",
    "ru": "Russian",
    "pt": "Portuguese",
    "id": "Indonesian",
    "ur": "Urdu",
    "de": "German",
    "ja": "Japanese",
    "sw": "Swahili",
    "mr": "Marathi",
    "te": "Telugu",
    "ta": "Tamil",
    "tr": "Turkish",
    "vi": "Vietnamese",
    "it": "Italian",
    "pl": "Polish",
    "uk": "Ukrainian",
    "fa": "Persian",
    "nl": "Dutch",
    "el": "Greek",
    "hu": "Hungarian",
    "sv": "Swedish",
    "fi": "Finnish",
    "no": "Norwegian",
    "da": "Danish",
    "he": "Hebrew",
    "ko": "Korean",
    "th": "Thai",
    "cs": "Czech",
    "ro": "Romanian",
    "sk": "Slovak",
    "bg": "Bulgarian",
    "hr": "Croatian",
    "sr": "Serbian",
    "lt": "Lithuanian",
    "lv": "Latvian",
    "et": "Estonian",
    "sl": "Slovenian",
    "is": "Icelandic",
    "mt": "Maltese",
    "ga": "Irish",
    "cy": "Welsh",
    "sq": "Albanian",
    "mk": "Macedonian",
    "bs": "Bosnian",
    "af": "Afrikaans",
}


_supabase_client: SB_Client | None = None
_openai_client: openai.OpenAI | None = None


def get_supabase_client() -> SB_Client:
    global _supabase_client
    if _supabase_client is None:
        url = os.getenv("supabaseUrl")
        key = os.getenv("supabaseKey")
        _supabase_client = create_client(url, key)
    return _supabase_client


def sign_in_with_email(email: str, password: str) -> dict:
    client = get_supabase_client()
    response = client.auth.sign_in_with_password({"email": email, "password": password})
    print(f"Signed in as {response.user.email}")
    return response


def sign_in_with_token(access_token: str, refresh_token: str) -> dict:
    client = get_supabase_client()
    client.auth.get_user(access_token)
    response = client.auth.set_session(
        access_token=access_token, refresh_token=refresh_token
    )
    return response


def sign_out() -> None:
    client = get_supabase_client()
    client.auth.sign_out()


def get_openai_client() -> openai.OpenAI:
    global _openai_client
    if _openai_client is None:
        _openai_client = openai.OpenAI(api_key=os.getenv("openai_api_key"))
    return _openai_client
