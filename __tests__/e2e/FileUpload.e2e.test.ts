import { test, expect, Page } from "@playwright/test";
import path from "path";
import fs from "fs";

const EXAMPLE_FILES = [
  "test_book.twb",
  "test.twb",
  "Validation _ S2 2023 Combined Results (2).twb",
];

test.describe("FileUpload", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto("/");
  });

  for (const filename of EXAMPLE_FILES) {
    test(`should load ${filename} successfully`, async ({
      page,
    }: {
      page: Page;
    }) => {
      // Get the file path
      const filePath = path.join(process.cwd(), "example-files", filename);

      // Verify file exists
      expect(fs.existsSync(filePath)).toBeTruthy();

      // Setup file input handler
      const fileChooserPromise = page.waitForEvent("filechooser");

      // Click the upload button
      await page.getByRole("button", { name: "Upload TWB file" }).click();

      // Handle file selection
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(filePath);

      // Wait for success notification with longer timeout since file parsing might take time
      await expect(
        page.getByText(`Successfully loaded: ${filename}`, { exact: false })
      ).toBeVisible({ timeout: 10000 });

      // Verify filename is displayed in header
      await expect(page.getByText(filename).first()).toBeVisible();

      // Verify clear button is visible
      await expect(page.getByRole("button", { name: "Clear" })).toBeVisible();

      // Verify fields list is visible (indicating successful load)
      await expect(
        page.getByRole("textbox", { name: "Search fields" })
      ).toBeVisible({ timeout: 7000 });

      // Click clear and verify file is removed
      await page.getByRole("button", { name: "Clear" }).click();
      await expect(
        page.getByText("Upload a Tableau workbook to view fields")
      ).toBeVisible();
    });
  }

  test("should show error notification for invalid file", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Create a temporary invalid TWB file
    const invalidFilePath = path.join(process.cwd(), "temp-invalid.twb");
    fs.writeFileSync(invalidFilePath, "Invalid TWB content");

    try {
      // Setup file input handler
      const fileChooserPromise = page.waitForEvent("filechooser");

      // Click the upload button
      await page.getByRole("button", { name: "Upload TWB file" }).click();

      // Handle file selection
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(invalidFilePath);

      // Wait for error notification with longer timeout
      await expect(
        page.getByRole("alert", { name: "error notification" })
      ).toBeVisible({ timeout: 10000 });

      // Verify we're still in the initial state
      await expect(
        page.getByText("Upload a Tableau workbook to view fields")
      ).toBeVisible();
    } finally {
      // Cleanup
      fs.unlinkSync(invalidFilePath);
    }
  });

  test("should handle switching between different files", async ({
    page,
  }: {
    page: Page;
  }) => {
    const firstFile = EXAMPLE_FILES[0];
    const secondFile = EXAMPLE_FILES[1];

    // Load first file
    const firstFilePath = path.join(process.cwd(), "example-files", firstFile);
    const fileChooserPromise1 = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Upload TWB file" }).click();
    const fileChooser1 = await fileChooserPromise1;
    await fileChooser1.setFiles(firstFilePath);

    // Verify first file loaded
    await expect(
      page.getByText(`Successfully loaded: ${firstFile}`, { exact: false })
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(firstFile).first()).toBeVisible();

    // Clear the first file
    await page.getByRole("button", { name: "Clear" }).click();
    await expect(
      page.getByText("Upload a Tableau workbook to view fields")
    ).toBeVisible();
    await expect(page.getByText(firstFile)).not.toBeVisible();

    // Load second file
    const secondFilePath = path.join(
      process.cwd(),
      "example-files",
      secondFile
    );
    const fileChooserPromise2 = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Upload TWB file" }).click();
    const fileChooser2 = await fileChooserPromise2;
    await fileChooser2.setFiles(secondFilePath);

    // Verify second file loaded
    await expect(
      page.getByText(`Successfully loaded: ${secondFile}`, { exact: false })
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(secondFile).first()).toBeVisible();
    await expect(page.getByText(firstFile)).not.toBeVisible();

    // Verify search field is still visible
    await expect(
      page.getByRole("textbox", { name: "Search fields" })
    ).toBeVisible({ timeout: 7000 });
  });

  test("should handle reloading the same file", async ({
    page,
  }: {
    page: Page;
  }) => {
    const file = EXAMPLE_FILES[0];
    const filePath = path.join(process.cwd(), "example-files", file);

    // First load
    const fileChooserPromise1 = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Upload TWB file" }).click();
    const fileChooser1 = await fileChooserPromise1;
    await fileChooser1.setFiles(filePath);

    // Wait for success notification and check fields
    await page.getByRole("alert", { name: "success notification" }).waitFor();
    // Wait for search field to be visible (indicates fields are loaded)
    await page
      .getByRole("textbox", { name: "Search fields" })
      .waitFor({ timeout: 7000 });
    // Wait for fields to be rendered
    await page.waitForSelector('[role="button"]');
    // Get initial count of field boxes
    const initialFieldsCount = await page.locator('[role="button"]').count();
    expect(initialFieldsCount).toBeGreaterThan(0);

    // Clear the file
    await page.getByRole("button", { name: "Clear" }).click();
    await expect(
      page.getByText("Upload a Tableau workbook to view fields")
    ).toBeVisible();

    // Second load of the same file
    const fileChooserPromise2 = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Upload TWB file" }).click();
    const fileChooser2 = await fileChooserPromise2;
    await fileChooser2.setFiles(filePath);

    // Wait for success notification and check fields
    await page.getByRole("alert", { name: "success notification" }).waitFor();
    // Wait for search field to be visible (indicates fields are loaded)
    await page
      .getByRole("textbox", { name: "Search fields" })
      .waitFor({ timeout: 7000 });
    // Wait for fields to be rendered
    await page.waitForSelector('[role="button"]');
    // Get count of field boxes after second load
    const secondFieldsCount = await page.locator('[role="button"]').count();
    expect(secondFieldsCount).toBe(initialFieldsCount);
  });
});
