import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MainPage from "./main";
import { EditorOverlay } from "@/components/EditorOverlay";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { 
  Save, 
  RefreshCcw, 
  Languages, 
  Eye, 
  Edit3,
  CheckCircle,
  Globe,
  Home,
  AlertCircle,
  Info,
  Search,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  scanTranslationCoverage, 
  highlightMissingKeys, 
  clearHighlights,
  type ScanResult
} from "@/utils/translationScanner";

export default function TranslationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditMode, setIsEditMode] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'hy' | 'ru'>('en');
  const [previewLanguage, setPreviewLanguage] = useState<'en' | 'hy' | 'ru'>('en');
  const [isEditing, setIsEditing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showMissingKeys, setShowMissingKeys] = useState(false);

  // Scan for missing translation keys
  useEffect(() => {
    if (!isEditMode) return;
    
    const performScan = () => {
      const result = scanTranslationCoverage();
      setScanResult(result);
      
      // Log to console in development
      if (process.env.NODE_ENV === 'development' && result.missingKeys.length > 0) {
        console.group('%c⚠ Translation Coverage Scan', 'color: #f59e0b; font-weight: bold;');
        console.log(`Coverage: ${result.coveragePercentage}%`);
        console.log(`Missing keys: ${result.missingKeys.length}`);
        result.missingKeys.forEach((missing, i) => {
          console.log(`${i + 1}. "${missing.text}" in <${missing.parentTag}>`);
        });
        console.groupEnd();
      }
    };
    
    // Scan after a short delay to ensure DOM is rendered
    const timer = setTimeout(performScan, 1500);
    return () => clearTimeout(timer);
  }, [isEditMode, currentLanguage]);

  // Toggle missing keys highlighting
  useEffect(() => {
    if (showMissingKeys && scanResult) {
      highlightMissingKeys(scanResult);
    } else {
      clearHighlights();
    }
    
    return () => clearHighlights();
  }, [showMissingKeys, scanResult]);

  // Fetch translation validation status
  const { data: validationStatus } = useQuery({
    queryKey: ['translation-validation'],
    queryFn: async () => {
      const response = await fetch('/api/translations/validate');
      if (!response.ok) throw new Error('Failed to validate');
      return response.json();
    },
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Reset translations mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/translations/reset', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to reset');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translations'] });
      queryClient.invalidateQueries({ queryKey: ['live-translations'] });
      queryClient.invalidateQueries({ queryKey: ['translation-validation'] });
      toast({
        title: "Translations reset",
        description: "All translations restored to defaults",
      });
      // Force page reload to show updated translations
      window.location.reload();
    }
  });

  const coverage = validationStatus?.isComplete ? 100 : 
    validationStatus ? Math.round((validationStatus.totalKeys - 
      Object.values(validationStatus.missing || {}).flat().length - 
      Object.values(validationStatus.empty || {}).reduce((a: number, b: any) => a + (typeof b === 'number' ? b : 0), 0)) / 
      validationStatus.totalKeys * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Editor overlay - only active in edit mode */}
      <EditorOverlay 
        enabled={isEditMode}
        currentLanguage={currentLanguage}
        onEditStart={() => setIsEditing(true)}
        onEditEnd={() => setIsEditing(false)}
      />

      {/* Fixed header with controls */}
      <div className="sticky top-0 z-[90] bg-white border-b shadow-md">
        <div className="max-w-full px-4 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Languages className="w-7 h-7 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  Translation Editor
                  <Link href="/platform">
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Home className="w-4 h-4" />
                      Dashboard
                    </Button>
                  </Link>
                </h1>
                <p className="text-xs text-gray-600">
                  Live DOM-based translation editing • {validationStatus?.totalKeys || 0} keys • {coverage}% coverage
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Edit mode toggle */}
              <Button
                variant={isEditMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsEditMode(!isEditMode)}
                className="gap-2"
                disabled={isEditing}
              >
                {isEditMode ? <><Eye className="w-4 h-4" /> Preview</> : <><Edit3 className="w-4 h-4" /> Edit</>}
              </Button>

              {/* Language selector for editing */}
              {isEditMode && (
                <Select value={currentLanguage} onValueChange={(v: any) => setCurrentLanguage(v)}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">
                      🇬🇧 English
                      {validationStatus?.missing?.en && validationStatus.missing.en.length > 0 && (
                        <span className="ml-2 text-xs text-red-500">
                          ({validationStatus.missing.en.length} missing)
                        </span>
                      )}
                    </SelectItem>
                    <SelectItem value="hy">
                      🇦🇲 Armenian
                      {validationStatus?.missing?.hy && validationStatus.missing.hy.length > 0 && (
                        <span className="ml-2 text-xs text-red-500">
                          ({validationStatus.missing.hy.length} missing)
                        </span>
                      )}
                    </SelectItem>
                    <SelectItem value="ru">
                      🇷🇺 Russian
                      {validationStatus?.missing?.ru && validationStatus.missing.ru.length > 0 && (
                        <span className="ml-2 text-xs text-red-500">
                          ({validationStatus.missing.ru.length} missing)
                        </span>
                      )}
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* Preview language selector */}
              <Select value={previewLanguage} onValueChange={(v: any) => setPreviewLanguage(v)}>
                <SelectTrigger className="w-[140px] h-9">
                  <Globe className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">Preview: EN</SelectItem>
                  <SelectItem value="hy">Preview: HY</SelectItem>
                  <SelectItem value="ru">Preview: RU</SelectItem>
                </SelectContent>
              </Select>

              {/* Scan missing keys button */}
              {isEditMode && scanResult && (
                <Button
                  variant={scanResult.missingKeys.length > 0 ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setShowMissingKeys(!showMissingKeys)}
                  className="gap-2"
                >
                  {showMissingKeys ? <XCircle className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                  {scanResult.missingKeys.length > 0 
                    ? `${scanResult.missingKeys.length} Missing` 
                    : 'All Covered'}
                </Button>
              )}

              {/* Reset button */}
              <Button
                onClick={() => {
                  if (confirm('Reset all translations to defaults? This cannot be undone.')) {
                    resetMutation.mutate();
                  }
                }}
                variant="destructive"
                size="sm"
                className="gap-2"
                disabled={resetMutation.isPending}
              >
                <RefreshCcw className="w-4 h-4" />
                Reset
              </Button>
            </div>
          </div>

          {/* Coverage scan results */}
          {scanResult && scanResult.coveragePercentage < 100 && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-600 font-medium">
                DOM Scan: {scanResult.coveragePercentage}% coverage • {scanResult.missingKeys.length} elements without data-i18n-key
              </span>
            </div>
          )}

          {scanResult && scanResult.coveragePercentage === 100 && (
            <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">DOM Scan: 100% coverage ✓ All text elements have translation keys</span>
            </div>
          )}

          {/* Validation status bar */}
          {validationStatus && !validationStatus.isComplete && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <span className="text-orange-600">
                {Object.values(validationStatus.missing || {}).flat().length} missing keys,{' '}
                {Object.values(validationStatus.empty || {}).reduce((a: number, b: any) => a + (typeof b === 'number' ? b : 0), 0)} empty values
              </span>
            </div>
          )}

          {validationStatus && validationStatus.isComplete && (
            <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>All translations complete ✓</span>
            </div>
          )}
        </div>
      </div>

      {/* Main preview area - renders the REAL main page */}
      <div className="max-w-full mx-auto">
        <div className={isEditMode ? "ring-4 ring-inset ring-blue-400 ring-opacity-30" : ""}>
          <MainPage />
        </div>
      </div>

      {/* Instructions overlay */}
      {isEditMode && !isEditing && (
        <Card className="fixed bottom-6 right-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white p-5 max-w-sm z-50 border-0 shadow-2xl">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-bold mb-2">Edit Mode Active</h3>
              <ul className="text-sm space-y-1.5 opacity-90">
                <li>• Hover over text to highlight</li>
                <li>• Click any text to edit inline</li>
                <li>• <kbd className="px-1 bg-white/20 rounded">Enter</kbd> to save, <kbd className="px-1 bg-white/20 rounded">Esc</kbd> to cancel</li>
                <li>• Select language before editing</li>
                <li>• Changes save automatically</li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}


