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
    quantitativeFocus: 1,
    naturalScience: 2,
    socialScience: 1,
  },
  richnesses: {
    international: 1,
    quantitative: 1,
    writing: 2,
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
export const GEM_LABELS = {
  learningInquiryCore: {
    explorations: "LIC 1: Explorations",
    discoveries: "LIC 2: Discoveries",
    intersectionalJustice: "LIC 3: Intersectional Justice in U.S.",
    globalIssues: "LIC 4: Global Issues",
  },
  waysOfKnowing: {
    appliedStudies: "WoK: Applied Studies",
    creativeArts: "WoK: Creative Arts",
    culturalEthnicStudies: "WoK: Cultural & Ethnic Studies",
    humanities: "WoK: Humanities",
    quantitativeFocus: "WoK: Quantitative Focus",
    naturalScience: "WoK: Natural Science (2 required)",
    socialScience: "WoK: Social Science",
  },
  richnesses: {
    international: "Richness: International",
    quantitative: "Richness: Quantitative",
    writing: "Richness: Writing (2 required)",
  },
  additional: {
    ale: "ALE (Academic Life Experience)",
    physicalActivity: "Physical Activity (2 required)",
  },
};
