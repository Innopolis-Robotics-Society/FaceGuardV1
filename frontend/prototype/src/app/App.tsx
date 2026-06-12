import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "./routes";

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1a2235",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#e2e8f0",
          },
        }}
      />
    </>
  );
}
