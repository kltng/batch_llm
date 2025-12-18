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
