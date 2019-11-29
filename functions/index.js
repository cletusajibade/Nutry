const functions = require("firebase-functions");
const admin = require("firebase-admin");
const authHandler = require('./util/AuthHandler');

admin.initializeApp(functions.config().firebase);
let db = admin.firestore();
let auth = admin.auth();

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

        //Get a random salt, and then a hash of the password before saving to firestore
        const salt = authHandler.getPasswordSalt();
        data.password = authHandler.getPasswordHash(data.password, salt);
        data.salt = salt; //this adds a new field on the fly; was not sent along with the request

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
        // Destructure the request body into an object with corresponding properties
        // const data = {food_name, food_class, price, serving} = request.body;
        const data = request.body;

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
 * API endpoint expects JSON of the form:
 * {
	"email":"value",
    "password":"value",
    }
 * @type {HttpsFunction}
 */
exports.login = functions.https.onRequest((request, response) => {
    //Make sure this is a POST request
    if (request.method !== "POST") {
        return response.status(401).json({
            message: "Not allowed"
        });
    }

    // db.collection("users")
    //     .get()
    //     .then(usersSnapshot => {
    //         if (!usersSnapshot.empty) {
    //             let docArray = []; //Holds each user in the collection
    //             usersSnapshot.forEach(doc => {
    //                 const row = {
    //                     id: doc.id,
    //                     data: doc.data()
    //                 };
    //                 docArray.push(row);
    //             });
    //
    //             //1. "response.send" converts docArray into JSON and sends it to the client
    //             //2. It finally terminates this function
    //             return response.send(docArray);
    //         } else {
    //             return response.send({msg: "No users in database"});
    //         }
    //     })
    //     .catch(error => {
    //         response.status(500).send(error);
    //     });

    const authData = {
        email: request.body.email,
        emailVerified: false,
        password: request.body.password,
        disabled: false,
    };
    const customData = {
        firstName: request.body.firstName,
        lastName: request.body.lastName,
        email: request.body.email,
        dateOfBirth: request.body.dateOfBirth,
        height: request.body.height,
        weight: request.body.weight,
        gender: request.body.gender,
        photoURL: request.body.photoURL,
        avoidFood: request.body.avoidFood,
        dateCreated: new Date()
    };
    auth.createUser(authData)
        .then((userRecord) => {
            // On success, create a custom user collection/document
            // that has the same uid returned by the createUser auth process
            return db.collection('users').doc(userRecord.uid).set(customData);
        })
        .then((writeResult) => {
            return response.json({
                message: 'Successfully created new user',
                time: writeResult.writeTime
            });
        })
        .catch((error) => {
            response.status(500).send(error);
        });
});