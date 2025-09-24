import time

import streamlit as st
from streamlit_cookies_controller import CookieController

from src import sign_in_with_email, LANGUAGES


@st.dialog(title="Login")
def login_modal():
    with st.form("login_form"):
        st.text_input("Email", key="email", autocomplete="email")
        st.text_input(
            "Password", type="password", key="password", autocomplete="current-password"
        )
        if st.form_submit_button("Login", width="stretch"):
            toast = st.toast("Logging in...", icon="⏳")
            try:
                response = sign_in_with_email(
                    email=st.session_state["email"],
                    password=st.session_state["password"],
                )
                if response.user is not None and response.session is not None:
                    toast.toast("Login successful!", icon="✅")
                    auth = {
                        **response.user.user_metadata,
                        "id": response.user.id,
                        "email": response.user.email,
                        "access_token": response.session.access_token,
                        "refresh_token": response.session.refresh_token,
                    }
                    st.session_state["auth"] = auth
                    CookieController().set(
                        "access_token",
                        response.session.access_token,
                        secure=True,
                        max_age=3600 * 24 * 7,
                    )
                    CookieController().set(
                        "refresh_token",
                        response.session.refresh_token,
                        secure=True,
                        max_age=3600 * 24 * 7,
                    )
                    time.sleep(1)
                    st.rerun()

                else:
                    toast.error("Login failed. Please check your credentials.")
            except Exception as e:
                toast.error(f"An error occurred: {e}")


@st.dialog(title="Sign Up")
def signup_modal():
    st.error("Sign-up is currently disabled.")
    with st.form("signup_form"):
        st.text_input("Email", key="signup_email", autocomplete="email")
        st.text_input(
            "Password",
            type="password",
            key="signup_password",
            autocomplete="new-password",
        )
        st.text_input(
            "Confirm Password",
            type="password",
            key="confirm_password",
            autocomplete="new-password",
        )
        st.selectbox(
            "Native Language",
            options=list(LANGUAGES.values()),
            key="native_language",
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
            index=0,
        )
        if st.form_submit_button("Sign Up", disabled=True, width="stretch"):
            if (
                st.session_state["signup_password"]
                != st.session_state["confirm_password"]
            ):
                st.error("Passwords do not match.")
                return
            st.toast("Signing up...", icon="⏳")
            print(f"Signing up {st.session_state['signup_email']}")
