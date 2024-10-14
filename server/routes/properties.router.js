const express = require('express');
// const monthlyProfit = require('../helpers/monthlyProfit')
// const profit = require('../helpers/profit');
// const totalCost = require('../helpers/totalCost');
// const totalHoldingCost = require('../helpers/totalHoldingCost');
// const upfrontCost = require('../helpers/upfrontCost');
// const monthlyProfit = require('../helpers/monthlyProfit')
const {
  rejectUnauthenticated,
} = require('../modules/authentication-middleware');
const pool = require('../modules/pool');
const router = express.Router();
const axios = require('axios');

function upfrontCost (totalRepairCost, downPayment, closingCosts) {
  let totalUpfrontCost = Number(totalRepairCost) + Number(downPayment) + Number(closingCosts) ;
  
  return totalUpfrontCost;
}

function totalHoldingCost (holdingPeriod, monthlyHoldingCost) {
  let holdingCost = (monthlyHoldingCost) * holdingPeriod;
  
  return holdingCost;
}

function totalCost (totalRepairCost, purchasePrice, holdingPeriod, monthlyHoldingCost) {
  let cost = upfrontCost(totalRepairCost, purchasePrice) + totalHoldingCost(holdingPeriod, monthlyHoldingCost);
  
  return cost;
}

function profit (afterRepairValue, totalRepairCost, purchasePrice, holdingPeriod, monthlyHoldingCost) {
  let totalProfit = afterRepairValue - totalCost(totalRepairCost, purchasePrice, holdingPeriod, monthlyHoldingCost);
  
  return totalProfit;
}

function monthlyProfit (afterRepairValue, totalRepairCost, purchasePrice, holdingPeriod, monthlyHoldingCost) {
  let totalAnnualizedProfit = (profit(afterRepairValue, totalRepairCost, purchasePrice, holdingPeriod, monthlyHoldingCost) / holdingPeriod);
  
  return totalAnnualizedProfit;
}

// ===================== Properties =====================
/**
 * ----- GET properties: getProperties
 */
router.get('/:id', async (req, res) => {
  console.log('in get properties/id: ', req.params.id);
  const userId = req.user.id;

  let connection;
  try{

    connection = await pool.connect()
    await connection.query('BEGIN;')

    const propertiesText = `
        SELECT * FROM "properties"
            WHERE "user_id" = $1
            ORDER BY "inserted_at" DESC;
    `;
    const propertiesResult = await connection.query(propertiesText, [userId])
    const properties = propertiesResult.rows

    const repairText = `
      SELECT 
        "properties"."id" AS "id",
        "repair_items"."id" AS "repair_id",
        "repair_items"."name" AS "repair_name",
        "repair_items"."cost" AS "repair_cost"
        FROM "properties"
        JOIN "repair_items"
          ON "properties"."id" = "repair_items"."property_id"
        WHERE "user_id" = $1
        ORDER BY "inserted_at" DESC;
    `;
    const repairResult = await connection.query(repairText, [userId])
    const repairItems = repairResult.rows

    const holdingText = `
      SELECT
        "properties"."id" AS "id",
        "holding_items"."id" AS "holding_id",
        "holding_items"."name" AS "holding_name",
        "holding_items"."cost" AS "holding_cost" 
        FROM "properties"
        JOIN "holding_items"
          ON "properties"."id" = "holding_items"."property_id"
        WHERE "user_id" = $1
        ORDER BY "inserted_at" DESC;
    `;
    const holdingResult = await connection.query(holdingText, [userId])
    const holdingItems = holdingResult.rows

    const propertyInfo = {
      properties: properties,
      repairItems: repairItems,
      holdingItems: holdingItems
    }

    await connection.query('Commit;')
    res.send(propertyInfo);
    
  }catch(err) {
    console.log('GET properties failed: ', err);
    await connection.query('Rollback;')
    res.sendStatus(500);
  } finally {
    await connection.release()
  }
});


/**
 * ----- POST property: addProperty
 */
