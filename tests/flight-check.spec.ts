import { test, expect } from '@playwright/test';

test('Check price of specific flight', async ({ page }) => {
  const departCityCode = 'DCA';
  const arriveCityCode = 'DAL';
  const departDate = '5/1';
  const flightNumbers = '# 1296';

  await page.goto('https://www.southwest.com/');

  await page.locator('.radio-button', { hasText: 'One-way' }).first().click();

  await page
    .locator('.input', {
      has: page.locator('#LandingAirBookingSearchForm_originationAirportCode'),
    })
    .first()
    .fill(departCityCode);

  await page
    .locator('.input', {
      has: page.locator('#LandingAirBookingSearchForm_destinationAirportCode'),
    })
    .first()
    .fill(arriveCityCode);

  await page
    .locator('.input', {
      has: page.locator('#LandingAirBookingSearchForm_departureDate'),
    })
    .first()
    .fill(departDate);

  await page.locator('#LandingAirBookingSearchForm_submit-button').click();
  await page.locator('#form-mixin--submit-button').click();

  const myFlight = await page.locator('.air-booking-select-detail', {
    has: page.locator('.actionable--text', { hasText: flightNumbers }),
  });

  const allPrices = await myFlight.locator('.fare-button--value').all();

  //   await page.locator('.actionable--text', { hasText: flightNumbers }).click();

  await page.pause();
});
