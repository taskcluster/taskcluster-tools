import { PureComponent } from 'react';
import { Alert } from 'react-bootstrap';
import { horizontalRule, footer } from './styles.module.css';

export default class TaskclusterWebBanner extends PureComponent {
  render() {
    const { children } = this.props;

    return (
      <Alert bsStyle="warning">
        <h4>
          This deployment of Taskcluster{' '}
          <b>has been shut down as of November 9.</b>
        </h4>
        {children}
        <hr className={horizontalRule} />
        <div className={footer}>
          <small>
            Access either the{' '}
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
