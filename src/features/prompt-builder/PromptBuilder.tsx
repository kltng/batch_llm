import { useState, useEffect, useRef } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/db/db"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"

interface PromptBuilderProps {
    projectId: number
}

export default function PromptBuilder({ projectId }: PromptBuilderProps) {
    const project = useLiveQuery(() => db.projects.get(projectId), [projectId])
    const sampleRow = useLiveQuery(() => db.rows.where({ projectId }).first(), [projectId])

    const [systemPromptType, setSystemPromptType] = useState<'static' | 'column'>('static')
    const [systemPromptValue, setSystemPromptValue] = useState("")
    const [userPromptTemplate, setUserPromptTemplate] = useState("")

    // Ref to track last active textarea for insertion
    const lastActiveInputRef = useRef<'system' | 'user' | null>(null)
    const systemInputRef = useRef<HTMLTextAreaElement>(null)
    const userInputRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (project) {
            setSystemPromptType(project.systemPromptType)
            setSystemPromptValue(project.systemPromptValue)
            setUserPromptTemplate(project.userPromptTemplate)
        }
    }, [project])

    const saveConfig = async () => {
        await db.projects.update(projectId, {
            systemPromptType,
            systemPromptValue,
            userPromptTemplate
        })
        // toast success
        alert("Prompt configuration saved!")
    }

    const insertVariable = (col: string) => {
        const variable = `{{${col}}}`;

        if (lastActiveInputRef.current === 'system' && systemPromptType === 'static') {
            // Insert into system prompt
            const el = systemInputRef.current;
            if (el) {
                const start = el.selectionStart;
                const end = el.selectionEnd;
                const text = systemPromptValue;
                const newText = text.substring(0, start) + variable + text.substring(end);
                setSystemPromptValue(newText);
                // restore focus?
            }
        } else {
            // Default to user prompt
            const el = userInputRef.current;
            if (el) {
                const start = el.selectionStart;
                const end = el.selectionEnd;
                const text = userPromptTemplate;
                const newText = text.substring(0, start) + variable + text.substring(end);
                setUserPromptTemplate(newText);
            } else {
                setUserPromptTemplate(prev => prev + variable)
            }
        }
    }

    if (!project) return null;

    const columns = sampleRow ? Object.keys(sampleRow.data) : []

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-2 space-y-6">
                {/* System Prompt Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>System Prompt</CardTitle>
                        <CardDescription>Define the persona or rules for the AI.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <RadioGroup
                            value={systemPromptType}
                            onValueChange={(v: 'static' | 'column') => setSystemPromptType(v)}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="static" id="sp-static" />
                                <Label htmlFor="sp-static">Static Text</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="column" id="sp-column" />
                                <Label htmlFor="sp-column">From Column</Label>
                            </div>
                        </RadioGroup>

                        {systemPromptType === 'static' ? (
                            <Textarea
                                ref={systemInputRef}
                                placeholder="You are a helpful assistant..."
                                value={systemPromptValue}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSystemPromptValue(e.target.value)}
                                onFocus={() => lastActiveInputRef.current = 'system'}
                                className="min-h-[100px] font-mono text-sm"
                            />
                        ) : (
                            <Select value={systemPromptValue} onValueChange={setSystemPromptValue}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a column" />
                                </SelectTrigger>
                                <SelectContent>
                                    {columns.map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </CardContent>
                </Card>

                {/* User Prompt Section */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>User Prompt Template</CardTitle>
                        <CardDescription>
                            Construct the query for each row. Click columns on the right to insert.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col">
                        <Textarea
                            ref={userInputRef}
                            placeholder="Analyze the following text: {{text_column}}"
                            value={userPromptTemplate}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setUserPromptTemplate(e.target.value)}
                            onFocus={() => lastActiveInputRef.current = 'user'}
                            className="min-h-[200px] font-mono text-sm"
                        />
                    </CardContent>
                </Card>

                <Button onClick={saveConfig} className="w-full md:w-auto">
                    <Save className="mr-2 h-4 w-4" /> Save Configuration
                </Button>
            </div>

            <div className="md:col-span-1">
                <Card className="sticky top-6">
                    <CardHeader>
                        <CardTitle>Columns</CardTitle>
                        <CardDescription>Available data from CSV</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {columns.length === 0 && <p className="text-sm text-muted-foreground">No columns found.</p>}
                            {columns.map(col => (
                                <Badge
                                    key={col}
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors p-2 text-sm"
                                    onClick={() => insertVariable(col)}
                                >
                                    {col}
                                </Badge>
                            ))}
                        </div>
                        <div className="mt-6 text-xs text-muted-foreground">
                            Click a column chip to insert it into the active editor.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