router.post('/', async (req, res) => {
  const api_key = process.env.RENTCAST_API_KEY;
  const calculator_api_key = process.env.MORTGAGE_CALCULATOR_API_KEY;
  const address = req.body.address;
  const addressId = req.body.addressId
  const userId = req.user.id;
  let propertyApiId;
  let propertyId;
  let formattedAddress;
  let purchasePrice;
  let afterRepairValue;
  let listingResponse = {};
  let recordsResponse = {};
  let valueEstimateResponse = {};

  let taxYear;
  
  console.log('ADDRESS:', address, userId);
  
  let connection;
  try {
    connection = await pool.connect()
    await connection.query('BEGIN;')

    // ========================== CALLING API && CHECKING TIMESTAMP ==========================
    const checkTimeStampSqlText = `
        SELECT * FROM "property_api_data"
            WHERE "inserted_at" >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
            AND "google_address_id" = $1;
    `
    const checkTimeStampResults = await connection.query(checkTimeStampSqlText, [addressId]);
    const checkTimeStampData = checkTimeStampResults.rows;
    console.log('checkTimeStampData is:', checkTimeStampData);
      
  
  
    if (checkTimeStampData.length === 0) {
      // ================ Axios for VALUE ESTIMATE (afterRepairValue)
      const theValueEstimateResponse = await axios({
        method: 'GET',
        url: `https://api.rentcast.io/v1/avm/value?address=${address}&limit=1&compCount=5`,
        headers: {
            'accept': 'application/json',
            'X-Api-Key': api_key
        }
      })

      valueEstimateResponse = theValueEstimateResponse;
      purchasePrice = valueEstimateResponse.data.price;
      afterRepairValue = valueEstimateResponse.data.priceRangeHigh;
      console.log("Data from valueEstimateResponse:", valueEstimateResponse.data);



      // ================ Axios for RECORDS (taxesYearly)
      const theRecordsResponse = await axios({
        method: 'GET',
        url: `https://api.rentcast.io/v1/properties?address=${address}&limit=1`,
        headers: {
            'accept': 'application/json',
            'X-Api-Key': api_key
        }
      })
      recordsResponse = theRecordsResponse;
      console.log("Data from recordsResponse:", recordsResponse.data);


      // ================ Axios for LISTING
      formattedAddress = recordsResponse.data[0].formattedAddress;

      try {
        const theListingResponse = await axios({
          method: 'GET',
          url: `https://api.rentcast.io/v1/listings/sale?address=${formattedAddress}&limit=1`,
          headers: {
              'accept': 'application/json',
              'X-Api-Key': api_key
          }
        })
        listingResponse = theListingResponse;
        formattedAddress = listingResponse.data[0].formattedAddress;
        purchasePrice = listingResponse.data[0].price

      } catch(error) {
        console.log('Address cannot be found in listing.');

        listingResponse = {data: [{
          formattedAddress: formattedAddress,
          price: purchasePrice,
          propertyType: (recordsResponse.data[0].propertyType ? recordsResponse.data[0].propertyType : 'Single Family'),
          bedrooms: (recordsResponse.data[0].bedrooms ? recordsResponse.data[0].bedrooms : 3),
          bathrooms: (recordsResponse.data[0].bathrooms ? recordsResponse.data[0].bathrooms : 2),
          squareFootage: (recordsResponse.data[0].squareFootage ? recordsResponse.data[0].squareFootage : 1500)
        }]}
      }
      console.log("Data from listingResponse:", listingResponse.data);



      // ================ SQL insert into table: PROPERTY_API_DATA
      const lastYear = new Date().getFullYear() - 1;
      taxYear = recordsResponse.data[0].propertyTaxes;
      
      if (!taxYear) {
          taxYear = null;
      } else if (taxYear) {
          taxYear = recordsResponse.data[0].propertyTaxes[`${lastYear}`].total;
      }
          
      const propertyApiData = [
          addressId,
          listingResponse.data[0].formattedAddress,
          listingResponse.data[0].price,
          taxYear,
          valueEstimateResponse.data.priceRangeHigh,
          listingResponse.data[0].propertyType,
          listingResponse.data[0].bedrooms,
          listingResponse.data[0].bathrooms,
          listingResponse.data[0].squareFootage
      ]

      const propertyApiDataSqlText = `
          INSERT INTO "property_api_data"
          ("google_address_id", "address", "purchase_price", "taxes_yearly", "after_repair_value", 
          "property_type", "bedrooms", "bathrooms", "square_footage")
          VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING "id";
      `
      const propertyApiDataResults = await connection.query(propertyApiDataSqlText, propertyApiData);
      propertyApiId = propertyApiDataResults.rows[0].id;
      console.log('propertyApiId: ', propertyApiId)

    } else if (checkTimeStampData.length > 0) {
      console.log('Property already exists in database!');

      // propertyApiId = checkTimeStampData[0].id;

      // //get property details from the properties api data table
      // const getPropertyInfoText = `
      //   SELECT
      //     "address",
      //     "purchase_price",
      //     "taxes_yearly",
      //     "after_repair_value"
      //     FROM "property_api_data"
      //     WHERE "id" = $1;
      //   `;
      // const getPropertyInfoResponse = await connection.query(getPropertyInfoText, [propertyApiId]);
      // formattedAddress = getPropertyInfoResponse.rows[0].address;
      // purchasePrice = getPropertyInfoResponse.rows[0].purchase_price;
      // taxYear = getPropertyInfoResponse.rows[0].taxes_yearly;
      // afterRepairValue = getPropertyInfoResponse.rows[0].after_repair_value;

      const mostRecentCheck = checkTimeStampData.length - 1;

      propertyApiId = checkTimeStampData[mostRecentCheck].id;
      formattedAddress = checkTimeStampData[mostRecentCheck].address;
      purchasePrice = Number(checkTimeStampData[mostRecentCheck].purchase_price);
      afterRepairValue = Number(checkTimeStampData[mostRecentCheck].after_repair_value);
      taxYear = Number(checkTimeStampData[mostRecentCheck].taxes_yearly);
      
    }





    // ================ SQL insert into table: PROPERTIES
    const propertiesData = [
        userId,
        propertyApiId,
        formattedAddress,
        purchasePrice,
        taxYear,
        afterRepairValue
    ]

    const propertiesSqlText = `
      INSERT INTO "properties"
        ("user_id", "property_api_id", "address", "purchase_price", "taxes_yearly", "after_repair_value")
        VALUES
        ($1, $2, $3, $4, $5, $6) RETURNING id;
    `;
    const propertiesResults = await connection.query(propertiesSqlText, propertiesData);
    propertyId = propertiesResults.rows[0].id;
    console.log('This is propertyId:', propertyId);
    


    // ================ SQL insert into table: HOLDING
    const getDefaultHoldingsText = `
      SELECT * FROM "default_holdings"
        WHERE "user_id" = $1;
    `;
    const getDefaultHoldingsResults = await connection.query(getDefaultHoldingsText, [userId]);
    console.log('getDefaultHoldingsResult: ', getDefaultHoldingsResults.rows)

    for(let holdingItem of getDefaultHoldingsResults.rows) {
      const addHoldingItemText = `
        INSERT INTO "holding_items"
          ("property_id", "name", "cost")
          VALUES
          ($1, $2, $3);
      `;
      const addHoldingItemValues = [propertyId, holdingItem.holding_name, holdingItem.holding_cost];
      const addHoldingItemResults = await connection.query(addHoldingItemText, addHoldingItemValues);
    }

    // ================ SQL sum holding cost: HOLDING
    const totalHoldingCostText = `
    SELECT 
      SUM("holding_items"."cost") AS "monthly_holding_total"
      FROM "holding_items"
      WHERE "property_id" = $1;
    `;
    const totalHoldingCostValues = [propertyId];
    const totalHoldingCostResults = await connection.query(totalHoldingCostText, totalHoldingCostValues);
    console.log('sum of holding items. expected: 200', totalHoldingCostResults.rows);
    const monthlyHoldingCost = Number(totalHoldingCostResults.rows[0].monthly_holding_total) + (taxYear / 12);



    // ================ SQL insert into table: REPAIR
    const getDefaultRepairsText = `
    SELECT * FROM "default_repairs"
      WHERE "user_id" = $1;
    `;
    const getDefaultRepairsResults = await connection.query(getDefaultRepairsText, [userId]);
    console.log('getDefaultRepairsResult: ', getDefaultRepairsResults.rows)

    for(let repairItem of getDefaultRepairsResults.rows) {
      const addRepairItemText = `
        INSERT INTO "repair_items"
          ("property_id", "name", "cost")
          VALUES
          ($1, $2, $3);
      `;
      const addRepairItemValues = [propertyId, repairItem.repair_name, repairItem.repair_cost];
      const addRepairItemResults = await connection.query(addRepairItemText, addRepairItemValues);
    }

    // ================ SQL sum repair cost: REPAIR
    const totalRepairCostText = `
    SELECT 
      SUM("repair_items"."cost") AS "total_repair_cost"
      FROM "repair_items"
      WHERE "property_id" = $1;
    `;
    const totalRepairCostValues = [propertyId];
    const totalRepairCostResults = await connection.query(totalRepairCostText, totalRepairCostValues);
    console.log('sum of repair items. expected: 200', totalRepairCostResults.rows[0].total_repair_cost)
    const totalRepairs = totalRepairCostResults.rows[0].total_repair_cost

    // ================ SQL select default holding period: USER
    const getDefaultHoldingPeriodText = `
    SELECT 
      "user"."holding_period_default" AS "defaultHoldingPeriod"
      FROM "user"
      WHERE "id" = $1;
    `;
    const getDefaultHoldingPeriodResults = await connection.query(getDefaultHoldingPeriodText, [userId]);
    console.log('getDefaultHoldingPeriodResult: ', getDefaultHoldingPeriodResults.rows)
    const defaultHoldingPeriod = getDefaultHoldingPeriodResults.rows[0].defaultHoldingPeriod

    // ================ SQL update table: PROPERTIES
    const totalUpfrontCost = upfrontCost(totalRepairs, purchasePrice);
    const cost = totalCost(totalRepairs, purchasePrice, defaultHoldingPeriod, monthlyHoldingCost);
    const holdingCost = totalHoldingCost(defaultHoldingPeriod, monthlyHoldingCost);
    const totalProfit = profit(afterRepairValue, totalRepairs, purchasePrice, defaultHoldingPeriod, monthlyHoldingCost);
    const totalMonthlyProfit = monthlyProfit(afterRepairValue, totalRepairs, purchasePrice, defaultHoldingPeriod, monthlyHoldingCost);
    
    const updatePropertiesText = `
       UPDATE "properties"
          SET "total_repair_cost" = $1,
              "total_upfront_cost" = $2,
              "monthly_holding_cost" = $3,
              "total_holding_cost" = $4,
              "total_cost" = $5,
              "profit" = $6,
              "monthly_profit" = $7
          WHERE "id" = $8;
    `;

    const updatePropertiesValues = [totalRepairs, totalUpfrontCost, monthlyHoldingCost, holdingCost, cost, totalProfit, totalMonthlyProfit, propertyId];
    const updatePropertiesResults = await connection.query(updatePropertiesText, updatePropertiesValues);



    // ========================== CALLING API && CHECKING DEFAULT CALCULATIONS TIMESTAMP ==========================
    const checkDefaultCalculationsTimeStampSqlText = `
        SELECT *, "default_mortgage_calculations".id AS "default_mortgage_calculations_id"
            FROM "default_mortgage_calculations"
            JOIN "properties"
            ON "properties".id = "default_mortgage_calculations".property_id
                WHERE "default_mortgage_calculations".interest_rate_inserted_at 
                        >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
                AND "properties".id = $1;
    `
    const checkDefaultCalculationsTimeStampResults = await connection.query(checkDefaultCalculationsTimeStampSqlText, [propertyId]);
    const checkDefaultCalculationsTimeStampData = checkDefaultCalculationsTimeStampResults.rows;
    // console.log('checkDefaultCalculationsTimeStampData is:', checkDefaultCalculationsTimeStampData);

    if (checkDefaultCalculationsTimeStampData.length === 0) {
      // ================ Axios for INTEREST RATE API
      const interestRateResponse = await axios({
          method: 'GET',
          url: `https://api.api-ninjas.com/v1/interestrate?country=United States`,
          headers: {
              'accept': 'application/json',
              'X-Api-Key': api_key
          }
      })
      interestRate = interestRateResponse.data.central_bank_rates[0].rate_pct;
      downPayment = purchasePrice * 0.2;
      closingCosts = purchasePrice * 0.03;
      baseLoanAmount = purchasePrice - downPayment;
      // console.log('interestRate:', interestRate);
      // console.log('downPayment:', downPayment);
      // console.log('closingCosts:', closingCosts);
      // console.log('baseLoanAmount:', baseLoanAmount);
      
      

      // ================ Axios for MORTGAGE CALCULATOR API
      const mortgageCalculatorResponse = await axios({
          method: 'GET',
          url: `https://api.api-ninjas.com/v1/mortgagecalculator?loan_amount=${purchasePrice}&interest_rate=${interestRate}&duration_years=${defaultLoanTerm}&downpayment=${downPayment}`,
          headers: {
              'accept': 'application/json',
              'X-Api-Key': api_key
          }
      })
      // &annual_property_tax=${propertyTax}
      // monthlyPayment = mortgageCalculatorResponse.data.monthly_payment;
      // annualPayment = mortgageCalculatorResponse.data.annual_payment;
      totalInterestPaid = mortgageCalculatorResponse.data.total_interest_paid;
      interestRateAnnual = Number(((((totalInterestPaid / baseLoanAmount) / (defaultLoanTerm * 365)) * 365) * 100).toFixed(3));
      


      // ================ SQL insert into table: DEFAULT_MORTGAGE_CALCULATIONS
      const defaultCalculationsData = [
          propertyId,
          interestRate,
          baseLoanAmount,
          interestRateAnnual
      ]
      const defaultCalculationsSqlText = `
          INSERT INTO "default_mortgage_calculations"
          ("property_id", "interest_rate", "base_loan_amount", "interest_rate_annual")
          VALUES
          ($1, $2, $3, $4);
      `
      const defaultCalculationsResponse = await connection.query(defaultCalculationsSqlText, defaultCalculationsData)
      
  } else if (checkDefaultCalculationsTimeStampData.length > 0) {
      console.log('Data is less than 24 hours, no API call');
      const mostRecentCheck = checkDefaultCalculationsTimeStampData.length - 1;
      interestRate = checkDefaultCalculationsTimeStampData[mostRecentCheck].interest_rate;
      interestRateInsertedAt = checkDefaultCalculationsTimeStampData[mostRecentCheck].interest_rate_inserted_at;
      purchasePrice = checkDefaultCalculationsTimeStampData[mostRecentCheck].purchase_price;
      baseLoanAmount = checkDefaultCalculationsTimeStampData[mostRecentCheck].base_loan_amount;
      interestRateAnnual = checkDefaultCalculationsTimeStampData[mostRecentCheck].interest_rate_annual;
      downPayment = purchasePrice * 0.2;
      closingCosts = purchasePrice * 0.03;
  }



  // ========================== CHECKING MORTGAGE CALCULATIONS TIMESTAMP ==========================
  const checkMortgageCalculationsTimeStampSqlText = `
  SELECT *, "mortgage_calculations".id AS "mortgage_calculations_id"
      FROM "mortgage_calculations"
      JOIN "properties"
      ON "properties".id = "mortgage_calculations".property_id
          WHERE "mortgage_calculations".interest_rate_api_inserted_at 
                  >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
          AND "properties".id = $1;
  `
  const checkMortgageCalculationsTimeStampResults = await connection.query(checkMortgageCalculationsTimeStampSqlText, [propertyId]);
  const checkMortgageCalculationsTimeStampData = checkMortgageCalculationsTimeStampResults.rows;
  // console.log('checkMortgageCalculationsTimeStampData is:', checkMortgageCalculationsTimeStampData);


  if (checkMortgageCalculationsTimeStampData.length === 0) {
  // ================ SQL insert into table: MORTGAGE_CALCULATIONS
  interestRateMonthly = interestRateAnnual / 12;
  interestDecimalMonthly = interestRateMonthly / 100;
  interestPaymentMonthly = interestDecimalMonthly * baseLoanAmount;

  const mortgageCalculationsData = [
      propertyId,
      interestRate,
      interestRateInsertedAt,
      downPayment,
      baseLoanAmount,
      closingCosts,
      interestRateAnnual,
      interestRateMonthly,
      interestDecimalMonthly,
      interestPaymentMonthly
  ]
  const mortgageCalculationsSqlText = `
      INSERT INTO "mortgage_calculations"
      ("property_id", "interest_rate", "interest_rate_api_updated_at", "down_payment", "base_loan_amount",
      "closing_costs", "interest_rate_annual", "interest_rate_monthly", "interest_decimal_monthly", "interest_payment_monthly")
      VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING "id";
  `
  const mortgageCalculationsResponse = await connection.query(mortgageCalculationsSqlText, mortgageCalculationsData)
  mortgageCalculationsId = mortgageCalculationsResponse.rows[0].id;

  } else if (checkMortgageCalculationsTimeStampData.length > 0) {
      const mostRecentCheck = checkMortgageCalculationsTimeStampData.length - 1;
      mortgageCalculationsId = checkMortgageCalculationsTimeStampData[mostRecentCheck].mortgage_calculations_id;

  }

  // ================ SQL get table: MORTGAGE_CALCULATIONS
  const getMortgageCalculationsSqlText = `
      SELECT * FROM "mortgage_calculations"
          WHERE "id" = $1;
  `
  const getMortgageCalculationsResponse = await connection.query(getMortgageCalculationsSqlText, [mortgageCalculationsId]);
  const mortgageCalculationsSqlData = getMortgageCalculationsResponse.rows[0]

  const finalMortgageCalculationsData = getMortgageCalculationsFixData(mortgageCalculationsSqlData, purchasePrice);

    console.log('Property posted/updated in database!');
    
    await connection.query('Commit;');
    res.send(finalMortgageCalculationsData);

  } catch(err) {
    console.log('Add property failed: ', err);
    await connection.query('Rollback;');
    res.sendStatus(500);
  } finally {
    await connection.release()
  }
});


