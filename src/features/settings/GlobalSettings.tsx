import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/db/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Save, Trash2, Key, Database, Globe } from "lucide-react"
import { useState, useEffect } from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const PROVIDERS = [
    { id: 'lmstudio', name: 'LM Studio', defaultUrl: 'http://localhost:1234/v1' },
    { id: 'ollama', name: 'Ollama', defaultUrl: 'http://localhost:11434/v1' },
    { id: 'openai', name: 'OpenAI', defaultUrl: 'https://api.openai.com/v1' },
    { id: 'google', name: 'Google Gemini', defaultUrl: 'https://generativelanguage.googleapis.com/v1beta' },
    { id: 'openrouter', name: 'OpenRouter', defaultUrl: 'https://openrouter.ai/api/v1' },
    { id: 'custom', name: 'Custom OpenAI-Compatible', defaultUrl: '' },
]

export default function GlobalSettings() {
    const settings = useLiveQuery(() => db.settings.get(1))
    const [localProviders, setLocalProviders] = useState<Record<string, any>>({})
    const [isSaving, setIsSaving] = useState(false)
    const [isClearing, setIsClearing] = useState(false)

    useEffect(() => {
        if (settings?.providers) {
            setLocalProviders(settings.providers)
        } else {
            // Initialize with defaults if empty
            const defaults: Record<string, any> = {}
            PROVIDERS.forEach(p => {
                defaults[p.id] = { baseUrl: p.defaultUrl, apiKey: '', model: '' }
            })
            setLocalProviders(defaults)
        }
    }, [settings])

    const updateProviderField = (providerId: string, field: string, value: string) => {
        setLocalProviders(prev => ({
            ...prev,
            [providerId]: {
                ...prev[providerId],
                [field]: value
            }
        }))
    }

    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    const saveAll = async () => {
        setIsSaving(true)
        setStatus(null)
        try {
            const current = await db.settings.get(1)
            if (!current) {
                await db.settings.add({ id: 1, activeProvider: 'lmstudio', providers: localProviders })
            } else {
                await db.settings.update(1, { providers: localProviders })
            }
            setStatus({ type: 'success', message: 'All global credentials saved successfully!' })
        } catch (err: any) {
            setStatus({ type: 'error', message: `Error saving: ${err.message}` })
        } finally {
            setIsSaving(false)
        }
    }

    const clearAllData = async () => {
        setIsClearing(true)
        try {
            await db.rows.clear()
            await db.projects.clear()
            // Small delay to let DB settle
            await new Promise(r => setTimeout(r, 500))
            window.location.href = "/"
        } catch (err) {
            console.error("Failed to clear", err)
            setIsClearing(false)
        }
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-2">Manage your global API credentials and application state.</p>
            </div>

            <Separator />

            <div className="grid gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                        <Key className="h-5 w-5 text-primary" />
                        <h2>API Credentials</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        {status && (
                            <span className={`text-sm font-medium ${status.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                                {status.message}
                            </span>
                        )}
                        <Button onClick={saveAll} disabled={isSaving}>
                            <Save className="mr-2 h-4 w-4" />
                            {isSaving ? "Saving..." : "Save All Changes"}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {PROVIDERS.map(p => (
                        <Card key={p.id} className="overflow-hidden transition-all hover:shadow-md border-muted">
                            <CardHeader className="bg-muted/30 pb-4">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Globe className="h-4 w-4 opacity-50" />
                                    {p.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Base URL</Label>
                                    <Input
                                        value={localProviders[p.id]?.baseUrl || ''}
                                        onChange={(e) => updateProviderField(p.id, 'baseUrl', e.target.value)}
                                        placeholder={p.defaultUrl}
                                        className="h-9 font-mono text-xs"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">API Key</Label>
                                    <Input
                                        type="password"
                                        value={localProviders[p.id]?.apiKey || ''}
                                        onChange={(e) => updateProviderField(p.id, 'apiKey', e.target.value)}
                                        placeholder="sk-..."
                                        className="h-9 font-mono text-xs"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <Separator />

            <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-destructive">
                    <Trash2 className="h-5 w-5" />
                    <h2>Danger Zone</h2>
                </div>
                <Card className="border-destructive/20 bg-destructive/5">
                    <CardContent className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="space-y-1">
                            <p className="font-medium">Reset Application Database</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                This will permanently delete all projects and imported CSV rows.
                                Your API keys in the section above will be preserved.
                            </p>
                        </div>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="shrink-0" disabled={isClearing}>
                                    {isClearing ? "Clearing..." : "Clear All Projects"}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your projects and all associated data from the local database.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={clearAllData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        Yes, Delete Everything
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-center text-xs text-muted-foreground pt-8 pb-12 items-center gap-2">
                <Database className="h-3 w-3" />
                <span>All data is stored locally in your browser (IndexedDB).</span>
            </div>
        </div>
    )
}
