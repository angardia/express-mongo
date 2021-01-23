const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient, ObjectId } = require("mongodb");
const app = express();
const moment = require('moment'); // require
moment().format();
const port = 4000;
let db;
const mongoUrl = "mongodb://localhost:27017";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//GET ALL COUPONS
app.get("/coupon", (req, res) => {
  //use specific collection
  db.collection("coupons").find().toArray().then(coupons => res.send(coupons));
});

//CREATE NEW COUPON
app.put("/coupon", async (req, res) => {
  //get info
  const { code, date, isRedeem } = req.body;
  //testing
  const dateFormat = 'DD-MM-YYYY HH:mm:ss';
  const checkDate = moment(date, dateFormat, true);
  const doesExist = await db.collection("coupons").findOne({ code : code});
  if(doesExist !==null ){
    res.status(400).send('coupon already exists');
    return;
  }
  if (!code || code.length < 5) {
    res.status(400).send('error');
    return;
  }
  if (!checkDate.isValid()) {
    res.status(400).send('date format error');
    return;
  }
  if (typeof isRedeem !== "boolean" || isRedeem) {
    res.status(400).send('cannot enter redeemed coupon');
    return;
  }
  //inesrt to DB 
  db.collection("coupons").insertOne({
    code,
    date,
    isRedeem
  })
    .then((report) => {
      //send feedback to the user after DB wroth the info
      res.status(201).send(report.ops[0]);
    }) // if failed
    .catch(e => {
      console.log(e);
      res.sendStatus(500)
    });
});

//GET ONE COUPON
app.get("/coupon/:id", (req, res) => {
  const id = req.params.id;
  db.collection("coupons").findOne({ _id: ObjectId(id) })
    .then(coupon => {
      if (!coupon) {
        res.sendStatus(404);
        return;
      }
      res.send(coupon)
    })
    .catch((e) => {
      console.log(e);
      res.sendStatus(404);
    });
});

//DELETE COUPON
app.delete("/coupon/:id", (req, res) => {
  const id = req.params.id;
  db.collection("coupons").deleteOne({ _id: ObjectId(id) })
    .then(report => {
      if (!report.matchedCount) {
        res.sendStatus(404);
        return;
      }
      res.sendStatus(200);
    })
    .catch(e => {
      console.log(e);
      res.sendStatus(404);
    });
});

//REDEEM COUPON
app.post("/coupon/:id/redeem", (req, res) => {
  const id = req.params.id;
  const { isRedeem } = req.body;
  if (!isRedeem) {
    res.sendStatus(400);
    return;
  }
  db.collection("coupons").updateOne({ _id: ObjectId(id) }, {
    $set: {
      isRedeem
    }
  })
    .then(report => {
      if (!report.modifiedCount) {
        res.sendStatus(400);
        return;
      }
      res.sendStatus(200);
    })
    .catch((e) => {
      console.log(e);
      res.sendStatus(404);
    })

});


//EDIT COUPON
app.post("/coupon/:id", (req, res) => {
  const id = req.params.id;
  const { isRedeem, code } = req.body;
  db.collection("coupons").updateOne({ _id: ObjectId(id) },
    {
      $set: {
        code,
        isRedeem
      }
    })
    .then(report => {
      if (!report.modifiedCount) {
        res.sendStatus(404);
        return;
      }
      res.sendStatus(200);
    })
});


//DOES COUPON EXISTS?
app.get("/coupon/search/:code", (req, res) => {
  const code = req.params.code;
  db.collection("coupons").findOne({ code : code})
    .then(coupon => {
      if (!coupon) {
        res.sendStatus(404);
        return;
      }
      res.sendStatus(200);
    })
    .catch(e => {
      console.log(e);
      res.sendStatus(500)
    })
});


//url to mongo localhost 
const client = new MongoClient(mongoUrl, { useUnifiedTopology: true });
//connect to DB
client.connect().then(() => {
  db = client.db("coupon_app");
  console.log("connected to DB");
  app.listen(port, () => {
    console.log(`using port http://localhost:${port}`);
  });
}).catch((e) => console.log('could not connect to mongo', e));


