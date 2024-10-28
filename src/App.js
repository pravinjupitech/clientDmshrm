import React, { useEffect, useState } from "react";
import SignUpForm from "./components/SignUpForm";
import Loginform from "./components/Loginform";
// App Pages start
import AppLoginForm from "./components/Applogin/AppLoginForm";
import AppHomePage from "./components/Applogin/AppHomePage";
// App Pages End

import ApplicationRegister from "./components/ApplicationRegister";
import { Route, Routes } from "react-router-dom";
import Splashscreen from "./components/Splashscreen";
import Home from "./components/Home";
import AttendanceList from "./components/AttendanceList";
import NewattenList from "./components/NewattenList";
import Capture1 from "./components/Capture1";
import Header from "../src/components/Header";
import Capture2 from "./components/Capture2";
import Logs from "./components/Logs";
const App = () => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  }, []);

  return (
    <>
      <div className="container-fluid">
        {/* <Header /> */}
        <Routes>
          {loading ? (
            <Route path="/" element={<Splashscreen />} />
          ) : (
            <>
              <Route path="/" element={<Loginform />} />
              <Route
                path="/ApplicationRegister"
                element={<ApplicationRegister />}
              />
              <Route path="/login" element={<Loginform />} />
              <Route path="/Applogin" element={<AppLoginForm />} />
              <Route path="/AppHomePage" element={<AppHomePage />} />
              <Route path="/signup" element={<SignUpForm />} />
              <Route path="/home" element={<Home />} />
              <Route path="/attendancelist" element={<AttendanceList />} />
              <Route path="/attenlist" element={<NewattenList />} />
              <Route path="/Logs" element={<Logs />} />
              <Route
                path="/capture1"
                element={
                  <React.StrictMode>
                    <Capture1 />
                  </React.StrictMode>
                }
              />
              <Route path="/capture2" element={<Capture2 />} />
            </>
          )}
        </Routes>
      </div>
    </>
  );
};

export default App;
