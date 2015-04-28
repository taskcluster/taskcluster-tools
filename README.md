TaskCluster Tools
=================

This repository contains a collection of useful tools for use with TaskCluster.
Generally, we strive to not add UI to TaskCluster components, but instead offer
well documented APIs that can be easily consumed using a client library for
TaskCluster. See [TaskCluster documentation site](http://docs.taskcluster.net)
for details.


Developing TaskCluster Tools
============================

Code Organization
-----------------
  - lib/    (code intended for reuse)
  - <app>/  (application specific-code, can be reused)
  - `*.jsx` (file containing JSX)
  - `*.js`  (file with pure Javascript, no JSX syntax or header)


Grunt Tasks and Configuration
-----------------------------
Our grunt file offers compilation of:

 - Javascript/JSX (react.js) files to browserified bundles
 - less files to CSS
 - jade files to HTML

The grunt default task builds, watches sources and serves them from
`http://localhost:9000`.

targets:

  - `grunt`, the default target build, watches sources and serves the `build/`
    folder on `http://localhost:9000/`.
  - `grunt build`, builds sources into the `build/` folder.
  - `grunt clean`, delete generated files (ie. deletes the `build/` folder).


Configuration with Sublime 2
----------------------------
Install [sublime-react](https://github.com/reactjs/sublime-react), open one of
`.jsx` files the do:

`View` > `Syntax` > `Open all with current extension as...` > `JavaScript (JSX)`


