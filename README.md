# TaskCluster Tools

This repository contains a collection of useful tools for use with TaskCluster.
Generally, we strive to not add UI to TaskCluster components, but instead offer
well documented APIs that can be easily consumed using a client library for
TaskCluster. See [TaskCluster documentation site](https://docs.taskcluster.net)
for details.


## Developing TaskCluster Tools

### Prerequisites for building TaskCluster Tools

- Node version v4+

### Building

```
git clone https://github.com/taskcluster/taskcluster-tools.git
cd taskcluster-tools
npm install
```

### Code Organization

- `src/`    (Tools source code)
- `src/<app>/`  (application specific-code, can be reused)

### Tasks and Configuration

Building this project uses [neutrino](https://github.com/mozilla-neutrino/neutrino),
[neutrino-preset-react](https://github.com/mozilla-neutrino/neutrino-preset-react),
and the `src/tools-preset` to:

- Compile ES2015+ syntax to ES5-compatible JS
- Compile React JSX to de-sugared JS
- Show ESLint errors during development, and both errors and warnings when building
- Build application directories into page-specific bundles
- LESS files to CSS

### Testing changes

Install npm dependencies and start it up:
- npm install
- npm start

This will start a local development server on port 9000 (http://localhost:9000).

Any ESLint errors across the project will be displayed in the terminal during development.

## Available targets

- `npm start`: the default development build, watches `src/`, and serves on `http://localhost:9000/`
- `npm run build`: builds `src/` into a `build/` directory

### Memory problems during development

It's possible that when building a larger project like taskcluster-tools that Node.js will run out
of memory for the amount of files being built during development. As a workaround, instead of
running `npm start`, run the following to run the same command with more memory:

```sh
PORT=9000 node --max-old-space-size=4096 node_modules/.bin/neutrino start -p tools-preset
```

## Testing

Until someone comes up with something better, which probably involves Redux or similar,
all testing is manual. Open the tools and check that they work. :)


## Ngrok Setup (optional)

Ngrok allows you to expose a web server running on your local machine to the internet.
Ngrok is used creating an https connection, so that you can login to the taskcluster-tools.
For using ngrok:

- Create an account (free) on [ngrok](https://ngrok.com/).
- Install ngrok - npm install ngrok
- Run ngrok - ngrok http 9000

<sup>Note: You have to run ngrok in a separate terminal/console.</sup>
