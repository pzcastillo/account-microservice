const bcrypt = require('bcrypt');
const password = 'test1234';
const saltRounds = 10;

bcrypt.hash(password, saltRounds)
  .then(hash => {
    console.log('Hash:', hash);
  })
  .catch(err => {
    console.error('Error hashing:', err);
  });
