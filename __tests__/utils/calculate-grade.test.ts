import calculateGrade from "@/lib/utils/calculate-grade";

describe("calculateGrade", () => {
  // Mock the current date to ensure consistent test results
  const mockDate = new Date("2025-01-01");
  const originalDate = Date;

  beforeAll(() => {
    // @ts-ignore
    global.Date = class extends Date {
      constructor(...args: any[]) {
        if (args.length === 0) {
          // @ts-ignore
          super(mockDate);
        } else {
          // @ts-ignore
          super(...args);
        }
      }
      static now() {
        return mockDate.getTime();
      }
    };
  });

  afterAll(() => {
    global.Date = originalDate;
  });

  describe("Testing years 2015-2024", () => {
    it("should show grade calculations for birth years 2015-2024", () => {
      console.log("\n=== Grade Calculations for Birth Years 2015-2024 (Current Year: 2025) ===\n");
      
      for (let year = 2015; year <= 2024; year++) {
        const birthday = new Date(`${year}-06-28`);
        const grade = calculateGrade(birthday);
        const age = 2025 - year;
        console.log(`Birth Year: ${year} | Age in 2025: ${age} | Grade: ${grade}`);
      }
      
      console.log("\n=== End of Grade Calculations ===\n");
      
      // Add specific assertions to verify the calculations
      expect(calculateGrade(new Date("2015-06-28"))).toBe("Grade 4"); // Age 10
      expect(calculateGrade(new Date("2016-06-28"))).toBe("Grade 3"); // Age 9
      expect(calculateGrade(new Date("2017-06-28"))).toBe("Grade 2"); // Age 8
      expect(calculateGrade(new Date("2018-06-28"))).toBe("Grade 1"); // Age 7
      expect(calculateGrade(new Date("2019-06-28"))).toBe("Kinder"); // Age 6
      expect(calculateGrade(new Date("2020-06-28"))).toBe("Kinder"); // Age 5
      expect(calculateGrade(new Date("2021-06-28"))).toBe("Kinder"); // Age 4
      expect(calculateGrade(new Date("2022-06-28"))).toBe("Kinder"); // Age 3
      expect(calculateGrade(new Date("2023-06-28"))).toBe("Kinder"); // Age 2
      expect(calculateGrade(new Date("2024-06-28"))).toBe("Kinder"); // Age 1
    });
  });

  describe("with null birthday", () => {
    it("should return N/A when birthday is null", () => {
      expect(calculateGrade(null)).toBe("N/A");
    });
  });

  describe("with birthday 2018-06-28", () => {
    it("should calculate grade correctly for someone born in 2018 (7 years old in 2025)", () => {
      const birthday = new Date("2018-06-28");
      // Born in 2018, so in 2025 they are 7 years old (2025 - 2018 = 7)
      // Age 7 = Grade 1
      expect(calculateGrade(birthday)).toBe("Grade 1");
    });
  });

  describe("age-based grade calculations", () => {
    it("should return 'Kinder' for children under 7", () => {
      expect(calculateGrade(new Date("2019-01-01"))).toBe("Kinder"); // 6 years old
      expect(calculateGrade(new Date("2020-01-01"))).toBe("Kinder"); // 5 years old
      expect(calculateGrade(new Date("2021-01-01"))).toBe("Kinder"); // 4 years old
    });

    it("should return correct grade for ages 7-18", () => {
      expect(calculateGrade(new Date("2018-01-01"))).toBe("Grade 1"); // 7 years old
      expect(calculateGrade(new Date("2017-01-01"))).toBe("Grade 2"); // 8 years old
      expect(calculateGrade(new Date("2016-01-01"))).toBe("Grade 3"); // 9 years old
      expect(calculateGrade(new Date("2015-01-01"))).toBe("Grade 4"); // 10 years old
      expect(calculateGrade(new Date("2014-01-01"))).toBe("Grade 5"); // 11 years old
      expect(calculateGrade(new Date("2013-01-01"))).toBe("Grade 6"); // 12 years old
      expect(calculateGrade(new Date("2012-01-01"))).toBe("Grade 7"); // 13 years old
      expect(calculateGrade(new Date("2011-01-01"))).toBe("Grade 8"); // 14 years old
      expect(calculateGrade(new Date("2010-01-01"))).toBe("Grade 9"); // 15 years old
      expect(calculateGrade(new Date("2009-01-01"))).toBe("Grade 10"); // 16 years old
      expect(calculateGrade(new Date("2008-01-01"))).toBe("Grade 11"); // 17 years old
      expect(calculateGrade(new Date("2007-01-01"))).toBe("Grade 12"); // 18 years old
    });

    it("should return 'Adult' for ages above 18", () => {
      expect(calculateGrade(new Date("2006-01-01"))).toBe("Adult"); // 19 years old
      expect(calculateGrade(new Date("2000-01-01"))).toBe("Adult"); // 25 years old
      expect(calculateGrade(new Date("1990-01-01"))).toBe("Adult"); // 35 years old
    });
  });

  describe("edge cases", () => {
    it("should handle birthdays at year boundaries correctly", () => {
      expect(calculateGrade(new Date("2018-12-31"))).toBe("Grade 1"); // 7 years old (2025-2018=7)
      expect(calculateGrade(new Date("2017-12-31"))).toBe("Grade 2"); // 8 years old (2025-2017=8)
    });

    it("should not consider whether birthday has passed this year", () => {
      // The function only uses year difference, not actual age calculation
      // Someone born in December 2018 is considered 7 years old in 2025 (2025-2018=7)
      expect(calculateGrade(new Date("2018-12-31"))).toBe("Grade 1");
      // Someone born in January 2018 is also considered 7 years old in 2025
      expect(calculateGrade(new Date("2018-01-01"))).toBe("Grade 1");
    });
  });
});