/**
 * ----- DELETE property: deleteProperty
 */
router.delete('/:id', (req, res) => {
    // console.log('/api/properties/id delete route received a request! ', req.params.id)
    const propertyId = req.params.id;

    const sqlText = `
      DELETE FROM "properties"
	      WHERE "id" = $1;
    `
  
      pool.query(sqlText, [propertyId])
      .then((results) => {
          res.send(results.rows);
      }) .catch((error) => {
          console.log('Error in deleting property:', error);
          res.sendStatus(500);
      })
  });


/**
 * ----- PUT property: updateProperty
 */
//put route updates the holding period, purchase price, and after repair 
//value for a specific property in the database
router.put('/', async (req, res) => {
  console.log('/api/properties put route received a request! ', req.body)
  const propertyId = Number(req.body.propertyId);
  const holdingPeriod = Number(req.body.holdingPeriod);
  const purchasePrice = Number(req.body.purchasePrice);
  const afterRepairValue = Number(req.body.afterRepairValue);

  let connection;
  try {
    connection = await pool.connect()
    await connection.query('BEGIN;')

    //get the values needed for the calculation functions
    const propertyInfoText = `
      SELECT 
          "total_repair_cost",
          "monthly_holding_cost"
          FROM "properties"
          WHERE "id" = $1;
    `;
    const propertyInfoValues = [propertyId];
    const propertyInfoResults = await connection.query(propertyInfoText, propertyInfoValues);

    const totalRepairs = Number(propertyInfoResults.rows[0].total_repair_cost);
    const monthlyHoldingCost = Number(propertyInfoResults.rows[0].monthly_holding_cost);

    //update the properties table with the inputs the user saved
    const updatePropertyText = `
      UPDATE "properties"
          SET holding_period = $1,
              purchase_price = $2,
              after_repair_value = $3,
              "updated_at" = CURRENT_TIMESTAMP
          WHERE "id" = $4;
    `;
    const updatePropertyValues = [holdingPeriod, purchasePrice, afterRepairValue, propertyId]
    const updatePropertyResult = await connection.query(updatePropertyText, updatePropertyValues)

    const mortgageCalcSqlText = `
      SELECT * FROM "mortgage_calculations"
      WHERE "property_id" = $1;
    `
    const mortgageCalcResponse = await connection.query(mortgageCalcSqlText, [propertyId])
    const mortgageCalcData = mortgageCalcResponse.rows[0];
    console.log('mortgageCalcData:', mortgageCalcData);
    const downPayment= mortgageCalcData.down_payment;
    const closingCosts = mortgageCalcData.closing_costs;
    const interestPaymentMonthly = mortgageCalcData.interest_payment_monthly;
    const totalMonthlyHoldingCost = Number(interestPaymentMonthly) + Number(monthlyHoldingCost);
    

    // ================ SQL update table: PROPERTIES
    const totalUpfrontCost = upfrontCost(totalRepairs, purchasePrice, downPayment, closingCosts);
    const cost = totalCost(totalRepairs, purchasePrice, holdingPeriod, monthlyHoldingCost);
    const holdingCost = totalHoldingCost(holdingPeriod, totalMonthlyHoldingCost);
    const totalProfit = profit(afterRepairValue, totalRepairs, purchasePrice, holdingPeriod, monthlyHoldingCost);
    const totalMonthlyProfit = monthlyProfit(afterRepairValue, totalRepairs, purchasePrice, holdingPeriod, monthlyHoldingCost);
    

    const updatePropertiesText = `
    UPDATE "properties"
      SET "total_repair_cost" = $1,
          "total_upfront_cost" = $2,
          "monthly_holding_cost" = $3,
          "total_holding_cost" = $4,
          "total_cost" = $5,
          "profit" = $6,
          "monthly_profit" = $7
      WHERE "id" = $8;
`;
const updatePropertiesValues = [totalRepairs, totalUpfrontCost, monthlyHoldingCost, holdingCost, cost, totalProfit, totalMonthlyProfit, propertyId];
const updatePropertiesResults = await connection.query(updatePropertiesText, updatePropertiesValues);


    await connection.query('Commit;')
    res.sendStatus(201)

  } catch(err) {
      console.log('Update property failed: ', err);
      await connection.query('Rollback;')
      res.sendStatus(500);
    } finally {
      await connection.release()
    }
  });


  /**
 * ----- GET property of interest: getPropertyOfInterest
 */
