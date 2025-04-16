import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NetworkProvider } from './context/NetworkContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import NetworkList from './components/networks/NetworkList';
import FriendshipNetwork from './components/FriendshipNetwork';
import Header from './components/layout/Header';

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NetworkProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route
                  path="/networks"
                  element={
                    <ProtectedRoute>
                      <NetworkList />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/networks/:id"
                  element={
                    <ProtectedRoute>
                      <FriendshipNetwork />
                    </ProtectedRoute>
                  }
                />

                <Route path="/" element={<Navigate to="/networks" />} />
                <Route path="*" element={<Navigate to="/networks" />} />
              </Routes>
            </main>
          </div>
        </Router>
      </NetworkProvider>
    </AuthProvider>
  );
};

export default App;
