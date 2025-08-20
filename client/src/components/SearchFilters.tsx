import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, X, Bell } from "lucide-react";
import { US_STATES_AND_TERRITORIES, JOB_CATEGORIES } from "@/utils/states";

interface SearchFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedStates: string[];
  onStatesChange: (states: string[]) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  onEmailAlert?: (filters: { states: string[], jobTypes: string[], keywords: string }) => void;
}

export const SearchFilters = ({ 
  searchTerm, 
  onSearchChange, 
  selectedStates,
  onStatesChange,
  typeFilter,
  onTypeChange,
  onEmailAlert
}: SearchFiltersProps) => {
  const [showStates, setShowStates] = useState(false);
  const [showEmailAlert, setShowEmailAlert] = useState(false);

  const handleStateToggle = (state: string) => {
    if (selectedStates.includes(state)) {
      onStatesChange(selectedStates.filter(s => s !== state));
    } else {
      onStatesChange([...selectedStates, state]);
    }
  };

  const removeState = (state: string) => {
    onStatesChange(selectedStates.filter(s => s !== state));
  };

  const clearAllFilters = () => {
    onSearchChange("");
    onStatesChange([]);
    onTypeChange("all");
  };

  const handleEmailAlert = () => {
    if (onEmailAlert) {
      const jobTypes = typeFilter === "all" ? [] : [typeFilter];
      onEmailAlert({
        states: selectedStates,
        jobTypes,
        keywords: searchTerm
      });
    }
  };

  return (
    <div className="bg-card p-4 rounded-lg shadow-card border border-border">
      <div className="space-y-3">
        {/* Search and main filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search jobs by title, organization, or keyword..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowStates(!showStates)}
              className="w-full md:w-48 justify-between"
            >
              {selectedStates.length === 0 
                ? "Select States" 
                : `${selectedStates.length} state${selectedStates.length > 1 ? 's' : ''} selected`
              }
            </Button>
            
            {showStates && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-card border border-border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                <div className="p-2">
                  <div className="text-sm font-medium mb-2">Select States/Territories:</div>
                  {US_STATES_AND_TERRITORIES.map(state => (
                    <div key={state} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={state}
                        checked={selectedStates.includes(state)}
                        onCheckedChange={() => handleStateToggle(state)}
                      />
                      <label htmlFor={state} className="text-sm cursor-pointer">{state}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <Select value={typeFilter} onValueChange={onTypeChange}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Job Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {JOB_CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected states badges */}
        {selectedStates.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Selected states:</span>
            {selectedStates.map(state => (
              <Badge key={state} variant="secondary" className="flex items-center gap-1">
                {state}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-red-500" 
                  onClick={() => removeState(state)}
                />
              </Badge>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2 justify-between">
          <div className="flex gap-2">
            {(searchTerm || selectedStates.length > 0 || typeFilter !== "all") && (
              <Button variant="ghost" onClick={clearAllFilters} className="text-sm">
                Clear all filters
              </Button>
            )}
          </div>
          
          {onEmailAlert && (
            <Button 
              onClick={handleEmailAlert}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              Get email alerts for these filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};