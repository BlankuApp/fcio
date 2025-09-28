"""
Admin interface for managing AI prompts in the FCIO application.
Provides a Streamlit interface for viewing, editing, and managing prompts.
"""

import streamlit as st
import json
from src.prompts import get_prompt_manager, PromptManager


def show_admin_page():
    """Display the admin interface for prompt management."""
    st.title("🛠️ Prompt Administration")
    st.markdown("Manage AI prompts used throughout the FCIO application.")

    # Initialize prompt manager
    prompt_manager = get_prompt_manager()

    # Create tabs for different admin functions
    tab1, tab2, tab3, tab4 = st.tabs(
        ["📋 View Prompts", "✏️ Edit Prompt", "➕ Add Prompt", "⚙️ Settings"]
    )

    with tab1:
        show_prompts_view(prompt_manager)

    with tab2:
        show_edit_prompt(prompt_manager)

    with tab3:
        show_add_prompt(prompt_manager)

    with tab4:
        show_settings(prompt_manager)


def show_prompts_view(prompt_manager: PromptManager):
    """Display all available prompts."""
    st.header("Current Prompts")

    # Get all prompts
    prompts = prompt_manager.get_all_prompts()

    if not prompts:
        st.info("No prompts configured yet.")
        return

    # Display prompts in expandable sections
    for prompt_id, prompt_config in prompts.items():
        with st.expander(f"🔍 {prompt_config.get('name', prompt_id)} ({prompt_id})"):
            st.markdown(
                f"**Description:** {prompt_config.get('description', 'No description')}"
            )

            st.markdown("**Model Settings:**")
            st.code(f"""
Model: {prompt_config.get("model", "N/A")}
Response Format: {prompt_config.get("response_format", "N/A")}
Temperature: {prompt_config.get("temperature", "N/A")}
Max Tokens: {prompt_config.get("max_tokens", "N/A")}
                """)

            system_msg = prompt_config.get("system_message", "")
            st.text_area(
                "System Message:",
                value=system_msg,
                disabled=True,
                key=f"view_sys_{prompt_id}",
            )

            st.text_area(
                "User Message:",
                value=prompt_config.get("user_message_template", ""),
                disabled=True,
                key=f"view_user_{prompt_id}",
            )


def show_edit_prompt(prompt_manager: PromptManager):
    """Interface for editing existing prompts."""
    st.header("Edit Prompt")

    prompts = prompt_manager.get_all_prompts()
    if not prompts:
        st.info("No prompts available to edit.")
        return

    # Select prompt to edit
    prompt_names = {pid: config.get("name", pid) for pid, config in prompts.items()}
    selected_id = st.selectbox(
        "Select prompt to edit:",
        options=list(prompt_names.keys()),
        format_func=lambda x: f"{prompt_names[x]} ({x})",
    )

    if selected_id:
        prompt_config = prompts[selected_id]

        # Create edit form
        with st.form(f"edit_prompt_{selected_id}"):
            st.subheader(f"Editing: {prompt_config.get('name', selected_id)}")

            # Basic information
            name = st.text_input("Name:", value=prompt_config.get("name", ""))
            description = st.text_area(
                "Description:", value=prompt_config.get("description", "")
            )

            # Model configuration
            st.subheader("Model Configuration")
            col1, col2 = st.columns(2)

            with col1:
                model = st.selectbox(
                    "Model:",
                    options=["gpt-4o-mini", "gpt-5-mini", "gpt-4o"],
                    index=["gpt-4o-mini", "gpt-5-mini", "gpt-4o"].index(
                        prompt_config.get("model", "gpt-4o-mini")
                    ),
                )
                response_format = st.selectbox(
                    "Response Format:",
                    options=["json_object", "text"],
                    index=["json_object", "text"].index(
                        prompt_config.get("response_format", "json_object")
                    ),
                )

            with col2:
                temperature = st.slider(
                    "Temperature:",
                    min_value=0.0,
                    max_value=2.0,
                    value=float(prompt_config.get("temperature", 1.0)),
                    step=0.1,
                )
                max_tokens = st.number_input(
                    "Max Tokens:",
                    min_value=1,
                    max_value=8192,
                    value=prompt_config.get("max_tokens", 2048),
                )

            # System message
            st.subheader("System Message")
            system_message = st.text_area(
                "System Message:",
                value=prompt_config.get("system_message", ""),
                help="Enter the system message for the AI (use \\n for line breaks)",
                height=150,
            )

            # User message template
            st.subheader("User Message Template")
            user_template = st.text_area(
                "User Message Template:",
                value=prompt_config.get("user_message_template", ""),
                help="Use {variable} syntax for dynamic content",
            )

            # Save button
            if st.form_submit_button("💾 Save Changes", type="primary"):
                try:
                    updated_config = {
                        "name": name,
                        "description": description,
                        "model": model,
                        "response_format": response_format,
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                        "system_message": system_message,
                        "user_message_template": user_template,
                    }

                    prompt_manager.set_prompt(selected_id, updated_config)
                    st.success(f"✅ Prompt '{name}' saved successfully!")
                    st.rerun()

                except Exception as e:
                    st.error(f"❌ Error saving prompt: {str(e)}")


