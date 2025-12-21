"use client";

import { useState } from "react";
import { X, Filter, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import instrumentList from "@/data/instrumentList.json";
import skillsList from "@/data/skillsList.json";

interface FilterPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: {
    preferredInstruments: string[];
    preferredSkills: string[];
  };
  onFiltersChange: (filters: {
    preferredInstruments: string[];
    preferredSkills: string[];
  }) => void;
}

export default function FilterPanel({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
}: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    onOpenChange(false);
  };

  const handleReset = () => {
    setLocalFilters({
      preferredInstruments: [],
      preferredSkills: [],
    });
  };

  const toggleInstrument = (instrument: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      preferredInstruments: prev.preferredInstruments.includes(instrument)
        ? prev.preferredInstruments.filter((i) => i !== instrument)
        : [...prev.preferredInstruments, instrument],
    }));
  };

  const toggleSkill = (skill: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      preferredSkills: prev.preferredSkills.includes(skill)
        ? prev.preferredSkills.filter((s) => s !== skill)
        : [...prev.preferredSkills, skill],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-950 border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Music className="w-5 h-5" />
            Advanced Filters - Music Preferences
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* COMMENTED OUT - Music Compatibility Filters */}
          {false && (
          <>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Music className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">
                Preferred Instruments
              </h3>
              {localFilters.preferredInstruments.length > 0 && (
                <span className="text-sm text-gray-300">
                  ({localFilters.preferredInstruments.length} selected)
                </span>
              )}
            </div>
            <div className="max-h-60 overflow-y-auto border border-gray-700 rounded-lg p-3 bg-gray-900/50">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {instrumentList.map((instrument) => (
                  <label
                    key={instrument}
                    className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-800 transition-colors ${
                      localFilters.preferredInstruments.includes(instrument)
                        ? "bg-purple-900/50 border border-purple-500"
                        : "border border-gray-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={localFilters.preferredInstruments.includes(instrument)}
                      onChange={() => toggleInstrument(instrument)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-100">{instrument}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Music className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">
                Preferred Skills
              </h3>
              {localFilters.preferredSkills.length > 0 && (
                <span className="text-sm text-gray-300">
                  ({localFilters.preferredSkills.length} selected)
                </span>
              )}
            </div>
            <div className="max-h-60 overflow-y-auto border border-gray-700 rounded-lg p-3 bg-gray-900/50">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {skillsList.map((skill) => (
                  <label
                    key={skill}
                    className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-800 transition-colors ${
                      localFilters.preferredSkills.includes(skill)
                        ? "bg-blue-900/50 border border-blue-500"
                        : "border border-gray-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={localFilters.preferredSkills.includes(skill)}
                      onChange={() => toggleSkill(skill)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-100">{skill}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          </>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={handleReset}>
              Reset Filters
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}








