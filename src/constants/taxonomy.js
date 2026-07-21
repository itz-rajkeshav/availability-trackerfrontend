// mirrors the backend's taxonomy.js - backend re-validates all of it, this copy
// is just here so the pickers have something to render

export const CALL_TYPES = ["RESUME_REVAMP", "JOB_MARKET_GUIDANCE", "MOCK_INTERVIEW"];

export const CALL_TYPE_LABELS = {
  RESUME_REVAMP: "Resume Revamp",
  JOB_MARKET_GUIDANCE: "Job Market Guidance",
  MOCK_INTERVIEW: "Mock Interview",
};

export const CALL_TYPE_BLURB = {
  RESUME_REVAMP: "Get your resume rewritten around impact by someone who has screened for big tech.",
  JOB_MARKET_GUIDANCE: "Talk through positioning, levelling and negotiation with a strong communicator.",
  MOCK_INTERVIEW: "A realistic interview with a mentor working in your own domain.",
};

// shown to the admin so it's clear why the ranking looks the way it does
export const CALL_TYPE_INTENT = {
  RESUME_REVAMP: "Prioritises mentors from big tech",
  JOB_MARKET_GUIDANCE: "Prioritises strong communicators",
  MOCK_INTERVIEW: "Prioritises same-domain mentors",
};

export const DOMAINS = ["Frontend", "Backend", "Data & ML", "DevOps & SRE", "Product", "Design"];

export const MENTOR_TAGS = [
  "Tech",
  "Non-tech",
  "Big company",
  "Public company",
  "India",
  "Ireland",
  "Senior Developer",
  "Good communication",
];

export const USER_TAGS = ["Tech", "Non-tech", "Good communication", "Asks a lot of questions"];

export const REQUEST_STATUS_LABELS = {
  PENDING: "Pending",
  SCHEDULED: "Scheduled",
  CANCELLED: "Cancelled",
};
