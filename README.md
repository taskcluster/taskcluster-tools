TaskCluster Tools
=================

This repository contains a collection of useful tools for use with TaskCluster.
Generally, we strive to not add UI to TaskCluster components, but instead offer
well documented APIs that can be easily consumed using a client library for
TaskCluster. See [TaskCluster documentation site](http://docs.taskcluster.net)
for details.


Developing TaskCluster Tools
============================

Prerequisites for building TaskCluster Tools
--------------------------------------------
  - Node version 4.x
  - Grunt-cli (Allows you to test and see the changes)
  - Jade (installed as one of the dependencies)

```
Note:  Grunt-cli and Jade will be installed as dependencies when you run "npm install".
```

Building
--------

```
git clone https://github.com/taskcluster/taskcluster-tools.git
cd taskcluster-tools
npm install
```

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

Testing changes
---------------
Install the dependencies needed for grunt and start it up:
* npm install
* grunt develop or (./node_modules/.bin/grunt develop)

Grunt allows you to test and see your changes.
The grunt default task builds, watches sources and serves them from
`http://localhost:9000`.

Available targets
-----------------

  - `grunt`, the default target build, watches sources and serves the `build/`
    folder on `http://localhost:9000/`.
  - `grunt build`, builds sources into the `build/` folder.
  - `grunt clean`, delete generated files (ie. deletes the `build/` folder).
  - `grunt develop`, it serves on localhost and watches sources


Configuration with Sublime 2
----------------------------
Install [sublime-react](https://github.com/reactjs/sublime-react), open one of
`.jsx` files the do:

`View` > `Syntax` > `Open all with current extension as...` > `JavaScript (JSX)`


Testing
-------
Until someone comes up with something better, which probably involves redux or similar,
all testing is manual. Open the tools and check that they work.


Ngrok Setup (optional)
-----------
Ngrok allows you to expose a web server running on your local machine to the internet.
Ngrok is used creating a https connection, so that you can login to the taskcluster-tools.
For using ngrok:
  - Create an account (free) on [ngrok](https://ngrok.com/).
  - Install ngrok - npm install ngrok
  - Run ngrok - ngrok http 9000
