export interface CompletionRequest {
    provider: string;
    baseUrl: string;
    apiKey: string;
    model: string;
    systemPrompt: string;
    userPrompt: string;
}

export async function generateCompletion(req: CompletionRequest): Promise<string> {
    // Google Gemini Direct API
    if (req.provider === 'google') {
        // Fallback to strict prompt merging if system instruction not robustly supported in this simple client
        // But 1.5 Flash/Pro supports it. Let's try correct new API structure for better results.
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${req.model}:generateContent?key=${req.apiKey}`;

        const body = {
            system_instruction: {
                parts: { text: req.systemPrompt }
            },
            contents: {
                role: "user",
                parts: { text: req.userPrompt }
            }
        };

        const response = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Gemini Error: ${response.status} - ${err}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    // Default OpenAI Compatible (LM Studio, OpenRouter, OpenAI)
    // Normalize URL
    let url = req.baseUrl;
    if (!url.endsWith('/chat/completions')) {
        url = url.replace(/\/$/, "") + '/chat/completions';
    }

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${req.apiKey}`
    };

    // Handle potential CORS need or specific header tweaks?
    // Standard is fine.

    const body = {
        model: req.model,
        messages: [
            { role: "system", content: req.systemPrompt },
            { role: "user", content: req.userPrompt }
        ],
        temperature: 0.7
    };

    const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`API Error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
}

export async function testConnection(provider: string, baseUrl: string, apiKey: string, model: string): Promise<void> {
    if (provider === 'google') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}?key=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Gemini Connection Error: ${response.status} - ${err}`);
        }
        // If successful, we get model info.
        return;
    }

    // OpenAI Compatible
    let url = baseUrl;
    // Remove trailing slash
    if (url.endsWith('/')) url = url.slice(0, -1);

    // Most standard is GET /models
    // However, we need to be careful with how the user inputs Base URL. 
    // If they input "http://localhost:11434/v1", models is "http://localhost:11434/v1/models"

    const modelsUrl = `${url}/models`;

    const headers: Record<string, string> = {
        "Authorization": `Bearer ${apiKey}`
    };

    // For some providers (like Ollama), Auth header might not be needed but doesn't hurt.
    // However, some CORS proxies might be strict.

    try {
        const response = await fetch(modelsUrl, { headers });
        if (!response.ok) {
            // Fallback: Try a minimal generation if models endpoint fails (some proxies hide /models)
            // But actually, let's just throw for now.
            const err = await response.text();
            throw new Error(`Connection Error: ${response.status} - ${err}`);
        }
        const data = await response.json();
        // Basic validation that it looks like a models response?
        if (!data.data && !Array.isArray(data)) {
            // Some might return just array
            // But usually { data: [...] }
        }
    } catch (error: any) {
        // If /models fails, let's try a very cheap chat completion to be sure it's not just a permission issue on /models
        // Create a temporary request to generateCompletion? 
        // No, let's stick to the error to encourage standard compliance or correct URL.
        throw error;
    }
}
