const express = require('express');
const pool = require('../modules/pool');
const router = express.Router();
const axios = require('axios');

const formattedCurrency = (value) => {
    const number = parseFloat(value);
    return `$${number.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

// ===================== INTEREST RATE/CALCULATOR =====================
/**
 * POST interest rate from API && send data
 */
router.post('/:id', async (req, res) => {
    const api_key = process.env.MORTGAGE_CALCULATOR_API_KEY;
    const userId = req.user.id;
    const propertyId = req.params.id;

    let defaultLoanTerm = 30;
    let interestRate;
    let purchasePrice;
    let downPayment;
    let closingCosts;
    let baseLoanAmount;
    let interestRateAnnual;
    let interestRateInsertedAt;
    let interestRateMonthly;
    let interestDecimalMonthly;
    let interestPaymentMonthly;
    let mortgageCalculationsId;

    console.log('propertyId:', propertyId);
    let connection;
    try { 
        connection = await pool.connect()
        await connection.query('BEGIN;')

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



        // ================ Get PURCHASE PRICE
        const propertyDataSqlText = `
        SELECT * FROM "properties"
            WHERE "id" = $1;
        `
        const propertyDataResponse = await connection.query(propertyDataSqlText, [propertyId])
        purchasePrice = propertyDataResponse.rows[0].purchase_price;
        // console.log('purchasePrice:', purchasePrice);


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
        // console.log('finalMortgageCalculationsData:', finalMortgageCalculationsData);
        
        await connection.query('Commit;')
        res.send(finalMortgageCalculationsData);

    } catch (error) {
        console.log('Post and get interest rate, calculate and data failed: ', error);
        await connection.query('Rollback;')
        res.sendStatus(500);
    } finally {
        await connection.release()
    }
})

/**
 * PUT update calculations
 */
router.put('/:id', async (req, res) => {
    const api_key = process.env.MORTGAGE_CALCULATOR_API_KEY;
    const userId = req.user.id;
    const propertyId = req.params.id;
    
    let downPayment = req.body.downPayment;
    let downPaymentPercentage = req.body.downPaymentPercentage;
    let closingCosts = req.body.closingCosts;
    let closingCostsPercentage = req.body.closingCostsPercentage;
    let interestRate;
    let defaultLoanTerm = 30;
    let purchasePrice;
    let baseLoanAmount;
    let totalInterestPaid;
    let interestRateAnnual;
    let interestRateMonthly;
    let interestDecimalMonthly;
    let interestPaymentMonthly;

    console.log('req.body data:', req.body);
    let connection;
    try {
        connection = await pool.connect()
        await connection.query('BEGIN;')
    
        // ========================== CALLING API && CHECKING DEFAULT CALCULATIONS TIMESTAMP ==========================
        // ================ Get PURCHASE PRICE
        const propertyDataSqlText = `
        SELECT * FROM "properties"
            WHERE "id" = $1;
        `
        const propertyDataResponse = await pool.query(propertyDataSqlText, [propertyId])
        purchasePrice = propertyDataResponse.rows[0].purchase_price;
        // console.log('purchasePrice:', purchasePrice);



        // ================ Get MORTGAGE CALCULATOR && check data
        const getMortgageCalculationsSqlText = `
            SELECT * FROM "mortgage_calculations"
                WHERE "property_id" = $1;
        `
        const getMortgageCalculationsResponse = await pool.query(getMortgageCalculationsSqlText, [propertyId]);
        const mortgageCalculationsSqlData = getMortgageCalculationsResponse.rows[0]
        // console.log('mortgageCalculationsSqlData:', mortgageCalculationsSqlData);
        
        const mortgageCalculationsDataObject = {
            interest_rate: interestRate,
            down_payment: downPayment,
            down_payment_percentage: downPaymentPercentage,
            base_loan_amount: baseLoanAmount,
            closing_costs: closingCosts,
            closing_costs_percentage: closingCostsPercentage,
        }

        const newMortgageCalculationsDataObject = checkmortgageCalculationsData(mortgageCalculationsDataObject, mortgageCalculationsSqlData, purchasePrice)
        // console.log('newMortgageCalculationsDataObject:', newMortgageCalculationsDataObject);

        interestRate = newMortgageCalculationsDataObject.interestRate;
        // loanTerm = newMortgageCalculationsDataObject.loanTerm;
        downPayment = newMortgageCalculationsDataObject.downPayment;
        downPaymentPercentage = newMortgageCalculationsDataObject.downPaymentPercentage;
        baseLoanAmount = newMortgageCalculationsDataObject.baseLoanAmount;
        closingCosts = newMortgageCalculationsDataObject.closingCosts;
        closingCostsPercentage = newMortgageCalculationsDataObject.closingCostsPercentage;
        

        // ================ Axios for MORTGAGE CALCULATOR API
        const mortgageCalculatorResponse = await axios({
            method: 'GET',
            url: `https://api.api-ninjas.com/v1/mortgagecalculator?loan_amount=${purchasePrice}&interest_rate=${interestRate}&duration_years=${defaultLoanTerm}&downpayment=${downPayment}`,
            headers: {
                'accept': 'application/json',
                'X-Api-Key': api_key
            }
        })
        totalInterestPaid = mortgageCalculatorResponse.data.total_interest_paid;
        interestRateAnnual = Number(((((totalInterestPaid / purchasePrice) / (defaultLoanTerm * 365)) * 365) * 100).toFixed(3));
        interestRateMonthly = interestRateAnnual / 12;
        interestDecimalMonthly = interestRateMonthly / 100;
        interestPaymentMonthly = interestDecimalMonthly * baseLoanAmount;

        const mortgageCalculationsData = [
            interestRate,
            downPayment,
            downPaymentPercentage,
            baseLoanAmount,
            closingCosts,
            closingCostsPercentage,
            interestRateAnnual,
            interestRateMonthly,
            interestDecimalMonthly,
            interestPaymentMonthly,
            defaultLoanTerm,
            propertyId
        ]

        const updateMortgageCalculationsSqlText = `
            UPDATE "mortgage_calculations"
                SET "interest_rate" = $1, "down_payment" = $2, "down_payment_percentage" = $3,
                    "base_loan_amount" = $4, "closing_costs" = $5, "closing_costs_percentage" = $6,
                    "interest_rate_annual" = $7, "interest_rate_monthly" = $8, 
                    "interest_decimal_monthly" = $9, "interest_payment_monthly" = $10, "loan_term" = $11
                WHERE "property_id" = $12;
        `
        const updateMortgageCalculationsResponse = await pool.query(updateMortgageCalculationsSqlText, mortgageCalculationsData)
        
        console.log('Calculations updated!');
        await connection.query('Commit;')
        res.sendStatus(200);

    } catch (error) {
        console.log('Update caculations failed:', error);
        await connection.query('Rollback;')
        res.sendStatus(500);
    } finally {
        await connection.release()
    }
})

