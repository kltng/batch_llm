import { BrowserRouter, Routes, Route } from "react-router-dom"
import Layout from "./components/layout/Layout"
import ProjectList from "./features/projects/ProjectList"
import Workspace from "./features/projects/Workspace"
import GlobalSettings from "./features/settings/GlobalSettings"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<ProjectList />} />
          <Route path="/project/:id" element={<Workspace />} />
          <Route path="/settings" element={<GlobalSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
