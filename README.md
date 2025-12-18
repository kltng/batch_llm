# Batch LLM Studio (PWA)

A powerful, privacy-first Progressive Web App for running batch inference tasks using local LLMs (like [LM Studio](https://lmstudio.ai/) and [Ollama](https://ollama.com/)) as well as cloud providers (OpenAI, Google Gemini).

![Batch LLM Studio Screenshot](public/pwa-512x512.png)
*(Replace with actual screenshot)*

## ✨ Features

- **100% Local Storage**: All projects, data, and API keys are stored in your browser's IndexedDB. Nothing leaves your device unless you send it to an API.
- **Batch Processing**: Import CSV files and process thousands of rows with configurable concurrency.
- **Dynamic Prompts**: Map CSV columns to prompts using `{{column_name}}` syntax.
- **Multi-Provider Support**: 
    - **Local**: LM Studio, Ollama
    - **Cloud**: OpenAI, Google Gemini, OpenRouter
- **Resilient**: Automatic retry for failed rows, pause/resume capability, and rate limiting (delay) controls.
- **Responsive PWA**: Installable on Desktop and Mobile.

## 🚀 Getting Started

### Hosted Version
Use the production app directly at: **[https://kltng.github.io/batch_llm/](https://kltng.github.io/batch_llm/)**

### Local Development

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/kltng/batch_llm.git
    cd batch_llm
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  Open `http://localhost:5173` in your browser.

## 🛠 Usage Guide

### 1. Connecting to Local LLMs

**LM Studio:**
1.  Start LM Studio and load a model.
2.  Go to the **Developer/Server** tab (monitor icon).
3.  Start the server. **Crucial**: Ensure "CORS" is enabled.
4.  In Batch LLM Studio, select **LM Studio** as the provider (default URL: `http://localhost:1234/v1`).

**Ollama:**
1.  Start Ollama.
2.  Set the environment variable `OLLAMA_ORIGINS="*"` (or include the app URL) to allow browser requests.
    - *Mac/Linux*: `OLLAMA_ORIGINS="*" ollama serve`
3.  In Batch LLM Studio, select **Ollama** as the provider (default URL: `http://localhost:11434/v1`).

### 2. Workflow
1.  **New Project**: Create a named workspace.
2.  **Import CSV**: Upload your dataset.
3.  **Setup**: Configure your System Prompt and User Prompt. Use `{{header}}` to insert data from your CSV rows.
4.  **Batch Run**: Set concurrency (e.g., 5 parallel requests) and start the job.
5.  **Export**: Download the completed dataset with model responses.

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

[MIT](https://choosealicense.com/licenses/mit/)
