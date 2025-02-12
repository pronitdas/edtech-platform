// App.tsx
import React from 'react';
import { HashRouter  as Router, Route, Routes } from 'react-router-dom';
import Edtech from './page';
import LoginPage from './LoginPage';
import SignUpPage from './SignUp';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/dashboard" element={<Edtech />} />
       
      </Routes>
    </Router>
  );
}

export default App;
