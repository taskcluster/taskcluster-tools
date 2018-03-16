import { Component } from 'react';
import { Link } from 'react-router-dom';
import resolve from 'resolve-pathname';
import { Grid, Row, Col } from 'react-bootstrap';
import 'prismjs/themes/prism.css';
import HelmetTitle from '../components/HelmetTitle';
import Error from '../components/Error';
import TableOfContents from '../components/TableOfContents';
import { container, page } from './styles.module.css';
import './globals.css';

export default class Documentation extends Component {
  state = {
    error: null,
    Document: null,
    meta: null
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

  pageHasSidebar() {
    return ['/docs/manual', '/docs/reference'].some(path =>
      this.props.location.pathname.includes(path)
    );
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

    return (
      <Grid fluid className={container}>
        {meta.title && <HelmetTitle title={meta.title} />}
        {this.pageHasSidebar() ? (
          <Row>
            <Col md={3}>
              <TableOfContents pathname={this.props.location.pathname} />
            </Col>
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
