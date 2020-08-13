const assert = require('assert');
const fs = require('fs');
const execa = require('execa');

const {
  LE_USE_STAGING = true,
  LE_CONFIG_HOME,
  DEBUG = false,
  ACME_SH_DNS = 'dns_gd', // By default for godaddy dns,
  ACCOUNT_EMAIL
} = process.env;

assert(ACCOUNT_EMAIL);

if (ACME_SH_DNS === 'dns_gd') {
  assert(process.env.GD_Key, 'Provide Godaddy api key. https://github.com/acmesh-official/acme.sh/wiki/dnsap');
  assert(process.env.GD_Secret, 'Provide Godaddy api secret. https://github.com/acmesh-official/acme.sh/wiki/dnsap');
}

// const certName = `${DOMAIN_NAME.replace(/\./g, '-').replace(/\*/g, 'wildcard')}-ssl-certs`;
exports.getSecretNameFromDomain = function(domain) {
  return `${domain.replace(/\./g, '-').replace(/\*/g, 'wildcard')}-ssl-certs`;
};

exports.getCert = async function(domain) {
  const CMD = `/root/.acme.sh/acme.sh --issue  ${Boolean(LE_USE_STAGING) ? '--staging' : ''} ${
    Boolean(DEBUG) ? '--debug' : ''
  } --dns ${ACME_SH_DNS} -d '${domain}' --force  --nocron  --accountemail ${ACCOUNT_EMAIL}`;

  console.log('CMD-->', CMD);

  const subprocess = execa('sh', [CMD], { shell: true });
  subprocess.stdout.pipe(process.stdout);
  subprocess.stderr.pipe(process.stderr);

  const execaRes = await subprocess;

  // console.log('execaRes', execaRes);

  const certDir = `${LE_CONFIG_HOME}/${domain}`;
  console.log('acme.sh cert dir -- ', certDir);

  const keyFile = `${certDir}/${domain}.key`;
  const cerFile = `${certDir}/fullchain.cer`;

  console.log('keyfile', keyFile);
  console.log('cerFile', cerFile);

  return { keyFile, cerFile };
};

exports.renewCert = async function(domain) {
  const CMD = `/root/.acme.sh/acme.sh --renew  ${Boolean(LE_USE_STAGING) ? '--staging' : ''} ${
    Boolean(DEBUG) ? '--debug' : ''
  } --dns ${ACME_SH_DNS} -d '${domain}' --force --accountemail ${ACCOUNT_EMAIL}`;

  console.log('CMD-->', CMD);

  const subprocess = execa('sh', [CMD], { shell: true });
  subprocess.stdout.pipe(process.stdout);
  subprocess.stderr.pipe(process.stderr);

  const execaRes = await subprocess;

  // console.log('execaRes', execaRes);

  const certDir = `${LE_CONFIG_HOME}/${domain}`;
  console.log('acme.sh cert dir -- ', certDir);

  const keyFile = `${certDir}/${domain}.key`;
  const cerFile = `${certDir}/fullchain.cer`;

  console.log('keyfile', keyFile);
  console.log('cerFile', cerFile);

  return { keyFile, cerFile };
};

exports.getCertData = function(keyFile, cerFile) {
  const keyFileData = fs.readFileSync(keyFile, 'utf8');
  const cerFileData = fs.readFileSync(cerFile, 'utf8');

  // console.log('fiels--', keyFileData, cerFileData);
  return { keyFileData, cerFileData };
};

// const rancherCertURL = `/project/${NAMESPACE_ID}/certificates`;

// (async function() {
//   try {
//     const subprocess = execa('sh', [CMD], { shell: true });
//     subprocess.stdout.pipe(process.stdout);
//     subprocess.stderr.pipe(process.stderr);

//     const execaRes = await subprocess;

//     // console.log('execaRes', execaRes);

//     const certDir = `${LE_CONFIG_HOME}/${DOMAIN_NAME}`;
//     console.log('acme.sh cert dir -- ', certDir);

//     const keyFilePath = `${certDir}/${DOMAIN_NAME}.key`;
//     const cerFilePath = `${certDir}/fullchain.cer`;

//     console.log('keyfile', keyFilePath);
//     console.log('cerFile', cerFilePath);

//     const keyFile = fs.readFileSync(keyFilePath, 'utf8');
//     const csrFile = fs.readFileSync(cerFilePath, 'utf8');

//     console.log('fiels--', keyFile, csrFile);

//     // get cert by name
//     const { data } = await instance.get(`${rancherCertURL}?name=${certName}`);
//     console.log('data--->>>', data);

//     if (data.data && data.data.length) {
//       // cert exists on rancher, update it
//       console.log('data--', data.data[0].id);
//       const certId = data.data[0].id;
//       const { data: d } = await instance.get(`${rancherCertURL}/${certId}`);
//       console.log('cert data--', d);
//       const { data: d1 } = await instance.put(`${rancherCertURL}/${certId}`, {
//         id: certId,
//         key: keyFile,
//         certs: csrFile
//       });

//       console.log('update ssl cert', DOMAIN_NAME, d1);
//     } else {
//       // create on rancher
//       const { data: d1 } = await instance.post(`${rancherCertURL}`, {
//         name: certName,
//         key: keyFile,
//         certs: csrFile,
//         type: 'certificate'
//       });

//       console.log('added new ssl cert', DOMAIN_NAME, d1);
//     }
//   } catch (err) {
//     console.log('err', err);
//     process.exit(1);
//   }
// })();
