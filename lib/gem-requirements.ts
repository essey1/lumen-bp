// GEM Model Requirements for Berea College
// Based on the new curriculum (not old general curriculum)

import type { GEMRequirements } from "./types";

export const GEM_REQUIREMENTS: GEMRequirements = {
  learningInquiryCore: {
    explorations: 1,
    discoveries: 1,
    intersectionalJustice: 1,
    globalIssues: 1,
  },
  waysOfKnowing: {
    appliedStudies: 1,
    creativeArts: 1,
    culturalEthnicStudies: 1,
    humanities: 1,
    quantitativeReasoning: 1,
    naturalScience: 2,
    socialScience: 1,
  },
  richnesses: {
    internationallyRich: 1,
    quantitativelyRich: 1,
    writingRich: 2,
  },
   values: {
    beyondTheBorders: 1,
    holisticWellness: 1,
    powerAndEquity: 1,
    seekingMeaning: 1,
    sustainability: 1,
  },
  additional: {
    ale: 1,
    physicalActivity: 2,
  },
};

// Total GEM credits calculation
// Note: Many courses can fulfill multiple requirements (Ways of Knowing + Value + Richness)
// So the actual credit count is less than the sum of requirements
export const calculateMinGEMCredits = (): number => {
  // Learning & Inquiry Core: 4 credits (cannot overlap)
  const coreCredits = 4;

  // Ways of Knowing: ~8 credits (Natural Science requires 2)
  // But these overlap with Values and Richnesses
  const waysOfKnowingCredits = 8;

  // Richnesses overlay with Ways of Knowing (Writing requires 2)
  // These don't add extra credits

  // Additional: ALE (1) + Physical Activity (2) = 3 credits
  const additionalCredits = 3;

  // Estimated minimum GEM credits accounting for overlaps
  return coreCredits + waysOfKnowingCredits + additionalCredits; // ~15 credits
};

// GEM requirement labels for display
// L&I (Learning & Inquiry) replaced old GSTRs
// L&I 100 prereq for L&I 200, L&I 200 prereq for L&I 300
// L&I 100, 200 = Freshman only
// L&I 300 = Sophomore or Junior
// L&I 400 = Senior only
export const GEM_LABELS = {
  learningInquiryCore: {
    explorations: "L&I 100: Explorations",
    discoveries: "L&I 200: Discoveries",
    intersectionalJustice: "L&I 300: Intersectional Justice in U.S.",
    globalIssues: "L&I 400: Global Issues",
  },
  waysOfKnowing: {
    appliedStudies: "WoK: Applied Studies",
    creativeArts: "WoK: Creative Arts",
    culturalEthnicStudies: "WoK: Cultural & Ethnic Studies",
    humanities: "WoK: Humanities",
    quantitativeReasoning: "WoK: Quantitative Reasoning",
    naturalScience: "WoK: Natural Science (2 required)",
    socialScience: "WoK: Social Science",
  },
  richnesses: {
    internationallyRich: "Richness: Internationally Rich",
    quantitativelyRich: "Richness: Quantitatively Rich",
    writingRich: "Richness: Writing (2 required)",
  },
  additional: {
    ale: "ALE (Academic Life Experience)",
    physicalActivity: "Physical Activity (2 required)",
  },
};
