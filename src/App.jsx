import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DevLanding from "./pages/DevLanding/DevLanding";
import ProjectOverview from "./pages/ProjectOverview/ProjectOverview";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dev" replace />} />
        <Route path="/dev" element={<DevLanding />} />
        <Route path="/project/:id" element={<ProjectOverview />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;