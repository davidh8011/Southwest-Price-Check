import { test, expect } from '@playwright/test';
// import random_useragent from 'random-useragent';
// import playwright from 'playwright';

const flightData = [
  {
    departCityCode: 'DAL',
    arriveCityCode: 'ABQ',
    departDate: '9/5',
    thresholdPrice: 125, //You'll get alert if price goes below this
    flights: [['4373']], // Add all flights in 2D array (keeping together connections); example for multiple flights each with a connection flights: [['387', '5455'],['1996', '5968'],['587', '1292'],],
  },
  {
    departCityCode: 'ABQ',
    arriveCityCode: 'DAL',
    departDate: '9/8',
    thresholdPrice: 150, //You'll get alert if price goes below this
    flights: [
      ['1370'],
    ], // Add all flights in 2D array (keeping together connections)
  },
];

flightData.forEach((data) => {
  test(
    data.departCityCode +
      ' -> ' +
      data.arriveCityCode +
      ' on ' +
      data.departDate,
    async ({ page }) => {
      // //Create random agent
      // const agent = random_useragent.getRandom();
      // //Set up browser
      // const browser = await playwright.chromium.launch({ headless: true });
      // const context = await browser.newContext({ userAgent: agent });
      // const page = await context.newPage({ bypassCSP: true });

      //Enter data
      const departCityCode = data.departCityCode;
      const arriveCityCode = data.arriveCityCode;
      const departDate = data.departDate;
      const thresholdPrice = data.thresholdPrice;
      const flights = data.flights;

      //Navigate to the website
      await page.goto(
        'https://www.southwest.com/air/booking/?clk=GSUBNAV-AIR-BOOK'
      );
      await page.waitForTimeout(500);

      // Validate page has loaded
      const onewayButton = page.locator('input[type="radio"][value="oneway"]');
      await expect(onewayButton).toBeVisible();
      await expect(page.locator('#Depart')).toBeVisible();

      // Enter flight info
      await onewayButton.check();
      await page.waitForTimeout(200);
      await page.locator('#originationAirportCode').click();
      await page.waitForTimeout(200);
      await page.keyboard.type(departCityCode);
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      await page.locator('#destinationAirportCode').click();
      await page.waitForTimeout(200);
      await page.keyboard.type(arriveCityCode);
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');

      await page.waitForTimeout(200);
      await page.locator('#departureDate').click();
      await page.waitForTimeout(200);
      await page.keyboard.type(departDate);
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      await onewayButton.click();
      await page.waitForTimeout(200);

      // Submit flight info (keep trying until successful)
      let flightList = false;
      const maxRetries = 3;
      let retries = 0;

      while (!flightList && retries < maxRetries) {
        let response = await Promise.all([
          page.waitForResponse(
            'https://www.southwest.com/api/air-booking/v1/air-booking/page/air/booking/shopping'
          ),
          page.locator('#form-mixin--submit-button').click(),
        ]);

        if (response[0].ok() == true) flightList = true;
        else {
          await page.waitForTimeout(1000);
          await onewayButton.click();
          await page.waitForTimeout(1000);
          retries++;
        }
      }

      // const myFlight = await page.locator('.air-booking-select-detail', {
      //   has: page.getByText(flightNumbers, { exact: true }),
      // });
      await expect(page.locator('#price-matrix-heading-0').first()).toBeVisible();

      console.log(departCityCode, '->', arriveCityCode, 'on', departDate);
      let minPrice = 9999;
      for (const flight of flights) {
        let thisFlightCheapest = 9999;
        let flightNumbers: string;
        if (flight[1]) {
          flightNumbers = '# ' + flight[0] + ' / ' + flight[1];
        } else {
          flightNumbers = '# ' + flight[0];
        }

        const myFlight = await page.locator('.air-booking-select-detail', {
          has: page.locator('.actionable--text', {
            hasText: flightNumbers,
          }),
        });

        // Validate flight is displayed
        // await expect(myFlight, 'Flight not found').toBeVisible();

        if (await myFlight.isVisible()) {
          // Check prices of your flight and look for the minimum
          const allPrices = await myFlight.locator('.fare-button--value').all();
          for (const priceLocator of allPrices) {
            const priceText = await priceLocator.innerText();
            for (const priceTextLine of priceText.split('\n')) {
              if (priceTextLine.split(' ')[1] == 'Dollars') {
                const price = Number(priceTextLine.split(' ')[0]);
                if (price < thisFlightCheapest) thisFlightCheapest = price;
                if (price < minPrice) minPrice = price;
              }
            }

            // const price = priceText.split('\n')[0];
            // console.log('Parsed Price:', price);
            // const deal = await priceLocator.locator('')
            // console.log(await priceLocator.innerText());
          }

          //Display current price and threshold price for the flight
          console.log(
            'Flight number(s):',
            flightNumbers,
            '   Price:',
            thisFlightCheapest
          );
        } else {
          console.log(
            'Flight number(s):',
            flightNumbers,
            '   Price:',
            'Flight not found'
          );
        }
      }
      console.log('Cheapest current price is:', minPrice);
      console.log('Threshold price is:', thresholdPrice);
      // Fail the test if price is below threshold, so user gets alert
      expect(minPrice >= thresholdPrice, 'Price is cheaper!').toBeTruthy();
      //If above statement is true/doesn't fail, then price is not cheaper
      console.log('Price is not cheaper');
    }
  );
});
