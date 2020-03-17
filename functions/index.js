'use strict';
const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp(functions.config().firebase);
let db = admin.firestore();

const requirements = [
  {
    boutId: '2',
    show: true,
    title: 'Fri Apr 17, 2020: Wrecker v Rat City',
    date: '2020-04-17',
    start: '2020-01-31',
    end: '2020-03-23',
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
  {
    boutId: '1',
    show: true,
    title: 'Sat Feb 29, 2019: Wrecker v Wrecker',
    date: '2020-02-29',
    start: '2020-12-12',
    end: '2020-02-03',
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
];

const getCollData = async collRef => {
  const docRefs = await collRef.listDocuments();
  const docData = await Promise.all(docRefs.map(docRef => (
    docRef.get().then(docSnap => docSnap.data())
  )));
  return Promise.resolve(docData.reduce((arr, data) => {
    const { show } = Object.values(data)[0];
    return show ? Object.assign({}, arr, data) : arr;
  }, {}))
};

const getEligibility = async (uid) => {
  const userCollRef = db.collection(uid);
  const boutDocRefs = await userCollRef.listDocuments()
    .catch(err => console.log('Error getting bout documents: ', err));

  // Add any missing bout documents
  let missingBoutIds = requirements.map(({ boutId }) => boutId);
  boutDocRefs.forEach(boutDocRef => {
    missingBoutIds = missingBoutIds.filter(boutId => (
      boutDocRef.path !== `${uid}/${boutId}`
    ));
  });

  return Promise.all(missingBoutIds.map(missingBoutId => {
    const newBoutData = requirements.filter(({ boutId }) => missingBoutId === boutId)[0];
    const boutDocRef = userCollRef.doc(missingBoutId);
    return boutDocRef.set(Object.assign({}, { [missingBoutId]: newBoutData }))
      .catch(err => console.log(`Error setting bout (ID: ${missingBoutId}) requirements`, err));
  }))
    .then(() => getCollData(userCollRef))
    .catch(err => console.log('Error updating missing bout requirements', err));
};

const updateRequirement = (payload, requirementData) => {
  const { requirement, subRequirement, value } = payload;
  const requirementType = {
    boutId: 'string',
    show: 'boolean',
    title: 'string',
    date: 'string',
    start: 'string',
    end: 'string',
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
  const boutDocRef = userCollRef.doc(payload.boutId);
  const boutData = await boutDocRef.get()
    .then(boutDocSnap => boutDocSnap.data())
    .then(boutDocSnapData => boutDocSnapData[payload.boutId])
    .catch(err => console.log('Error getting bout doc data', err));
  return boutDocRef.update(`${payload.boutId}.${payload.requirement}`, updateRequirement(payload, boutData[payload.requirement]))
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
