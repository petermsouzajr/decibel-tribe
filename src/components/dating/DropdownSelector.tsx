"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: boolean;
  className?: string;
}

export default function DropdownSelector({
  value,
  onChange,
  options,
  label,
  placeholder = "Select option",
  required = false,
  error = false,
  className = "",
}: DropdownSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : "";

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

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
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
          {displayValue || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform text-gray-500 ${isOpen ? "rotate-180" : ""}`} />
      </Button>
      
      {isOpen && (
        <div className={`absolute z-50 w-full mt-1 border rounded-lg shadow-lg max-h-64 overflow-y-auto ${
          isDarkTheme 
            ? "bg-gray-900 border-gray-700" 
            : "bg-white border-gray-300"
        }`}>
          {options.map((option) => (
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

