import ConvertMarkdown from './ConvertMarkdown.js'

// --- Agentforce API Constants (Update these values) ---
// Define defaults outside the class, which will be overwritten by localStorage or user input
const DEFAULT_CLIENT_ID = ""
const DEFAULT_CLIENT_SECRET = ""
const DEFAULT_AGENT_ID = ""
const DEFAULT_MY_DOMAIN_URL = ""
const AGENT_API_VERSION = 'v1'

class GenericChatbot extends HTMLElement {

    chatHistoryIndex
    userPrompt = ''
    inputDisabled = false
    apikey
    height
    _accessToken = null // Store the access token
    _sessionId = null    // Store the active Agentforce session ID
    _sequenceId = 0      // Store the sequence ID for messages within the session
    
    // New instance properties for configuration
    _clientId
    _clientSecret
    _agentId
    _myDomainUrl
    _isConfigVisible = false // State to control config modal visibility


    static observedAttributes = ["height"];

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.state = this.createReactiveState({
            chatHistory: []
        });
        this.loadConfig(); // Load configuration from localStorage or use defaults
        this.resetChatHistory(); // This now initiates the first session
    }

    connectedCallback() {
        this.render();
        this.resize();
    }

    attributeChangedCallback(name, oldValue, newValue) {
       
        if (name === 'height') {
            this.height = newValue
            this.resize()
        }
    }

    createReactiveState(obj) {
        const component = this;
        return new Proxy(obj, {
            set(target, property, value) {
                target[property] = value;
                component.render(); // re-render component when state changes
                return true; // signifies the set operation succeeded
            }
        });
    }

    render() {
        console.log('render called')
        this.shadowRoot.innerHTML = `
           <style>
           :host {
                display: inline-block;
            }
           .chat-input-area {
                height: 4rem;
                border-radius: 0px 0px 5px 5px;
                border-width: 2px;
                border-top-width: 0px;
                border-style: solid;
                padding: 10px;
                background: darkgray;
                scroll-behavior: smooth;
                margin: auto;
            }

            .chat-message-area {
                
                overflow-y: scroll;
                /*background: darkgray*/
            }

            .chat {
                --rad: 20px;
                --rad-sm: 3px;
                font: 16px/1.5 sans-serif;
                display: flex;
                flex-direction: column;
                padding: 20px;
                /*max-width: 500px;*/
                margin: auto;
                /*height: calc(100vh - 9rem);*/
                overflow-y: auto;
                /*background: darkgray;*/
                border-radius: 5px 5px 0px 0px;
                border-width: 2px;
                border-bottom-width: 0px;
                border-style: solid;
                /*margin-top: 1rem;*/
                scroll-behavior: smooth;
            }

            .msg {
                position: relative;
                max-width: 75%;
                padding: 7px 15px;
                margin-bottom: 2px;
                width: fit-content;
                background: #fff;


            }

            .msg.sent {
                border-radius: var(--rad) var(--rad-sm) var(--rad-sm) var(--rad);
                background: #42a5f5;
                color: #fff;
                /* moves it to the right */
                margin-left: auto;
                text-align: right;
                margin-top: 5px;
            }

            .msg.rcvd {
                border-radius: var(--rad-sm) var(--rad) var(--rad) var(--rad-sm);
                background: #f1f1f1;
                color: #555;
                /* moves it to the left */
                margin-right: auto;
                margin-top: 5px;
            }

            /* Improve radius for messages group */

            .msg.sent:first-child,
            .msg.rcvd+.msg.sent {
                border-top-right-radius: var(--rad);
            }

            .msg.rcvd:first-child,
            .msg.sent+.msg.rcvd {
                border-top-left-radius: var(--rad);
            }


                /* time */

            .msg::before {
                content: attr(data-time);
                font-size: 0.8rem;
                position: absolute;
                bottom: 100%;
                color: #888;
                white-space: nowrap;
                /* Hidden by default */
                display: none;
            }

            .msg.sent::before {
                right: 15px;
            }

            .msg.rcvd::before {
                left: 15px;
            }

                /* Show time only for first message in group */

            .msg:first-child::before,
            .msg.sent+.msg.rcvd::before,
            .msg.rcvd+.msg.sent::before {
                /* Show only for first message in group */
                display: block;
            }

            #input-user-prompt {
                margin: 0.5rem;
                padding: 0.5rem;
                border-radius: 10px;
                flex-grow: 1; /* Allows the input to take up available space */
            }

            #btn-reset-history, #btn-config {
                border-radius: 5px;
                margin: 0.5rem 0.5rem 0.5rem 0; /* Adjust margin for buttons */
                flex-shrink: 0; /* Prevents buttons from shrinking */
            }

            /* --- Config Modal Styles --- */
            .config-modal {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10;
            }
            .config-content {
                background: white;
                padding: 20px;
                border-radius: 10px;
                width: 90%;
                max-width: 400px;
                display: flex;
                flex-direction: column;
            }
            .config-content h3 {
                margin-top: 0;
            }
            .config-content label {
                margin-top: 10px;
                font-weight: bold;
            }
            .config-content input {
                padding: 8px;
                margin-top: 5px;
                margin-bottom: 10px;
                border: 1px solid #ccc;
                border-radius: 5px;
            }
            .config-buttons {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 20px;
            }
           </style>
           <div id="chat-component">
                <div>
                    <div id="chat-history" class="chat">
                        <div class="chat-message-area">
                            ${this.state.chatHistory.map(history => `
                                ${history.isUser ?
                `<div class="msg sent">${history.content}</div>`
                : ''}
                                ${history.isAssistant ?
                `<div class="msg rcvd"><convert-markdown markdown= "${history.content}"></convert-markdown></div>`
                : ''}
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div>
                    <div class="chat-input-area">
                        <div style="display:flex">
                            <input id="input-user-prompt" type="text" placeholder="Type your message..." />
                            <button id="btn-config">Config</button>
                            <button id="btn-reset-history">New</button>
                        </div>
                    </div>
                </div>
                
                ${this._isConfigVisible ? this.renderConfigModal() : ''}

            </div>
        `
        // Add Event Listeners
        const btnReset = this.shadowRoot.getElementById('btn-reset-history');
        if (btnReset) btnReset.addEventListener('click', (e) => this.resetChatHistory(e));
        
        const btnConfig = this.shadowRoot.getElementById('btn-config');
        if (btnConfig) btnConfig.addEventListener('click', () => this.toggleConfigModal(true));

        const input = this.shadowRoot.getElementById('input-user-prompt');
        if (input) {
            input.addEventListener('keydown', (e) => this.handleKeyPress(e));
            input.focus();
            input.value = this.userPrompt;
        }
        
        if (this._isConfigVisible) {
            this.shadowRoot.getElementById('btn-save-config').addEventListener('click', () => this.handleSaveConfig());
            this.shadowRoot.getElementById('btn-cancel-config').addEventListener('click', () => this.toggleConfigModal(false));
        }

        this.resize()
    }
    
    /**
     * Renders the configuration input modal.
     */
    renderConfigModal() {
        return `
            <div id="config-modal" class="config-modal">
                <div class="config-content">
                    <h3>Agentforce Configuration</h3>
                    <label for="config-clientId">Client ID:</label>
                    <input type="text" id="config-clientId" value="${this._clientId}" placeholder="${DEFAULT_CLIENT_ID}" />
                    
                    <label for="config-clientSecret">Client Secret:</label>
                    <input type="text" id="config-clientSecret" value="${this._clientSecret}" placeholder="${DEFAULT_CLIENT_SECRET}" />
                    
                    <label for="config-agentId">Agent ID:</label>
                    <input type="text" id="config-agentId" value="${this._agentId}" placeholder="${DEFAULT_AGENT_ID}" />
                    
                    <label for="config-myDomainUrl">My Domain URL (e.g., https://domain.my.salesforce.com):</label>
                    <input type="url" id="config-myDomainUrl" value="${this._myDomainUrl}" placeholder="${DEFAULT_MY_DOMAIN_URL}" />
                    
                    <div class="config-buttons">
                        <button id="btn-save-config">Save & Connect</button>
                        <button id="btn-cancel-config">Cancel</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Toggles the visibility of the configuration modal.
     * @param {boolean} visible - True to show, false to hide.
     */
    toggleConfigModal(visible) {
        this._isConfigVisible = visible;
        this.render(); // Re-render to show/hide the modal
    }
    
    /**
     * Loads configuration values from localStorage or uses defaults.
     */
    loadConfig() {
        this._clientId = localStorage.getItem('agentforce_clientId') || DEFAULT_CLIENT_ID;
        this._clientSecret = localStorage.getItem('agentforce_clientSecret') || DEFAULT_CLIENT_SECRET;
        this._agentId = localStorage.getItem('agentforce_agentId') || DEFAULT_AGENT_ID;
        this._myDomainUrl = localStorage.getItem('agentforce_myDomainUrl') || DEFAULT_MY_DOMAIN_URL;
    }
    
    /**
     * Saves configuration values to localStorage.
     * @param {string} clientId
     * @param {string} clientSecret
     * @param {string} agentId
     * @param {string} myDomainUrl
     */
    saveConfig(clientId, clientSecret, agentId, myDomainUrl) {
        // Simple validation to ensure fields aren't completely empty before saving
        if (!clientId || !clientSecret || !agentId || !myDomainUrl) {
            alert('Please fill in all configuration fields.');
            return;
        }

        // Strip trailing slash from URL if present
        const cleanedMyDomainUrl = myDomainUrl.replace(/\/$/, "");

        localStorage.setItem('agentforce_clientId', clientId);
        localStorage.setItem('agentforce_clientSecret', clientSecret);
        localStorage.setItem('agentforce_agentId', agentId);
        localStorage.setItem('agentforce_myDomainUrl', cleanedMyDomainUrl);
        
        this.loadConfig(); // Reload into instance properties
        this.toggleConfigModal(false); // Hide config
        this.resetChatHistory(); // Start a new session with new config
    }
    
    /**
     * Handles the save button click in the configuration modal.
     */
    handleSaveConfig() {
        const clientId = this.shadowRoot.getElementById('config-clientId').value;
        const clientSecret = this.shadowRoot.getElementById('config-clientSecret').value;
        const agentId = this.shadowRoot.getElementById('config-agentId').value;
        const myDomainUrl = this.shadowRoot.getElementById('config-myDomainUrl').value;
        
        this.saveConfig(clientId, clientSecret, agentId, myDomainUrl);
    }


    resize() {
        console.log('component resizing')
        const componentHeight = this.shadowRoot.host.getBoundingClientRect().height
        this.shadowRoot.getElementById("chat-history").style.height = "calc(" + componentHeight + "px - 8rem)"
    }

    /**
     * Resets the chat UI and initiates a new Agentforce session.
     */
    resetChatUI(errorMessage) {
        // System message remains
        this.state.chatHistory = [
            {
                id: 1,
                isSystem: true,
                content: `Format your responses using markdown. 
            Only put the answer portion of your response in markdown format. 
            Parts of the message where you are adding text before and after the answer do not need to be formatted.`
            },
            {
                id: 2,
                isAssistant: true,
                // Update welcome message to show configured values
                content: errorMessage || `Hello. You're connected to Agentforce. 
                Session ID: ${this._sessionId ? this._sessionId.substring(0, 8) + '...' : 'N/A'}. 
                Agent ID: ${this._agentId}. 
                My Domain: ${this._myDomainUrl.substring(0, 30) + (this._myDomainUrl.length > 30 ? '...' : '')}`
            }
        ];
        this.chatHistoryIndex = 3
        this.userPrompt = ""
        this.scrollToBottom()
    }

    /**
     * Ends the current session and starts a new one. Triggered by the "New" button.
     */
    resetChatHistory() {
        // 1. End the previous session if one exists
        this.endSession();

        // 2. Start a new session (which also handles UI reset and token fetching)
        this.startNewSession();
    }

    scrollToBottom() {
        const objDiv = this.shadowRoot.querySelector(".chat-message-area")
        if (objDiv) {
            objDiv.scrollTop = objDiv.scrollHeight
        }
    }


    /**
   * Handles key presses in the input field, triggering the handleEnterKeyPress method when Enter is pressed.
   * @param {KeyboardEvent} e - The keyboard event object.
   */
    handleKeyPress(e) {
        this.userPrompt = e.target.value
        if (e.key === "Enter" && e.target.value.trim() !== "" && !this.inputDisabled) {
            this.handleEnterKeyPress(e)
            this.scrollToBottom()
        }
    }

    handleEnterKeyPress(e) {
        // Get and clear input value
        const prompt = e.target.value
        e.target.value = ""
        this.userPrompt = ""
        
        this.state.chatHistory = [...this.state.chatHistory, {
            id: this.chatHistoryIndex,
            isUser: true,
            content: prompt
        }];
        this.chatHistoryIndex++

        this.callAgentforceWithStreaming(prompt)
    }

    /**
     * Retrieves an access token using the OAuth 2.0 Client Credentials flow.
     * @returns {Promise<string>} The access token.
     */
    async getAccessToken() {
        const OAUTH_TOKEN_ENDPOINT = `${this._myDomainUrl}/services/oauth2/token`
        
        if (!this._clientId || !this._clientSecret || !this._myDomainUrl || this._myDomainUrl.includes('your-my-domain')) {
            console.error("Missing or placeholder configuration values: Client ID, Client Secret, or My Domain URL");
            return null;
        }

        const details = {
            'grant_type': 'client_credentials',
            'client_id': this._clientId, // Use instance property
            'client_secret': this._clientSecret // Use instance property
        };

        // Standard form-urlencoded body construction
        const formBody = Object.keys(details).map(key =>
            encodeURIComponent(key) + '=' + encodeURIComponent(details[key])
        ).join('&');

        try {
            console.log("creds:", details)
            const response = await fetch(OAUTH_TOKEN_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formBody
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to get access token: ${response.status} ${response.statusText}. Response: ${errorText}`);
            }

            const data = await response.json();
            this._accessToken = data.access_token;
            return this._accessToken;

        } catch (error) {
            console.error('Error in getAccessToken:', error);
            return null;
        }
    }

    /**
     * Starts a new Agentforce API session.
     */
    async startNewSession() {
        const AGENT_API_BASE_URL = `https://api.salesforce.com/einstein/ai-agent/${AGENT_API_VERSION}`

        this.inputDisabled = true;
        this.state.chatHistory = [];
        this._sequenceId = 0;
        this._sessionId = null;

        if (!this._agentId) { // Use instance property
            this.inputDisabled = false;
            this.resetChatUI("Error: Agent ID is not configured. Click 'Config' to set it.");
            return;
        }
        
        // Check if other crucial config values are set
        if (!this._clientId || !this._clientSecret || !this._myDomainUrl) {
            this.inputDisabled = false;
            this.resetChatUI("Error: Client ID, Client Secret, or My Domain URL is missing. Click 'Config' to set them.");
            return;
        }

        if (!this._accessToken) {
            const token = await this.getAccessToken();
            if (!token) {
                this.inputDisabled = false;
                this.resetChatUI('Error: Failed to retrieve an access token. Check configurations.');
                return;
            }
        }

        const externalSessionKey = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();

        try {
            const response = await fetch(`${AGENT_API_BASE_URL}/agents/${this._agentId}/sessions`, { // Use instance property
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this._accessToken}`,
                },
                body: JSON.stringify({
                    externalSessionKey: externalSessionKey,
                    instanceConfig: {
                        endpoint: this._myDomainUrl // Use instance property
                    },
                    streamingCapabilities: {
                        chunkTypes: ["Text"]
                    },
                    bypassUser: false
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to start session: ${response.status} ${response.statusText}. Response: ${errorText}`);
            }

            const data = await response.json();
            this._sessionId = data.sessionId;

            this.resetChatUI(null);
            this.inputDisabled = false;

        } catch (error) {
            console.error('Error starting Agentforce session:', error);
            this.inputDisabled = false;
            this.resetChatUI(`Error: Failed to start new Agentforce session. ${error.message}`);
        }
    }

    /**
     * Ends the active Agentforce API session.
     */
    async endSession() {
        if (!this._sessionId || !this._accessToken) {
            return;
        }

        try {
            const AGENT_API_BASE_URL = `https://api.salesforce.com/einstein/ai-agent/${AGENT_API_VERSION}`
            
            await fetch(`${AGENT_API_BASE_URL}/sessions/${this._sessionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this._accessToken}`,
                    'x-session-end-reason': 'UserRequest'
                }
            });
            console.log(`Agentforce session ${this._sessionId} ended.`);
        } catch (error) {
            console.error('Error ending Agentforce session:', error);
        } finally {
            this._sessionId = null;
            this._sequenceId = 0;
            this._accessToken = null;
        }
    }


    parseSSE(event) {
        const lines = event.split('\n');

        // Parse the event data and metadata
        const eventData = {};
        lines.forEach(line => {
            if (line.trim() === '') return;

            const [key, value] = line.split(/:\s?(.+)/s); // Split on the first ': ' (colon and optional space)
            if (key === 'data') {
                try {
                    // Agentforce API returns a JSON string in the data field
                    eventData.data = JSON.parse(value.trim())
                } catch (error) {
                    console.error("Error parsing SSE JSON data:", value, error);
                    eventData['data'] = null; // Mark as null if parsing fails
                }
            } else {
                eventData[key] = value ? value.trim() : '';
            }
        });

        return eventData;
    }

    /**
     * Calls the Agentforce API using the session ID and streams the results back to the UX.
     * @param {string} input - The user's input string (or prompt).
     */
    async callAgentforceWithStreaming(input) {
        console.log("get streaming response")
        this.inputDisabled = true;
        
        const AGENT_API_BASE_URL = `https://api.salesforce.com/einstein/ai-agent/${AGENT_API_VERSION}`

        if (!this._sessionId) {
            this.inputDisabled = false;
            this.resetChatUI('Error: No active Agentforce session. Please click "New" to start a new session.');
            return;
        }

        this._sequenceId++; // Increment sequence ID for the new message

        this.state.chatHistory = [...this.state.chatHistory, {
            id: this.chatHistoryIndex,
            isAssistant: true,
            content: '...'
        }]
        const index = this.state.chatHistory.length - 1;

        try {
            const body = JSON.stringify({
                message: {
                    type: "Text",
                    sequenceId: this._sequenceId,
                    text: input
                }
            });

            // Endpoint: POST /v1/sessions/{session-id}/messages/stream
            const response = await fetch(`${AGENT_API_BASE_URL}/sessions/${this._sessionId}/messages/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this._accessToken}`,
                    'Accept': 'text/event-stream'
                },
                body: body,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Agent API request failed: ${response.status} ${response.statusText}. Response: ${errorText}`);
            }

            // --- Streaming Logic ---
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = '';
            let currentContent = '...';
            let waitingForFirstToken = true;
            let streamDone = false;

            while (!streamDone) {
                const { value, done } = await reader.read();
                if (done) {
                    streamDone = true;
                }

                accumulatedText += decoder.decode(value, { stream: true });
                //console.log(accumulatedText)
                let events = accumulatedText.split('\n\n');
                accumulatedText = events.pop();

                for (const event of events) {
                    if (event.trim() === '') continue;

                    const parsedEvent = this.parseSSE(event);
                    console.log(parsedEvent)
                    if (parsedEvent.data) {
                        const data = parsedEvent.data;
                        if (parsedEvent.event === 'TEXT_CHUNK') {
                            console.log("text chunk added")
                            // Append the new chunk of text
                            if (waitingForFirstToken) {
                                 currentContent = data.message.message;
                                 waitingForFirstToken = false;
                            } else {
                                currentContent += data.message.message;
                            }

                            // Update the UI
                            this.state.chatHistory[index].content = currentContent;
                            this.state.chatHistory = [...this.state.chatHistory];
                            this.scrollToBottom();

                        }

                        if (parsedEvent.event === 'INFORM') {
                            //this is the fully resolved response from Agentforce.
                            //could overwrite the streamed response with this value, which would correct any sequence errors
                            //that might arise during streaming
                            waitingForFirstToken = false;
                            currentContent = data.message.message + "\n\n```json\n" + JSON.stringify(data.message.result,null,2).replace(/"/g, "'") + "\n```";
                            this.state.chatHistory[index].content = currentContent;
                            this.state.chatHistory = [...this.state.chatHistory];
                            this.scrollToBottom();
                        }

                        if (parsedEvent.event === 'PROGRESS_INDICATOR') {
                            //display progress indicator text
                            currentContent = data.message.message;
                            // Update the UI
                            this.state.chatHistory[index].content = currentContent;
                            this.state.chatHistory = [...this.state.chatHistory];
                            this.scrollToBottom();
                        }

                        if (parsedEvent.event === 'END_OF_TURN') {
                            streamDone = true;
                            break;
                        }
                    }
                }

                if (streamDone) break;
            }

            this.scrollToBottom();

        } catch (error) {
            console.error('Error processing event stream:', error);
            this.state.chatHistory[index].content = `An unexpected error occurred during communication: ${error.message}. Please check the console for details.`;
            this.state.chatHistory = [...this.state.chatHistory];
        }

        this.chatHistoryIndex++
        this.userPrompt = ""
        this.inputDisabled = false
    }

    /**
     * Short-circuits the LLM by adding a pre-defined response to the chat history.
     * Used to test the UX without calling the LLM
     */
    shortCircuitLLM() {
        this.state.chatHistory = [...this.state.chatHistory, {
            id: this.chatHistoryIndex,
            isAssistant: true,
            content:
                "Sure! Here is a list of ten random things:\n\n1. Sunflowers\n2. Rollercoasters\n3. Chocolate chip cookies\n4. Mountains\n5. Polar bears\n6. Jazz music\n7. Beach vacations\n8. Astronomy\n9. Vintage cars\n10. Rainbows\n\nIf you need more lists or information on any specific topic, feel free to let me know!"
        }]
        this.chatHistoryIndex++
    }



}

customElements.define('generic-chatbot', GenericChatbot);
customElements.define('convert-markdown', ConvertMarkdown)