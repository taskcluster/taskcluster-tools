import { PureComponent } from 'react';
import { string } from 'prop-types';
import { Row, Col, Collapse } from 'react-bootstrap';
import ManualSidebar from '../../docs/ManualSidebar';
import ReferenceSidebar from '../../docs/ReferenceSidebar';
import HamburgerMenu from '../HamburgerMenu';

export default class TableOfContents extends PureComponent {
  static propTypes = {
    pathname: string.isRequired
  };

  state = {
    showSidebar: true
  };

  handleMenuClick = () =>
    this.setState({ showSidebar: !this.state.showSidebar });

  render() {
    const { pathname } = this.props;
    const { showSidebar } = this.state;
    const Sidebar = pathname.includes('/docs/manual')
      ? ManualSidebar
      : ReferenceSidebar;

    if (Sidebar) {
      return (
        <div>
          <Row>
            <Col mdHidden lgHidden>
              <HamburgerMenu onClick={this.handleMenuClick} />
            </Col>
          </Row>
          <Row>
            <Col>
              <Collapse in={showSidebar}>
                <div>
                  <Sidebar />
                </div>
              </Collapse>
            </Col>
          </Row>
        </div>
      );
    }
  }
}
