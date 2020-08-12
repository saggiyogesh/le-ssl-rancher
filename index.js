/* eslint-disable no-await-in-loop */
const { API_KEY, RANCHER_SERVER_API, LE_CONFIG_HOME } = process.env;

const fastify = require('fastify')({
  logger: true,
  prefix: 'v1'
});
const assert = require('assert');
const axios = require('axios');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const { getCert, getCertData, renewCert, getSecretNameFromDomain} = require('./cert');

assert(RANCHER_SERVER_API);
assert(API_KEY);

const adapter = new FileSync(`${LE_CONFIG_HOME}/db.json`);
const db = low(adapter);

// Set default state
db.defaults({ certs: [], projectIds: [] }).write();

const instance = axios.create({
  baseURL: RANCHER_SERVER_API,
  timeout: 4000,
  headers: {
    Authorization: `Bearer ${API_KEY}`
  }
});

// Declare a route
const postSchema = {
  body: {
    type: 'object',
    required: ['projectId', 'domain'],
    properties: {
      projectId: { type: 'string' },
      domain: { type: 'string' }
    }
  }
};
fastify.post('/insertDomainSecret', { schema: postSchema }, async (request, reply) => {
  const { domain, projectId } = request.body;

  const certSecretName = await getSecretNameFromDomain(domain)
  let certObj = db
    .get('certs')
    .find({ name: certSecretName })
    .value();

  certObj = certObj || {};

  console.log('insertDomainSecret inputs ---', domain, projectId, certSecretName, certObj);

  let { keyFile, cerFile } = certObj;
  if (certObj && certObj.name) {
    // push existing generated ssl cert to secret of the project
    console.log('Certs exists. Skipping');
  } else {
    const cert = await getCert(domain);

    // persist info in db
    db.get('certs')
      .push({ name: certSecretName, keyFile: cert.keyFile, cerFile: cert.cerFile })
      .write();
    keyFile = cert.keyFile;
    cerFile = cert.cerFile;
  }

  const { keyFileData, cerFileData } = getCertData(keyFile, cerFile);

  const rancherCertURL = `/project/${projectId}/certificates`;

  const { data } = await instance.get(`${rancherCertURL}?name=${certSecretName}`);
  console.log('cert name if exists in project--->>>', data && data.name);

  if (data.data && data.data.length) {
    // cert exists on rancher, update it
    console.log('cert id--', data.data[0].id);
    const certId = data.data[0].id;
    // const { data: d } = await instance.get(`${rancherCertURL}/${certId}`);
    // console.log('cert data--', d);
    const { data: d1 } = await instance.put(`${rancherCertURL}/${certId}`, {
      id: certId,
      key: keyFileData,
      certs: cerFileData
    });

    console.log('update ssl cert', domain, d1.name);
  } else {
    // create on rancher
    const { data: d1 } = await instance.post(`${rancherCertURL}`, {
      name: certSecretName,
      key: keyFileData,
      certs: cerFileData,
      type: 'certificate'
    });

    console.log('added new ssl cert', domain, d1.name);
  }

  db.get('projectIds')
    .push({ projectId, certSecretName })
    .write();

  return { hello: 'world' };
});

fastify.get('/', async () => {
  return 'OK';
});

fastify.post('/renewDomainSecret', { schema: postSchema }, async (request, reply) => {
  const { domain } = request.body;

  const certSecretName = await getSecretNameFromDomain(domain);
  // let certObj = db
  //   .get('certs')
  //   .find({ name: certSecretName })
  //   .value();
  const renewedCertObj = await renewCert(domain);

  const projObj = db
    .get('projectIds')
    .value();

  // certObj = certObjsudo docker-compose down || {};

//  console.log('insertDomainSecret inputs ---', domain, projectId, certSecretName, certObj);

  const { keyFile, cerFile } = renewedCertObj;

  const { keyFileData, cerFileData } = getCertData(keyFile, cerFile);
  for (const _currentProj of projObj) {
    if (_currentProj.certSecretName === certSecretName) {
      console.log('found existing project', _currentProj.projectId);
      const rancherCertURL = `/project/${_currentProj.projectId}/certificates`;
  // eslint-disable-next-line no-await-in-loop
      console.log('rancher url', rancherCertURL);
      const { data } = await instance.get(`${rancherCertURL}?name=${certSecretName}`);
      console.log('cert name if exists in project--->>>', data && data.name);
      if (data.data && data.data.length) {
    // cert exists on rancher, update it
        console.log('cert id--', data.data[0].id);
        const certId = data.data[0].id;
    // const { data: d } = await instance.get(`${rancherCertURL}/${certId}`);
    // console.log('cert data--', d);
        const { data: d1 } = await instance.put(`${rancherCertURL}/${certId}`, {
          id: certId,
          key: keyFileData,
          certs: cerFileData
        });

    console.log('update ssl cert', domain, d1.name);
    }
  }
}

return { hello: 'world' };
});

// Run the server!
fastify.listen(process.env.PORT || 80, function(err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  fastify.log.info(`server listening on ${address}`);
});
