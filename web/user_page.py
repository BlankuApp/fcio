import time

import streamlit as st
from streamlit_cookies_controller import CookieController
from src import LANGUAGES, DifficultyLevel, sign_out, get_supabase_client

controller = CookieController()

auth = st.session_state.get("auth", None)


if auth is None:
    st.warning("You must be logged in to view this page.")
    st.stop()

if st.sidebar.button("Log Out", width="stretch"):
    sign_out()
    controller.remove(
        "access_token",
        secure=True,
        same_site="strict",
    )
    controller.remove(
        "refresh_token",
        secure=True,
        same_site="strict",
    )
    if "auth" in st.session_state:
        del st.session_state["auth"]
    time.sleep(1)
    st.rerun()

st.write(f"# Welcome, {auth.get('username')}!")
st.write(
    "This is your user dashboard. Here you can manage your account and view personalized content."
)

# Add Word Creation Section
st.header("📚 Add New Word")
with st.form("add_word_form"):
    col1, col2 = st.columns(2)

    with col1:
        word_input = st.text_input(
            "Word or Phrase",
            help="Enter the word or phrase you want to learn",
            placeholder="e.g., hello, good morning",
        )

        selected_lang = st.selectbox(
            "Language",
            options=list(LANGUAGES.keys()),
            format_func=lambda x: f"{LANGUAGES[x]} ({x})",
            help="Select the language of the word",
        )

    with col2:
        manual_difficulty = st.selectbox(
            "Difficulty Level (Optional)",
            options=["Auto-detect"] + DifficultyLevel.get_values(),
            help="Let AI auto-detect difficulty or set manually",
        )

        manual_lemma = st.text_input(
            "Base Form (Optional)",
            help="Leave empty for AI to determine automatically",
            placeholder="e.g., for 'running' enter 'run'",
        )

    if st.form_submit_button("Add Word", type="primary"):
        if word_input.strip():
            try:
                from src import ValidationError
                from src.db.word import Word

                # Prepare word creation parameters
                word_params = {"word": word_input, "lang": selected_lang}

                # Add optional parameters if provided
                if manual_lemma.strip():
                    word_params["lemma"] = manual_lemma.strip()

                if manual_difficulty != "Auto-detect":
                    word_params["difficulty_level"] = manual_difficulty

                # Create word with validation
                with st.spinner("Analyzing word..."):
                    word = Word(**word_params)
                    word.save_to_db()

                st.success(f"✅ Successfully added '{word.word}' to your vocabulary!")
                st.info(
                    f"**Analysis Results:**\n- Lemma: {word.lemma}\n- Difficulty: {word.difficulty_level}"
                )

            except ValidationError as e:
                st.error(f"❌ Validation Error: {e}")
            except Exception as e:
                st.error(f"❌ Error adding word: {e}")
        else:
            st.error("Please enter a word or phrase.")

with st.sidebar.expander("User Details", expanded=True):
    st.text_input("Email", value=auth.get("email"), disabled=True)
    st.text_input("Username", value=auth.get("username", ""), key="username")
    st.selectbox(
        "Native Language",
        options=list(LANGUAGES.values()),
        key="native_language",
        index=list(LANGUAGES.values()).index(auth.get("native_language", "English")),
    )
    st.selectbox(
        "Proficiency Level",
        options=DifficultyLevel.get_values(),
        key="proficiency_level",
        help="Select your overall language proficiency level.",
        index=DifficultyLevel.get_values().index(
            auth.get("proficiency_level", DifficultyLevel.BEGINNER.value)
        ),
    )
    if st.button("Update Profile"):
        client = get_supabase_client()
        updates = {
            "username": st.session_state.get("username", ""),
            "native_language": st.session_state.get("native_language", ""),
            "proficiency_level": st.session_state.get("proficiency_level", ""),
        }
        response = client.auth.update_user({"data": updates})
        if response.user is not None:
            st.session_state["auth"] = {
                **response.user.user_metadata,
                "id": response.user.id,
                "email": response.user.email,
                "access_token": auth.get("access_token"),
                "refresh_token": auth.get("refresh_token"),
            }
            st.toast("Profile updated successfully!", icon="✅")
        else:
            st.error("Failed to update profile. Please try again.")
