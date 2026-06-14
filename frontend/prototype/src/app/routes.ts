import { createHashRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/pages/Dashboard";
import { LiveCamera } from "./components/pages/LiveCamera";
import { People } from "./components/pages/People";
import { PersonProfile } from "./components/pages/PersonProfile";
import { AccessLogs } from "./components/pages/AccessLogs";
import { System } from "./components/pages/System";
import { Settings } from "./components/pages/Settings";

export const router = createHashRouter([
  {
    path: "/",
    Component: Layout,
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
