const R = require('ramda');
const MongoClient = require('mongodb').MongoClient;
const data = require('./training-data.js');
const url = 'mongodb://localhost:27017/trainingBack';

// 1 Load_______________________________________________________________

const idEqExternalId = R.map(c => R.omit('id')({ externalId: c.id, ...c }));
const external_id = elem => ({ id: elem.externalId, _id: elem._id });
const matchingTable = contrite => R.map(external_id , contrite.ops);
const fillCollection = (db, targetCollection, data) => db.collection(targetCollection).insertMany(data).then(matchingTable);
const loadCollections = db => Promise.all([
  fillCollection(db, 'people', idEqExternalId(data.people)),
  fillCollection(db, 'courses', idEqExternalId(data.courses))
]);

const findId = (id, matchTable) => R.find(R.propEq('id', id))(matchTable);
const fillSession = (matchTables, session) => ({
    userId: findId(matchTables[0],session.userId)._id,
    courseId: findId(matchTables[1], session.courseId)._id
});
const fillSessions = (db, matchTables) => R.map(session => fillSession(matchTables, session) , data.trainingSessions);

// MongoClient.connect(url)
//   .then(db =>
//     loadCollections(db)
//       .then(matchTables => fillSessions(db, matchTables))
//       .then(sessions => fillCollection(db, 'trainingSessions', sessions))
//       .then(() => db.close())
//   )
//   .catch(console.error);


// 2 Extract_&_Rebuild____________________________________________________
 

const externalIdToKey = R.reduce((accu, value) => ({ ...accu, [value._id]: value }), {});
const objectFormat = (db, name) => db.collection(name).find().toArray().then(externalIdToKey);
const newFormat = (db) => Promise.all([objectFormat(db, 'people'),objectFormat(db, 'courses')]);
const sessionsMatching = (sessions, arrToMatch)  => R.map(s => ({
      user: arrToMatch[0][s.userId],
      courses: arrToMatch[1][s.courseId],
}), sessions);
const sessionsFormat = (db, arrToMatch) => db.collection('trainingSessions').find().toArray()
  .then(sessions => sessionsMatching(sessions, arrToMatch));

// MongoClient.connect(url)
//   .then(db => newFormat(db)
//     .then(res => sessionsFormat(db, res))
//     .then(console.log)
//     .then(() => db.close())
//     // .then(() => db)
//   )
//   // .then(() => db.close)
//   .catch(console.error)


// 3 Compute____________________________________________________

const getUserSkill = (sessions) => R.reduce((accu, value) => ({ ...accu, [value.userId]: accu[value.userId] ? [ ...accu[value.userId], value.courseId] : [value.courseId] }), {})(sessions)
const techSheet = ({ _id, firstname, lastname }, userCourses, courses) => {
  const details = R.reduce((accu, value) => ({ ...accu, [courses[value].name]: courses[value].skillPoints }) , {})(userCourses)
  console.log(details); // have to get  points and skillName   ()
  const sheet = { _id, firstname, lastname, points: {
      total: 0,
      details,
    },
  }
}

const idToKey = R.reduce((accu, value) => ({ ...accu, [value._id]: value }), {});
const userSheets = (allInf) => {
  const userCourses = getUserSkill(allInf[2]);
  const coursesId = idToKey(allInf[1]);
  const userSkill = R.map(user => techSheet(user, R.uniq(userCourses[user._id]), coursesId))(allInf[0]);
}
const getCollection = (db, name) => db.collection(name).find().toArray();
const getAllCollections = (db) => Promise.all([
  getCollection(db, 'people'),
  getCollection(db, 'courses'),
  getCollection(db, 'trainingSessions')
]);

MongoClient.connect(url)
  .then(getAllCollections)
  .then(userSheets)
  .catch(console.error)

// ______________________ MEMO (4 compute)

// STEP1: Compute training points per skill per user.
// You should report something like:
//   [
// --------------------------------> { firstname, lastname, points: { total, details: [ { skill, value } ] } }
//      ...                          {  people            } {            courseId                         }
//   ]
// Where points.total is the sum of all points collected per user during training sessions
// Where points.details is the sum of all points collected per user per skill.
// Points.details must be desc sorted by value, report must be sorted by lastname.
// STEP2: Compute courses usagex
// You should report something like:
// [
// { name, points }
// ...
// ]
// Where points is the sum of all points collected by users during all training sessions on a
// course. Sort result by points.
// const externalIdToKey = R.reduce((accu, value) => ({ ...accu, [value._id]: value }), {}); -------------->R.reduce
// entry => array [ [people] , [courses] , [trainingSessions] ]
//                         \    /               R.reduce
//                          \--/                               |                          |


//                    session
//    { _id: 58ac313fdcaae1dcf55ab58f,           
//     userId: 58ac313edcaae1dcf55ab585,
//     courseId: 58ac313edcaae1dcf55ab589 },

