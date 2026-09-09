import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./page/Home.jsx";
import CountryRules from './page/CountryRules.jsx';
import ActivityRulesView from './page/ActivityRulesView.jsx';
import ActivityRules from "./page/ActivityRules.jsx";
import TermsRules from "./page/TermsRules.jsx";
import RefundRules from "./page/RefundRules.jsx";
import Backoffice from "./page/Backoffice.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/country-rules" element={<CountryRules />} />
      <Route path="/activity-rules-view" element={<ActivityRulesView />} />
      <Route path="/activity-rules" element={<ActivityRules />} />
      <Route path="/terms-rules" element={<TermsRules />} />
      <Route path="/refund-rules" element={<RefundRules />} />
      <Route path="/backoffice" element={<Backoffice />} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;