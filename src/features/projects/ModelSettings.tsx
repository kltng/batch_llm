import { useEffect, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/db/db"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Check, Loader2, Wifi } from "lucide-react"
import { testConnection } from "@/lib/llm"

export default function ModelSettings({ projectId }: { projectId: number }) {
    const project = useLiveQuery(() => db.projects.get(projectId), [projectId])

    const [provider, setProvider] = useState("lmstudio")
    const [baseUrl, setBaseUrl] = useState("http://localhost:1234/v1")
    const [apiKey, setApiKey] = useState("")
    const [model, setModel] = useState("local-model")
    const [isSaving, setIsSaving] = useState(false)
    const [isTesting, setIsTesting] = useState(false)

    // Load initial values (unchanged logic mostly, but ensured we respect Load)
    useEffect(() => {
        if (project?.modelConfig) {
            setProvider(project.modelConfig.provider)
            // Note: we still rely on the other effect to load the details from Global Settings if not manually overridden by user interaction yet.
            // But actually, we want the global settings to take precedence on initial load?
            // The logic below (useEffect on provider) handles the defaults/fetch.
        }
    }, [project])

    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    // ... (keep useEffects)

    const handleSave = async () => {
        setIsSaving(true)
        setStatus(null)
        try {
            // 1. Save Project Selection
            await db.projects.update(projectId, {
                modelConfig: {
                    provider,
                    model
                }
            })

            // 2. Save Global Provider Config
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
                    type: provider.includes('openai') ? 'openai' : 'google' as any
                }
            }

            await db.settings.update(1, {
                activeProvider: provider,
                providers: updatedProviders
            })

            setStatus({ type: 'success', message: 'Settings saved successfully!' })
        } finally {
            setIsSaving(false)
        }
    }

    const handleTest = async (e: React.MouseEvent) => {
        e.preventDefault() // Prevent form submission just in case
        setIsTesting(true)
        setStatus(null)
        try {
            await testConnection(provider, baseUrl, apiKey, model)
            setStatus({ type: 'success', message: 'Connection Successful! Provider is reachable.' })
        } catch (err: any) {
            setStatus({ type: 'error', message: `Connection Failed: ${err.message}` })
        } finally {
            setIsTesting(false)
        }
    }

    // Effect to clear status on provider change
    useEffect(() => {
        setStatus(null)
    }, [provider])

    return (
        <Card>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ... fields ... */}
                <div className="space-y-2">
                    <Label>Provider</Label>
                    <Select value={provider} onValueChange={(v) => { setProvider(v); }}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="lmstudio">LM Studio (Local)</SelectItem>
                            <SelectItem value="ollama">Ollama (Local)</SelectItem>
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
                    <p className="text-[0.8rem] text-muted-foreground">
                        Must point to the v1 compatible endpoint (e.g. ending in /v1)
                    </p>
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

                {status && (
                    <div className={`md:col-span-2 p-3 rounded-md text-sm font-medium ${status.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-destructive/10 text-destructive'}`}>
                        {status.message}
                    </div>
                )}

                <div className="md:col-span-2 flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={handleTest} disabled={isTesting || isSaving}>
                        {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wifi className="mr-2 h-4 w-4" />}
                        Test Connection
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving || isTesting}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                        Save Settings
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
