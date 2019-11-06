import { PureComponent } from 'react';
import { Alert } from 'react-bootstrap';
import moment from 'moment';
import { horizontalRule, footer } from './styles.module.css';

const storageKey = 'hide-taskcluster-web-banner';

export default class TaskclusterWebBanner extends PureComponent {
  constructor(props) {
    super(props);

    const bannerMemory = localStorage.getItem(storageKey);

    this.state = {
      open: bannerMemory ? moment(bannerMemory).isBefore(new Date()) : true
    };
  }

  handleAlertClose = () => {
    this.setState({ open: false });

    localStorage.setItem(
      storageKey,
      moment()
        .add(2, 'week')
        .format()
    );
  };

  render() {
    const { open } = this.state;
    const { children } = this.props;

    return (
      open && (
        <Alert bsStyle="warning" onDismiss={this.handleAlertClose}>
          <h4>This deployment of Taskcluster will shut down on November 9.</h4>
          {children}
          <hr className={horizontalRule} />
          <div className={footer}>
            <small>
              After that date, access either the{' '}
              <a href="https://firefox-ci-tc.services.mozilla.com/">
                Firefox-CI
              </a>{' '}
              deployment or the{' '}
              <a href="https://community-tc.services.mozilla.com/">
                Community-TC
              </a>{' '}
              deployment, depending on the project you are looking for. This
              deployment will remain, but in a read-only mode, for several
              months to keep existing URLs functional.
            </small>
          </div>
        </Alert>
      )
    );
  }
}
