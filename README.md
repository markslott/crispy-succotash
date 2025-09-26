# Custom Agentforce Chatbot Web Component

A standalone web component for creating a modern, streaming chat interface that interacts with the Salesforce Agentforce API. This project uses a lightweight Python FastAPI server to host the front-end application and manage dependencies.  
  
The intent of this is to have a working example of a custom built chatbot interacting with the Agentforce API in as simple a fashion as possible.  This is just a demo app for seeing how things work, y'all.  I was curious, so I built it and shared it.  This is just for  
educational purposes only.  

## Key Features

* **Web Component:** The chatbot is encapsulated as a `<generic-chatbot>` custom element, making it highly portable and easy to embed in any web page or framework (e.g., Salesforce Lightning Web Components, Aura, or any standard web app).
* **Salesforce Agentforce API Integration:** Handles the full conversational flow, including session management (start, end) and message streaming.
* **OAuth 2.0 Client Credentials Flow:** Securely retrieves the necessary access token for Agentforce API calls using the configured Client ID and Secret.
* **Streaming Response:** Messages from the Agentforce API are streamed back to the UI for a real-time user experience.
* **In-Browser Configuration:** All required connection details (`Client ID`, `Client Secret`, `Agent ID`, `My Domain URL`) can be configured and persisted in the browser's local storage via a dedicated configuration modal.  So you can set it once and forget it.  
* **Markdown Support:** Assistant responses are rendered with markdown formatting for enhanced readability, using the `marked` library via a custom `<convert-markdown>` element.  If the response comes back as markdown format, it'll look normal.  probably.  

## Prerequisites

To run the server and host the web component, you need:

* **Python 3.x**
* **pip** (Python package installer)

## Setup and Installation

### 1. Backend Dependencies

Install the required Python packages for the FastAPI server:

```bash
pip install -r requirements.txt
```

The required packages are `fastapi`, `uvicorn`, and `gunicorn`.

## Running the Project

### Local Development

The project uses `uvicorn` to run the FastAPI server locally.

```bash
python serve.py
```

The server will run on `http://localhost:8000`. Access the chatbot by navigating to:

```bash
http://localhost:8000/
```

### Deployment (e.g., Heroku)

The `Procfile` is configured for cloud deployment using `gunicorn`:

```bash
web: gunicorn -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT serve:app
```

## Chatbot Configuration (In-Browser)

Upon launching the application, you must configure the Agentforce connection details.  
  
Some setup is required with the Salesforce org.  The app relies on using OAuth Client Credentials, and you will also  
need to have an agent configured, activated, and connected to the client credentials within your org.  
The Agent ID can be retrieved by exracting it from the URL in the Agent Builder in Salesforce.  
You will also need to enable CORS support for OAuth with your Salesforce environment.  

1. Click the **"Config"** button in the chat interface.
2. Enter the following details, which will be saved to your browser's local storage:
      * **Client ID**
      * **Client Secret**
      * **Agent ID**
      * **My Domain URL** (e.g., `https://domain.my.salesforce.com`)
3. Click **"Save & Connect"**.

The chatbot will attempt to retrieve an access token and start a new session with your specified Agentforce parameters.

## Project Structure

```bash
.
├── .env                  # Environment variables for configuration
├── Procfile              # Gunicorn process definition for deployment
├── requirements.txt      # Python dependencies (FastAPI, uvicorn, gunicorn)
├── serve.py              # FastAPI server setup and static file serving
└── public/               # Frontend (Web Component) files
    ├── index.html        # Main HTML file hosting the generic-chatbot component
    ├── GenericChatbot.js # Custom web component logic (Agentforce API calls, UI rendering)
    ├── ConvertMarkdown.js# Custom web component for markdown rendering
    └── style.css         # CSS for the chatbot and layout
```
