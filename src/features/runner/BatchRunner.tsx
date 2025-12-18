import { useState, useRef } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db, type DataRow } from "@/db/db"
import { generateCompletion } from "@/lib/llm"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Play, Pause, RotateCcw, AlertTriangle } from "lucide-react"

export default function BatchRunner({ projectId }: { projectId: number }) {
    const project = useLiveQuery(() => db.projects.get(projectId), [projectId])
    const counts = useLiveQuery(async () => {
        const total = await db.rows.where({ projectId }).count()
        const completed = await db.rows.where({ projectId }).filter(r => r.status === 'completed').count()
        const pending = await db.rows.where({ projectId }).filter(r => r.status === 'pending').count()
        const processing = await db.rows.where({ projectId }).filter(r => r.status === 'processing').count()
        const error = await db.rows.where({ projectId }).filter(r => r.status === 'error').count()
        return { total, completed, pending, processing, error }
    }, [projectId])

    const [isRunning, setIsRunning] = useState(false)
    const [concurrency, setConcurrency] = useState(3)
    const [delaySeconds, setDelaySeconds] = useState(0)
    const stopRef = useRef(false)

    // Helpers to get creds
    const getBaseUrl = async (provider: string) => {
        const s = await db.settings.get(1);
        return s?.providers?.[provider]?.baseUrl || ""
    }
    const getApiKey = async (provider: string) => {
        const s = await db.settings.get(1);
        return s?.providers?.[provider]?.apiKey || ""
    }

    const processRow = async (row: DataRow, proj: any) => {
        if (stopRef.current) return;

        // 1. Mark processing
        await db.rows.update(row.id, { status: 'processing', updatedAt: Date.now() })

        try {
            const sysPrompt = proj?.systemPromptType === 'static'
                ? proj.systemPromptValue
                : (row.data[proj?.systemPromptValue || ""] || "");

            let userPrompt = proj?.userPromptTemplate || "";
            // Replace {{col}}
            // Optimize: find all {{...}} matches and replace
            const keys = Object.keys(row.data);
            keys.forEach(key => {
                userPrompt = userPrompt.replaceAll(`{{${key}}}`, row.data[key] || "")
            })

            if (!proj.modelConfig?.provider) throw new Error("No provider configured");

            const baseUrl = await getBaseUrl(proj.modelConfig.provider);
            const apiKey = await getApiKey(proj.modelConfig.provider);

            // 3. Call API
            const response = await generateCompletion({
                provider: proj.modelConfig.provider,
                baseUrl,
                apiKey,
                model: proj.modelConfig.model,
                systemPrompt: sysPrompt,
                userPrompt: userPrompt
            })

            // 4. Save Result
            await db.rows.update(row.id, {
                status: 'completed',
                response: response,
                fullSystemPrompt: sysPrompt,
                fullUserPrompt: userPrompt,
                updatedAt: Date.now()
            })

        } catch (err: any) {
            console.error("Row Error:", err)
            await db.rows.update(row.id, {
                status: 'error',
                error: err.message,
                updatedAt: Date.now()
            })
        }
    }

    const startBatch = async () => {
        if (!project) return;
        if (!project.modelConfig?.provider) {
            alert("Please configure a provider in the Setup tab first.")
            return
        }
        setIsRunning(true)
        stopRef.current = false;

        // While check
        // We fetch in small chunks
        // To support concurrency, we need to maintain a pool
        // Simple implementation: Fetch N pending, await Promise.all, repeat.
        // This acts as a semaphore of size N where N is batch size :)

        while (!stopRef.current) {
            // Re-fetch pending count to be sure
            const pendingCount = await db.rows.where({ projectId }).filter(r => r.status === 'pending').count();
            if (pendingCount === 0) break;

            const candidates = await db.rows
                .where({ projectId })
                .filter(r => r.status === 'pending')
                .limit(concurrency)
                .toArray();

            if (candidates.length === 0) break;

            await Promise.all(candidates.map(row => processRow(row, project)))

            // Delay between queries (or batches)
            if (delaySeconds > 0 && !stopRef.current) {
                await new Promise(r => setTimeout(r, delaySeconds * 1000))
            } else {
                // Small breathing room
                await new Promise(r => setTimeout(r, 100))
            }
        }
        setIsRunning(false)
    }

    const stopBatch = () => {
        stopRef.current = true;
        setIsRunning(false)
    }

    const resetErrors = async () => {
        await db.rows.where({ projectId }).filter(r => r.status === 'error').modify({ status: 'pending', error: undefined })
    }

    const progress = counts ? Math.round((counts.completed / counts.total) * 100) : 0;

    return (
        <div className="space-y-8 max-w-3xl mx-auto mt-6">
            <Card className="shadow-lg">
                <CardHeader className="bg-muted/10 pb-4">
                    <CardTitle>Batch Operations</CardTitle>
                    <CardDescription>Run inference on {counts?.total || 0} rows using {project?.modelConfig?.model || 'configured model'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-6">

                    <div className="space-y-2">
                        <div className="flex justify-between font-medium text-sm">
                            <span>Progress</span>
                            <span>{progress}% ({counts?.completed}/{counts?.total})</span>
                        </div>
                        <Progress value={progress} className="h-3" />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Pending: {counts?.pending}</span>
                            <span>Processing: {counts?.processing}</span>
                            <span className="text-destructive font-semibold">Errors: {counts?.error}</span>
                        </div>
                    </div>

                    <div className="flex items-end gap-4 border-t pt-6 bg-slate-50 dark:bg-slate-900/50 -mx-6 px-6 -mb-6 pb-6 rounded-b-lg">
                        <div className="w-32">
                            <Label>Concurrency</Label>
                            <Input
                                type="number"
                                min={1}
                                max={20}
                                value={concurrency}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConcurrency(parseInt(e.target.value))}
                                disabled={isRunning}
                            />
                        </div>

                        <div className="w-32">
                            <Label>Delay (s)</Label>
                            <Input
                                type="number"
                                min={0}
                                max={120}
                                value={delaySeconds}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDelaySeconds(parseInt(e.target.value))}
                                disabled={isRunning}
                            />
                        </div>

                        <div className="flex-1 flex justify-end gap-3">
                            {counts && counts.error > 0 && !isRunning && (
                                <Button variant="outline" onClick={resetErrors} className="text-destructive border-destructive/20 hover:bg-destructive/10">
                                    <RotateCcw className="mr-2 h-4 w-4" /> Retry Errors
                                </Button>
                            )}

                            {!isRunning ? (
                                <Button onClick={startBatch} disabled={!counts || counts.pending === 0} size="lg" className="min-w-[150px]">
                                    <Play className="mr-2 h-5 w-5" />
                                    {counts?.pending === 0 && counts.total > 0 ? "Completed" : "Start Batch"}
                                </Button>
                            ) : (
                                <Button onClick={stopBatch} variant="destructive" size="lg" className="min-w-[150px]">
                                    <Pause className="mr-2 h-5 w-5" /> Stop
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {counts && counts.error > 0 && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-center gap-2 border border-destructive/20">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">Some rows failed. Check the results table or click Retry Errors.</span>
                </div>
            )}
        </div>
    )
}
