import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Index from "@/pages/Index";
import Admin from "@/pages/Admin";
import Replaced from "@/pages/Replaced";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/replaced" element={<Replaced />} />
        <Route path="*" element={<Index />} />
      </Routes>
      <Toaster theme="dark" position="top-center" />
    </BrowserRouter>
  );
}