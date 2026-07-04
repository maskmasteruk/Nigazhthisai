import { AdminRoute } from '../types/admin';

export const DAYS_OF_WEEK = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY'
] as const;

export type DayOfWeek = typeof DAYS_OF_WEEK[number];

/**
 * Automatically selects the correct route stops based on the current day or a specific date.
 * Priority: 
 * 1. Special Date Overrides (Festivals/Events)
 * 2. Day of Week Schedules (Monday-Sunday)
 * 3. Default Stops Architecture
 */
export const getEffectiveRouteStops = (route: AdminRoute, date: Date = new Date()): string[] => {
  const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const dayOfWeek = DAYS_OF_WEEK[date.getDay()];

  // 1. Check for Special Overrides
  if (route.special_overrides?.[dateString]) {
    return route.special_overrides[dateString];
  }

  // 2. Check for Day-specific schedules
  if (route.day_schedules?.[dayOfWeek]) {
    return route.day_schedules[dayOfWeek];
  }

  // 3. Fallback to Default Stops
  return route.stops || [];
};

export const getCurrentDayName = (date: Date = new Date()): DayOfWeek => {
  return DAYS_OF_WEEK[date.getDay()];
};
