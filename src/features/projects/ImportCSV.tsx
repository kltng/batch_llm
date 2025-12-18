import { useState } from "react"
import Papa from "papaparse"
import { db } from "@/db/db"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Upload, FileText, Loader2 } from "lucide-react"

export default function ImportCSV() {
    const [file, setFile] = useState<File | null>(null)
    const [projectName, setProjectName] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)
    const navigate = useNavigate()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const f = e.target.files[0]
            setFile(f)
            // Auto-suggest project name from filename
            if (!projectName) {
                setProjectName(f.name.replace(/\.[^/.]+$/, ""))
            }
        }
    }

    const handleImport = async () => {
        if (!file || !projectName) return

        setIsProcessing(true)
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    // 1. Create Project
                    const projectId = await db.projects.add({
                        name: projectName,
                        createdAt: Date.now(),
                        systemPromptType: 'static',
                        systemPromptValue: 'You are a helpful assistant.',
                        userPromptTemplate: '', // to be configured
                    })

                    // 2. Add Rows
                    const rows = results.data.map((row: any) => ({
                        projectId,
                        data: row,
                        status: 'pending',
                        updatedAt: Date.now()
                    }))

                    // Bulk add is much faster
                    await db.rows.bulkAdd(rows as any)

                    navigate(`/project/${projectId}`)
                } catch (error) {
                    console.error("Failed to import", error)
                    // todo: toast error
                } finally {
                    setIsProcessing(false)
                }
            },
            error: (error) => {
                console.error("Papa parse error", error)
                setIsProcessing(false)
            }
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create New Project</CardTitle>
                <CardDescription>Upload a CSV file to start a batch inference task.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Project Name</Label>
                    <Input
                        value={projectName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProjectName(e.target.value)}
                        placeholder="My Batch Task"
                    />
                </div>

                <div className="space-y-2">
                    <Label>CSV File</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                        <input
                            type="file"
                            accept=".csv"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleFileChange}
                        />
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        {file ? (
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <FileText className="h-4 w-4" />
                                {file.name}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                        )}
                    </div>
                </div>

                <Button
                    className="w-full"
                    onClick={handleImport}
                    disabled={!file || !projectName || isProcessing}
                >
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Project
                </Button>
            </CardContent>
        </Card>
    )
}