/**
* PUT update input calculations
*/
router.put('/inputs/:id', async (req, res) => {
    const userId = req.user.id;
    const propertyId = req.params.id;
    const input = req.body.input;

    let downPayment;
    let downPaymentPercentage;
    let closingCosts;
    let closingCostsPercentage;

    console.log('req.body data:', req.body);
    let connection;
    let sqlText;
    let sqlResponse;

    try {
        connection = await pool.connect()
        await connection.query('BEGIN;')

        if (input === 'downPayment' || input === 'downPaymentPercentage') {
            downPayment = req.body.downPayment;
            downPaymentPercentage = req.body.downPaymentPercentage / 100;

            sqlText = `
                UPDATE "mortgage_calculations"
                    SET "down_payment" = $1, "down_payment_percentage" = $2
                    WHERE "property_id" = $3;
            `
            sqlResponse = await connection.query(sqlText, [downPayment, downPaymentPercentage, propertyId])
        } else if (input === 'closingCosts' || input === 'closingCostsPercentage') {
            closingCosts = req.body.closingCosts;
            closingCostsPercentage = req.body.closingCostsPercentage / 100;

            sqlText = `
                UPDATE "mortgage_calculations"
                    SET "closing_costs" = $1, "closing_costs_percentage" = $2
                    WHERE "property_id" = $3;
            `
            sqlResponse = await connection.query(sqlText, [closingCosts, closingCostsPercentage, propertyId])
        }
    
        console.log('Calculations updated!', sqlResponse.rows);
        await connection.query('Commit;')
        res.sendStatus(200);

    } catch (error) {
        console.log('Update caculations failed:', error);
        await connection.query('Rollback;')
        res.sendStatus(500);
    } finally {
        await connection.release()
    }
})

