# Headless Salesforce Customer Portal

A modern, headless customer support portal that decouples the user interface from Salesforce. Built with a **React (Vite)** frontend hosted on AWS Amplify and a **Node.js/Express** reverse proxy hosted on Render, this application provides a secure, seamless web interface for customers to create and view support tickets in real-time.

## 🚀 Architecture & Security

This project utilizes a three-tier architecture to ensure enterprise-grade security:
1. **Frontend (React/AWS Amplify):** A lightweight Single Page Application (SPA) that never holds Salesforce credentials or API keys.
2. **Middleware (Node.js/Render):** A custom backend proxy that securely manages authentication and formats data.
3. **Salesforce (REST API):** The system of record.

**Authentication:** The backend authenticates with Salesforce using the **OAuth 2.0 JWT Bearer Flow**. It utilizes RS256 cryptographic signing via a Base64-encoded PEM private key injected at runtime, ensuring complete server-to-server security without exposing credentials to the client or source control.

## ✨ Features
* **View Support Tickets:** Fetches and displays the latest customer support cases using optimized SOQL queries via `jsforce`.
* **Create New Cases:** Form interface for users to submit new support tickets, instantly creating `Case` records in Salesforce.
* **CORS & Mixed Content Safe:** Routes all Salesforce API traffic through the HTTPS proxy, bypassing browser restrictions.
* **Automated CI/CD:** Fully integrated with GitHub for continuous deployment to AWS Amplify and Render.

## 💻 Tech Stack
* **Frontend:** React, Vite, JavaScript, HTML/CSS
* **Backend:** Node.js, Express.js, JSforce, Axios, JSON Web Tokens (JWT)
* **Infrastructure:** AWS Amplify (Frontend), Render (Backend)
* **Salesforce:** Connected Apps, REST API, SOQL

---

## 🛠️ Local Setup & Installation

### Prerequisites
1. Node.js installed locally.
2. A Salesforce Developer Edition org.
3. A **Connected App** created in Salesforce with:
   * "Enable OAuth Settings" checked.
   * "Use digital signatures" checked (upload your public `server.crt`).
   * Scopes: `Manage user data via APIs (api)`, `Perform requests at any time (refresh_token, offline_access)`.
   * The associated Integration User pre-approved via Profiles/Permission Sets.

### 1. Clone the repository
```bash
git clone [https://github.com/Sudip704/salesforce-headless-react-portal.git](https://github.com/Sudip704/salesforce-headless-react-portal.git)
cd salesforce-headless-react-portal

```

### 2. Backend Setup

```bash
cd headless-sf-middleware
npm install

```

Create a `.env` file in the `headless-sf-middleware` directory:

```env
PORT=3001
SF_CONSUMER_KEY=your_salesforce_connected_app_client_id
SF_USERNAME=your_integration_user@domain.com
SF_LOGIN_URL=[https://login.salesforce.com](https://login.salesforce.com)

# Convert your server.key to Base64 to avoid multiline string errors
PRIVATE_KEY_BASE64=your_base64_encoded_private_key_string

```

*Note: To generate the Base64 string for your private key, run `base64 -w 0 server.key` (Linux/Mac/Git Bash) or `[Convert]::ToBase64String([IO.File]::ReadAllBytes("server.key"))` (Windows PowerShell).*

Start the backend server:

```bash
npm run dev # or node server.js

```

### 3. Frontend Setup

Open a new terminal window:

```bash
cd frontend
npm install

```

Update your API endpoint in `src/App.jsx` to point to your local server:

```javascript
const API_BASE = 'http://localhost:3001/api/cases';

```

Start the React development server:

```bash
npm run dev

```

---

## ☁️ Deployment

### Backend (Render)

1. Connect your GitHub repository to a new Render Web Service.
2. Root Directory: `headless-sf-middleware`
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Add all `.env` variables in the Render Environment tab (using `PRIVATE_KEY_BASE64` to prevent RSA parsing errors).

### Frontend (AWS Amplify)

1. Connect your GitHub repository to AWS Amplify.
2. Update the `API_BASE` in your `App.jsx` to point to your live Render URL (e.g., `https://your-service.onrender.com/api/cases`).
3. Amplify will automatically detect the Vite build settings and deploy the application.

---

## 🔮 Future Enhancements

* **Row-Level Security:** Integrate Firebase Authentication to restrict case visibility to the currently logged-in user.
* **Resilience:** Implement `@tanstack/react-query` to handle loading skeletons during backend cold starts and cache responses.
* **Observability:** Integrate Sentry.io for enterprise-grade API error monitoring and tracking.

```
