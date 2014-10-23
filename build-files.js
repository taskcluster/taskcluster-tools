var path = require('path')

// Files that should be built as follows:
//    *.js    -> build/*.bundle.js
//    *.less  -> build/*.css
//    *.jade  -> build/*.html
module.exports = [
  // Authentication Manager
  'auth/index.jade',
  'auth/app.less',
  'auth/app.jsx',

  // Login
  'login/index.jade',
  'login/app.jsx',

  // Preferences
  'preferences/index.jade',
  'preferences/app.jsx'
].map(function(file) {
  return path.join(__dirname, file);
});