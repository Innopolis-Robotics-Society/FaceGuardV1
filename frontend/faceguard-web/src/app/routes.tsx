import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/pages/Dashboard";
import { LiveCamera } from "./components/pages/LiveCamera";
import { People } from "./components/pages/People";
import { PersonProfile } from "./components/pages/PersonProfile";
import { AccessLogs } from "./components/pages/AccessLogs";
import { System } from "./components/pages/System";
import { Settings } from "./components/pages/Settings";
import { LoginPage } from "./components/auth/LoginPage";
import { RegisterPage } from "./components/auth/RegisterPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/register",
    Component: RegisterPage,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: Dashboard },
      { path: "camera", Component: LiveCamera },
      { path: "people", Component: People },
      { path: "people/:id", Component: PersonProfile },
      { path: "logs", Component: AccessLogs },
      { path: "system", Component: System },
      { path: "settings", Component: Settings },
    ],
  },
]);
