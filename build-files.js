var path = require('path')

// Files that should be built as follows:
//    *.js    -> build/*.bundle.js
//    *.less  -> build/*.css
//    *.jade  -> build/*.html
module.exports = [
  // Layout
  'lib/layout.less',
  'lib/layout.jsx',

  // Landing page
  'index.jade',
  'landingpage.jsx',
  'landingpage.less',

  // Authentication Manager
  'auth/index.jade',
  'auth/app.less',
  'auth/app.jsx',

  // Login
  'login/index.jade',
  'login/app.jsx',

  // Preferences
  'preferences/index.jade',
  'preferences/app.jsx',

  // Pulse Inspector
  'pulse-inspector/index.jade',
  'pulse-inspector/app.jsx',
  'pulse-inspector/app.less'
].map(function(file) {
  return path.join(__dirname, file);
});