def show_add_prompt(prompt_manager: PromptManager):
    """Interface for adding new prompts."""
    st.header("Add New Prompt")

    with st.form("add_new_prompt"):
        # Basic information
        prompt_id = st.text_input(
            "Prompt ID:", help="Unique identifier (e.g., 'new_analysis_prompt')"
        )
        name = st.text_input("Name:", help="Display name for the prompt")
        description = st.text_area(
            "Description:", help="Brief description of what this prompt does"
        )

        # Model configuration
        st.subheader("Model Configuration")
        col1, col2 = st.columns(2)

        with col1:
            model = st.selectbox(
                "Model:", options=["gpt-4o-mini", "gpt-5-mini", "gpt-4o"], index=0
            )
            response_format = st.selectbox(
                "Response Format:", options=["json_object", "text"], index=0
            )

        with col2:
            temperature = st.slider(
                "Temperature:", min_value=0.0, max_value=2.0, value=1.0, step=0.1
            )
            max_tokens = st.number_input(
                "Max Tokens:", min_value=1, max_value=8192, value=2048
            )

        # System message
        st.subheader("System Message")
        system_message = st.text_area(
            "System Message:",
            placeholder="Enter the system message for the AI (use \\n for line breaks)...",
            height=150,
        )

        # User message template
        st.subheader("User Message Template")
        user_template = st.text_area(
            "User Message Template:",
            placeholder="Enter template with {variables}...",
            help="Use {variable} syntax for dynamic content",
        )

        # Save button
        if st.form_submit_button("➕ Add Prompt", type="primary"):
            if not prompt_id or not name or not system_message or not user_template:
                st.error(
                    "❌ Please fill in all required fields (ID, Name, System Message, and User Template)"
                )
            elif prompt_id in prompt_manager.get_all_prompts():
                st.error(f"❌ Prompt ID '{prompt_id}' already exists!")
            else:
                try:
                    new_config = {
                        "name": name,
                        "description": description,
                        "model": model,
                        "response_format": response_format,
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                        "system_message": system_message,
                        "user_message_template": user_template,
                    }

                    prompt_manager.set_prompt(prompt_id, new_config)
                    st.success(f"✅ Prompt '{name}' ({prompt_id}) added successfully!")

                except Exception as e:
                    st.error(f"❌ Error adding prompt: {str(e)}")


