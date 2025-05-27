import "./App.css";
import React, { useEffect } from "react";
import { Auth, SignUp } from "./pages/Auth/Auth";
import ProfileEdit from "./pages/Deets/Deets";
import Feed from "./pages/Feed/Feed";
import UserProfile from "./pages/userProfile/userProfile";
import OTPVerification from "./pages/Otp/Otp";
import ViewProfile from "./pages/ViewProfile/ViewProfile";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ViewAllSearch from "./components/ViewAllSearch/ViewAllSearch";
import NotFound from "./components/NotFound/NotFound";
import TwoFactorAuth from './components/TwoFactorAuth/TwoFactorAuth';
import { Toaster } from 'react-hot-toast';
import TwoFactorVerify from "./pages/TwoFactorVerify/TwoFactorVerify";
import PhoneVerify from "./pages/PhoneVerify/PhoneVerify";

// Navigation Control Component
const NavigationControl = ({ children }) => {
  useEffect(() => {
    // Disable back button
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = function () {
      window.history.pushState(null, null, window.location.href);
    };

    return () => {
      window.onpopstate = null;
    };
  }, []);

  return children;
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('userId');
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

// Auth Route Component (redirects to feed if already logged in)
const AuthRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('userId');

  if (isAuthenticated) {
    return <Navigate to="/feed" replace />;
  }

  return children;
};

// Wrapper component for the blur effect
const PageWrapper = ({ children }) => (
  <div className="App">
    <div className="blur" style={{ top: "-18%", right: "0" }}></div>
    <div className="blur" style={{ top: "36%", left: "-8rem" }}></div>
    {children}
  </div>
);

function App() {
  return (
    <NavigationControl>
      <Routes>
        {/* Public Routes - Redirect to feed if already logged in */}
        <Route path="/" element={
          <AuthRoute>
            <PageWrapper><Auth /></PageWrapper>
          </AuthRoute>
        } />
        <Route path="/signup" element={
          <AuthRoute>
            <PageWrapper><SignUp /></PageWrapper>
          </AuthRoute>
        } />
        <Route path="/verify-otp" element={<PageWrapper><OTPVerification /></PageWrapper>} />
        <Route path="/2fa-setup/:id" element={<PageWrapper><TwoFactorAuth /></PageWrapper>} />
        <Route path="/2fa-verify/:id" element={<PageWrapper><TwoFactorVerify /></PageWrapper>} />
        <Route path="/phone-verify/:id" element={<PageWrapper><PhoneVerify /></PageWrapper>} />

        {/* Protected Routes - Require authentication */}
        <Route path="/feed" element={
          <ProtectedRoute>
            <PageWrapper>
              <Feed />
            </PageWrapper>
          </ProtectedRoute>
        } />

        <Route path="/viewprofile/:id" element={
          <ProtectedRoute>
            <PageWrapper>
              <ViewProfile />
            </PageWrapper>
          </ProtectedRoute>
        } />

        <Route path="/profileedit/:id" element={
          <ProtectedRoute>
            <PageWrapper>
              <ProfileEdit />
            </PageWrapper>
          </ProtectedRoute>
        } />

        <Route path="/view-all" element={
          <ProtectedRoute>
            <ViewAllSearch />
          </ProtectedRoute>
        } />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="top-center" />
    </NavigationControl>
  );
}

export default App;