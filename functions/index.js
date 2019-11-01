const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {parse} = require('querystring');

admin.initializeApp(functions.config().firebase);

let db = admin.firestore();

/**
 * API endpoint that expects JSON of the form:
 * {
	"first_name":"value",
	"last_name":"value",
	"date_of_birth":"value",
	"height":value,
	"weight":value,
	"gender":"value"
    }
 * @type {HttpsFunction}
 */
exports.addUser = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(401).json({
            message: 'Not allowed'
        })
    }

    try {
        console.log(req.body);
        const data = {first_name, last_name, date_of_birth, height, weight, gender} = req.body;

        // Add a new document with an auto-generated id.
        // The 'users' collection is created if it does not already exist
        const userRef = await db.collection('users').add(data);
        const user = await userRef.get();

        res.json({
            id: userRef.id,
            data: user.data()
        });
    } catch (error) {
        res.status(500).send(error);
    }
});

/**
 * API endpoint that expects JSON of the form:
 * {
	"food_name":"value",
	"food_class":"value",
	"price":"value",
	"date":"value"
    }
 * @type {HttpsFunction}
 */
exports.addFood = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(401).json({
            message: 'Not allowed'
        })
    }

    try {
        console.log(req.body);
        const data = {food_name, food_class, price} = req.body;

        // Add a new document with an auto-generated id.
        // The 'food' collection is created if it does not already exist
        const foodRef = await db.collection('food').add(data).then(value=>{
            return res.send(value.get().data());
        });
        const food = await foodRef.get();

        res.json({
            id: foodRef.id,
            data: food.data()
        });
    } catch (error) {
        res.status(500).send(error);
    }
});

