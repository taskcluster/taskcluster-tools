import { Component } from 'react';
import { NavLink as Link } from 'react-router-dom';

export default class ManualSidebar extends Component {
  render() {
    return (
      <ul className="main-menu nav nav-stacked">
        <li>
          <Link exact to="/docs/manual/tasks/">
            Tasks
          </Link>
          <ul>
            <li>
              <Link exact to="/docs/manual/tasks/times">
                Times
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/tasks/workertypes">
                Worker Types
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/tasks/priority">
                Priority
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/tasks/runs">
                Runs
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/tasks/artifacts">
                Artifacts
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/tasks/dependencies">
                Dependencies and Task Graphs
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/tasks/taskgroupid-schedulerid">
                The taskGroupId and scheduledId properties
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/tasks/manipulating">
                Manipulating Tasks
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/tasks/scopes">
                Task Scopes
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/tasks/messages">
                Messages
              </Link>
            </li>
          </ul>
        </li>

        <li>
          <Link exact to="/docs/manual/task-execution/">
            Task Execution
          </Link>
          <ul>
            <li>
              <Link exact to="/docs/manual/task-execution/queues">
                Queues
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/task-execution/workers">
                Workers
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/task-execution/worker-types">
                Worker Types
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/task-execution/provisioning">
                Provisioning
              </Link>
            </li>
          </ul>
        </li>

        <li>
          <Link exact to="/docs/manual/design/">
            System Design
          </Link>
          <ul>
            <li>
              <Link exact to="/docs/manual/design/apis/">
                Microservice APIs
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/design/apis/hawk/">
                API Authentication and Authorization
              </Link>
              <ul>
                <li>
                  <Link exact to="/docs/manual/design/apis/hawk/authn">
                    Authentication
                  </Link>
                </li>
                <li>
                  <Link exact to="/docs/manual/design/apis/hawk/scopes">
                    Scopes
                  </Link>
                </li>
                <li>
                  <Link exact to="/docs/manual/design/apis/hawk/clients">
                    Clients
                  </Link>
                </li>
                <li>
                  <Link exact to="/docs/manual/design/apis/hawk/roles">
                    Roles
                  </Link>
                </li>
                <li>
                  <Link
                    exact
                    to="/docs/manual/design/apis/hawk/authorized-scopes">
                    Authorized Scopes
                  </Link>
                </li>
                <li>
                  <Link
                    exact
                    to="/docs/manual/design/apis/hawk/temporary-credentials">
                    Temporary Credentials
                  </Link>
                </li>
                <li>
                  <Link exact to="/docs/manual/design/apis/hawk/signed-urls">
                    Pre-signed URLs
                  </Link>
                </li>
                <li>
                  <Link
                    exact
                    to="/docs/manual/design/apis/hawk/troubleshooting">
                    Troubleshooting
                  </Link>
                </li>
              </ul>
            </li>
            <li>
              <Link exact to="/docs/manual/design/apis/errors">
                API Errors
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/design/apis/pulse">
                Pulse
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/design/apis/reference-format">
                Reference Formats
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/design/devel/">
                Development
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/design/devel/principles">
                Guiding Design Principles for Taskcluster
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/design/devel/rfcs">
                RFCs
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/design/devel/idempotency">
                Idempotency
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/design/devel/best-practices/">
                Best Practices
              </Link>
              <ul>
                <li>
                  <Link
                    exact
                    to="/docs/manual/design/devel/best-practices/scopes">
                    Scopes and Roles
                  </Link>
                </li>
                <li>
                  <Link
                    exact
                    to="/docs/manual/design/devel/best-practices/microservices">
                    Building Microservices
                  </Link>
                </li>
                <li>
                  <Link
                    exact
                    to="/docs/manual/design/devel/best-practices/libraries">
                    Building Libraries
                  </Link>
                </li>
                <li>
                  <Link
                    exact
                    to="/docs/manual/design/devel/best-practices/commits">
                    Creating Good Commit Messages
                  </Link>
                </li>
              </ul>
            </li>
            <li>
              <Link exact to="/docs/manual/design/namespaces">
                Namespaces
              </Link>
            </li>
          </ul>
        </li>
        <li>
          <Link exact to="/docs/manual/using/">
            Using Taskcluster
          </Link>
          <ul>
            <li>
              <Link exact to="/docs/manual/using/github">
                Integrating with GitHub
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/using/secrets">
                Handling Secrets
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/using/indexing">
                Indexing Tasks
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/using/scheduled-tasks">
                Running Periodic Tasks
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/using/task-graph">
                Building Task Graphs
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/using/artifacts">
                Working with Artifacts
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/using/caching">
                Caching on Workers
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/using/s3-uploads">
                Uploading to S3
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/using/task-notifications">
                Task Notifications
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/using/administration">
                Project Administration
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/using/integration/">
                Integration with other Applications
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/using/integration/guidelines">
                Guidelines
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/using/integration/frontend">
                Frontend Applications
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/using/integration/backend">
                Backend Services
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/using/integration/pulse">
                Pulse Integrations
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/using/integration/libraries">
                Client Libraries
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/using/handling-high-load">
                Handling High Load
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/using/actions/">
                Defining User Actions on Existing Tasks
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/using/actions/spec">
                Action Specification
              </Link>
            </li>
            <li>
              <Link exact to="/docs/manual/using/actions/ui">
                User Interface Considerations
              </Link>
            </li>
          </ul>
        </li>
      </ul>
    );
  }
}
