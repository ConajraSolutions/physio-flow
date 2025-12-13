import { useState, useEffect, useCallback } from "react";

export type TimeZoneMode = "auto" | "manual";

export interface TimeZoneSettings {
  timeZoneMode: TimeZoneMode;
  manualTimeZone: string | null;
}

const STORAGE_KEY = "physio-flow-timezone-settings";

// Get detected timezone from browser
export const getDetectedTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    // Fallback to UTC if detection fails
    return "UTC";
  }
};

// Get effective timezone based on settings
export const getEffectiveTimeZone = (settings: TimeZoneSettings): string => {
  if (settings.timeZoneMode === "auto") {
    return getDetectedTimeZone();
  }
  return settings.manualTimeZone || getDetectedTimeZone();
};

// Load settings from localStorage
const loadSettings = (): TimeZoneSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        timeZoneMode: parsed.timeZoneMode || "auto",
        manualTimeZone: parsed.manualTimeZone || null,
      };
    }
  } catch (error) {
    console.error("Error loading timezone settings:", error);
  }
  
  // Default settings
  return {
    timeZoneMode: "auto",
    manualTimeZone: null,
  };
};

// Save settings to localStorage
const saveSettings = (settings: TimeZoneSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Error saving timezone settings:", error);
  }
};

export const useTimeZoneSettings = () => {
  const [settings, setSettings] = useState<TimeZoneSettings>(loadSettings);
  const [detectedTimeZone, setDetectedTimeZone] = useState<string>(getDetectedTimeZone);

  // Update detected timezone on mount (in case it changes)
  useEffect(() => {
    setDetectedTimeZone(getDetectedTimeZone());
  }, []);

  // Get effective timezone
  const effectiveTimeZone = getEffectiveTimeZone(settings);

  // Update settings
  const updateSettings = useCallback((updates: Partial<TimeZoneSettings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...updates };
      saveSettings(newSettings);
      return newSettings;
    });
  }, []);

  // Set timezone mode
  const setTimeZoneMode = useCallback((mode: TimeZoneMode) => {
    updateSettings({ timeZoneMode: mode });
  }, [updateSettings]);

  // Set manual timezone
  const setManualTimeZone = useCallback((timeZone: string) => {
    updateSettings({ manualTimeZone: timeZone });
  }, [updateSettings]);

  return {
    settings,
    detectedTimeZone,
    effectiveTimeZone,
    setTimeZoneMode,
    setManualTimeZone,
    updateSettings,
  };
};


