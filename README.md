# le-ssl-rancher


## Env vars

- `RANCHER_SERVER_API`: Rancher master host like `https://rancher-master.server.com`

- `API_KEY`: API token from user panel. `username:secret`

- `LE_USE_STAGING`: Boolean flag to generate test LE test ssl certs. Default is `true`.

- `DEBUG`: acme.sh debug logs. Default is `false`

- `ACME_SH_DNS`: acme.sh dns api. Default is `dns_gd`

- `GD_Key`: Godaddy dev api key

- `GD_Secret`: Godaddy dev api secret

- `LE_CONFIG_HOME` acme.sh location certs will be stored in this dir. Provided by base image. NO NEED TO UPDATE

## APIs

- Generate new certificate and add secret to multiple Rancher projects

  POST `v1/insertDomainSecret`

  Request Body:

      `domain`: FQDN for which SSL cert to be generated

      `projectId`: Rancher project id, in which the domain secret to be added
  
  Curl command
  ```
  curl -d '{"domain":"*.domain.com", "projectId":"c-7lll9:p-wxlcn"}' -H "Content-Type: application/json" -X POST http://localhost/insertDomainSecret
  ```
  Note: This api will also create secret of any existing SSL certificate generated by acme.sh
