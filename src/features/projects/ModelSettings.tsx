import { useEffect, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/db/db"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Check, Loader2, Wifi, Settings as SettingsIcon } from "lucide-react"
import { testConnection } from "@/lib/llm"
import { Link } from "react-router-dom"

export default function ModelSettings({ projectId }: { projectId: number }) {
    const project = useLiveQuery(() => db.projects.get(projectId), [projectId])
    const globalSettings = useLiveQuery(() => db.settings.get(1))

    // State
    const [provider, setProvider] = useState("lmstudio")
    const [model, setModel] = useState("local-model")

    // Override State
    const [useCustomSettings, setUseCustomSettings] = useState(false)
    const [customBaseUrl, setCustomBaseUrl] = useState("")
    const [customApiKey, setCustomApiKey] = useState("")

    const [isSaving, setIsSaving] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
    const [isTesting, setIsTesting] = useState(false)

    // Load Project Defaults
    useEffect(() => {
        if (project?.modelConfig) {
            setProvider(project.modelConfig.provider)
            setModel(project.modelConfig.model)

            // Explicitly verify useGlobal logic:
            // if useGlobal is UNDEFINED (legacy), we assume TRUE (don't override).
            // if useGlobal is TRUE, we don't override. 
            // Only if useGlobal is FALSE do we override.
            const overrides = project.modelConfig.useGlobal === false;
            setUseCustomSettings(overrides)

            if (project.modelConfig.baseUrl) setCustomBaseUrl(project.modelConfig.baseUrl)
            if (project.modelConfig.apiKey) setCustomApiKey(project.modelConfig.apiKey)
        } else {
            // New project defaults
            setUseCustomSettings(false)
        }
    }, [project])

    // Resolved Values (Computed for display/testing)
    const globalProviderConfig = globalSettings?.providers?.[provider]
    const activeBaseUrl = useCustomSettings ? customBaseUrl : (globalProviderConfig?.baseUrl || "")
    const activeApiKey = useCustomSettings ? customApiKey : (globalProviderConfig?.apiKey || "")


    const handleSave = async () => {
        setIsSaving(true)
        setStatus(null)
        try {
            // Only update PROJECT settings. Never touch Global Settings here.
            await db.projects.update(projectId, {
                modelConfig: {
                    provider,
                    model,
                    useGlobal: !useCustomSettings,
                    baseUrl: useCustomSettings ? customBaseUrl : undefined,
                    apiKey: useCustomSettings ? customApiKey : undefined
                }
            })

            setStatus({ type: 'success', message: 'Project configuration saved.' })
        } catch (err: any) {
            setStatus({ type: 'error', message: `Error saving: ${err.message}` })
        } finally {
            setIsSaving(false)
        }
    }

    const handleTest = async (e: React.MouseEvent) => {
        e.preventDefault()
        setIsTesting(true)
        setStatus(null)
        try {
            await testConnection(provider, activeBaseUrl, activeApiKey, model)
            setStatus({ type: 'success', message: 'Connection Successful!' })
        } catch (err: any) {
            setStatus({ type: 'error', message: `Connection Failed: ${err.message}` })
        } finally {
            setIsTesting(false)
        }
    }

    // Reset status on change
    useEffect(() => { setStatus(null) }, [provider, useCustomSettings])

    return (
        <Card>
            <CardContent className="pt-6 space-y-6">

                {/* 1. Basic Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>

                {/* 2. Connection Info Box (ReadOnly vs Edit) */}
                <div className="rounded-lg border bg-muted/20 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <Label className="flex items-center gap-2 font-semibold">
                            Connection Details
                            {!useCustomSettings && <span className="text-xs font-normal text-muted-foreground ml-2">(Using Global Settings)</span>}
                        </Label>
                        <div className="flex items-center space-x-2">
                            <Label htmlFor="override-mode" className="text-xs cursor-pointer text-muted-foreground">Override Global</Label>
                            <Switch id="override-mode" checked={useCustomSettings} onCheckedChange={setUseCustomSettings} />
                        </div>
                    </div>

                    {!useCustomSettings ? (
                        <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-[80px_1fr] gap-2 items-center">
                                <span className="text-muted-foreground text-xs uppercase font-mono">Base URL</span>
                                <code className="bg-background px-2 py-1 rounded border text-xs overflow-hidden text-ellipsis whitespace-nowrap">
                                    {activeBaseUrl || "Not configured"}
                                </code>
                            </div>
                            <div className="grid grid-cols-[80px_1fr] gap-2 items-center">
                                <span className="text-muted-foreground text-xs uppercase font-mono">API Key</span>
                                <div className="flex items-center gap-2">
                                    <code className="bg-background px-2 py-1 rounded border text-xs">
                                        {activeApiKey ? "••••••••" : "No key set"}
                                    </code>
                                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2" asChild>
                                        <Link to="/settings" className="flex items-center gap-1">
                                            <SettingsIcon className="h-3 w-3" />
                                            Configure
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-200">
                            <div className="space-y-2">
                                <Label className="text-xs">Project-Specific Base URL</Label>
                                <Input
                                    value={customBaseUrl}
                                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Project-Specific API Key</Label>
                                <Input
                                    type="password"
                                    value={customApiKey}
                                    onChange={(e) => setCustomApiKey(e.target.value)}
                                    placeholder="sk-..."
                                    className="h-9"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {status && (
                    <div className={`p-3 rounded-md text-sm font-medium ${status.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-destructive/10 text-destructive'}`}>
                        {status.message}
                    </div>
                )}

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={handleTest} disabled={isTesting || isSaving}>
                        {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wifi className="mr-2 h-4 w-4" />}
                        Test Connection
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving || isTesting}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                        Save Configuration
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
