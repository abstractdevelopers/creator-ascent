import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Index from "@/pages/Index";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="*" element={<Index />} />
      </Routes>
      <Toaster theme="dark" position="top-center" />
    </BrowserRouter>
  );
}