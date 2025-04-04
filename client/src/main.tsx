import { createRoot } from "react-dom/client";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import App from "./App";
import { AuthProvider } from "./hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";

// Create a simple app that just renders components based on auth state
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <>
        <App />
        <Toaster />
      </>
    </AuthProvider>
  </QueryClientProvider>
);
