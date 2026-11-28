export const CLIENT_TYPES = ["Citizen", "Business", "Government (Employee or another agency)"];
export const SEX = ["Male", "Female"];

export const CC1 = [
  "1. I know what a CC is and I saw this office's CC.",
  "2. I know what a CC is but I did NOT see this office's CC.",
  "3. I learned of the CC only when I saw this office's CC.",
  "4. I do not know what a CC is and I did not see one in this office.",
];
export const CC2 = ["1. Easy to see", "2. Somewhat easy to see", "3. Difficult to see", "4. Not visible at all", "5. N/A"];
export const CC3 = ["1. Helped very much", "2. Somewhat helped", "3. Did not help", "4. N/A"];

export const SCALE = [
  ["Strongly", "Disagree"],
  ["Disagree"],
  ["Neither Agree", "nor Disagree"],
  ["Agree"],
  ["Strongly", "Agree"],
  ["N/A", "Not Applicable"],
];

export const SQD = [
  "I am satisfied with the service that I availed.",
  "I spent a reasonable amount of time for my transaction.",
  "The office followed the transaction's requirements and steps based on the information provided.",
  "The steps (including payment) I needed to do for my transaction were easy and simple.",
  "I easily found information about my transaction from the office or its website.",
  "I paid a reasonable amount of fees for my transaction.",
  'I feel the office was fair to everyone, or "walang palakasan", during my transaction.',
  "I was treated courteously by the staff, and (if asked for help) the staff was helpful.",
  "I got what I needed from the government office, or (if denied) denial of request was sufficiently explained to me.",
];

export const EMPTY_FORM = {
  clientType: "",
  date: "",
  sex: "",
  age: "",
  region: "",
  service: "",
  cc1: "",
  cc2: "",
  cc3: "",
  suggestions: "",
};
