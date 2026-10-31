import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Chat from "./pages/Chat";
import Developer from "./pages/Developer";
import NotFound from "./pages/NotFound";
import "./App.css";
import "./Chat.css";
import "./Developer.css";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/features" element={<Index />} />
          <Route path="/download" element={<Index />} />
          <Route path="/docs" element={<Index />} />
          <Route path="/faq" element={<Index />} />
          <Route path="/privacy" element={<Index />} />
          <Route path="/open-source" element={<Index />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/developer" element={<Developer />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
