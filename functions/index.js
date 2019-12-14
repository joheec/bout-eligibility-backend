'use strict';
const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp(functions.config().firebase);

exports.date = functions.https.onRequest((req, res) => {
  res.status(200).send('JOHEE');
});

exports.addMessage = functions.https.onRequest(async (req, res) => {
  const original = req.query.text;
  const writeResult = await admin.firestore().collection('messages').add({ original: original });
  res.json({ result: `Message with ID: ${writeResult.id} added.` });
});

exports.makeUppercase = functions.firestore.document('/messages/{documentId}')
  .onCreate((snap, context) => {
    const original = snap.data().original;
    console.log('Uppercasing', context.params.documentID, original);
    const uppercase = original.toUpperCase();
    return snap.ref.set({uppercase}, {merge: true});
  });

let db = admin.firestore();
let docRef = db.collection('users').doc('UH1tRz041Tap0Ptm6ZJV0QRgxgy1');

let setProgress = docRef.set({
  20200229: {
    strategyHour: [
      { signin: true, date: new Date('12/14/2019') },
      { signin: true, date: new Date('12/21/2019') },
      { signin: false, date: null },
    ],
    practice: [
      { signin: true, date: new Date('12/19/2019') },
      { signin: true, date: new Date('12/16/2019') },
      { signin: false, date: null },
    ],
    scrimmage: [
      { signin: true, date: new Date('12/14/2019') },
      { signin: true, date: new Date('12/21/2019') },
      { signin: false, date: null },
      { signin: false, date: null },
    ],
    volunteer1: { vologistic: true, hours: 3 },
    volunteer2: { vologistic: false, hours: 0 },
  }
});

db.collection('users').get()
  .then((snapshot) => {
    snapshot.forEach((doc) => {
      console.log(doc.id, '=>', doc.data());
    });
  })
  .catch((err) => {
    console.log('Error getting documents', err);
  });
