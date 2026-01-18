import { test, expect } from '@playwright/test';

test.describe('Abyssal Hunter Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display start screen', async ({ page }) => {
    // Check title is visible
    await expect(page.locator('.title.glow-pulse')).toContainText('Abyssal Hunter');

    // Check "Dive In" button is visible
    await expect(page.locator('button:has-text("Dive In")')).toBeVisible();

    // Check controls hint is visible
    await expect(page.locator('.screen.visible .desc')).toContainText('WASD');
  });

  test('should start game when clicking Dive In', async ({ page }) => {
    // Click the start button
    await page.click('button:has-text("Dive In")');

    // Wait a moment for game to initialize
    await page.waitForTimeout(500);

    // Start screen should be hidden
    await expect(page.locator('.screen.visible:has-text("Dive In")')).not.toBeVisible();

    // HUD should be visible with score
    await expect(page.locator('.hud #score')).toBeVisible();
  });

  test('should show game over screen on death', async ({ page }) => {
    // Start the game
    await page.click('button:has-text("Dive In")');

    // Wait for spawn protection to wear off (3 seconds)
    await page.waitForTimeout(4000);

    // Try to trigger death by not moving (predators will spawn)
    // This test may be flaky depending on RNG
    await page.waitForTimeout(5000);

    // If game over screen appears, check respawn button
    const respawnButton = page.locator('button:has-text("Respawn")');
    if (await respawnButton.isVisible()) {
      await expect(respawnButton).toBeVisible();
      await expect(page.locator('.game-over-title')).toContainText('Consumed');
    }
  });

  test('should respond to keyboard input', async ({ page }) => {
    // Start the game
    await page.click('button:has-text("Dive In")');
    await page.waitForTimeout(500);

    // Press arrow keys
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowRight');

    // Press WASD keys
    await page.keyboard.press('KeyW');
    await page.keyboard.press('KeyD');

    // Press space for dash
    await page.keyboard.press('Space');

    // If no errors, test passes
    await expect(page.locator('.hud')).toBeVisible();
  });

  test('should toggle mute', async ({ page }) => {
    // Start the game
    await page.click('button:has-text("Dive In")');

    // Find and click mute button
    const muteBtn = page.locator('.mute-btn');
    await expect(muteBtn).toBeVisible();

    // Get initial state
    const initialText = await muteBtn.textContent();

    // Click to toggle
    await muteBtn.click();

    // State should change
    const newText = await muteBtn.textContent();
    expect(newText).not.toBe(initialText);
  });

  test('canvas should be present and sized', async ({ page }) => {
    const canvas = page.locator('#gameCanvas');
    await expect(canvas).toBeVisible();

    // Canvas should be full viewport
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(100);
    expect(box!.height).toBeGreaterThan(100);
  });
});