// allInf[0]-> 
// [ { _id: 58ac313edcaae1dcf55ab585,________________________________________________________
//     externalId: 1,
//     firstName: 'Sofiane',
//     lastName: 'Khatir' },
//   { _id: 58ac313edcaae1dcf55ab586,
//     externalId: 2,
//     firstName: 'Raphael',
//     lastName: 'Le Minor' },
//   { _id: 58ac313edcaae1dcf55ab587,
//     externalId: 3,
//     firstName: 'Lucas',
//     lastName: 'Baujard' },
//   { _id: 58ac313edcaae1dcf55ab588,
//     externalId: 4,
//     firstName: 'Matthias',
//     lastName: 'Leconte' } ]
// allInf[1]-> 
//  [ { _id: 58ac313edcaae1dcf55ab589,_______________________________________________________
//     externalId: 1,
//     name: 'JavaScript Road Trip Part 1',
//     skillPoints: [ [Object] ] },
//   { _id: 58ac313edcaae1dcf55ab58a,
//     externalId: 2,
//     name: 'JavaScript Road Trip Part 2',
//     skillPoints: [ [Object], [Object] ] },
//   { _id: 58ac313edcaae1dcf55ab58b,
//     externalId: 3,
//     name: 'React',
//     skillPoints: [ [Object], [Object], [Object] ] },
//   { _id: 58ac313edcaae1dcf55ab58c,
//     externalId: 4,
//     name: 'Redux',
//     skillPoints: [ [Object], [Object], [Object] ] },
//   { _id: 58ac313edcaae1dcf55ab58d,
//     externalId: 5,
//     name: 'Redux',
//     skillPoints: [ [Object], [Object], [Object], [Object] ] },
//   { _id: 58ac313edcaae1dcf55ab58e,
//     externalId: 6,
//     name: 'Functionnal Programming',
//     skillPoints: [ [Object], [Object] ] } ]
//   allInf[2]->
// [ { _id: 58ac313fdcaae1dcf55ab58f,__________________________________________________
//     userId: 58ac313edcaae1dcf55ab585,
//     courseId: 58ac313edcaae1dcf55ab589 },
//   { _id: 58ac313fdcaae1dcf55ab590,
//     userId: 58ac313edcaae1dcf55ab585,
//     courseId: 58ac313edcaae1dcf55ab58a },
//   { _id: 58ac313fdcaae1dcf55ab591,
//     userId: 58ac313edcaae1dcf55ab585,
//     courseId: 58ac313edcaae1dcf55ab58c },
//   { _id: 58ac313fdcaae1dcf55ab592,
//     userId: 58ac313edcaae1dcf55ab585,
//     courseId: 58ac313edcaae1dcf55ab58e },
//   { _id: 58ac313fdcaae1dcf55ab593,
//     userId: 58ac313edcaae1dcf55ab586,
//     courseId: 58ac313edcaae1dcf55ab589 },
//   { _id: 58ac313fdcaae1dcf55ab594,
//     userId: 58ac313edcaae1dcf55ab586,
//     courseId: 58ac313edcaae1dcf55ab58d },
//   { _id: 58ac313fdcaae1dcf55ab595,
//     userId: 58ac313edcaae1dcf55ab587,
//     courseId: 58ac313edcaae1dcf55ab58c },
//   { _id: 58ac313fdcaae1dcf55ab596,
//     userId: 58ac313edcaae1dcf55ab587,
//     courseId: 58ac313edcaae1dcf55ab58d },
//   { _id: 58ac313fdcaae1dcf55ab597,
//     userId: 58ac313edcaae1dcf55ab587,
//     courseId: 58ac313edcaae1dcf55ab58e },
//   { _id: 58ac313fdcaae1dcf55ab598,
//     userId: 58ac313edcaae1dcf55ab587,
//     courseId: 58ac313edcaae1dcf55ab589 },
//   { _id: 58ac313fdcaae1dcf55ab599,
//     userId: 58ac313edcaae1dcf55ab588,
//     courseId: 58ac313edcaae1dcf55ab589 },
//   { _id: 58ac313fdcaae1dcf55ab59a,
//     userId: 58ac313edcaae1dcf55ab588,
//     courseId: 58ac313edcaae1dcf55ab589 },
//   { _id: 58ac313fdcaae1dcf55ab59b,
//     userId: 58ac313edcaae1dcf55ab588,
//     courseId: 58ac313edcaae1dcf55ab58b },
//   { _id: 58ac313fdcaae1dcf55ab59c,
//     userId: 58ac313edcaae1dcf55ab588,
//     courseId: 58ac313edcaae1dcf55ab58d },
//   { _id: 58ac313fdcaae1dcf55ab59d,
//     userId: 58ac313edcaae1dcf55ab588,
//     courseId: 58ac313edcaae1dcf55ab58c } 
// ]











    
















// Sofi de la Torre - Flex Your Way Out (ft. Blackbear)