import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, Code, Play, Database, Settings, FileSpreadsheet, CheckCircle2 } from "lucide-react"

export default function InstructionPage() {
    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-primary">Batch LLM Studio</h1>
                <p className="text-xl text-muted-foreground mt-4">
                    A powerful Progressive Web App (PWA) for running batch inference tasks using local LLMs (LM Studio, Ollama) and cloud APIs (OpenAI, Gemini).
                </p>
            </div>

            <Separator />

            <div className="grid gap-8 md:grid-cols-[1fr_250px]">
                <div className="space-y-8">
                    <section id="getting-started">
                        <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
                            <Play className="h-6 w-6 text-blue-500" /> Getting Started
                        </h2>
                        <Card>
                            <CardContent className="pt-6 space-y-4">
                                <p>
                                    Batch LLM Studio is designed to process large datasets (CSV) against Large Language Models.
                                    Everything runs <strong>locally in your browser</strong>. Your API keys and data never leave your device unless sent directly to the LLM provider you choose.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                                    <div className="bg-muted/30 p-4 rounded-lg border text-center space-y-2">
                                        <Database className="h-8 w-8 mx-auto text-primary" />
                                        <h3 className="font-semibold">Locally Stored</h3>
                                        <p className="text-xs text-muted-foreground">Projects & data saved in IndexedDB</p>
                                    </div>
                                    <div className="bg-muted/30 p-4 rounded-lg border text-center space-y-2">
                                        <Code className="h-8 w-8 mx-auto text-primary" />
                                        <h3 className="font-semibold">Local & Cloud</h3>
                                        <p className="text-xs text-muted-foreground">Support for LM Studio, Ollama, OpenAI, & Gemini</p>
                                    </div>
                                    <div className="bg-muted/30 p-4 rounded-lg border text-center space-y-2">
                                        <FileSpreadsheet className="h-8 w-8 mx-auto text-primary" />
                                        <h3 className="font-semibold">CSV Processing</h3>
                                        <p className="text-xs text-muted-foreground">Import data, map columns to prompts</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    <section id="workflow">
                        <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
                            <CheckCircle2 className="h-6 w-6 text-green-500" /> Typical Workflow
                        </h2>

                        <div className="relative pl-6 border-l-2 border-muted space-y-8">
                            <div className="relative">
                                <div className="absolute -left-[31px] bg-background border-2 border-muted rounded-full w-4 h-4 mt-1.5" />
                                <h3 className="text-lg font-semibold">1. Create a Project</h3>
                                <p className="text-muted-foreground mt-1">Start by clicking "New Project". Give it a name to organize your batch run.</p>
                            </div>

                            <div className="relative">
                                <div className="absolute -left-[31px] bg-background border-2 border-muted rounded-full w-4 h-4 mt-1.5" />
                                <h3 className="text-lg font-semibold">2. Import Data</h3>
                                <p className="text-muted-foreground mt-1">
                                    Upload a CSV file. Each row in the CSV represents one task.
                                    The columns (headers) in your CSV will be available as variables for your prompt.
                                </p>
                            </div>

                            <div className="relative">
                                <div className="absolute -left-[31px] bg-background border-2 border-muted rounded-full w-4 h-4 mt-1.5" />
                                <h3 className="text-lg font-semibold">3. Configure Provider & Prompts</h3>
                                <p className="text-muted-foreground mt-1 mb-2">
                                    Navigate to the <strong>Setup Tab</strong> in your project workspace.
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li><strong>Model Selection:</strong> Choose between Local (LM Studio, Ollama) or Cloud (OpenAI, Gemini).</li>
                                    <li><strong>Prompt Template:</strong> Write your system and user prompts. Use <code className="bg-muted px-1 rounded text-xs">{`{{column_name}}`}</code> to inject data from your CSV dynamically.</li>
                                    <li><strong>Test Connection:</strong> Use the test button to ensure your model is reachable.</li>
                                </ul>
                            </div>

                            <div className="relative">
                                <div className="absolute -left-[31px] bg-background border-2 border-muted rounded-full w-4 h-4 mt-1.5" />
                                <h3 className="text-lg font-semibold">4. Run Batch</h3>
                                <p className="text-muted-foreground mt-1">
                                    Go to the <strong>Batch Run Tab</strong>. Set your concurrency (parallel requests) and optional delay (rate limiting).
                                    Click <strong>Start Batch</strong> to begin processing.
                                </p>
                            </div>

                            <div className="relative">
                                <div className="absolute -left-[31px] bg-background border-2 border-muted rounded-full w-4 h-4 mt-1.5" />
                                <h3 className="text-lg font-semibold">5. Export Results</h3>
                                <p className="text-muted-foreground mt-1">
                                    Once completed, view the results in the <strong>Results Tab</strong> or export the full dataset (including model responses) as a new CSV.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section id="providers">
                        <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
                            <Settings className="h-6 w-6 text-purple-500" /> Provider Configuration
                        </h2>
                        <Tabs defaultValue="local" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="local">Local Models</TabsTrigger>
                                <TabsTrigger value="cloud">Cloud APIs</TabsTrigger>
                            </TabsList>
                            <TabsContent value="local" className="space-y-4 mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>LM Studio</CardTitle>
                                        <CardDescription>Default Port: 1234</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ol className="list-decimal list-inside text-sm space-y-2">
                                            <li>Open LM Studio and load a model.</li>
                                            <li>Go to the <strong>Developer/Server</strong> tab (double arrow icon).</li>
                                            <li>Start the local server. Ensure "Cross-Origin-Resource-Sharing (CORS)" is enabled (ON).</li>
                                            <li>Use `http://localhost:1234/v1` as the Base URL in this app.</li>
                                        </ol>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Ollama</CardTitle>
                                        <CardDescription>Default Port: 11434</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ol className="list-decimal list-inside text-sm space-y-2">
                                            <li>Install and run Ollama.</li>
                                            <li>Ensure OLLAMA_ORIGINS env variable includes `*` or this app's URL to allow CORS.</li>
                                            <li>Use `http://localhost:11434/v1` as the Base URL.</li>
                                        </ol>
                                        <Alert className="mt-4">
                                            <Info className="h-4 w-4" />
                                            <AlertTitle>CORS Warning</AlertTitle>
                                            <AlertDescription>
                                                Web browsers block requests to local servers strictly. You MUST enable CORS on your local LLM server for this app to work.
                                            </AlertDescription>
                                        </Alert>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="cloud" className="space-y-4 mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>OpenAI / Gemini / OpenRouter</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <p className="text-sm">
                                            Configure your global API keys in the <strong>Settings</strong> page.
                                        </p>
                                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                                            <li><strong>OpenAI:</strong> `https://api.openai.com/v1`</li>
                                            <li><strong>Google Gemini:</strong> `https://generativelanguage.googleapis.com/v1beta`</li>
                                            <li><strong>OpenRouter:</strong> `https://openrouter.ai/api/v1`</li>
                                        </ul>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </section>
                </div>

                {/* Table of Contents Sticky */}
                <div className="hidden md:block">
                    <div className="sticky top-8 space-y-2">
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider mb-2">On this page</h4>
                        <nav className="flex flex-col space-y-1 text-sm">
                            <a href="#getting-started" className="text-muted-foreground hover:text-primary transition-colors">Getting Started</a>
                            <a href="#workflow" className="text-muted-foreground hover:text-primary transition-colors">Workflow</a>
                            <a href="#providers" className="text-muted-foreground hover:text-primary transition-colors">Provider Config</a>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    )
}
