import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import RcrForm from './components/RcrForm';
import ManageRequests from './components/ManageRequests';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/forms/new" element={<RcrForm />} />
            <Route path="/forms/edit/:id" element={<RcrForm />} />
            <Route path="/forms" element={<ManageRequests />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
