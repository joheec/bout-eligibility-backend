'use strict';
const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp(functions.config().firebase);
let db = admin.firestore();

const requirements = {
  20200417: {
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
  },
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

const getCollData = async collRef => {
  const docRefs = await collRef.listDocuments();
  const docData = await Promise.all(docRefs.map(docRef => (
    docRef.get().then(docSnap => ({ [docRef.id]: docSnap.data() })))
  ));
  return Promise.resolve(docData.reduce((arr, data) => (Object.assign({}, arr, data)), {}));
};

const getEligibility = async (uid) => {
  const userCollRef = db.collection(uid);
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
    return boutDocRef.set(Object.assign({}, requirements[boutKey]))
      .catch(err => console.log(`Error setting bout (${boutKey}) requirements`, err));
  }))
    .then(() => getCollData(userCollRef))
    .catch(err => console.log('Error updating missing bout requirements', err));
};

const updateRequirement = (payload, requirementData) => {
  const { requirement, subRequirement, value } = payload;
  const requirementType = {
    practice: 'array',
    scrimmage: 'array',
    strategyHour: 'array',
    volunteer1: 'object',
    volunteer2: 'object',
  };

  if (requirementType[requirement] === 'array') {
    return [].concat(
      requirementData.slice(0, subRequirement),
      [Object.assign({}, requirementData[subRequirement], value)],
      requirementData.slice(subRequirement + 1)
    );
  }
  return Object.assign({}, requirementData, { [subRequirement]: value });
};

const updateEligibility = async (payload) => {
  const userCollRef = db.collection(payload.uid);
  const boutDocRef = userCollRef.doc(payload.boutDate);
  const boutData = await boutDocRef.get()
    .then(boutDocSnap => boutDocSnap.data())
    .catch(err => console.log('Error getting bout doc data', err));
  return boutDocRef.update({ [payload.requirement]: updateRequirement(payload, boutData[payload.requirement]) })
    .then(() => getCollData(userCollRef));
};

exports.eligibility = functions.https.onRequest(async (req, res) => {
  try {
    let eligibilityData;
    switch (req.method) {
      case 'PUT':
        eligibilityData = await updateEligibility(JSON.parse(req.body));
        break;
      default:
        eligibilityData = await getEligibility(req.query.uid);
        break;
    }
    res.status(200).send(JSON.stringify(eligibilityData));
  } catch (err) {
    console.log({ err });
  }
});
