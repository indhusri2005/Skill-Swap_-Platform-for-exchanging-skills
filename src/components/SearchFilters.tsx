import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Search, Filter, X, Star, Clock, MapPin } from "lucide-react";
import { useState } from "react";

interface SearchFiltersProps {
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: FilterState) => void;
  showLocationFilter?: boolean;
  showRatingFilter?: boolean;
  showPriceFilter?: boolean;
  placeholder?: string;
}

interface FilterState {
  category: string;
  location: string;
  rating: number[];
  priceRange: number[];
  duration: string;
  availability: string;
  level: string;
  language: string;
}

const SearchFilters = ({
  onSearch,
  onFilterChange,
  showLocationFilter = true,
  showRatingFilter = true,
  showPriceFilter = false,
  placeholder = "Search skills, mentors, or topics..."
}: SearchFiltersProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    category: "",
    location: "",
    rating: [0],
    priceRange: [0, 100],
    duration: "",
    availability: "",
    level: "",
    language: ""
  });

  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const categories = [
    "Programming", "Design", "Business", "Languages", "Music", "Photography",
    "Writing", "Marketing", "Data Science", "Fitness", "Cooking", "Art"
  ];

  const durations = [
    { value: "30min", label: "30 minutes" },
    { value: "1hour", label: "1 hour" },
    { value: "2hours", label: "2 hours" },
    { value: "3hours+", label: "3+ hours" }
  ];

  const levels = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
    { value: "expert", label: "Expert" }
  ];

  const languages = [
    "English", "Spanish", "French", "German", "Italian", "Portuguese",
    "Chinese", "Japanese", "Korean", "Russian", "Arabic", "Hindi"
  ];

  const handleSearch = () => {
    onSearch?.(searchQuery);
  };

  const handleFilterUpdate = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);

    // Add to active filters if not empty
    if (value && value !== "" && value !== 0) {
      if (!activeFilters.includes(key)) {
        setActiveFilters([...activeFilters, key]);
      }
    } else {
      setActiveFilters(activeFilters.filter(f => f !== key));
    }
  };

  const clearFilter = (filterKey: string) => {
    const resetValue = filterKey === "rating" ? [0] : filterKey === "priceRange" ? [0, 100] : "";
    handleFilterUpdate(filterKey as keyof FilterState, resetValue);
  };

  const clearAllFilters = () => {
    const resetFilters: FilterState = {
      category: "",
      location: "",
      rating: [0],
      priceRange: [0, 100],
      duration: "",
      availability: "",
      level: "",
      language: ""
    };
    setFilters(resetFilters);
    setActiveFilters([]);
    onFilterChange?.(resetFilters);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Search & Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={placeholder}
            className="pl-10 pr-4"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button
            size="sm"
            onClick={handleSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
          >
            Search
          </Button>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Active Filters:</Label>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filterKey) => (
                <Badge key={filterKey} variant="secondary" className="flex items-center gap-1">
                  {filterKey}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => clearFilter(filterKey)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              <Button size="sm" variant="outline" onClick={clearAllFilters}>
                Clear All
              </Button>
            </div>
          </div>
        )}

        <Separator />

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Category Filter */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select 
              value={filters.category} 
              onValueChange={(value) => handleFilterUpdate("category", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category.toLowerCase()}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location Filter */}
          {showLocationFilter && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              <Input
                placeholder="City or country"
                value={filters.location}
                onChange={(e) => handleFilterUpdate("location", e.target.value)}
              />
            </div>
          )}

          {/* Duration Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Session Duration
            </Label>
            <Select 
              value={filters.duration} 
              onValueChange={(value) => handleFilterUpdate("duration", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any duration</SelectItem>
                {durations.map((duration) => (
                  <SelectItem key={duration.value} value={duration.value}>
                    {duration.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Experience Level */}
          <div className="space-y-2">
            <Label>Experience Level</Label>
            <Select 
              value={filters.level} 
              onValueChange={(value) => handleFilterUpdate("level", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any level</SelectItem>
                {levels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Language Filter */}
          <div className="space-y-2">
            <Label>Language</Label>
            <Select 
              value={filters.language} 
              onValueChange={(value) => handleFilterUpdate("language", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any language</SelectItem>
                {languages.map((language) => (
                  <SelectItem key={language} value={language.toLowerCase()}>
                    {language}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Availability */}
          <div className="space-y-2">
            <Label>Availability</Label>
            <Select 
              value={filters.availability} 
              onValueChange={(value) => handleFilterUpdate("availability", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any time</SelectItem>
                <SelectItem value="weekdays">Weekdays</SelectItem>
                <SelectItem value="weekends">Weekends</SelectItem>
                <SelectItem value="mornings">Mornings</SelectItem>
                <SelectItem value="afternoons">Afternoons</SelectItem>
                <SelectItem value="evenings">Evenings</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Rating Filter */}
        {showRatingFilter && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Minimum Rating: {filters.rating[0]}+
            </Label>
            <Slider
              value={filters.rating}
              onValueChange={(value) => handleFilterUpdate("rating", value)}
              max={5}
              min={0}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>0</span>
              <span>5</span>
            </div>
          </div>
        )}

        {/* Price Range Filter */}
        {showPriceFilter && (
          <div className="space-y-2">
            <Label>
              Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
            </Label>
            <Slider
              value={filters.priceRange}
              onValueChange={(value) => handleFilterUpdate("priceRange", value)}
              max={200}
              min={0}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>$0</span>
              <span>$200+</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SearchFilters;
