// Standalone version of medal queries without Next.js dependencies
import { addMonths } from "date-fns";
import { toZonedTime } from "date-fns-tz";

import { APP_TIMEZONE } from "@/lib/constants/timezone";

export function getCurrentKoreaYearMonth() {
  const nowKST = toZonedTime(new Date(), APP_TIMEZONE);
  return {
    year: nowKST.getFullYear(),
    month: nowKST.getMonth() + 1, // JavaScript months are 0-indexed
  };
}

export function getPreviousKoreaYearMonth() {
  const nowKST = toZonedTime(new Date(), APP_TIMEZONE);
  const prevMonth = addMonths(nowKST, -1);
  return {
    year: prevMonth.getFullYear(),
    month: prevMonth.getMonth() + 1, // JavaScript months are 0-indexed
  };
}
