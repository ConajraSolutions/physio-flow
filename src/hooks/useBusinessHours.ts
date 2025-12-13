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

const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday: { enabled: true, startTime: "08:00", endTime: "17:00" },
  tuesday: { enabled: true, startTime: "08:00", endTime: "17:00" },
  wednesday: { enabled: true, startTime: "08:00", endTime: "17:00" },
  thursday: { enabled: true, startTime: "08:00", endTime: "17:00" },
  friday: { enabled: true, startTime: "08:00", endTime: "17:00" },
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

  return {
    businessHours,
    updateBusinessHours,
    updateDay,
    isWithinBusinessHours,
    getDayHours,
  };
};


