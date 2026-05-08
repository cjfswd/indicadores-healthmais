const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

async function generate() {
  const attrs = [{ name: 'commonName', value: 'localhost' }];
  const pems = await selfsigned.generate(attrs, { days: 365, keySize: 2048 });

  fs.writeFileSync(path.join(__dirname, 'certs', 'cert.pem'), pems.cert);
  fs.writeFileSync(path.join(__dirname, 'certs', 'key.pem'), pems.private);
  console.log('Certificates generated in certs/ directory.');
}

generate().catch(console.error);
