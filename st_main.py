import time

import streamlit as st
from streamlit_cookies_controller import CookieController

from src import sign_in_with_token
from web.log_tools import login_modal, signup_modal

auth = st.session_state.get("auth", None)
cookie_controller = CookieController()

pages = []

main_page = st.Page("web/main_page.py", title="Home", icon="🏠")
pages.append(main_page)

if auth:
    user_page = st.Page("web/user_page.py", title="User", icon="👤")
    pages.append(user_page)
elif cookie_controller.get("access_token"):
    try:
        response = sign_in_with_token(
            access_token=cookie_controller.get("access_token"),
            refresh_token=cookie_controller.get("refresh_token"),
        )
        if response.user is not None and response.session is not None:
            auth = {
                **response.user.user_metadata,
                "id": response.user.id,
                "email": response.user.email,
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token,
            }
            st.session_state["auth"] = auth
            cookie_controller.set(
                "access_token",
                response.session.access_token,
                secure=True,
                max_age=3600 * 24 * 7,
            )
            cookie_controller.set(
                "refresh_token",
                response.session.refresh_token,
                secure=True,
                max_age=3600 * 24 * 7,
            )
            time.sleep(1)
            st.rerun()
        else:
            st.sidebar.info("Please log in to access user features.")
            if st.sidebar.button("Log In"):
                login_modal()
    except Exception as e:
        print(f"Token sign-in failed: {e}")
else:
    if st.sidebar.button("Log In", width="stretch"):
        login_modal()
    if st.sidebar.button("Sign Up", width="stretch"):
        signup_modal()


app = st.navigation(pages=pages, expanded=True)
app.run()
