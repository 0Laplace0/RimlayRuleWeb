import { Routes, Route, Navigate } from 'react-router-dom';
import Rules from './page/Rules.jsx';
import Backoffice from './page/Backoffice.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/rules" replace />} />
      <Route path="/rules" element={<Rules />} />
      <Route path="/backoffice" element={<Backoffice />} />
      <Route path="*" element={<Navigate to="/rules" replace />} />
    </Routes>
  );
}

export default App;