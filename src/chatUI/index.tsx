
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@/components/theme-provider';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import ChatWindow from './ChatWindow';
import '../index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="chat-theme">
      <TooltipProvider>
        <ChatWindow />
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </ThemeProvider>
  </React.StrictMode>
);
