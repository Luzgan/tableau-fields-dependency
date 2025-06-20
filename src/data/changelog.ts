export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
  type: "feature" | "fix" | "improvement";
}

export const changelogData: ChangelogEntry[] = [
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
