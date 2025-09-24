import time

import streamlit as st
from streamlit_cookies_controller import CookieController
from src import LANGUAGES, sign_out, get_supabase_client

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
        options=[
            "Beginner",
            "Elementary",
            "Intermediate",
            "Upper Intermediate",
            "Advanced",
            "Native/Fluent",
        ],
        key="proficiency_level",
        help="Select your overall language proficiency level.",
        index=list(
            [
                "Beginner",
                "Elementary",
                "Intermediate",
                "Upper Intermediate",
                "Advanced",
                "Native/Fluent",
            ]
        ).index(auth.get("proficiency_level", "Beginner")),
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
