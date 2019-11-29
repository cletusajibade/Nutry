const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require('crypto');
//const authHandler = require('./util/AuthHandler');

admin.initializeApp(functions.config().firebase);
let db = admin.firestore();

// if(location.hostname==="localhost"){
//     db.settings({
//         host: "localhost:8084",
//         ssl: false
//     });
// }

/**
 * API endpoint expects JSON of the form:
 * {
	"first_name":"value",
	"last_name":"value",
	"date_of_birth":"value",
	"height":value,
	"weight":value,
    "gender":"value",
    "email":"value",
    "password":"value",
    }
 * @type {HttpsFunction}
 */

// Notice the use of "async, await".
// This helps to handle promises without having to chain them together with the "then" function.
// But this must be done within "try,catch" block to handle any errors in case the promise was rejected.
exports.addUser = functions.https.onRequest(async (request, response) => {
    //Make sure this is a POST request
    if (request.method !== "POST") {
        return response.status(401).json({
            message: "Not allowed"
        });
    }

    try {
        // Destructure the request body into an object with corresponding properties
        // const data = {first_name, last_name, date_of_birth, height, weight, gender, email, password} = request.body;
        const data = request.body;

        //Hash the password
        data.password = this.setPassword(data.password);

        console.log(data);

        // authHandler.setPassword(data.password);
        // Add a new document with an auto-generated id.
        // The 'users' collection is created if it does not already exist
        const userRef = await db.collection("users").add(data);
        const user = await userRef.get();
        response.json({
            id: userRef.id,
            data: user.data()
        });
    } catch (error) {
        response.status(500).send(error);
    }
});

// Using Promise chaining, get all users from the database
// Notice the absence of "async, await"; promise chaining with "then" is used instead
exports.getAllUsers = functions.https.onRequest((request, response) => {
    //Make sure this is a GET request
    if (request.method !== "GET") {
        return response.status(401).json({
            message: "Not allowed"
        });
    }

    console.log(request.query);

    db.collection("users")
        .get()
        .then(usersSnapshot => {
            if (!usersSnapshot.empty) {
                let docArray = []; //Holds each user in the collection
                usersSnapshot.forEach(doc => {
                    const row = {
                        id: doc.id,
                        data: doc.data()
                    };
                    docArray.push(row);
                });
                console.log(docArray);

                //1. "response.send" converts docArray into JSON and sends it to the client
                //2. It finally terminates this function
                return response.send(docArray);
            } else {
                return response.send({msg: "No users in database"});
            }
        })
        .catch(error => {
            response.status(500).send(error);
        });
});

/**
 * API endpoint expects JSON of the form:
 * {
	"food_name":"value",
	"food_class":"value",
	"price":"value",
	"date":"value"
	"serving":"value"
    }
 * @type {HttpsFunction}
 */
// Notice the use of "async, await".
// This helps to handle promises without having to chain them together with the "then" function.
// But this must be done within "try,catch" block to handle any errors in case the promise was rejected.
exports.addFood = functions.https.onRequest(async (request, response) => {
    //Make sure this is a POST request
    if (request.method !== "POST") {
        return response.status(401).json({
            message: "Not allowed"
        });
    }

    try {
        console.log(request.body);
        const data = ({food_name, food_class, price, serving} = request.body);

        // Add a new document with an auto-generated id.
        // The 'food' collection is created if it does not already exist
        const foodRef = await db.collection("food").add(data);
        const food = await foodRef.get();

        response.json({
            id: foodRef.id,
            data: food.data()
        });
    } catch (error) {
        response.status(500).send(error);
    }
});

/**
 * Method to set salt and hash the password for a user.
 * setPassword method first creates a salt unique for every user,
 * then it hashes the salt with user password and creates a hash.
 * This hash is stored in the database as user password
 */
exports.setPassword = function (password) {
    // Hashing user's salt and password with 1000 iterations, 64 length and sha512 digest
    const salt = crypto.randomBytes(16).toString('hex');
    return crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`hex`);
};

// exports.getSalt = function () {
//     // Creating a unique salt for a particular user
//     return crypto.randomBytes(16).toString('hex');
// };

// Method to check the entered password is correct or not.
// valid password method checks whether the user password is correct or not.
// It takes the user password from the request and salt from user database entry
// It then hashes user password and salt,
// then checks if this generated hash is equal to user's hash in the database or not.
// If the user's hash is equal to generated hash, then the password is correct otherwise not
// exports.validatePassword = function (password) {
//     let hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, `sha512`).toString(`hex`);
//     return this.hash === hash;
// };