'use strict';
const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp(functions.config().firebase);
let db = admin.firestore();

const requirements = {
  20200229: {
    strategyHour: [
      { signin: false, date: null },
      { signin: false, date: null },
      { signin: false, date: null },
    ],
    practice: [
      { signin: false, date: null },
      { signin: false, date: null },
      { signin: false, date: null },
    ],
    scrimmage: [
      { signin: false, date: null },
      { signin: false, date: null },
      { signin: false, date: null },
      { signin: false, date: null },
    ],
    volunteer1: { vologistic: false, hours: 0 },
    volunteer2: { vologistic: false, hours: 0 },
  }
};

const getEligibility = async (userCollRef, uid) => {
  const boutDocRefs = await userCollRef.listDocuments()
    .catch(err => console.log('Error getting bout documents: ', err));

  // Add any missing bout documents
  let missingBoutKeys = Object.keys(requirements);
  boutDocRefs.forEach(boutDocRef => {
    missingBoutKeys = missingBoutKeys.filter(boutKey => (
      boutDocRef.path !== `${uid}/${boutKey}`
    ));
  });

  return Promise.all(missingBoutKeys.map(boutKey => {
    const boutDocRef = userCollRef.doc(boutKey);
    return boutDocRef.set({ ...requirements[boutKey] })
      .catch(err => console.log(`Error setting bout (${boutKey}) requirements`, err));
  }))
    .then(() => userCollRef.listDocuments())
    .then((updatedBoutDocRefs) => (
      updatedBoutDocRefs.reduce(async (arr, boutDocRef) => {
        const boutData = await boutDocRef.get()
          .then(boutDocSnap => (boutDocSnap.data()));
        return {
          ...arr,
          [boutDocRef.id]: boutData,
        };
      }, {})
    ))
    .catch(err => console.log('Error updating missing bout requirements', err));
};

const updateEligibility = async (userCollRef, data) => {
  console.log('doc', userCollRef.doc(data.uid));
};

exports.eligibility = functions.https.onRequest(async (req, res) => {
  try {
    const userCollRef = db.collection(req.query.uid);
    let eligibilityData;

    switch (req.method) {
      case 'PUT':
        eligibilityData = await updateEligibility(userCollRef, JSON.parse(req.body));
        break;
      default:
        eligibilityData = await getEligibility(userCollRef, req.query.uid);
        break;
    }

    res.status(200).send(JSON.stringify(eligibilityData));
  } catch (err) {
    console.log({ err });
  }
});
