
import React from "react";
import { Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <Button 
      variant="outline" 
      size="icon"
      onClick={() => setTheme("light")}
      className="bg-white"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] text-yellow-500" />
      <span className="sr-only">Light theme</span>
    </Button>
  );
}
