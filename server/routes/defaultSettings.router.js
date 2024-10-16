const express = require('express');
const {
  rejectUnauthenticated,
} = require('../modules/authentication-middleware');
const pool = require('../modules/pool');
const router = express.Router();


// ===================== Default =====================
/**
 * ----- GET defaults: getDefaults
 */
router.get('/', rejectUnauthenticated, async (req, res) => {
  const userId = req.user.id;

  try {
    const defaultHoldingsSqlText = `
      SELECT * FROM "default_holdings"
        WHERE "user_id" = $1;
    `
    const defaultHoldingsResponse = await pool.query(defaultHoldingsSqlText, [userId]);
    const defaultHoldings = defaultHoldingsResponse.rows;

    const defaultRepairsSqlText = `
      SELECT * FROM "default_repairs"
        WHERE "user_id" = $1;
    `
    const defaultRepairsResponse = await pool.query(defaultRepairsSqlText, [userId]);
    const defaultRepairs = defaultRepairsResponse.rows;

    res.send({defaultHoldings: defaultHoldings, defaultRepairs: defaultRepairs});

  } catch (error) {
    console.log('Error getting all default items:', error);
    res.sendStatus(500);
  }

});


/**
 * ----- PUT default holding period: updateDefaultHoldingPeriod
 */
router.put('/',rejectUnauthenticated, (req, res) => {
  const userId = req.user.id;
  const holdingPeriod = req.body.holdingPeriod;

  const sqlText = `
    UPDATE "user"
      SET "holding_period_default" = $1
      WHERE "id" = $2;
  `
  pool.query(sqlText, [holdingPeriod, userId])
  .then((results) => {
    res.sendStatus(200);
  }) .catch((error) => {
    console.log('Error updating default holding period:', error);
    res.sendStatus(500);
  })
});


// ===================== Holding Item =====================
/**
 * ----- POST default holding item: addDefaultHoldingItem
 */
router.post('/holdingItem',rejectUnauthenticated, (req, res) => {
  const holdingName = req.body.holdingName;
  const holdingCost = req.body.holdingCost;
  const userId = req.user.id;

  const sqlText = `
    INSERT INTO "default_holdings"
      ("user_id", "holding_name", "holding_cost")
      VALUES
      ($1, $2, $3);
  `
  pool.query(sqlText, [userId, holdingName, holdingCost])
  .then((results) => {
    res.sendStatus(201);
  }) .catch((error) => {
    console.log('Error adding new default holding item:', error);
    res.sendStatus(500);
  })
  
});


/**
 * ----- DELETE default holding item: deleteDefaultHoldingItem
 */
router.delete('/holdingItem/:id',rejectUnauthenticated, (req, res) => {
  const holdingId = req.params.id;
  const userId = req.user.id;

  const sqlText = `
    DELETE FROM "default_holdings"
      WHERE "id" = $1
      AND "user_id" = $2;
  `
  pool.query(sqlText, [holdingId, userId])
  .then((results) => {
    res.sendStatus(200);
  }) .catch((error) => {
    console.log('Error deleting default holding item:', error);
    res.sendStatus(500);
  })
});


// ===================== Repair Item =====================
/**
 * ----- POST default repair item: addDefaultRepairItem
 */
router.post('/repairItem',rejectUnauthenticated, (req, res) => {
  const repairName = req.body.repairName;
  const repairCost = req.body.repairCost;
  const userId = req.user.id;

  const sqlText = `
    INSERT INTO "default_repairs"
      ("user_id", "repair_name", "repair_cost")
      VALUES
      ($1, $2, $3);
  `
  pool.query(sqlText, [userId, repairName, repairCost])
  .then((results) => {
    res.sendStatus(201);
  }) .catch((error) => {
    console.log('Error adding new default repair item:', error);
    res.sendStatus(500);
  })
});


/**
 * ----- DELETE default repair item: deleteDefaultRepairItem
 */
router.delete('/repairItem/:id',rejectUnauthenticated, (req, res) => {
    const repairId = req.params.id;
    const userId = req.user.id;

    const sqlText = `
      DELETE FROM "default_repairs"
        WHERE "id" = $1
        AND "user_id" = $2;
    `
    pool.query(sqlText, [repairId, userId])
    .then((results) => {
      res.sendStatus(200);
    }) .catch((error) => {
      console.log('Error deleting default repair item:', error);
      res.sendStatus(500);
    })
});

module.exports = router;

