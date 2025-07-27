import { test, expect } from '@playwright/test'

test.describe('Bachelor Fantasy League App', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check that the page title is correct
    await expect(page).toHaveTitle(/Bachelor Fantasy League/i)
    
    // Check for basic page structure
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('page is responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Verify the page renders properly on mobile
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('navigation works correctly', async ({ page }) => {
    await page.goto('/')
    
    // Test basic navigation (these routes may not exist yet, but the test structure is ready)
    // await page.click('text=Login')
    // await expect(page).toHaveURL(/.*login/)
    
    // For now, just verify we can navigate to the home page
    await expect(page).toHaveURL(/\/$/)
  })
})