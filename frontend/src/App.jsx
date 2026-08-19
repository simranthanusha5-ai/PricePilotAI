import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Analytics from "./pages/Analytics";
import DemandForecast from "./pages/DemandForecast";
import RevenueOptimization from "./pages/RevenueOptimization";
import Model from "./pages/Model";
import About from "./pages/About";
import CompetitorAnalysis from "./pages/CompetitorAnalysis";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Products from "./pages/Products";
import PredictionHistory from "./pages/PredictionHistory";

function AppContent() {
  const location = useLocation();

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/register";

  return (
    <div className="app-layout">
      {!isAuthPage && <Navbar />}

      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />
        <Route
  path="/revenue"
  element={
    <ProtectedRoute>
      <RevenueOptimization />
    </ProtectedRoute>
  }
/>

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
  path="/history"
  element={
    <ProtectedRoute>
      <PredictionHistory />
    </ProtectedRoute>
  }
/>

        <Route
          path="/forecast"
          element={
            <ProtectedRoute>
              <DemandForecast />
            </ProtectedRoute>
          }
        />

        <Route
          path="/revenue"
          element={
            <ProtectedRoute>
              <RevenueOptimization />
            </ProtectedRoute>
          }
        />

        <Route
          path="/model"
          element={
            <ProtectedRoute>
              <Model />
            </ProtectedRoute>
          }
        />
        <Route
  path="/products"
  element={
    <ProtectedRoute>
      <Products />
    </ProtectedRoute>
  }
/>

        <Route
          path="/competitors"
          element={
            <ProtectedRoute>
              <CompetitorAnalysis />
            </ProtectedRoute>
          }
        />

        <Route
          path="/about"
          element={
            <ProtectedRoute>
              <About />
            </ProtectedRoute>
          
        
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;