function checkmortgageCalculationsData(userData, databaseData, price) {
    const interestRate = databaseData.interest_rate;
    let downPayment;
    let downPaymentPercentage;
    let closingCosts;
    let closingCostsPercentage;

    if (userData.down_payment === '') {
        if (userData.down_payment_percentage != '') {
            console.log('userData.down_payment_percentage:', userData.down_payment_percentage);
            downPayment = (userData.down_payment_percentage / 100) * price
        } else {
            downPayment = databaseData.down_payment;
        }
    } else if (userData.down_payment != '') {
        downPayment = userData.down_payment;
    }

    if (userData.down_payment_percentage === '') {
        if (userData.down_payment != '') {
            console.log('userData.down_payment:', userData.down_payment);
            downPaymentPercentage = userData.down_payment / price
        } else {
            downPaymentPercentage = databaseData.down_payment_percentage;
        }
    } else if (userData.down_payment_percentage != '') {
        downPaymentPercentage = userData.down_payment_percentage / 100
    }

    if (userData.closing_costs === '') {
        if (userData.closing_costs_percentage != '') {
            closingCosts = (userData.closing_costs_percentage / 100) * price
        } else {
            closingCosts = databaseData.closing_costs;
        }
    } else if (userData.closing_costs != '') {
        closingCosts = userData.closing_costs;
    }

    if (userData.closing_costs_percentage === '') {
        if (userData.closing_costs != '') {
            closingCostsPercentage = userData.closing_costs / price
        } else {
            closingCostsPercentage = databaseData.closing_costs_percentage;
        }
    } else if (userData.closing_costs_percentage != '') {
        closingCostsPercentage = userData.closing_costs_percentage / 100
    }

    let baseLoanAmount = price - downPayment;
    return data = {
        interestRate: interestRate,
        downPayment: downPayment,
        downPaymentPercentage: downPaymentPercentage,
        baseLoanAmount: baseLoanAmount,
        closingCosts: closingCosts,
        closingCostsPercentage: closingCostsPercentage,
    }

}

function getMortgageCalculationsFixData(object, price) {
    const dateObject = new Date(object.interest_rate_inserted_at);
    const year = dateObject.getFullYear();
    const month = dateObject.getMonth() + 1; // Months are zero-indexed (0 = January)
    const day = dateObject.getDate();
    const formattedDate = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}-${year}`

    const data = {
        id: object.id,
        property_id: object.property_id,
        interest_rate: Number(object.interest_rate).toFixed(2),
        interest_rate_inserted_at: formattedDate,
        interest_rate_updated_at: object.interest_rate_updated_at,
        loan_term: object.loan_term,
        down_payment: Number(object.down_payment).toFixed(0),
        down_payment_percentage: (object.down_payment_percentage * 100),
        base_loan_amount: formattedCurrency(Number(object.base_loan_amount)),
        closing_costs: Number(object.closing_costs).toFixed(0),
        closing_costs_percentage: (object.closing_costs_percentage * 100),
        interest_rate_annual: Number(object.interest_rate_annual).toFixed(2) + '%',
        interest_rate_monthly: Number(object.interest_rate_monthly).toFixed(2)  + '%',
        interest_decimal_monthly: Number(object.interest_decimal_monthly).toFixed(3)  + '%',
        interest_payment_monthly: '$' + object.interest_payment_monthly
    }

    return data;

}

module.exports = router;

// formattedCurrency(Number(propertyOfInterest.property[0].purchase_price))