router.get('/propertyOfInterest/:id', rejectUnauthenticated, async (req, res) => {
  // console.log('in the /api/properties/propertyOfInterest/id route: ', req.params.id);  
  
  let connection;
  try {

    connection = await pool.connect()
    await connection.query('BEGIN;')

    const propertyId = req.params.id;
    

    //requests specific property info from the properties table
    const propertyText = `
      SELECT * FROM "properties"
        WHERE "properties"."id" = $1;
    `;
    const propertyValue = [propertyId]
    const propertyResult = await connection.query(propertyText, propertyValue);
    // console.log('database reponse to property: ', propertyResult.rows)


    // request repair items for specific property
    const repairItemText = `
      SELECT 
        "repair_items"."id" AS "id",
        "properties"."id" AS "property_id",
        "repair_items"."name" AS "repair_name",
        "repair_items"."cost" AS "repair_cost" 
        FROM "properties"
        JOIN "repair_items"
          ON "properties"."id" = "repair_items"."property_id"
        WHERE "properties"."id" = $1;
    `;
    const repairItemValue = [propertyId]
    const repairItemResult = await connection.query(repairItemText, repairItemValue);
    // console.log('database reponse to repairItem: ', repairItemResult.rows)

  
      //request holding items for specific property
      const holdingItemText = `
        SELECT 
          "holding_items"."id" AS "id",
          "properties"."id" AS "property_id",
          "holding_items"."name" AS "holding_name",
          "holding_items"."cost" AS "holding_cost" 
          FROM "properties"
          JOIN "holding_items"
            ON "properties"."id" = "holding_items"."property_id"
          WHERE "properties"."id" = $1;
    `;
    const holdingItemValue = [propertyId]
    const holdingItemResult = await connection.query(holdingItemText, holdingItemValue);
    // console.log('database reponse to holdingItem: ', holdingItemResult.rows)


    await connection.query('COMMIT;')

    const propertyData = {
      property : propertyResult.rows,
      repairItems : repairItemResult.rows,
      holdingItems : holdingItemResult.rows
    }

    res.send(propertyData)
  } catch (error) {
    console.log('error in /api/properties/propertyOfInterest/id GET route: ', error)
    await connection.query('ROLLBACK;')
    res.sendStatus(500);
  } finally {
    await connection.release()
  }

});


  /**
 * ----- PUT back to default: updateBackToDefault
 */
