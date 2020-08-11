const FileSync = require('lowdb/adapters/FileSync');
const low = require('lowdb');

const adapter = new FileSync("./db.json");


const db = low(adapter);

const certSecretName="wildcard-perftest-learnindialearn-org-ssl-certs"

console.log(certSecretName)
let certObj = db
.get('projectIds')
.find({ certSecretName: certSecretName })
.value();

console.log(certObj)