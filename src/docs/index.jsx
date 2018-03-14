import { Component } from 'react';
import { Link } from 'react-router-dom';
import resolve from 'resolve-pathname';
import 'prismjs/themes/prism.css';
import HelmetTitle from '../components/HelmetTitle';
import Error from '../components/Error';
import { container } from './styles.module.css';

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
      const doc = match.params.path
        ? match.params.path.replace('docs', '')
        : '';
      const { default: Document, meta } = await this.handleImport(doc);

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

  /* eslint-disable react/no-danger */
  codeBlockFactory = (props, children) => (
    <pre {...props}>
      <code dangerouslySetInnerHTML={{ __html: children }} />
    </pre>
  );
  /* eslint-enable react/no-danger */

  render() {
    const { error, Document, meta } = this.state;

    if (error) {
      return <Error error={error} />;
    }

    if (!Document) {
      return null;
    }

    return (
      <div className={container}>
        {meta.title && <HelmetTitle title={meta.title} />}
        <Document
          factories={{
            a: this.anchorFactory,
            codeBlock: this.codeBlockFactory
          }}
        />
      </div>
    );
  }
}
