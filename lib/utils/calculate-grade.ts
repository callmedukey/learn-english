const calculateGrade = (birthdayDate: Date | null): string => {
  if (!birthdayDate) return "N/A";
  const today = new Date();
  const birthDate = new Date(birthdayDate);

  // Calculate age using only year difference - DO NOT account for whether birthday has passed this year
  const age = today.getFullYear() - birthDate.getFullYear();

  if (age < 7) return "Below Grade 1";
  if (age >= 7 && age <= 18) {
    return `Grade ${age - 6}`;
  }
  return "Adult";
};

export default calculateGrade;
