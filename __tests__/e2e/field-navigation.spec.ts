import { test, expect } from "@playwright/test";

test.describe("Field Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page and upload a test file
    await page.goto("/");
    await page.setInputFiles('input[type="file"]', "example-files/test.twb");

    // Wait for the list items to be visible
    await page.waitForSelector('[data-testid="list-item"]', {
      state: "visible",
      timeout: 10000,
    });

    // Verify we have at least one list item
    const items = await page.locator('[data-testid="list-item"]').count();
    expect(items).toBeGreaterThan(0);
  });

  test("should navigate between fields and maintain history", async ({
    page,
  }) => {
    // Click on a list item to navigate to its details
    const firstItem = await page.locator('[data-testid="list-item"]').first();
    const firstItemId = await firstItem.getAttribute("data-node-id");
    if (!firstItemId) throw new Error("List item ID not found");
    await firstItem.click();

    // Verify we're on the field details page
    await expect(page).toHaveURL(`/field/${firstItemId}`);

    // Wait for the field details to load
    await page.waitForSelector('[data-testid="field-history"]');

    // Click the "References" tab
    await page.getByRole("tab", { name: "References" }).click();

    // Find and click a reference link
    const referenceLink = await page
      .locator('[data-testid="reference-link"]')
      .first();
    const referencedFieldId = await referenceLink.getAttribute("data-node-id");
    if (!referencedFieldId) throw new Error("Referenced field ID not found");
    await referenceLink.click();

    // Verify we navigated to the referenced field
    await expect(page).toHaveURL(`/field/${referencedFieldId}`);

    // Check if history is displayed and contains both fields
    const historyItems = await page
      .locator('[data-testid^="history-item-"]')
      .all();
    expect(historyItems.length).toBe(2);

    // Click the back button
    await page.locator('[data-testid="back-button"]').click();

    // Verify we went back to the first field
    await expect(page).toHaveURL(`/field/${firstItemId}`);
  });

  test("should limit history to last 5 entries", async ({ page }) => {
    // Get 6 different list items
    const items = await page.locator('[data-testid="list-item"]').all();
    expect(items.length).toBeGreaterThanOrEqual(6);

    // Click on 6 different items
    for (let i = 0; i < 6; i++) {
      await items[i].click();
      // Wait for navigation and history update
      await page.waitForSelector('[data-testid="field-history"]');
    }

    // Check if history shows only last 5 entries
    const historyItems = await page
      .locator('[data-testid^="history-item-"]')
      .all();
    expect(historyItems.length).toBe(5);
  });

  test("should handle direct navigation through history links", async ({
    page,
  }) => {
    // Navigate through a few items first
    const items = await page.locator('[data-testid="list-item"]').all();
    for (let i = 0; i < 3; i++) {
      await items[i].click();
      await page.waitForSelector('[data-testid="field-history"]');
    }

    // Click on the first history item
    const firstHistoryItem = await page.locator(
      '[data-testid="history-item-0"]'
    );
    const firstHistoryNodeId = await firstHistoryItem.getAttribute(
      "data-node-id"
    );
    if (!firstHistoryNodeId) throw new Error("History node ID not found");
    await firstHistoryItem.click();

    // Verify we navigated to the correct field
    await expect(page).toHaveURL(`/field/${firstHistoryNodeId}`);

    // Verify the history was updated correctly
    const historyItems = await page
      .locator('[data-testid^="history-item-"]')
      .all();
    expect(historyItems.length).toBe(4); // Original 3 + the one we clicked
  });

  test("should navigate through calculation references", async ({ page }) => {
    // Click on a calculation item
    const calculationItem = await page
      .locator('[data-testid="list-item"]')
      .filter({ hasText: "Calculation" })
      .first();
    const calculationId = await calculationItem.getAttribute("data-node-id");
    if (!calculationId) throw new Error("Calculation item ID not found");
    await calculationItem.click();

    // Verify we're on the calculation details page
    await expect(page).toHaveURL(`/field/${calculationId}`);

    // Find and click a reference link in the calculation formula
    const referenceLink = await page
      .locator('[data-testid="reference-link"]')
      .first();
    const referencedFieldId = await referenceLink.getAttribute("data-node-id");
    if (!referencedFieldId) throw new Error("Referenced field ID not found");
    await referenceLink.click();

    // Verify we navigated to the referenced field
    await expect(page).toHaveURL(`/field/${referencedFieldId}`);

    // Check if history shows both the calculation and the referenced field
    const historyItems = await page
      .locator('[data-testid^="history-item-"]')
      .all();
    expect(historyItems.length).toBe(2);

    // Verify the first history item is the calculation
    const firstHistoryId = await historyItems[0].getAttribute("data-node-id");
    expect(firstHistoryId).toBe(calculationId);

    // Verify the second history item is the referenced field
    const secondHistoryId = await historyItems[1].getAttribute("data-node-id");
    expect(secondHistoryId).toBe(referencedFieldId);
  });

  test("should support full navigation flow with back button", async ({
    page,
  }) => {
    // Start with a calculation item
    const calculationItem = await page
      .locator('[data-testid="list-item"]')
      .filter({ hasText: "Calculation" })
      .first();
    const calculationId = await calculationItem.getAttribute("data-node-id");
    if (!calculationId) throw new Error("Calculation item ID not found");
    await calculationItem.click();

    // Click a reference link in the calculation formula
    const referenceLink = await page
      .locator('[data-testid="reference-link"]')
      .first();
    const firstRefId = await referenceLink.getAttribute("data-node-id");
    if (!firstRefId) throw new Error("First reference ID not found");
    await referenceLink.click();

    // Verify we have two items in history
    let historyItems = await page
      .locator('[data-testid^="history-item-"]')
      .all();
    expect(historyItems.length).toBe(2);

    // Click another reference if available
    const secondReferenceLink = await page
      .locator('[data-testid="reference-link"]')
      .first();
    if (await secondReferenceLink.isVisible()) {
      const secondRefId = await secondReferenceLink.getAttribute(
        "data-node-id"
      );
      if (!secondRefId) throw new Error("Second reference ID not found");
      await secondReferenceLink.click();

      // Verify we now have three items in history
      historyItems = await page.locator('[data-testid^="history-item-"]').all();
      expect(historyItems.length).toBe(3);
    }

    // Click back button twice
    await page.locator('[data-testid="back-button"]').click();
    await page.locator('[data-testid="back-button"]').click();

    // Verify we're back at the original calculation
    await expect(page).toHaveURL(`/field/${calculationId}`);

    // Verify history is back to one item
    historyItems = await page.locator('[data-testid^="history-item-"]').all();
    expect(historyItems.length).toBe(1);

    // Verify the remaining history item is the original calculation
    const finalHistoryId = await historyItems[0].getAttribute("data-node-id");
    expect(finalHistoryId).toBe(calculationId);
  });

  test("should handle breadcrumb navigation correctly", async ({ page }) => {
    // Step 1: File is already uploaded in beforeEach

    // Step 2: Find and click a calculation field that references other calculated fields
    const calculationItem = await page
      .locator('[data-testid="list-item"]')
      .filter({ hasText: "Calculation" })
      .first();
    const calculationId = await calculationItem.getAttribute("data-node-id");
    if (!calculationId) throw new Error("Calculation item ID not found");
    await calculationItem.click();

    // Step 3: Verify we see only one breadcrumb
    await expect(page.locator('[data-testid="field-history"]')).toBeVisible();
    let historyItems = await page
      .locator('[data-testid^="history-item-"]')
      .all();
    expect(historyItems.length).toBe(1);

    // Step 4: Click a referenced calculated field in the calculation
    const referenceLink = await page
      .locator('[data-testid="reference-link"]')
      .first();
    await referenceLink.click();

    // Step 5: Verify we see two breadcrumbs
    historyItems = await page.locator('[data-testid^="history-item-"]').all();
    expect(historyItems.length).toBe(2);

    // Step 6: Click another field in the new calculation
    const secondReferenceLink = await page
      .locator('[data-testid="reference-link"]')
      .first();
    await secondReferenceLink.click();

    // Step 7: Verify we see three breadcrumbs
    historyItems = await page.locator('[data-testid^="history-item-"]').all();
    expect(historyItems.length).toBe(3);

    // Step 8: Click back button
    await page.locator('[data-testid="back-button"]').click();

    // Step 9: Verify we see two breadcrumbs
    historyItems = await page.locator('[data-testid^="history-item-"]').all();
    expect(historyItems.length).toBe(2);

    // Step 10: Click a field from the left list
    const listField = await page
      .locator('[data-testid="list-item"]')
      .filter({ hasText: "Calculation" })
      .nth(1);
    await listField.click();

    // Step 11: Verify we see one breadcrumb
    historyItems = await page.locator('[data-testid^="history-item-"]').all();
    expect(historyItems.length).toBe(1);
  });
});