router.put('/backToDefault/:id', async (req, res) => {
  console.log('params.id:', req.params.id);
  const propertyId = req.params.id;
  const userId = req.user.id;
  const connection = await pool.connect()
  const api_key = process.env.RENTCAST_API_KEY;
  let propertyApiId;
  let formattedAddress;
  let purchasePrice;
  let afterRepairValue;
  let listingResponse = {};
  let recordsResponse = {};
  let valueEstimateResponse = {};
  let taxYear;
  let address;

  try {
    await connection.query('BEGIN;')

    // ================ SQL delete holding items
    const deleteHoldingItemsSqlText = `
      DELETE FROM "holding_items"
        WHERE "property_id" = $1;
    `
    const deleteHoldingItemsResponse = await pool.query(deleteHoldingItemsSqlText, [propertyId])



    // ================ SQL delete repair items
    const deleteRepairItemsSqlText = `
      DELETE FROM "repair_items"
        WHERE "property_id" = $1;
    `
    const deleteRepairItemsResponse = await pool.query(deleteRepairItemsSqlText, [propertyId])



    // ================ SQL get address
    const getAddressSqlText = `
      SELECT * FROM "properties"
        WHERE "id" = $1;
    `
    const getAddressResponse = await pool.query(getAddressSqlText, [propertyId])
    console.log('get address response: ', getAddressResponse.rows)
    propertyApiId = getAddressResponse.rows[0].property_api_id;



    // ========================== RECALLING API && CHECKING TIMESTAMP ==========================
    const checkTimeStampSqlText = `
        SELECT * FROM "property_api_data"
            WHERE "inserted_at" >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
            AND "id" = $1;
    `
    const checkTimeStampResults = await pool.query(checkTimeStampSqlText, [propertyApiId]);
    const checkTimeStampData = checkTimeStampResults.rows;
    console.log('checkTimeStampData is:', checkTimeStampData);
      
  
  
    if (checkTimeStampData.length === 0) {
      // ================ Axios for VALUE ESTIMATE (afterRepairValue)
      const theValueEstimateResponse = await axios({
        method: 'GET',
        url: `https://api.rentcast.io/v1/avm/value?address=${address}&limit=1&compCount=5`,
        headers: {
            'accept': 'application/json',
            'X-Api-Key': api_key
        }
      })
      valueEstimateResponse = theValueEstimateResponse;
      purchasePrice = Number(valueEstimateResponse.data.price);
      afterRepairValue = Number(valueEstimateResponse.data.priceRangeHigh);
      console.log("Data from valueEstimateResponse:", valueEstimateResponse.data);



      // ================ Axios for RECORDS (taxesYearly)
      const theRecordsResponse = await axios({
        method: 'GET',
        url: `https://api.rentcast.io/v1/properties?address=${address}&limit=1`,
        headers: {
            'accept': 'application/json',
            'X-Api-Key': api_key
        }
      })
      recordsResponse = theRecordsResponse;
      console.log("Data from recordsResponse:", recordsResponse.data);


      // ================ Axios for LISTING
      formattedAddress = recordsResponse.data[0].formattedAddress;

      try {
        const theListingResponse = await axios({
          method: 'GET',
          url: `https://api.rentcast.io/v1/listings/sale?address=${formattedAddress}&limit=1`,
          headers: {
              'accept': 'application/json',
              'X-Api-Key': api_key
          }
        })
        listingResponse = theListingResponse;

      } catch(error) {
        console.log('Address cannot be found in listing.');

        listingResponse = {data: [{
          formattedAddress: formattedAddress,
          price: purchasePrice,
          propertyType: (recordsResponse.data[0].propertyType ? recordsResponse.data[0].propertyType : 'Single Family'),
          bedrooms: (recordsResponse.data[0].bedrooms ? recordsResponse.data[0].bedrooms : 3),
          bathrooms: (recordsResponse.data[0].bathrooms ? recordsResponse.data[0].bathrooms : 2),
          squareFootage: (recordsResponse.data[0].squareFootage ? recordsResponse.data[0].squareFootage : 1500)
        }]}
      }
      console.log("Data from listingResponse:", listingResponse.data);



      // ================ SQL insert into table: PROPERTY_API_DATA
      const lastYear = new Date().getFullYear() - 1;
      taxYear = recordsResponse.data[0].propertyTaxes;
      
      if (!taxYear) {
          taxYear = null;
      } else if (taxYear) {
          taxYear = recordsResponse.data[0].propertyTaxes[`${lastYear}`].total;
      }
          
      const propertyApiData = [
          listingResponse.data[0].formattedAddress,
          listingResponse.data[0].price,
          taxYear,
          valueEstimateResponse.data.priceRangeHigh,
          listingResponse.data[0].propertyType,
          listingResponse.data[0].bedrooms,
          listingResponse.data[0].bathrooms,
          listingResponse.data[0].squareFootage
      ]

      const propertyApiDataSqlText = `
          INSERT INTO "property_api_data"
          ("address", "purchase_price", "taxes_yearly", "after_repair_value", 
          "property_type", "bedrooms", "bathrooms", "square_footage")
          VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING "id";
      `
      const propertyApiDataResults = await pool.query(propertyApiDataSqlText, propertyApiData);
      propertyApiId = propertyApiDataResults.rows[0].id;

    } else if (checkTimeStampData.length > 0) {
      console.log('Property already exists in database!');
      const mostRecentCheck = checkTimeStampData.length - 1;

      propertyApiId = checkTimeStampData[mostRecentCheck].id;
      formattedAddress = checkTimeStampData[mostRecentCheck].address;
      purchasePrice = Number(checkTimeStampData[mostRecentCheck].purchase_price);
      afterRepairValue = Number(checkTimeStampData[mostRecentCheck].after_repair_value);
      taxYear = Number(checkTimeStampData[mostRecentCheck].taxes_yearly)
    }


    // ================ SQL insert into table: HOLDING
    const getDefaultHoldingsText = `
      SELECT * FROM "default_holdings"
        WHERE "user_id" = $1;
    `;
    const getDefaultHoldingsResults = await pool.query(getDefaultHoldingsText, [userId]);
    console.log('getDefaultHoldingsResult: ', getDefaultHoldingsResults.rows)

    for(let holdingItem of getDefaultHoldingsResults.rows) {
      const addHoldingItemText = `
        INSERT INTO "holding_items"
          ("property_id", "name", "cost")
          VALUES
          ($1, $2, $3);
      `;
      const addHoldingItemValues = [propertyId, holdingItem.holding_name, holdingItem.holding_cost];
      const addHoldingItemResults = await pool.query(addHoldingItemText, addHoldingItemValues);
    }


    // ================ SQL sum holding cost: HOLDING
    const totalHoldingCostText = `
    SELECT 
      SUM("default_holdings"."holding_cost") AS "monthly_holding_total"
      FROM "default_holdings"
      WHERE "user_id" = $1;
    `;
    const totalHoldingCostValues = [userId];
    const totalHoldingCostResults = await connection.query(totalHoldingCostText, totalHoldingCostValues);
    console.log('sum of holding items. expected: 200', totalHoldingCostResults.rows);
    console.log('tax Year: ', taxYear)
    const monthlyHoldingCost = Number(totalHoldingCostResults.rows[0].monthly_holding_total) + (Number(taxYear) / 12);
    console.log('monthly holding cost: ', monthlyHoldingCost)


    // ================ SQL insert into table: REPAIR
    const getDefaultRepairsText = `
    SELECT * FROM "default_repairs"
      WHERE "user_id" = $1;
    `;
    const getDefaultRepairsResults = await pool.query(getDefaultRepairsText, [userId]);
    console.log('getDefaultRepairsResult: ', getDefaultRepairsResults.rows)

    for(let repairItem of getDefaultRepairsResults.rows) {
      const addRepairItemText = `
        INSERT INTO "repair_items"
          ("property_id", "name", "cost")
          VALUES
          ($1, $2, $3);
      `;
      const addRepairItemValues = [propertyId, repairItem.repair_name, repairItem.repair_cost];
      const addRepairItemResults = await pool.query(addRepairItemText, addRepairItemValues);
    }

     // ================ SQL sum repair cost: REPAIR
    const totalRepairCostText = `
    SELECT 
      SUM("default_repairs"."repair_cost") AS "total_repair_cost"
      FROM "default_repairs"
      WHERE "user_id" = $1;
    `;
    const totalRepairCostValues = [userId];
    const totalRepairCostResults = await connection.query(totalRepairCostText, totalRepairCostValues);
    console.log('sum of repair items. expected: 200', totalRepairCostResults.rows[0].total_repair_cost)
    const totalRepairs = Number(totalRepairCostResults.rows[0].total_repair_cost)

     // ================ SQL select default holding period: USER
    const getDefaultHoldingPeriodText = `
    SELECT 
      "user"."holding_period_default" AS "defaultHoldingPeriod"
      FROM "user"
      WHERE "id" = $1;
    `;
    const getDefaultHoldingPeriodResults = await connection.query(getDefaultHoldingPeriodText, [userId]);
    console.log('getDefaultHoldingPeriodResult: ', getDefaultHoldingPeriodResults.rows)
    const defaultHoldingPeriod = Number(getDefaultHoldingPeriodResults.rows[0].defaultHoldingPeriod)

      // ================ SQL update table: PROPERTIES
      const totalUpfrontCost = upfrontCost(totalRepairs, purchasePrice);
      const cost = totalCost(totalRepairs, purchasePrice, defaultHoldingPeriod, monthlyHoldingCost);
      const holdingCost = totalHoldingCost(defaultHoldingPeriod, monthlyHoldingCost);
      const totalProfit = profit(afterRepairValue, totalRepairs, purchasePrice, defaultHoldingPeriod, monthlyHoldingCost);
      const totalMonthlyProfit = monthlyProfit(afterRepairValue, totalRepairs, purchasePrice, defaultHoldingPeriod, monthlyHoldingCost);
      
      purchasePrice,
        taxYear,
        afterRepairValue
      const updatePropertiesText = `
        UPDATE "properties"
          SET "total_repair_cost" = $1,
              "total_upfront_cost" = $2,
              "monthly_holding_cost" = $3,
              "total_holding_cost" = $4,
              "total_cost" = $5,
              "profit" = $6,
              "monthly_profit" = $7,
              "holding_period" = $8,
              "purchase_price" = $9,
              "taxes_yearly" = $10,
              "after_repair_value" = $11
            WHERE "id" = $12;
      `;
  
      const updatePropertiesValues = [totalRepairs, totalUpfrontCost, monthlyHoldingCost, holdingCost, cost, totalProfit, totalMonthlyProfit, defaultHoldingPeriod, purchasePrice, taxYear, afterRepairValue, propertyId];
  
      const updatePropertiesResults = await connection.query(updatePropertiesText, updatePropertiesValues);
  
      console.log('Property updated in database!');

    
    await connection.query('Commit;');
    console.log('Back to default done and API calls updated');
    res.sendStatus(200)


    // ========================== IF NOT CALLING API, SEND THIS ==========================
    // res.send({address: addressResult, userId: userId});

  } catch (error) {
    console.log('Update back to default failed:', error);
    await connection.query('Rollback;')
    res.sendStatus(500);
  } finally {
    await connection.release()
  }
})



