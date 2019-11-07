import { PureComponent } from 'react';
import { Alert } from 'react-bootstrap';
import { horizontalRule, footer } from './styles.module.css';

export default class TaskclusterWebBanner extends PureComponent {
  render() {
    const { children } = this.props;

    return (
      <Alert bsStyle="warning">
        <h4>This deployment of Taskcluster will shut down on November 9.</h4>
        {children}
        <hr className={horizontalRule} />
        <div className={footer}>
          <small>
            After that date, access either the{' '}
            <a href="https://firefox-ci-tc.services.mozilla.com/">Firefox-CI</a>{' '}
            deployment or the{' '}
            <a href="https://community-tc.services.mozilla.com/">
              Community-TC
            </a>{' '}
            deployment, depending on the project you are looking for. This
            deployment will remain, but in a read-only mode, for several months
            to keep existing URLs functional.
          </small>
        </div>
      </Alert>
    );
  }
}
