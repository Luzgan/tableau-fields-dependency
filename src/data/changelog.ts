export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
  type: "feature" | "fix" | "improvement";
}

export const changelogData: ChangelogEntry[] = [
  {
    version: "1.1.5",
    date: "2025-09-07",
    type: "improvement",
    changes: [
      "Fixed fields list layout issues when the screen is too narrow or text is too long",
    ],
  },
  {
    version: "1.1.4",
    date: "2025-06-29",
    type: "improvement",
    changes: [
      "Removed calculation with internal names, to clarify the visibility of the calculation",
    ],
  },
  {
    version: "1.1.3",
    date: "2025-06-25",
    type: "improvement",
    changes: ["Added footer with author information"],
  },
  {
    version: "1.1.2",
    date: "2025-06-22",
    type: "improvement",
    changes: ["Changed the name to fit the domain name"],
  },
  {
    version: "1.1.1",
    date: "2025-06-20",
    type: "fix",
    changes: ["Fixed issue with calculation nodes - groups"],
  },
  {
    version: "1.1.0",
    date: "2025-06-15",
    type: "feature",
    changes: [
      "Added changelog feature",
      "Improved field visualization",
      "Added support us page for donations",
      "Added GitHub issues page",
    ],
  },
  {
    version: "1.0.0",
    date: "2025-06-15",
    type: "feature",
    changes: [
      "Initial release",
      "Support for Tableau workbook analysis",
      "Field dependency visualization",
    ],
  },
];
