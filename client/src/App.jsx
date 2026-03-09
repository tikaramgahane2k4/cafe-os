import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import LandingPage from "./pages/LandingPage/LandingPage";
import Dashboard from "./pages/Owner/Dashboard";
import './App.css'
import RootRouter from './routes/RootRouter'

const AdminDashboard = () => <h1>Super Admin Dashboard</h1>;
const Unauthorized = () => <h1>403 - Unauthorized</h1>;

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <RootRouter />
      </div>
    </AuthProvider>
  )
}

export default App