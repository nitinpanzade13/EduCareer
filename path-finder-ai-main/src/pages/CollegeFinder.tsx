import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  GraduationCap, Search, MapPin, Star, TrendingUp, Filter,
  ArrowLeft, Users, IndianRupee, CheckCircle, Percent, Loader2, X, SlidersHorizontal,
  Trophy
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import Papa from "papaparse"; 
import { collegesData } from "@/data/collegesData"; 

interface PredictionRow {
  college_name: string;
  score_type: string;
  branch: string;
  min: number; 
  seat_type: string;
}

// --- HELPER: NORMALIZE STRINGS FOR ROBUST MATCHING ---
const normalizeString = (str: string) => {
  if (!str) return "";
  return str.toLowerCase()
    .replace(/b\.e\.|b\.tech|in\s|engineering|engg|charitable|trust's|trust|college|institute|of|and|&/g, "") // Remove noise words
    .replace(/[^a-z0-9]/g, "") // Remove special chars
    .trim();
};

export default function CollegeFinder() {
  // --- GENERAL SEARCH STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [showMainFilters, setShowMainFilters] = useState(false);
  
  // --- MAIN LIST FILTERS ---
  const [listState, setListState] = useState("All");
  const [listCity, setListCity] = useState("All");
  const [listBranch, setListBranch] = useState("All");
  const [listFees, setListFees] = useState("All");
  const [listRating, setListRating] = useState("All");

  // --- PREDICTOR STATE ---
  const [examScore, setExamScore] = useState("");
  const [examType, setExamType] = useState("JEE(Main)");
  const [selectedCaste, setSelectedCaste] = useState("OPEN");
  const [predictionData, setPredictionData] = useState<PredictionRow[]>([]);
  const [rawPredictions, setRawPredictions] = useState<PredictionRow[]>([]); 
  const [isPredicting, setIsPredicting] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // --- PREDICTION FILTERS (SIDEBAR) ---
  const [showPredSidebar, setShowPredSidebar] = useState(false);
  const [predState, setPredState] = useState("All");
  const [predCity, setPredCity] = useState("All");
  const [predBranch, setPredBranch] = useState("All");

  // --- COMPARE STATE ---
  const [compareList, setCompareList] = useState<typeof collegesData>([]);
  const [showCompare, setShowCompare] = useState(false);

  // --- LOAD CSV DATA ---
  useEffect(() => {
    setIsDataLoading(true);
    fetch("/college_prediction_data.csv")
      .then(response => response.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              setPredictionData(results.data as PredictionRow[]);
            }
            setIsDataLoading(false);
          },
          error: (error) => console.error("Error parsing CSV:", error)
        });
      })
      .catch(err => {
        console.error("Error fetching CSV:", err);
        setIsDataLoading(false);
      });
  }, []);

  // --- OPTIONS GENERATORS (From collegesData.ts) ---
  const uniqueStates = useMemo(() => ["All", ...new Set(collegesData.map(c => c.location.split(',')[1]?.trim()).filter(Boolean))], []);
  
  const uniqueCitiesList = useMemo(() => {
    // Return all cities available in the static data for the dropdown
    return ["All", ...new Set(collegesData.map(c => c.location.split(',')[0].trim()).filter(Boolean))];
  }, []);

  const uniqueBranches = useMemo(() => {
    const staticBranches = collegesData.flatMap(c => c.courses);
    const predictionBranches = predictionData ? predictionData.map(p => p.branch).filter(Boolean) : [];
    // Combine and sort uniquely
    const allBranches = [...new Set([...staticBranches, ...predictionBranches])];
    return ["All", ...allBranches.sort()];
  }, [predictionData]);

  // --- 1. MAIN LIST FILTER LOGIC (Static Data) ---
  const filteredMainList = useMemo(() => {
    return collegesData.filter(college => {
      const matchesSearch = college.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            college.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesState = listState === "All" || college.location.includes(listState);
      const matchesCity = listCity === "All" || college.location.includes(listCity);
      
      const matchesBranch = listBranch === "All" || college.courses.some(course => {
        return normalizeString(course).includes(normalizeString(listBranch)) || 
               normalizeString(listBranch).includes(normalizeString(course));
      });
      
      let matchesFees = true;
      if (listFees !== "All") {
        const fees = parseInt(college.fees.replace(/[₹,]/g, ''));
        if (listFees === "< 1 Lakh") matchesFees = fees < 100000;
        else if (listFees === "1 - 2 Lakhs") matchesFees = fees >= 100000 && fees <= 200000;
        else if (listFees === "2 - 4 Lakhs") matchesFees = fees > 200000 && fees <= 400000;
        else if (listFees === "> 4 Lakhs") matchesFees = fees > 400000;
      }

      let matchesRating = true;
      if (listRating !== "All") {
        const rating = parseFloat(listRating.split('+')[0]);
        matchesRating = college.rating >= rating;
      }

      return matchesSearch && matchesState && matchesCity && matchesBranch && matchesFees && matchesRating;
    });
  }, [searchQuery, listState, listCity, listBranch, listFees, listRating]);

  // --- 2. PREDICTION GENERATION LOGIC ---
  const handlePredict = () => {
    if (!examScore) return;
    setIsPredicting(true);
    
    setTimeout(() => {
      const score = parseFloat(examScore);
      const matches = predictionData.filter(college => {
        // 1. Exam Type Match
        const matchesExam = college.score_type === examType;
        
        // 2. Score Match (Standard)
        if (!college.min || !college.college_name) return false;
        const matchesScore = college.min <= score && college.min > 0;
        
        // 3. Caste Match (Robust)
        const seatStr = (college.seat_type || "OPEN").toUpperCase(); 
        let matchesCaste = false;
        if (selectedCaste === "OPEN") {
          matchesCaste = seatStr.includes("OPEN") || seatStr.includes("AI");
        } else {
          matchesCaste = seatStr.includes(selectedCaste) || seatStr.includes("OPEN");
        }

        return matchesExam && matchesScore && matchesCaste;
      });

      const sortedMatches = matches.sort((a, b) => b.min - a.min); 
      setRawPredictions(sortedMatches.slice(0, 200)); 
      setShowResults(true);
      setIsPredicting(false);
    }, 800);
  };

  // --- 3. ROBUST PREDICTION FILTER LOGIC (FIXED LOCATION) ---
  const finalPredictions = useMemo(() => {
    return rawPredictions.filter(pred => {
      const predNameRaw = (pred.college_name || "").toLowerCase();
      const predNameNormalized = normalizeString(pred.college_name);

      // Try to find full details in static data
      const staticInfo = collegesData.find(c => {
        const staticName = normalizeString(c.name);
        return staticName.includes(predNameNormalized) || predNameNormalized.includes(staticName);
      });
      
      // --- CITY MATCHING ---
      let matchesCity = true;
      if (predCity !== "All") {
         const searchCity = predCity.toLowerCase();
         if (staticInfo) {
           // Use trusted static location if available
           matchesCity = staticInfo.location.toLowerCase().includes(searchCity);
         } else {
           // Fallback: Check if CSV college name contains the city (e.g. "Alard... Pune")
           matchesCity = predNameRaw.includes(searchCity);
         }
      }

      // --- STATE MATCHING ---
      let matchesState = true;
      if (predState !== "All") {
         // CRITICAL FIX: If City was specifically matched, assume State is valid 
         // (because the User selects "Pune" knowing it is in "Maharashtra")
         if (predCity !== "All" && matchesCity) {
           matchesState = true; 
         } else {
           if (staticInfo) {
             matchesState = staticInfo.location.includes(predState);
           } else {
             // Only force string check if we don't have a City match to rely on
             matchesState = predNameRaw.includes(predState.toLowerCase());
           }
         }
      }
      
      // --- BRANCH MATCHING ---
      const matchesBranch = predBranch === "All" || (
        pred.branch && (
          normalizeString(pred.branch).includes(normalizeString(predBranch)) ||
          normalizeString(predBranch).includes(normalizeString(pred.branch))
        )
      );
      
      return matchesState && matchesCity && matchesBranch;
    });
  }, [rawPredictions, predState, predCity, predBranch]);

  // --- HELPER FUNCTIONS ---
  const addToCompare = (college: typeof collegesData[0]) => {
    if (compareList.length < 3 && !compareList.find(c => c.id === college.id)) {
      setCompareList([...compareList, college]);
    }
  };

  const removeFromCompare = (id: number) => {
    setCompareList(compareList.filter(c => c.id !== id));
  };

  const clearMainFilters = () => {
    setSearchQuery("");
    setListState("All"); setListCity("All"); setListBranch("All");
    setListFees("All"); setListRating("All");
  };

  return (
    <div className="min-h-screen bg-background pb-20 relative overflow-x-hidden">
      {/* HEADER */}
      <header className="bg-card border-b border-border sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden md:inline">Back</span>
              </Link>
              <div className="hidden md:flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">College Finder</span>
              </div>
            </div>
            {compareList.length > 0 && (
              <Button variant="hero" size="sm" onClick={() => setShowCompare(true)}>
                Compare ({compareList.length})
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Find Your <span className="text-gradient">Dream College</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Explore thousands of colleges or use our AI Predictor to find your perfect match.
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-8">
            {/* AI PREDICTOR CARD */}
            <div className="bg-card rounded-3xl p-6 md:p-8 shadow-glow border border-primary/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
              <div className="flex flex-col lg:flex-row gap-8 items-end relative z-10">
                <div className="flex-1 space-y-6 w-full">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-bold text-xl">Admission Chance Predictor</h3>
                    </div>
                    {/* FILTER BUTTON FOR PREDICTIONS */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 text-muted-foreground hover:text-primary border-dashed"
                      onClick={() => setShowPredSidebar(true)}
                    >
                      <SlidersHorizontal className="w-4 h-4" /> 
                      Refine Results
                    </Button>
                  </div>
                  
                  {/* PREDICTOR INPUTS */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div className="space-y-2">
                      <Label>Exam Type</Label>
                      <select 
                        className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary"
                        value={examType}
                        onChange={(e) => setExamType(e.target.value)}
                      >
                        <option value="JEE(Main)">JEE (Mains)</option>
                        <option value="MHT-CET">MHT-CET</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Caste Category</Label>
                      <select 
                        className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary"
                        value={selectedCaste}
                        onChange={(e) => setSelectedCaste(e.target.value)}
                      >
                        <option value="OPEN">OPEN / General</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                        <option value="EWS">EWS</option>
                        <option value="VJ">VJ / NT</option>
                      </select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Your Percentile Score</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="e.g. 85.5"
                          className="h-11 pl-4"
                          value={examScore}
                          onChange={(e) => setExamScore(e.target.value)}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="hero" 
                  className="h-11 px-8 w-full md:w-auto shadow-lg shadow-primary/20"
                  onClick={handlePredict}
                  disabled={isDataLoading || isPredicting || !examScore}
                >
                  {isDataLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 
                   isPredicting ? "Analyzing..." : 
                   <><Percent className="w-4 h-4 mr-2" /> Predict</>}
                </Button>
              </div>
            </div>

            {/* MAIN SEARCH & FILTER BAR */}
            <div className="bg-card rounded-2xl p-2 shadow-sm border border-border flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by college name (e.g. IIT Bombay)..."
                  className="pl-12 h-12 border-none shadow-none focus-visible:ring-0 bg-transparent text-lg"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowResults(false);
                  }}
                />
              </div>
              <Button 
                variant={showMainFilters ? "secondary" : "outline"} 
                className="h-12 px-6 gap-2 border-l rounded-xl md:rounded-l-none"
                onClick={() => setShowMainFilters(!showMainFilters)}
              >
                <Filter className="w-4 h-4" /> Filters
              </Button>
            </div>

            {/* EXPANDABLE MAIN FILTERS */}
            {showMainFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-6 bg-card border border-border rounded-2xl animate-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label>State</Label>
                  <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={listState} onChange={e => {setListState(e.target.value); setListCity("All");}}>
                    {uniqueStates.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={listCity} onChange={e => setListCity(e.target.value)}>
                    <option value="All">All Cities</option>
                    {/* Fixed: Populate all cities regardless of state selection to avoid locking */}
                    {uniqueCitiesList.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2"><Label>Branch</Label><select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={listBranch} onChange={e => setListBranch(e.target.value)}>{uniqueBranches.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
                <div className="space-y-2"><Label>Fees</Label><select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={listFees} onChange={e => setListFees(e.target.value)}><option value="All">Any</option><option value="< 1 Lakh">&lt; 1 Lakh</option><option value="1 - 2 Lakhs">1 - 2 Lakhs</option><option value="> 4 Lakhs">&gt; 4 Lakhs</option></select></div>
                <div className="space-y-2"><Label>Rating</Label><select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={listRating} onChange={e => setListRating(e.target.value)}><option value="All">Any</option><option value="4.0+">4.0+</option><option value="3.5+">3.5+</option></select></div>
                <div className="space-y-2 flex items-end"><Button variant="ghost" className="w-full text-destructive" onClick={clearMainFilters}>Clear All</Button></div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* RESULTS SECTION */}
      <section className="container mx-auto px-4 py-8">
        {showResults ? (
          // PREDICTION RESULTS
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6 bg-green-50/50 p-4 rounded-xl border border-green-100">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  Predicted Matches ({selectedCaste})
                </h2>
                <p className="text-sm text-green-700 mt-1">
                  Found {finalPredictions.length} matches for score <strong>{examScore}</strong>
                  {predState !== "All" && ` in ${predState}`}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowResults(false)}>Close Predictor</Button>
            </div>
            
            {finalPredictions.length > 0 ? (
              <div className="grid gap-4">
                {finalPredictions.map((college, idx) => (
                  <div key={idx} className="bg-card p-5 rounded-xl border border-border hover:border-primary transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group">
                    <div>
                      <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{college.college_name}</h3>
                      <p className="text-muted-foreground text-sm font-medium">{college.branch}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">{college.score_type}</span>
                        <span className="text-xs bg-muted text-foreground px-2.5 py-0.5 rounded-full">{college.seat_type}</span>
                      </div>
                    </div>
                    <div className="text-right min-w-[120px] bg-muted/30 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Cutoff</p>
                      <p className="text-2xl font-bold text-primary">{college.min.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-card rounded-xl border border-dashed">
                <p className="text-muted-foreground">No matches found with current filters. Try resetting the filters or lowering your requirements.</p>
              </div>
            )}
          </div>
        ) : (
          // MAIN LIST RESULTS
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Top Institutes</h2>
              <p className="text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                Showing {filteredMainList.length} results
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredMainList.map((college) => (
                <div key={college.id} className="bg-card rounded-2xl border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full group">
                  {/* College Card UI */}
                  <div className="relative h-48 overflow-hidden">
                    <img src={college.image} alt={college.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                      Rank #{college.ranking}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
                      <h3 className="text-xl font-bold text-white leading-tight">{college.name}</h3>
                      <p className="text-white/80 text-sm flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5" /> {college.location}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {college.courses.slice(0, 3).map(c => (
                        <span key={c} className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-md font-medium">{c}</span>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2 mb-6 text-sm">
                      <div><p className="text-xs text-muted-foreground">Fees</p><p className="font-semibold">{college.fees}</p></div>
                      <div><p className="text-xs text-muted-foreground">Cutoff</p><p className="font-semibold text-green-600">{college.cutoff}</p></div>
                      <div><p className="text-xs text-muted-foreground">Seats</p><p className="font-semibold">{college.seats}</p></div>
                      <div><p className="text-xs text-muted-foreground">Rating</p><p className="font-semibold text-amber-600">{college.rating} ★</p></div>
                    </div>

                    <div className="mt-auto flex gap-3">
                      <Button className="flex-1">View Details</Button>
                      <Button variant="outline" onClick={() => addToCompare(college)} disabled={compareList.some(c => c.id === college.id)}>
                        {compareList.some(c => c.id === college.id) ? "Added" : "Compare"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 🔮 PREDICTION FILTER SIDEBAR (SLIDE-OVER) */}
      {showPredSidebar && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[90]" 
            onClick={() => setShowPredSidebar(false)} 
          />
          {/* Sidebar */}
          <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-card border-l border-border z-[100] shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><SlidersHorizontal className="w-5 h-5"/> Refine Results</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowPredSidebar(false)}><X className="w-5 h-5" /></Button>
            </div>
            
            <div className="space-y-6">
              <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground mb-4">
                Refine the <strong>{rawPredictions.length}</strong> colleges found by your score.
              </div>

              <div className="space-y-2">
                <Label>State</Label>
                <select className="flex h-10 w-full rounded-md border bg-background px-3 text-sm" value={predState} onChange={e => {setPredState(e.target.value); setPredCity("All");}}>
                  {uniqueStates.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label>City</Label>
                <select className="flex h-10 w-full rounded-md border bg-background px-3 text-sm" value={predCity} onChange={e => setPredCity(e.target.value)}>
                  <option value="All">All Cities</option>
                  {/* Robust City Dropdown */}
                  {uniqueCitiesList.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Branch</Label>
                <select className="flex h-10 w-full rounded-md border bg-background px-3 text-sm" value={predBranch} onChange={e => setPredBranch(e.target.value)}>
                  {uniqueBranches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <Button className="flex-1" onClick={() => setShowPredSidebar(false)}>Apply Filters</Button>
                <Button variant="outline" className="flex-1" onClick={() => {setPredState("All"); setPredCity("All"); setPredBranch("All");}}>Reset</Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 📊 SMART COMPARE MODAL */}
      {showCompare && compareList.length > 0 && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-5 border-b border-border flex justify-between items-center bg-muted/30">
                <div>
                    <h2 className="font-bold text-xl flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary"/> Compare Institutes
                    </h2>
                    <p className="text-sm text-muted-foreground">Green highlights indicate the best metrics in each category.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowCompare(false)}><X className="w-5 h-5"/></Button>
            </div>
            
            {/* Scrollable Content */}
            <div className="p-6 overflow-auto bg-muted/5 h-full">
               <div className={`grid gap-6 min-w-[800px] ${compareList.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : compareList.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                 
                 {/* Logic to find 'Best' values for highlighting */}
                 {(() => {
                    const minFees = Math.min(...compareList.map(c => parseInt(c.fees.replace(/[^\d]/g, '')) || 0));
                    const maxRating = Math.max(...compareList.map(c => c.rating));
                    const minRank = Math.min(...compareList.map(c => c.ranking));
                    const maxCutoff = Math.max(...compareList.map(c => parseFloat(c.cutoff.replace(/[^\d.]/g, '')) || 0));

                    return compareList.map(c => {
                        const currentFees = parseInt(c.fees.replace(/[^\d]/g, '')) || 0;
                        const currentCutoff = parseFloat(c.cutoff.replace(/[^\d.]/g, '')) || 0;
                        
                        const isBestFee = currentFees === minFees;
                        const isBestRating = c.rating === maxRating;
                        const isBestRank = c.ranking === minRank;
                        const isHighestCutoff = currentCutoff === maxCutoff;

                        return (
                           <div key={c.id} className={`bg-card border-2 p-0 rounded-xl overflow-hidden flex flex-col shadow-sm transition-all relative ${isBestRank ? 'border-primary/40 shadow-md ring-1 ring-primary/20' : 'border-border'}`}>
                             
                             {/* Best Choice Badge (based on Rank) */}
                             {isBestRank && (
                                <div className="absolute top-3 left-3 z-10 bg-yellow-400 text-yellow-950 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                                    <Trophy className="w-3 h-3" /> Top Ranked
                                </div>
                             )}

                             {/* Image Header */}
                             <div className="relative h-40">
                                <img src={c.image} alt={c.name} className="w-full h-full object-cover"/>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-3 left-4 right-4">
                                    <h3 className="font-bold text-lg text-white leading-tight line-clamp-2">{c.name}</h3>
                                    <p className="text-white/80 text-xs flex items-center gap-1 mt-1"><MapPin className="w-3 h-3"/> {c.location}</p>
                                </div>
                             </div>

                             <div className="p-5 flex-1 flex flex-col gap-6">
                                {/* STATS GRID */}
                                <div className="space-y-4">
                                    {/* Row 1: Rank & Rating */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className={`p-3 rounded-lg border ${isBestRank ? 'bg-green-50 border-green-200 dark:bg-green-900/20' : 'bg-muted/30 border-transparent'}`}>
                                            <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Ranking</p>
                                            <p className={`font-bold text-lg ${isBestRank ? 'text-green-700 dark:text-green-400' : ''}`}>#{c.ranking}</p>
                                        </div>
                                        <div className={`p-3 rounded-lg border ${isBestRating ? 'bg-green-50 border-green-200 dark:bg-green-900/20' : 'bg-muted/30 border-transparent'}`}>
                                            <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Rating</p>
                                            <p className={`font-bold text-lg flex items-center gap-1 ${isBestRating ? 'text-green-700 dark:text-green-400' : ''}`}>
                                                {c.rating} <Star className={`w-4 h-4 ${isBestRating ? 'fill-green-600 text-green-600' : 'fill-amber-500 text-amber-500'}`} />
                                            </p>
                                        </div>
                                    </div>

                                    {/* Row 2: Fees & Cutoff */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className={`p-3 rounded-lg border ${isBestFee ? 'bg-green-50 border-green-200 dark:bg-green-900/20' : 'bg-muted/30 border-transparent'}`}>
                                            <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Total Fees</p>
                                            <p className={`font-bold text-lg flex items-center ${isBestFee ? 'text-green-700 dark:text-green-400' : ''}`}>
                                                <IndianRupee className="w-4 h-4"/> {c.fees}
                                            </p>
                                            {isBestFee && <span className="text-[10px] text-green-600 font-medium">Most Affordable</span>}
                                        </div>
                                        <div className={`p-3 rounded-lg border ${isHighestCutoff ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20' : 'bg-muted/30 border-transparent'}`}>
                                            <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Cutoff</p>
                                            <p className={`font-bold text-lg ${isHighestCutoff ? 'text-orange-700 dark:text-orange-400' : ''}`}>{c.cutoff}</p>
                                            {isHighestCutoff && <span className="text-[10px] text-orange-600 font-medium">High Demand</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* Comparison Dividers */}
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-2"><Users className="w-3.5 h-3.5"/> Seats & Intake</p>
                                        <div className="flex items-center justify-between text-sm bg-secondary/50 p-2 rounded-md">
                                            <span>Total Seats</span>
                                            <span className="font-mono font-bold">{c.seats}</span>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-2"><GraduationCap className="w-3.5 h-3.5"/> Top Branch</p>
                                        <div className="text-xs font-medium text-foreground bg-primary/5 p-2 rounded-md border border-primary/10">
                                            {c.courses[0]}
                                        </div>
                                    </div>
                                </div>

                                <Button variant="outline" size="sm" className="w-full mt-auto text-muted-foreground hover:text-destructive" onClick={() => removeFromCompare(c.id)}>
                                    Remove
                                </Button>
                             </div>
                           </div>
                        );
                    });
                 })()}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}