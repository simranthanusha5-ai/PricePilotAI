import { BrowserRouter, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Analytics from "./pages/Analytics";
import DemandForecast from "./pages/DemandForecast";
import RevenueOptimization from "./pages/RevenueOptimization";
import Model from "./pages/Model";
import About from "./pages/About";

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/forecast" element={<DemandForecast />} />
          <Route path="/revenue" element={<RevenueOptimization />} />
          <Route path="/model" element={<Model />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;