import { PureComponent } from 'react';
import { Alert } from 'react-bootstrap';
import { header, footer } from './styles.module.css';

export default class TaskclusterWebBanner extends PureComponent {
  render() {
    const { children } = this.props;

    return (
      <Alert bsStyle="info">
        <div className={header}>
          <strong>Taskcluster Web (alpha)</strong>
        </div>
        {children}
        <div className={footer}>
          <small>
            Report bugs or missing features by{' '}
            <a href="https://github.com/taskcluster/taskcluster/issues/new">
              creating an issue
            </a>.
          </small>
        </div>
      </Alert>
    );
  }
}
