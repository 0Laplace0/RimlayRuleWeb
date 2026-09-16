import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./page/Home.jsx";
import CountryRules from './page/CountryRules.jsx';
import ActivityRulesView from './page/ActivityRulesView.jsx';
import ActivityRules from "./page/ActivityRules.jsx";
import Safezone from "./page/SafezoneRules.jsx";
import RoleplayRules from "./page/RoleplayRules.jsx";
import PoliceRules from "./page/PoliceRules.jsx";
import DoctorRules from "./page/DoctorRules.jsx";
import TermsRules from "./page/TermsRules.jsx";
import RefundRules from "./page/RefundRules.jsx";
import StreamingPolicy from "./page/StreamingPolicyRules.jsx";
import Backoffice from "./page/Backoffice.jsx";
// import Login from "./page/Login.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/country-rules" element={<CountryRules />} />
      <Route path="/activity-rules-view" element={<ActivityRulesView />} />
      <Route path="/activity-rules" element={<ActivityRules />} />
      <Route path="/safezone-rules" element={<Safezone />} />
      <Route path="/roleplay-rules" element={<RoleplayRules />} />
      <Route path="/police-rules" element={<PoliceRules />} />
      <Route path="/doctor-rules" element={<DoctorRules />} />
      <Route path="/terms-rules" element={<TermsRules />} />
      <Route path="/refund-rules" element={<RefundRules />} />
      <Route path="/streaming-policy-rules" element={<StreamingPolicy />} />
      <Route path="/backoffice" element={<Backoffice />} />
      {/* <Route path="/login" element={<Login />} /> */}
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;