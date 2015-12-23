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

  // Client Manager
  'auth/clients/index.jade',
  'auth/clients/app.less',
  'auth/clients/app.jsx',

  // Roles Manager
  'auth/roles/index.jade',
  'auth/roles/app.less',
  'auth/roles/app.jsx',

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

  // Aws Provisioner
  'aws-provisioner/index.jade',
  'aws-provisioner/app.jsx',
  'aws-provisioner/app.less',

  // Index Browser
  'index/index.jade',
  'index/app.jsx',
  'index/app.less',

  // Indexed Artifact Browser
  'index/artifacts/index.jade',
  'index/artifacts/app.jsx',
  'index/artifacts/app.less',

  // Hooks Manager
  'hooks/index.jade',
  'hooks/app.jsx',
  'hooks/app.less',

  // Secrets manager
  'secrets/index.jade',
  'secrets/app.jsx',
  'secrets/app.less',

  // Interactive
  'interactive/index.jade',
  'interactive/app.jsx',

  // Interactive shall
  'shell/index.jade',
  'shell/app.jsx',

  // Interactive display
  'display/index.jade',
  'display/app.jsx',
  'display/app.less'
].map(function(file) {
  return path.join(__dirname, file);
});