// ===================== Repair Item =====================
/**
 * DELETE property repair item
 */
router.delete('/repairItem/:id', async (req, res) => {
  const itemId = req.params.id;
  console.log('item id: ', itemId)

  let connection;
  try {
    connection = await pool.connect()
    await connection.query('BEGIN;')

    //select item to be deleted to retrieve item cost
    const selectRepairItemText = `
    SELECT * FROM "repair_items"
      WHERE "id" = $1;
    `; 
    const selectRepairItemResponse = await connection.query(selectRepairItemText, [itemId])
    console.log('repair item: ', selectRepairItemResponse)
    const repairItemCost = selectRepairItemResponse.rows[0].cost;
    const propertyId = selectRepairItemResponse.rows[0].property_id

    //delete repair item from database
    const removeRepairItemText = `
      DELETE FROM "repair_items"
        WHERE "id" = $1;
    `; 
    const removeHoldingItemResponse = await connection.query(removeRepairItemText, [itemId])

     //update all the calculations based on this update to the reparir item table

    //get the values needed for the calculation functions
    const propertyInfoText = `
    SELECT 
      "total_repair_cost",
      "monthly_holding_cost",
      "purchase_price",
      "holding_period",
      "taxes_yearly",
      "after_repair_value"
      FROM "properties"
      WHERE "id" = $1;
    `;
    const propertyInfoValues = [propertyId];
    const propertyInfoResults = await connection.query(propertyInfoText, propertyInfoValues);
    console.log('propertyInfoResults: ', propertyInfoResults.rows[0])
    const totalRepairs = Number(propertyInfoResults.rows[0].total_repair_cost) - Number(repairItemCost);
    const monthlyHoldingCost = Number(propertyInfoResults.rows[0].monthly_holding_cost);
    const purchasePrice = Number(propertyInfoResults.rows[0].purchase_price);
    const holdingPeriod = Number(propertyInfoResults.rows[0].holding_period);
    const afterRepairValue = Number(propertyInfoResults.rows[0].after_repair_value);

    // ================ SQL update table: PROPERTIES
    const totalUpfrontCost = upfrontCost(totalRepairs, purchasePrice);
    const cost = totalCost(totalRepairs, purchasePrice, holdingPeriod, monthlyHoldingCost);
    const holdingCost = totalHoldingCost(holdingPeriod, monthlyHoldingCost);
    const totalProfit = profit(afterRepairValue, totalRepairs, purchasePrice, holdingPeriod, monthlyHoldingCost);
    const totalMonthlyProfit = monthlyProfit(afterRepairValue, totalRepairs, purchasePrice, holdingPeriod, monthlyHoldingCost);
    

    const updatePropertiesText = `
    UPDATE "properties"
       SET "total_repair_cost" = $1,
           "total_upfront_cost" = $2,
           "monthly_holding_cost" = $3,
           "total_holding_cost" = $4,
           "total_cost" = $5,
           "profit" = $6,
           "monthly_profit" = $7
       WHERE "id" = $8;
 `;

 const updatePropertiesValues = [totalRepairs, totalUpfrontCost, monthlyHoldingCost, holdingCost, cost, totalProfit, totalMonthlyProfit, propertyId];

 const updatePropertiesResults = await connection.query(updatePropertiesText, updatePropertiesValues);

    await connection.query('Commit;')
    res.sendStatus(201)

  } catch(err) {
      console.log('Delete repair item failed: ', err);
      await connection.query('Rollback;')
      res.sendStatus(500);
    } finally {
      await connection.release()
    }
});


/**
 * POST property repair item
 */
