import { useState, useEffect, useCallback } from "react";

export interface DayHours {
  enabled: boolean;
  startTime: string; // Format: "HH:mm"
  endTime: string;   // Format: "HH:mm"
}

export interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

const STORAGE_KEY = "physio-flow-business-hours";
const SAFE_DEFAULT_START = "09:00";
const SAFE_DEFAULT_END = "17:00";

const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday: { enabled: true, startTime: SAFE_DEFAULT_START, endTime: SAFE_DEFAULT_END },
  tuesday: { enabled: true, startTime: SAFE_DEFAULT_START, endTime: SAFE_DEFAULT_END },
  wednesday: { enabled: true, startTime: SAFE_DEFAULT_START, endTime: SAFE_DEFAULT_END },
  thursday: { enabled: true, startTime: SAFE_DEFAULT_START, endTime: SAFE_DEFAULT_END },
  friday: { enabled: true, startTime: SAFE_DEFAULT_START, endTime: SAFE_DEFAULT_END },
  saturday: { enabled: false, startTime: "09:00", endTime: "14:00" },
  sunday: { enabled: false, startTime: "09:00", endTime: "14:00" },
};

// Load business hours from localStorage
const loadBusinessHours = (): BusinessHours => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all days are present
      return { ...DEFAULT_BUSINESS_HOURS, ...parsed };
    }
  } catch (error) {
    console.error("Error loading business hours:", error);
  }
  
  return DEFAULT_BUSINESS_HOURS;
};

// Save business hours to localStorage
const saveBusinessHours = (hours: BusinessHours): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hours));
  } catch (error) {
    console.error("Error saving business hours:", error);
  }
};

// Get day name from Date (returns lowercase day name)
const getDayName = (date: Date): keyof BusinessHours => {
  const day = date.getDay();
  const days: (keyof BusinessHours)[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[day];
};

const parseTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

export const useBusinessHours = () => {
  const [businessHours, setBusinessHours] = useState<BusinessHours>(loadBusinessHours);

  // Update business hours
  const updateBusinessHours = useCallback((updates: Partial<BusinessHours>) => {
    setBusinessHours((prev) => {
      const newHours = { ...prev, ...updates };
      saveBusinessHours(newHours);
      return newHours;
    });
  }, []);

  // Update a specific day
  const updateDay = useCallback((day: keyof BusinessHours, hours: DayHours) => {
    updateBusinessHours({ [day]: hours });
  }, [updateBusinessHours]);

  // Check if a time is within business hours for a given day
  const isWithinBusinessHours = useCallback((date: Date, time: string): boolean => {
    const dayName = getDayName(date);
    const dayHours = businessHours[dayName];
    
    if (!dayHours.enabled) {
      return false;
    }

    const [timeHours, timeMinutes] = time.split(":").map(Number);
    const [startHours, startMinutes] = dayHours.startTime.split(":").map(Number);
    const [endHours, endMinutes] = dayHours.endTime.split(":").map(Number);

    const timeTotal = timeHours * 60 + timeMinutes;
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;

    return timeTotal >= startTotal && timeTotal < endTotal;
  }, [businessHours]);

  // Get business hours for a specific day
  const getDayHours = useCallback((date: Date): DayHours => {
    const dayName = getDayName(date);
    return businessHours[dayName];
  }, [businessHours]);

  const getBusinessHoursRange = useCallback((): { start: string; end: string } => {
    const weekdayKeys: (keyof BusinessHours)[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];
    const enabledDays = weekdayKeys
      .map((day) => businessHours[day])
      .filter((day) => day?.enabled);

    if (!enabledDays.length) {
      return { start: SAFE_DEFAULT_START, end: SAFE_DEFAULT_END };
    }

    const start = enabledDays.reduce((earliest, day) => {
      return parseTimeToMinutes(day.startTime) < parseTimeToMinutes(earliest) ? day.startTime : earliest;
    }, enabledDays[0].startTime || SAFE_DEFAULT_START);

    const end = enabledDays.reduce((latest, day) => {
      return parseTimeToMinutes(day.endTime) > parseTimeToMinutes(latest) ? day.endTime : latest;
    }, enabledDays[0].endTime || SAFE_DEFAULT_END);

    return {
      start: start || SAFE_DEFAULT_START,
      end: end || SAFE_DEFAULT_END,
    };
  }, [businessHours]);

  return {
    businessHours,
    updateBusinessHours,
    updateDay,
    isWithinBusinessHours,
    getDayHours,
    getBusinessHoursRange,
  };
};


