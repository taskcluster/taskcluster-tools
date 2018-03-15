import { Component } from 'react';
import { Link } from 'react-router-dom';
import resolve from 'resolve-pathname';
import { Grid, Row, Col, Button, Collapse } from 'react-bootstrap';
import 'prismjs/themes/prism.css';
import HelmetTitle from '../components/HelmetTitle';
import Error from '../components/Error';
import ManualSidebar from './ManualSidebar';
import ReferenceSidebar from './ReferenceSidebar';
import { container, menuButton, iconBar, page } from './styles.module.css';
import './globals.css';

export default class Documentation extends Component {
  state = {
    error: null,
    Document: null,
    meta: null,
    showSidebar: true
  };

  componentWillMount() {
    this.handleLoadDocument(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.handleLoadDocument(nextProps);
  }

  handleImport = url => {
    const doc = url ? url.replace(/\/$/, '') : 'index';

    return import(`./${doc}.md`).catch(() => import(`./${doc}/index.md`));
  };

  handleLoadDocument = async ({ match }) => {
    try {
      const { default: Document, meta } = await this.handleImport(
        match.params.path
      );

      this.setState({ Document, meta, error: null });
    } catch (error) {
      this.setState({ error });
    }
  };

  anchorFactory = ({ href, ...props }, ...children) => {
    if (href.startsWith('http')) {
      return (
        <a href={href} {...props} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    }

    const { location } = this.props;
    const url = resolve(href, location.pathname);

    return (
      <Link to={url} {...props}>
        {children}
      </Link>
    );
  };

  handleMenuClick = () =>
    this.setState({ showSidebar: !this.state.showSidebar });

  renderSidebar() {
    const { pathname } = this.props.location;
    let TableOfContent;

    if (pathname.includes('/docs/manual')) {
      TableOfContent = ManualSidebar;
    } else if (pathname.includes('/docs/reference')) {
      TableOfContent = ReferenceSidebar;
    }

    if (TableOfContent) {
      return (
        <div>
          <Row>
            <Col mdHidden lgHidden>
              <Button className={menuButton} onClick={this.handleMenuClick}>
                <span className="sr-only">Toggle menu</span>
                <span className={iconBar} />
                <span className={iconBar} />
                <span className={iconBar} />
              </Button>
            </Col>
          </Row>
          <Row>
            <Col>
              <Collapse in={this.state.showSidebar}>
                <div>
                  <TableOfContent />
                </div>
              </Collapse>
            </Col>
          </Row>
        </div>
      );
    }

    return null;
  }

  render() {
    const { error, Document, meta } = this.state;

    if (error) {
      return <Error error={error} />;
    }

    if (!Document) {
      return null;
    }

    const Page = (
      <Document
        factories={{
          a: this.anchorFactory
        }}
      />
    );
    const Sidebar = this.renderSidebar();

    return (
      <Grid fluid className={container}>
        {meta.title && <HelmetTitle title={meta.title} />}
        {Sidebar ? (
          <Row>
            <Col md={3}>{Sidebar}</Col>
            <Col className={page} md={9}>
              {Page}
            </Col>
          </Row>
        ) : (
          Page
        )}
      </Grid>
    );
  }
}
