import { Outlet, NavLink } from "react-router-dom"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/db/db"
import { Button } from "@/components/ui/button"
import { Plus, Database, Settings, BookOpen } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"

export default function Layout() {
    const projects = useLiveQuery(() => db.projects.toArray())

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-muted/20 flex flex-col">
                <div className="p-4 border-b">
                    <div className="flex items-center gap-2 font-bold text-lg text-primary">
                        <Database className="h-5 w-5" />
                        <span>Batch LLM</span>
                    </div>
                </div>

                <div className="flex-1 overflow-auto py-2">
                    <div className="px-3 py-2">
                        <h2 className="mb-2 px-2 text-xs font-semibold tracking-tight text-muted-foreground">
                            Projects
                        </h2>
                        <div className="space-y-1">
                            {projects?.map(p => (
                                <NavLink
                                    key={p.id}
                                    to={`/project/${p.id}`}
                                    className={({ isActive }) =>
                                        `block px-3 py-2 text-sm rounded-md transition-colors hover:bg-muted ${isActive ? "bg-muted font-medium text-primary" : "text-muted-foreground"}`
                                    }
                                >
                                    {p.name}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t space-y-2">
                    <Button variant="outline" className="w-full justify-start gap-2" asChild>
                        <NavLink to="/">
                            <Plus className="h-4 w-4" />
                            New Project
                        </NavLink>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2" asChild>
                        <NavLink to="/instructions">
                            <BookOpen className="h-4 w-4" />
                            Instructions
                        </NavLink>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2" asChild>
                        <NavLink to="/settings">
                            <Settings className="h-4 w-4" />
                            Settings
                        </NavLink>
                    </Button>
                    <div className="pt-2 flex justify-center">
                        <ModeToggle />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    )
}