router.post('/repairItem/', async (req, res) => {
  const propertyId = req.body.propertyId;
  const repairName = req.body.repairName;
  const repairCost = req.body.repairCost;

  let connection;
  try {
    connection = await pool.connect()
    await connection.query('BEGIN;')

    //add the reapir item to the repair_items table in the database
    const addRepairItemText = `
      INSERT INTO "repair_items"
        ("property_id", "name", "cost")
        VALUES
        ($1, $2, $3);
    `; 
    const addRepairItemResponse = await connection.query(addRepairItemText, [propertyId, repairName, repairCost])

    //update all the calculations based on this update to the reparir item table

    //get the values needed for the calculation functions
    const propertyInfoText = `
    SELECT 
      "total_repair_cost",
      "monthly_holding_cost",
      "purchase_price",
      "holding_period",
      "taxes_yearly",
      "after_repair_value"
      FROM "properties"
      WHERE "id" = $1;
    `;
    const propertyInfoValues = [propertyId];
    const propertyInfoResults = await connection.query(propertyInfoText, propertyInfoValues);
    console.log('propertyInfoResults: ', propertyInfoResults.rows[0])
    const totalRepairs = Number(propertyInfoResults.rows[0].total_repair_cost) + Number(repairCost);
    const monthlyHoldingCost = Number(propertyInfoResults.rows[0].monthly_holding_cost);
    const purchasePrice = Number(propertyInfoResults.rows[0].purchase_price);
    const holdingPeriod = Number(propertyInfoResults.rows[0].holding_period);
    const monthlyTaxes = Number(propertyInfoResults.rows[0].taxes_yearly) / 12;
    const afterRepairValue = Number(propertyInfoResults.rows[0].after_repair_value);

    // ================ SQL update table: PROPERTIES
    const totalUpfrontCost = upfrontCost(totalRepairs, purchasePrice);
    const cost = totalCost(totalRepairs, purchasePrice, holdingPeriod, monthlyTaxes, monthlyHoldingCost);
    const holdingCost = totalHoldingCost(holdingPeriod, monthlyTaxes, monthlyHoldingCost);
    const totalProfit = profit(afterRepairValue, totalRepairs, purchasePrice, holdingPeriod, monthlyTaxes, monthlyHoldingCost);
    const totalMonthlyProfit = monthlyProfit(afterRepairValue, totalRepairs, purchasePrice, holdingPeriod, monthlyTaxes, monthlyHoldingCost);
    

    const updatePropertiesText = `
    UPDATE "properties"
       SET "total_repair_cost" = $1,
           "total_upfront_cost" = $2,
           "monthly_holding_cost" = $3,
           "total_holding_cost" = $4,
           "total_cost" = $5,
           "profit" = $6,
           "monthly_profit" = $7
       WHERE "id" = $8;
 `;

 const updatePropertiesValues = [totalRepairs, totalUpfrontCost, monthlyHoldingCost, holdingCost, cost, totalProfit, totalMonthlyProfit, propertyId];

 const updatePropertiesResults = await connection.query(updatePropertiesText, updatePropertiesValues);

    await connection.query('Commit;')
    res.sendStatus(201)

  } catch(err) {
      console.log('Add repair item failed: ', err);
      await connection.query('Rollback;')
      res.sendStatus(500);
    } finally {
      await connection.release()
    }
});



// ===================== Holding Item =====================
/**
 * DELETE property holding item
 */
router.delete('/holdingItem/:id', async (req, res) => {
  const itemId = req.params.id;

  let connection;
  try {
    connection = await pool.connect()
    await connection.query('BEGIN;')

    //select item to be deleted to retrieve item cost
    const selectHoldingItemText = `
       SELECT * FROM "holding_items"
         WHERE "id" = $1;
     `; 
     const selectHoldingItemResponse = await connection.query(selectHoldingItemText, [itemId])
     console.log('repair item: ', selectHoldingItemResponse)
     const holdingItemCost = selectHoldingItemResponse.rows[0].cost;
     const propertyId = selectHoldingItemResponse.rows[0].property_id

    const removeHoldingItemText = `
      DELETE FROM "holding_items"
        WHERE "id" = $1;
    `; 
   const removeHoldingItemResult = connection.query(removeHoldingItemText, [itemId])

    //update all the calculations based on this update to the reparir item table

    //get the values needed for the calculation functions
    const propertyInfoText = `
    SELECT 
      "total_repair_cost",
      "monthly_holding_cost",
      "purchase_price",
      "holding_period",
      "taxes_yearly",
      "after_repair_value"
      FROM "properties"
      WHERE "id" = $1;
    `;
    const propertyInfoValues = [propertyId];
    const propertyInfoResults = await connection.query(propertyInfoText, propertyInfoValues);
    console.log('propertyInfoResults: ', propertyInfoResults.rows[0])
    const totalRepairs = Number(propertyInfoResults.rows[0].total_repair_cost);
    const monthlyHoldingCost = Number(propertyInfoResults.rows[0].monthly_holding_cost) - Number(holdingItemCost);
    const purchasePrice = Number(propertyInfoResults.rows[0].purchase_price);
    const holdingPeriod = Number(propertyInfoResults.rows[0].holding_period);
    const monthlyTaxes = Number(propertyInfoResults.rows[0].taxes_yearly) / 12;
    const afterRepairValue = Number(propertyInfoResults.rows[0].after_repair_value);

    // ================ SQL update table: PROPERTIES
    const totalUpfrontCost = upfrontCost(totalRepairs, purchasePrice);
    const cost = totalCost(totalRepairs, purchasePrice, holdingPeriod, monthlyHoldingCost);
    const holdingCost = totalHoldingCost(holdingPeriod, monthlyHoldingCost);
    const totalProfit = profit(afterRepairValue, totalRepairs, purchasePrice, holdingPeriod, monthlyHoldingCost);
    const totalMonthlyProfit = monthlyProfit(afterRepairValue, totalRepairs, purchasePrice, holdingPeriod, monthlyHoldingCost);
    

    const updatePropertiesText = `
    UPDATE "properties"
       SET "total_repair_cost" = $1,
           "total_upfront_cost" = $2,
           "monthly_holding_cost" = $3,
           "total_holding_cost" = $4,
           "total_cost" = $5,
           "profit" = $6,
           "monthly_profit" = $7
       WHERE "id" = $8;
 `;

 const updatePropertiesValues = [totalRepairs, totalUpfrontCost, monthlyHoldingCost, holdingCost, cost, totalProfit, totalMonthlyProfit, propertyId];

 const updatePropertiesResults = await connection.query(updatePropertiesText, updatePropertiesValues);

    await connection.query('Commit;')
    res.sendStatus(201)

  } catch(err) {
      console.log('delete holding item failed: ', err);
      await connection.query('Rollback;')
      res.sendStatus(500);
    } finally {
      await connection.release()
  }
});


/**
 * POST property holding item
 */
router.post('/holdingItem', async (req, res) => {
  const propertyId = req.body.propertyId;
  const holdingName = req.body.holdingName;
  const itemHoldingCost = req.body.holdingCost;

  let connection;
  try {
    connection = await pool.connect()
    await connection.query('BEGIN;')

  const sqlText = `
    INSERT INTO "holding_items"
      ("property_id", "name", "cost")
      VALUES
      ($1, $2, $3);
  `; 
  const sqlResponse = await connection.query(sqlText, [propertyId, holdingName, itemHoldingCost])

     //update all the calculations based on this update to the reparir item table

    //get the values needed for the calculation functions
    const propertyInfoText = `
    SELECT 
      "total_repair_cost",
      "monthly_holding_cost",
      "purchase_price",
      "holding_period",
      "taxes_yearly",
      "after_repair_value"
      FROM "properties"
      WHERE "id" = $1;
    `;
    const propertyInfoValues = [propertyId];
    const propertyInfoResults = await connection.query(propertyInfoText, propertyInfoValues);
    console.log('propertyInfoResults: ', propertyInfoResults.rows[0])
    const totalRepairs = Number(propertyInfoResults.rows[0].total_repair_cost);
    const monthlyHoldingCost = Number(propertyInfoResults.rows[0].monthly_holding_cost) + Number(itemHoldingCost);
    const purchasePrice = Number(propertyInfoResults.rows[0].purchase_price);
    const holdingPeriod = Number(propertyInfoResults.rows[0].holding_period);
    const monthlyTaxes = Number(propertyInfoResults.rows[0].taxes_yearly) / 12;
    const afterRepairValue = Number(propertyInfoResults.rows[0].after_repair_value);

    // ================ SQL update table: PROPERTIES
    const totalUpfrontCost = upfrontCost(totalRepairs, purchasePrice);
    const cost = totalCost(totalRepairs, purchasePrice, holdingPeriod, monthlyHoldingCost);
    const holdingCost = totalHoldingCost(holdingPeriod, monthlyHoldingCost);
    const totalProfit = profit(afterRepairValue, totalRepairs, purchasePrice, holdingPeriod, monthlyHoldingCost);
    const totalMonthlyProfit = monthlyProfit(afterRepairValue, totalRepairs, purchasePrice, holdingPeriod, monthlyHoldingCost);
    

    const updatePropertiesText = `
    UPDATE "properties"
       SET "total_repair_cost" = $1,
           "total_upfront_cost" = $2,
           "monthly_holding_cost" = $3,
           "total_holding_cost" = $4,
           "total_cost" = $5,
           "profit" = $6,
           "monthly_profit" = $7
       WHERE "id" = $8;
 `;
 const updatePropertiesValues = [totalRepairs, totalUpfrontCost, monthlyHoldingCost, holdingCost, cost, totalProfit, totalMonthlyProfit, propertyId];
 const updatePropertiesResults = await connection.query(updatePropertiesText, updatePropertiesValues);

    await connection.query('Commit;')
    res.sendStatus(201)

  } catch(err) {
      console.log('Add holding item failed: ', err);
      await connection.query('Rollback;')
      res.sendStatus(500);
    } finally {
      await connection.release()
    }
});

