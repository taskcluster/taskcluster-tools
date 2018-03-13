import ReactMarkdown from 'react-markdown';
import nextSteps from '../components/nextSteps';

const view = `
This section shows you how to access Taskcluster APIs programmatically.  The
examples use JavaScript (ES6) using the JavaScript [taskcluster
client](https://github.com/taskcluster/taskcluster-client) but apply to [other
supported
languages](https://taskcluster-docs.ngrok.io/manual/using/integration/libraries).

Note: the graphical Taskcluster tools on \`tools.taskcluster.net\` are all
written in client-side JavaScript using
[taskcluster-client-web](https://github.com/taskcluster/taskcluster-client-web),
the client library designed for use in browser frontends.

${nextSteps([
  {
    label: 'Authenticate to the API',
    path: '/tutorial/authenticate'
  }
])}
`;
const Api = props => <ReactMarkdown source={view} {...props} />;

export default Api;
