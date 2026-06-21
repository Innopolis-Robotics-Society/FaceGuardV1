import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "./routes.tsx";
import { AuthProvider } from "../contexts/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
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
      </AuthProvider>
    </QueryClientProvider>
  );
}