def show_settings(prompt_manager: PromptManager):
    """Display settings and configuration information."""
    st.header("Configuration & Settings")

    # Show metadata
    metadata = prompt_manager.get_metadata()
    st.subheader("Configuration Metadata")

    col1, col2 = st.columns(2)
    with col1:
        st.metric("Version", metadata.get("version", "Unknown"))
        st.metric("Last Updated", metadata.get("last_updated", "Unknown"))

    with col2:
        st.metric("Created By", metadata.get("created_by", "Unknown"))
        st.info(metadata.get("description", "No description available"))

    # Configuration file path
    st.subheader("Configuration File")
    st.code(str(prompt_manager.config_path))

    # Danger zone
    st.subheader("⚠️ Danger Zone")

    col1, col2 = st.columns(2)

    with col1:
        if st.button(
            "🔄 Reload Prompts",
            help="Reload prompts from file (discards unsaved changes)",
        ):
            try:
                prompt_manager.reload_prompts()
                st.success("✅ Prompts reloaded successfully!")
                st.rerun()
            except Exception as e:
                st.error(f"❌ Error reloading prompts: {str(e)}")

    with col2:
        # Delete prompt functionality
        prompts = prompt_manager.get_all_prompts()
        if prompts:
            selected_to_delete = st.selectbox(
                "Select prompt to delete:",
                options=[""] + list(prompts.keys()),
                format_func=lambda x: "Select a prompt..."
                if x == ""
                else f"{prompts[x].get('name', x)} ({x})",
            )

            if selected_to_delete and st.button("🗑️ Delete Prompt", type="primary"):
                if st.session_state.get(f"confirm_delete_{selected_to_delete}"):
                    try:
                        prompt_manager.delete_prompt(selected_to_delete)
                        st.success(
                            f"✅ Prompt '{selected_to_delete}' deleted successfully!"
                        )
                        if f"confirm_delete_{selected_to_delete}" in st.session_state:
                            del st.session_state[f"confirm_delete_{selected_to_delete}"]
                        st.rerun()
                    except Exception as e:
                        st.error(f"❌ Error deleting prompt: {str(e)}")
                else:
                    st.session_state[f"confirm_delete_{selected_to_delete}"] = True
                    st.warning("⚠️ Click 'Delete Prompt' again to confirm deletion!")

    # Export/Import functionality
    st.subheader("Import/Export")

    col1, col2 = st.columns(2)

    with col1:
        if st.button("📥 Export Configuration"):
            try:
                config_data = {
                    "prompts": prompt_manager.get_all_prompts(),
                    "metadata": prompt_manager.get_metadata(),
                }

                st.download_button(
                    label="💾 Download prompts.json",
                    data=json.dumps(config_data, indent=2),
                    file_name="prompts_export.json",
                    mime="application/json",
                )
            except Exception as e:
                st.error(f"❌ Error exporting configuration: {str(e)}")

    with col2:
        uploaded_file = st.file_uploader("📤 Import Configuration", type="json")
        if uploaded_file is not None:
            try:
                config_data = json.load(uploaded_file)

                if st.button("🔄 Import Prompts"):
                    # Validate structure
                    if "prompts" not in config_data:
                        st.error(
                            "❌ Invalid configuration file: missing 'prompts' section"
                        )
                    else:
                        # Import each prompt
                        imported_count = 0
                        for prompt_id, prompt_config in config_data["prompts"].items():
                            prompt_manager.set_prompt(prompt_id, prompt_config)
                            imported_count += 1

                        st.success(
                            f"✅ Successfully imported {imported_count} prompts!"
                        )
                        st.rerun()

            except Exception as e:
                st.error(f"❌ Error importing configuration: {str(e)}")


# Authentication check for admin access
def check_admin_access() -> bool:
    """Check if the current user has admin access."""
    # For now, this is a simple check - in production you'd want proper role-based access
    if "auth" not in st.session_state or not st.session_state["auth"]:
        return False

    # Add your admin user check logic here
    # For example: check if user email is in admin list
    user_data = st.session_state["auth"]
    admin_emails = ["a@b.com", "admin@fcio.app"]  # Configure as needed

    return user_data.get("email") in admin_emails


def admin_page():
    """Main admin page with authentication check."""
    if not check_admin_access():
        st.error("❌ Access Denied: Admin privileges required")
        st.info(
            "Please contact your administrator to request access to the prompt management interface."
        )
        return

    show_admin_page()


# Entry point for Streamlit navigation
admin_page()
