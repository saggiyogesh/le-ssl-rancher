const FileSync = require('lowdb/adapters/FileSync');
const low = require('lowdb');

const adapter = new FileSync("./db.json");


const db = low(adapter);

const certSecretName = "wildcard-learnindialearn-org-ssl-certs"

console.log(certSecretName)
let certObj = db
.get('projectIds')
.value();

console.log(certObj)