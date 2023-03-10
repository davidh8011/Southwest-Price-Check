import { test, expect } from '@playwright/test';

const flightData = [
  {
    departCityCode: 'DAL',
    arriveCityCode: 'DCA',
    departDate: '4/27',
    thresholdPrice: 150, //You'll get alert if price goes below this
    flightNumberOne: '3710',
    flightNumberTwo: '', //Only fill if you have second leg
  },
  {
    departCityCode: 'DCA',
    arriveCityCode: 'DAL',
    departDate: '5/1',
    thresholdPrice: 129, //You'll get alert if price goes below this
    flightNumberOne: '1548',
    flightNumberTwo: '', //Only fill if you have second leg
  },
];

flightData.forEach((data) => {
  test(
    data.departCityCode +
      ' -> ' +
      data.departCityCode +
      ' on ' +
      data.departDate,
    async ({ page }) => {
      const departCityCode = data.departCityCode;
      const arriveCityCode = data.arriveCityCode;
      const departDate = data.departDate;
      const thresholdPrice = data.thresholdPrice;
      const flightNumberOne = data.flightNumberOne;
      const flightNumberTwo = data.flightNumberTwo;

      let flightNumbers: string;
      if (flightNumberTwo) {
        flightNumbers = '# ' + flightNumberOne + ' / ' + flightNumberTwo;
      } else {
        flightNumbers = '# ' + flightNumberOne;
      }

      await page.goto(
        'https://www.southwest.com/air/booking/?clk=GSUBNAV-AIR-BOOK'
      );

      await page.getByLabel('One-way').check();
      await page.locator('#originationAirportCode').click();
      await page.keyboard.type(departCityCode);
      await page.locator('#destinationAirportCode').click();
      await page.keyboard.type(arriveCityCode);

      await page.locator('#departureDate').click();
      await page.keyboard.type(departDate);

      let flightList = false;

      while (!flightList) {
        let response = await Promise.all([
          page.waitForResponse(
            'https://www.southwest.com/api/air-booking/v1/air-booking/page/air/booking/shopping'
          ),
          page.locator('#form-mixin--submit-button').click(),
        ]);

        if (response[0].ok() == true) flightList = true;
      }

      const myFlight = await page.locator('.air-booking-select-detail', {
        has: page.getByText(flightNumbers, { exact: true }),
      });

      await expect(myFlight, 'Flight not found').toBeVisible();

      const allPrices = await myFlight.locator('.fare-button--value').all();

      let minPrice = 9999;

      for (const priceLocator of allPrices) {
        const priceText = await priceLocator.textContent();
        const price = Number(priceText.split(' ')[0]);

        if (price < minPrice) minPrice = price;
      }

      //Display current price and threshold price for the flight
      console.log('Flight number(s):', flightNumbers);
      console.log(departCityCode, '->', arriveCityCode, 'on', departDate);
      console.log('Cheapest current price is:', minPrice);
      console.log('Threshold price is:', thresholdPrice);
      // Fail the test if price is below threshold, so user gets alert
      expect(minPrice >= thresholdPrice, 'Price is cheaper!').toBeTruthy();
      //If above statement is true/doesn't fail, then price is not cheaper
      console.log('Price is not cheaper');
    }
  );
});
