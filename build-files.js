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
  'credentials/index.jade',
  'credentials/app.jsx',

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

  // Task Group Inspector
  'task-group-inspector/index.jade',
  'task-group-inspector/app.jsx',
  'task-group-inspector/app.less',

  // Task Creator
  'task-creator/index.jade',
  'task-creator/app.jsx',
  'task-creator/app.less',

  // Aws Provisioner
  'aws-provisioner/index.jade',
  'aws-provisioner/app.jsx',
  'aws-provisioner/app.less',

  // AMI set
  'ami-sets/index.jade',
  'ami-sets/app.jsx',
  'ami-sets/app.less',

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
  'display/app.less',

  // one-click-loaner
  'one-click-loaner/index.jade',
  'one-click-loaner/app.jsx',

  // one-click-loaner connect
  'one-click-loaner/connect/index.jade',
  'one-click-loaner/connect/app.jsx',
  'one-click-loaner/connect/connect.less',

  // Status
  'status/index.jade',
  'status/app.jsx',
  'status/app.less',

  //Diagnostics
  'diagnostics/index.jade',
  'diagnostics/app.jsx',
  'diagnostics/app.less'
].map(function(file) {
  return path.join(__dirname, file);
});
