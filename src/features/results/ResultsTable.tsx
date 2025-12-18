import { useLiveQuery } from "dexie-react-hooks"
import { useParams } from "react-router-dom"
import { db } from "@/db/db"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react"
import Papa from "papaparse"

export default function ResultsTable() {
    const { id } = useParams()
    const projectId = parseInt(id!)
    const rows = useLiveQuery(() => db.rows.where({ projectId }).toArray(), [projectId])

    const exportCSV = () => {
        if (!rows) return;

        // Construct export data
        // We want original data columns + response + error
        const data = rows.map(r => ({
            ...r.data, // original columns
            _status: r.status,
            _response: r.response,
            _error: r.error,
            _prompt_user: r.fullUserPrompt,
            _prompt_system: r.fullSystemPrompt
        }))

        const csv = Papa.unparse(data)
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `export_project_${projectId}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    if (!rows) return <div>Loading...</div>

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Results Preview</h2>
                <Button onClick={exportCSV} variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
            </div>

            <div className="border rounded-md flex-1 overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">ID</TableHead>
                            <TableHead className="w-[100px]">Status</TableHead>
                            <TableHead className="max-w-[300px]">Prompt</TableHead>
                            <TableHead>Response</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                    No data rows found.
                                </TableCell>
                            </TableRow>
                        )}
                        {rows.map(row => (
                            <TableRow key={row.id}>
                                <TableCell>{row.id}</TableCell>
                                <TableCell>
                                    {row.status === 'completed' && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Done</Badge>}
                                    {row.status === 'error' && <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Error</Badge>}
                                    {row.status === 'processing' && <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Run</Badge>}
                                    {row.status === 'pending' && <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Wait</Badge>}
                                </TableCell>
                                <TableCell className="max-w-[300px] truncate text-xs font-mono text-muted-foreground" title={row.fullUserPrompt}>
                                    {row.fullUserPrompt || "(Not generated)"}
                                </TableCell>
                                <TableCell className="text-sm whitespace-pre-wrap font-mono min-w-[300px]">
                                    {row.error ? (
                                        <span className="text-destructive">{row.error}</span>
                                    ) : (
                                        row.response
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
