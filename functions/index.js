const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp(functions.config().firebase);
let db = admin.firestore();
let auth = admin.auth();

/**
 * API endpoint expects JSON of the form:
 * {
        "firstName":"value",
        "lastName":"value",
        "dateOfBirth":"value",
        "height":value,
        "weight":value,
        "gender":"value",
        "email":"abc@xyz.com",
        "emailVerified": false,
        "password":"value",
        "photoURL": "http://www.example.com/12345678/photo.png",
        "disabled": false,
        "avoidFood": {
            "food1":"value1",
            "food2":"value2"
        }
    }
 * @type {HttpsFunction}
 *
 * Using Promise chaining, get all users from the database
 * Notice the absence of "async, await"; promise chaining with "then" is used instead
 */
exports.addUser = functions.https.onRequest((request, response) => {
  //Make sure this is a POST request
  if (request.method !== "POST") {
    return response.status(401).json({
      message: "Not allowed"
    });
  }

  const authData = {
    email: request.body.email,
    emailVerified: false,
    password: request.body.password,
    disabled: false
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
    dateCreated: new Date().toISOString()
  };

  auth
    .createUser(authData)
    .then(userRecord => {
      // On success, create a custom user collection/document
      // that has the same uid returned by the createUser auth process
      customData.uid = userRecord.uid;
      return db
        .collection("users")
        .doc(userRecord.uid)
        .set(customData);
    })
    .then(writeResult => {
      return response.json({
        message: "Successfully created new user",
        time: writeResult.writeTime
      });
    })
    .catch(error => {
      return response.status(500).send(error);
    });
});

/**
 * API endpoint for getting all users. Has empty request body
 * Uses Promise chaining to get all users from the database.
 * Notice the absence of "async" and "await", promise chaining with "then" is used
 */
exports.getAllUsers = functions.https.onRequest(async (request, response) => {
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
        return response.send({ msg: "No users in database" });
      }
    })
    .catch(error => {
      return response.status(500).send(error);
    });

  /** Another Implementation using admin.auth().listUsers() is below**/
  /** We may choose to go this route later; has more benefits and better performance **/
  /** But still has some TODOs as shown below **/
  // Start listing users from the beginning. This only lists the first 1000 users.
  //TODO 1: a better way to do this is to recursively list users in batches of 1000;
  // To be implemented later:

  //auth.listUsers(1000)
  //     .then(async listUserResult => {
  //         //This line returns multiple promises
  //         // so Promise.all() is used below to
  //         const docPromises = await listUserResult.users.map(userRecord => {
  //             return db.collection('users').doc(userRecord.uid).get();
  //         });
  //         return await Promise.all(docPromises);
  //     })
  //     .then(usersSnapshots => {
  //
  //         //TODO 2: for some reason unknown, this piece of code returns a big mixed JSON type.
  //         //TODO 2: The "usersSnapshots" here does not allow forEach so it cannot be iterated over.
  //         //TODO 2: A better implementation would look like the code commented below, but it does not work for now:
  //         /*
  //         const allUsers = [];
  //         usersSnapshots.forEach(doc =>{
  //             const data = doc.data();
  //             allUsers.push(data);
  //         });
  //         return response.send(allUsers);
  //         */
  //
  //         return response.send(usersSnapshots);
  //     })
  //     .catch(error => {
  //         response.status(500).send(error);
  //     });
});

/**
 * API endpoint expects JSON of the form:
 * {
    "foodName":"value",
	"foodClass":"value",
	"price":value,
	"date":"YYYY-MM-DD",
	"serving":value
    }
 * @type {HttpsFunction}
 *
 * Notice the use of "async", and "await".
 * This helps to handle promises without having to chain them together with the "then" function.
 * But this must be done within "try,catch" block to handle any errors in case the promise was rejected.
 */
exports.addFood = functions.https.onRequest(async (request, response) => {
  //Make sure this is a POST request
  if (request.method !== "POST") {
    return response.status(401).json({
      message: "Not allowed"
    });
  }

  try {
    // Destructure the request body into an object with corresponding properties
    // const data = {food_name, food_class, price, serving,calorie_count} = request.body;
    const data = request.body;

    // Add a new document with an auto-generated id.
    // The 'food' collection is created if it does not already exist
    const foodRef = await db.collection("food").add(data);
    const food = await foodRef.get();

    return response.json({
      id: foodRef.id,
      data: food.data()
    });
  } catch (error) {
    return response.status(500).send(error);
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
exports.login = functions.https.onRequest(async (request, response) => {
  //Make sure this is a POST request
  if (request.method !== "POST") {
    return response.status(401).json({
      message: "Not allowed"
    });
  }

  //TODO: This endpoint validates login with just the email.
  // Firebase Admin SDK Auth does not get user by both Email and Password through Cloud Functions.
  // This code uses "auth.getUserByEmail(email)".
  // We will have to do something better that can make use of both Email and Password.
  const email = request.body.email;
  const password = request.body.password; //the unused password

  try {
    const userRecord = await auth.getUserByEmail(email);
    const doc = await db
      .collection("users")
      .doc(userRecord.uid)
      .get();

    if (!doc.exists) {
      return response.send("No such document!");
    } else {
      const respData = Object.assign(userRecord.toJSON(), doc.data());
      return response.send(respData);
    }
  } catch (error) {
    return response.status(500).send(error);
  }
});

//This function will return user information when
//userid is passed to it
//The function expects JSON of the form {"uid":"xyusa12322522"}
exports.getUser = functions.https.onRequest(async (request, response) => {
  //Make sure this is a POST request
  if (request.method !== "POST") {
    return response.status(401).json({
      message: "Not allowed"
    });
  }

  const userid = request.body.uid;

  const userRecord = await auth.getUser(userid);
  console.log("userrecord ", userRecord.uid);
  const doc = await db
    .collection("users")
    .doc(userRecord.uid)
    .get();

  console.log("userrecord 2", doc.data);
  if (!doc.empty) {
    console.log(doc.id, " => ", doc.data());
    let docArray = [];
    const row = {
      id: doc.id,
      data: doc.data()
    };
    docArray.push(row);

    console.log(doc.id, " => ", doc.data());
    return response.send(docArray);
  } else {
    return response.send({ msg: "No users in database" });
  }
});

//This function will return user information when
//userid is passed to it
//The function expects JSON of the form {"uid":"xyusa12322522"}
exports.logFoodIntake = functions.https.onRequest(async (request, response) => {
  //Make sure this is a POST request
  if (request.method !== "POST") {
    return response.status(401).json({
      message: "Not allowed"
    });
  }

  try {
    // Destructure the request body into an object with corresponding properties
    // const data = {userId,food_name, calorieCount} = request.body;
    const data = {
      userId: request.body.userId,
      food_name: request.body.food_name,
      calorieCount: request.body.calorieCount,
      loggedDate: new Date().toISOString()
    };
    // Add a new document with an auto-generated id.
    // The 'food' collection is created if it does not already exist
    const logRef = await db.collection("loggedFood").add(data);
    const loggedFood = await logRef.get();

    return response.json({
      id: logRef.id,
      data: loggedFood.data()
    });
  } catch (error) {
    return response.status(500).send(error);
  }
});