//changes the taxes value to 0 in the properties table
router.put('/taxes', async (req, res) => {
  console.log('/api/properties/taxes RECEIVED A REQUEST!!!!!!!!!!!!!!!!!!!!')
  const propertyId = req.body.propertyId;

  let connection;
  try {
    connection = await pool.connect()
    await connection.query('BEGIN;')

    //get the value of the yearly taxes from the properties table
    const getTaxesText = `
      SELECT
        "taxes_yearly"
        FROM "properties"
        WHERE "id" = $1  
    `;
    const getTaxesResult = await connection.query(getTaxesText, [propertyId]);
    const taxes = getTaxesResult.rows[0].taxes_yearly
    console.log('taxes: ', getTaxesResult.rows[0]);

    //update the taxes value to zero
    const updateTaxesText = `
      UPDATE "properties"
        SET "taxes_yearly" = 0
        WHERE "id" = $1;
    `; 
    const updateTaxesResponse = await connection.query(updateTaxesText, [propertyId])
    
    //update all the calculations based on this update to the reparir item table

    //get the values needed for the calculation functions
    const propertyInfoText = `
    SELECT 
      "total_repair_cost",
      "monthly_holding_cost",
      "purchase_price",
      "holding_period",
      "taxes_yearly",
      "after_repair_value"
      FROM "properties"
      WHERE "id" = $1;
    `;
    const propertyInfoValues = [propertyId];
    const propertyInfoResults = await connection.query(propertyInfoText, propertyInfoValues);

    const totalRepairs = Number(propertyInfoResults.rows[0].total_repair_cost);
    const monthlyHoldingCost = Number(propertyInfoResults.rows[0].monthly_holding_cost) - (Number(taxes) / 12);
    console.log('monthly holding cost: ', monthlyHoldingCost)
    const purchasePrice = Number(propertyInfoResults.rows[0].purchase_price);
    const holdingPeriod = Number(propertyInfoResults.rows[0].holding_period);
    const monthlyTaxes = Number(propertyInfoResults.rows[0].taxes_yearly) / 12;
    const afterRepairValue = Number(propertyInfoResults.rows[0].after_repair_value);

    // ================ SQL update table: PROPERTIES
    const totalUpfrontCost = upfrontCost(totalRepairs, purchasePrice);
    const cost = totalCost(totalRepairs, purchasePrice, holdingPeriod, monthlyHoldingCost);
    const holdingCost = totalHoldingCost(holdingPeriod, monthlyHoldingCost);
    const totalProfit = profit(afterRepairValue, totalRepairs, purchasePrice, holdingPeriod, monthlyHoldingCost);
    const totalMonthlyProfit = monthlyProfit(afterRepairValue, totalRepairs, purchasePrice, holdingPeriod, monthlyHoldingCost);
    

    const updatePropertiesText = `
    UPDATE "properties"
      SET "total_repair_cost" = $1,
          "total_upfront_cost" = $2,
          "monthly_holding_cost" = $3,
          "total_holding_cost" = $4,
          "total_cost" = $5,
          "profit" = $6,
          "monthly_profit" = $7
      WHERE "id" = $8;
    `;
    const updatePropertiesValues = [totalRepairs, totalUpfrontCost, monthlyHoldingCost, holdingCost, cost, totalProfit, totalMonthlyProfit, propertyId];
    const updatePropertiesResults = await connection.query(updatePropertiesText, updatePropertiesValues);


    await connection.query('Commit;')
    res.sendStatus(201)

  } catch(err) {
      console.log('Update taxes failed: ', err);
      await connection.query('Rollback;')
      res.sendStatus(500);
    } finally {
      await connection.release()
    }
});


router.get('/filtered/:orderBy/:arrange', async (req, res) => {
  console.log('in get properties/filtered ', req.params);
  const orderBy = req.params.orderBy;
  const arrange = req.params.arrange;
  const userId = req.user.id;
  let properties;

  let connection;
  try{

    connection = await pool.connect()
    await connection.query('BEGIN;')

    if(arrange === 'ASC') {
      if(orderBy === 'monthly_profit') {
        // console.log('asc')
        const propertiesText = `
            SELECT * FROM "properties"
                WHERE "user_id" = $1
                ORDER BY "monthly_profit" ASC;
        `;
        const propertiesResult = await connection.query(propertiesText, [userId])
        properties = propertiesResult.rows
        // console.log('properties: ', properties)
      }
      else if (orderBy === 'total_cost'){
        const propertiesText = `
            SELECT * FROM "properties"
                WHERE "user_id" = $1
                ORDER BY "total_cost" ASC;
        `;
        const propertiesResult = await connection.query(propertiesText, [userId])
        properties = propertiesResult.rows
      }
    }
    else if(arrange === 'DESC') {
      if(orderBy === 'monthly_profit') {
        // console.log('asc')
        const propertiesText = `
            SELECT * FROM "properties"
                WHERE "user_id" = $1
                ORDER BY "monthly_profit" DESC;
        `;
        const propertiesResult = await connection.query(propertiesText, [userId])
        properties = propertiesResult.rows
        // console.log('properties: ', properties)
      }
      else if (orderBy === 'total_cost'){
        const propertiesText = `
            SELECT * FROM "properties"
                WHERE "user_id" = $1
                ORDER BY "total_cost" DESC;
        `;
        const propertiesResult = await connection.query(propertiesText, [userId])
        properties = propertiesResult.rows
      }
      else if (orderBy === 'inserted_at'){
        const propertiesText = `
            SELECT * FROM "properties"
                WHERE "user_id" = $1
                ORDER BY "inserted_at" DESC;
        `;
        const propertiesResult = await connection.query(propertiesText, [userId])
        properties = propertiesResult.rows
      }
    }

    await connection.query('Commit;')
    res.send(properties);
    
  }catch(err) {
    console.log('GET properties filtered failed: ', err);
    await connection.query('Rollback;')
    res.sendStatus(500);
  } finally {
    await connection.release()
  }
});


// 12505 54th Ave N, 
// 4008 5th st ne, columbia heights, mn



module.exports = router;