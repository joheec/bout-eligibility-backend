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

const getEligibility = async (collRef, uid) => (
  await collRef.get()
    .then(snapshot => {
      let docs = []
      snapshot.forEach(doc => {
        if (doc.id === uid) {
          docs.push(doc);
        }
      })
      return docs;
    })
    .then(entries => {
      if(entries.length === 0) {
        collRef.doc(uid).set(requirements);
        return requirements;
      }
      const entry = {
        ...requirements,
        ...entries[0].data()
      };
      collRef.doc(uid).set(entry);
      return entry;
    })
    .catch(err => {
      console.log('Error getting documents', err);
    })
);

exports.eligibility = functions.https.onRequest(async (req, res) => {
  try {
    const collRef = await db.collection('users');
    const userData = await getEligibility(collRef, req.query.uid);
    res.status(200).send(JSON.stringify(userData));
  } catch (err) {
    console.log({ err });
  }
});
