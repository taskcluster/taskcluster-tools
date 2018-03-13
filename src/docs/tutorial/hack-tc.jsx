import ReactMarkdown from 'react-markdown';
import nextSteps from '../components/nextSteps';

const view = `
Hacking on Taskcluster is really easy. Head over to the [Taskcluster GitHub
page](https://github.com/taskcluster) and dive right in. Fork a project you
want to contribute to and feel free to make pull requests.

The code base uses ES2015+ syntax and features like Promises and Async Functions.
Jump over to [async JavaScript](async-javascript) if you need to learn more.

${nextSteps([
  {
    label: 'Submitting changes of Taskcluster itself for review',
    path: '/docs/tutorial/reviews'
  }
])}
`;
const HackTc = props => <ReactMarkdown source={view} {...props} />;

export default HackTc;
