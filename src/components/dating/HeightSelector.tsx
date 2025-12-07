"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeightSelectorProps {
  value: number; // Height in inches
  onChange: (heightInInches: number) => void;
  label?: string;
  required?: boolean;
  error?: boolean;
  className?: string;
}

// Generate height options from 3'0" (36 inches) to 7'11" (95 inches)
const generateHeightOptions = () => {
  const options: { label: string; value: number }[] = [];
  for (let feet = 3; feet <= 7; feet++) {
    for (let inches = 0; inches <= 11; inches++) {
      const totalInches = feet * 12 + inches;
      options.push({
        label: `${feet}'${inches}"`,
        value: totalInches,
      });
    }
  }
  return options;
};

const HEIGHT_OPTIONS = generateHeightOptions();

export default function HeightSelector({
  value,
  onChange,
  label = "Height",
  required = false,
  error = false,
  className = "",
}: HeightSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedHeight = HEIGHT_OPTIONS.find((opt) => opt.value === value);
  const displayValue = selectedHeight ? selectedHeight.label : "";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (heightValue: number) => {
    onChange(heightValue);
    setIsOpen(false);
  };

  const isDarkTheme = className.includes("bg-gray");

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className={`block text-sm font-semibold mb-2 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full justify-between text-sm h-11 ${error ? "border-red-500" : ""} ${
          isDarkTheme 
            ? "bg-gray-900 border-gray-700 text-white hover:bg-gray-800" 
            : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
        }`}
      >
        <span className={`text-sm ${!displayValue ? "text-gray-400" : isDarkTheme ? "text-white" : "text-gray-900"}`}>
          {displayValue || "Select height"}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform text-gray-500 ${isOpen ? "rotate-180" : ""}`} />
      </Button>
      
      {isOpen && (
        <div className={`absolute z-50 w-full mt-1 border rounded-lg shadow-lg max-h-64 overflow-y-auto ${
          isDarkTheme 
            ? "bg-gray-900 border-gray-700" 
            : "bg-white border-gray-300"
        }`}>
          {HEIGHT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                isDarkTheme
                  ? value === option.value
                    ? "bg-purple-900 text-purple-200 font-semibold"
                    : "text-gray-200 hover:bg-gray-800"
                  : value === option.value
                    ? "bg-purple-50 text-purple-700 font-semibold"
                    : "text-gray-900 hover:bg-gray-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

