export interface BirthYearRange {
  minYear: number;
  maxYear: number;
}

const calculateBirthYearRangeForGrade = (grade: string): BirthYearRange | null => {
  const currentYear = new Date().getFullYear();
  
  // Parse grade string
  if (grade.toLowerCase() === "kinder") {
    // Kinder: age < 7
    // So birth years from (currentYear - 6) to currentYear
    return {
      minYear: currentYear - 6,
      maxYear: currentYear
    };
  }
  
  if (grade.toLowerCase() === "adult") {
    // Adult: age > 18
    // So birth years from 1900 to (currentYear - 19)
    return {
      minYear: 1900, // Reasonable minimum
      maxYear: currentYear - 19
    };
  }
  
  // Parse "Grade X" format
  const gradeMatch = grade.toLowerCase().match(/^grade\s*(\d+)$/);
  if (gradeMatch && gradeMatch[1]) {
    const gradeNum = parseInt(gradeMatch[1], 10);
    if (gradeNum >= 1 && gradeNum <= 12) {
      // Grade X means age = X + 6
      const age = gradeNum + 6;
      return {
        minYear: currentYear - age,
        maxYear: currentYear - age
      };
    }
  }
  
  return null;
};

export default calculateBirthYearRangeForGrade;