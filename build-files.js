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
  'pulse-inspector/app.less',

  // Task Inspector
  'task-inspector/index.jade',
  'task-inspector/app.jsx',
  'task-inspector/app.less',

  // Task-Graph Inspector
  'task-graph-inspector/index.jade',
  'task-graph-inspector/app.jsx',
  'task-graph-inspector/app.less',

  // Task Creator
  'task-creator/index.jade',
  'task-creator/app.jsx',
  'task-creator/app.less',

  // Index Browser
  'index/index.jade',
  'index/app.jsx',
  'index/app.less',

  // Indexed Artifact Browser
  'index/artifacts/index.jade',
  'index/artifacts/app.jsx',
  'index/artifacts/app.less'
].map(function(file) {
  return path.join(__dirname, file);
});