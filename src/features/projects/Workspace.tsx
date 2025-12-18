import { useParams } from "react-router-dom"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/db/db"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import PromptBuilder from "@/features/prompt-builder/PromptBuilder"
import BatchRunner from "@/features/runner/BatchRunner"
import ResultsTable from "@/features/results/ResultsTable"
import ModelSettings from "./ModelSettings"
import { Separator } from "@/components/ui/separator"

export default function Workspace() {
    const { id } = useParams()
    const projectId = parseInt(id!)
    const project = useLiveQuery(() => db.projects.get(projectId), [projectId])

    if (!project) return <div className="p-8 text-muted-foreground">Loading workspace...</div>

    return (
        <div className="h-screen flex flex-col bg-background">
            <div className="border-b px-6 py-4 flex items-center justify-between bg-card">
                <div>
                    <h1 className="font-bold text-xl tracking-tight">{project.name}</h1>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">ID: {projectId}</span>
                        <span>•</span>
                        <span>{project.modelConfig?.provider ? `Provider: ${project.modelConfig.provider}` : "No Provider Configured"}</span>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="setup" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 border-b bg-muted/40">
                    <TabsList className="bg-transparent h-12 p-0 w-full justify-start gap-6 rounded-none">
                        <TabsTrigger
                            value="setup"
                            className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 bg-transparent"
                        >
                            1. Setup
                        </TabsTrigger>
                        <TabsTrigger
                            value="run"
                            className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 bg-transparent"
                        >
                            2. Batch Run
                        </TabsTrigger>
                        <TabsTrigger
                            value="results"
                            className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 bg-transparent"
                        >
                            3. Results
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="setup" className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-950/50 p-6 data-[state=active]:flex data-[state=active]:flex-col">
                    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">1</div>
                                <h2 className="text-lg font-semibold text-foreground">Model Configuration</h2>
                            </div>
                            <ModelSettings projectId={projectId} />
                        </section>

                        <Separator />

                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">2</div>
                                <h2 className="text-lg font-semibold text-foreground">Prompt Engineering</h2>
                            </div>
                            <PromptBuilder projectId={projectId} />
                        </section>
                    </div>
                </TabsContent>

                <TabsContent value="run" className="flex-1 overflow-hidden hidden data-[state=active]:flex flex-col p-6">
                    <BatchRunner projectId={projectId} />
                </TabsContent>

                <TabsContent value="results" className="flex-1 overflow-hidden hidden data-[state=active]:flex flex-col p-6">
                    <ResultsTable />
                </TabsContent>
            </Tabs>
        </div>
    )
}
