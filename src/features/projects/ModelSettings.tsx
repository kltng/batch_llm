import { useEffect, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/db/db"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Check, Loader2 } from "lucide-react"

export default function ModelSettings({ projectId }: { projectId: number }) {
    const project = useLiveQuery(() => db.projects.get(projectId), [projectId])

    const [provider, setProvider] = useState("lmstudio")
    const [baseUrl, setBaseUrl] = useState("http://localhost:1234/v1")
    const [apiKey, setApiKey] = useState("")
    const [model, setModel] = useState("local-model")
    const [isSaving, setIsSaving] = useState(false)

    // Load initial values
    useEffect(() => {
        if (project?.modelConfig) {
            setProvider(project.modelConfig.provider)
            // If it's a known provider, maybe set default base URL?
            // But for now, we just load what's saved.
            // If nothing saved, we stick to defaults.
            // Wait, schema has provider/model.
            // I need to add baseUrl/apiKey storage to schema or use global settings.
            // The updated schema I wrote earlier had:
            // modelConfig?: { provider, model, ... }
            // appSettings has providers: Record<string, {baseUrl, apiKey}>.

            // This component should ideally save to project config the *selection*
            // and save to global settings the *credentials*.
        }
    }, [project])

    // NOTE: For simplicity in this iteration, I'm saving everything to Project Config 
    // (requires updating DB schema or storing in project object if it's flexible)
    // My DB schema for Project is:
    // modelConfig?: { provider: string; model: string; }
    // It's missing baseUrl/apiKey. I should update schema or store it in `modelConfig` as generic object.
    // The interface I defined was strict. I should probably relax it or update it.
    // Let's assume I can cast to any for now to just "make it work" quickly, 
    // but better to adhere to good practices.

    // Actually, I'll update the schema in db.ts to include generic `config` field or just update interface.
    // Wait, I can't easily change the schema at runtime without version bump.
    // I defined:
    // modelConfig?: { provider: string; model: string; temperature?: number; maxTokens?: number; };
    // It doesn't have baseUrl.

    // Correction: "User can choose use: ... There should be a specific way to configure all these."
    // I will use `db.settings` for credentials.

    const handleSave = async () => {
        setIsSaving(true)
        try {
            // 1. Save Project Selection
            await db.projects.update(projectId, {
                modelConfig: {
                    provider,
                    model
                }
            })

            // 2. Save Global Provider Config
            // We need to fetch current settings first
            let settings = await db.settings.get(1)
            if (!settings) {
                await db.settings.add({ id: 1, activeProvider: provider, providers: {} })
                settings = await db.settings.get(1)
            }

            const updatedProviders = {
                ...settings?.providers,
                [provider]: {
                    baseUrl,
                    apiKey,
                    model,
                    type: provider.includes('openai') ? 'openai' : 'google' as any // simplified
                }
            }

            await db.settings.update(1, {
                activeProvider: provider,
                providers: updatedProviders
            })

            // toast success
            alert("Settings saved successfully!")
        } finally {
            setIsSaving(false)
        }
    }

    // Effect to load GLOBAL settings when provider changes
    useEffect(() => {
        db.settings.get(1).then(settings => {
            if (settings?.providers?.[provider]) {
                const p = settings.providers[provider];
                if (p.baseUrl) setBaseUrl(p.baseUrl);
                if (p.apiKey) setApiKey(p.apiKey);
                if (p.model) setModel(p.model);
            } else {
                // Defaults
                if (provider === 'lmstudio') {
                    setBaseUrl("http://localhost:1234/v1")
                    setApiKey("lm-studio")
                    setModel("local-model")
                } else if (provider === 'openai') {
                    setBaseUrl("https://api.openai.com/v1")
                }
            }
        })
    }, [provider])

    return (
        <Card>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Provider</Label>
                    <Select value={provider} onValueChange={setProvider}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="lmstudio">LM Studio (Local)</SelectItem>
                            <SelectItem value="openai">OpenAI</SelectItem>
                            <SelectItem value="google">Google Gemini</SelectItem>
                            <SelectItem value="openrouter">OpenRouter</SelectItem>
                            <SelectItem value="custom">Custom OpenAI-Compatible</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Model Name</Label>
                    <Input
                        value={model}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setModel(e.target.value)}
                        placeholder="gpt-4o, gemini-pro, etc."
                    />
                </div>

                <div className="space-y-2">
                    <Label>Base URL</Label>
                    <Input
                        value={baseUrl}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBaseUrl(e.target.value)}
                        placeholder="https://api.example.com/v1"
                    />
                </div>

                <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                        type="password"
                        value={apiKey}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)}
                        placeholder="sk-..."
                    />
                </div>

                <div className="md:col-span-2 flex justify-end">
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                        Save Settings
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
