import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./page/Home.jsx";
import CountryRules from './page/CountryRules';
import ActivityRules from "./page/ActivityRules.jsx";
import Backoffice from "./page/Backoffice.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/country-rules" element={<CountryRules />} />
      <Route path="/activity-rules" element={<ActivityRules />} />
      <Route path="/backoffice" element={<Backoffice />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;