import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/hooks/use-auth";
import { LocaleProvider } from "@/hooks/use-locale";
import { Toaster } from "@/components/ui/toaster";
import * as serviceWorkerRegistration from './service-worker-registration';

ReactDOM.createRoot(document.getElementById("root")!).render(
  // Removing StrictMode as it causes hooks to run twice, which can lead to issues
  // with authentication and WebSocket connections
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LocaleProvider>
        <App />
        <Toaster />
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </LocaleProvider>
    </AuthProvider>
  </QueryClientProvider>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register();