# Daily Essentials — Installation & Setup Guide

Follow this step-by-step guide to get a local copy of **Daily Essentials** up and running on your machine.

---

## 📋 Prerequisites

Before getting started, ensure you have the following software installed on your system:

*   **Python:** `3.8+`
*   **Node.js:** `v18+` & `npm`
*   **Git**

---

## 🚀 Setup Instructions

<Sequence>
{/* Reason: Order is critical here; executing frontend or migration steps out of sequence will cause build and connection failures. */}
  <Step title="Clone the Repository" subtitle="Step 1">
    Open your terminal, navigate to your desired directory, and clone the codebase:
```bash
    git clone [https://github.com/adityanuwal5/daily-essentials.git](https://github.com/adityanuwal5/daily-essentials.git)
    cd daily-essentials
    ```
  </Step>

  <Step title="Backend Setup (Django)" subtitle="Step 2">
    From the root `daily-essentials` directory, set up your Python environment and database.

    **1. Create and activate a virtual environment:**
    ```bash
    # Create the environment
    python -m venv venv

    # Activate on Windows
    venv\Scripts\activate

    # Activate on macOS / Linux
    source venv/bin/activate
    ```

    **2. Install dependencies & configure environment variables:**
    ```bash
    pip install -r requirements.txt
    copy .env.example .env
    ```
    > 💡 **Tip:** Open the newly created `.env` file in your code editor to modify any default environment variables if necessary.

    **3. Apply migrations and seed the database catalog:**
    ```bash
    python manage.py migrate
    python manage.py seed_db
    ```
    *Note: If you need to wipe the database clean before seeding, append the `--flush` flag: `python manage.py seed_db --flush`*

    **4. Create an administrator account:**
    ```bash
    python manage.py createsuperuser
    ```
    *(The system will automatically assign the `"admin"` role to this account).*

    **5. Start the development server:**
    ```bash
    python manage.py runserver
    ```
    The backend api will now be running locally at `http://127.0.0.1:8000`.
  </Step>

  <Step title="Frontend Setup (React + Vite)" subtitle="Step 3">
    Open a **new terminal window** or tab, leaving the Django backend running in the background.

    **1. Navigate to the frontend folder and install node modules:**
    ```bash
    cd daily-essential-frontend
    npm install
    ```

    **2. Start the Vite development server:**
    ```bash
    npm run dev
    ```
    The frontend interface will now be live at `http://localhost:5173`.
  </Step>

  <Step title="Running the QA Testing Suite" subtitle="Step 4">
    This project includes a custom testing suite designed to verify security rules and system load capacity. 

    To execute the suite, ensure **both** the backend and frontend servers are actively running. Open a new terminal in the root folder and run:
    ```bash
    npm run test:setup
    npm run test:all
    ```
  </Step>
</Sequence>

---

## 🛠️ Troubleshooting

*   **Virtual Environment won't activate?** On Windows PowerShell, you might need to run `Set-ExecutionPolicy RemoteSigned -Scope Process` first to allow script execution in your session.
*   **Port conflicts?** If ports `8000` or `5173` are already in use by another application, Django and Vite will prompt you or select an alternative port. Make sure to update your `.env` URLs accordingly.
