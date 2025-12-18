import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/db/db"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardTitle, CardHeader, CardDescription, CardFooter } from "@/components/ui/card"
import ImportCSV from "./ImportCSV"
import { ArrowRight, Trash2 } from "lucide-react"

export default function ProjectList() {
    const projects = useLiveQuery(() => db.projects.orderBy('createdAt').reverse().toArray())

    const deleteProject = async (id: number) => {
        if (confirm("Are you sure? This will delete all data associated with this project.")) {
            await db.transaction('rw', db.projects, db.rows, async () => {
                await db.rows.where('projectId').equals(id).delete()
                await db.projects.delete(id)
            })
        }
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Manage your batch inference projects.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-semibold mb-4">Your Projects</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {projects?.length === 0 && (
                            <div className="col-span-full text-muted-foreground text-sm italic">No projects yet. Create one to get started.</div>
                        )}
                        {projects?.map(project => (
                            <Card key={project.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <CardTitle className="truncate">{project.name}</CardTitle>
                                    <CardDescription>Created {new Date(project.createdAt).toLocaleDateString()}</CardDescription>
                                </CardHeader>
                                <CardFooter className="flex justify-between">
                                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteProject(project.id)}>
                                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                                    </Button>
                                    <Button asChild size="sm">
                                        <Link to={`/project/${project.id}`}>
                                            Open <ArrowRight className="h-4 w-4 ml-1" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="sticky top-8">
                        <ImportCSV />
                    </div>
                </div>
            </div>
        </div>
    )
}
