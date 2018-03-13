import ReactMarkdown from 'react-markdown';
import nextSteps from '../components/nextSteps';

const view = `
# Welcome to Taskcluster!

---

This tutorial is designed to help you learn what you need to know about
Taskcluster to accomplish your goals. You can navigate it by answering the
question at the bottom of each page, which will bring you to the most helpful
information.

If you want a more comprehensive description of Taskcluster's design and
operation, see the manual portion of this documentation.

## Patches Welcome!

As you learn more, please feel welcome to [contribute](https://github.com/taskcluster/taskcluster-docs) more choices and pathways to this tutorial.
Especially if you did not find the information you were seeking, you are best able to decide where to add a new choice!

${nextSteps([
  {
    label: "I'm not sure - what is it?",
    path: '/docs/tutorial/what-is-tc'
  },
  {
    label: 'I want to run a task manually in Taskcluster.',
    path: '/docs/tutorial/hello-world'
  },
  {
    label:
      "I'm a Firefox/Gecko developer and I want to change builds or tests.",
    path: '/docs/tutorial/gecko-tasks'
  },
  {
    label: 'A task is failing and I want to debug it.',
    path: '/docs/tutorial/debug-task'
  },
  {
    label: 'I want to work with the Taskcluster APIs.',
    path: '/docs/tutorial/apis'
  },
  {
    label: 'I want to hack on Taskcluster itself.',
    path: '/docs/tutorial/hack-tc'
  }
])}
`;
const Tutorial = props => <ReactMarkdown source={view} {...props} />;

export default Tutorial;
