import { Component } from 'react';
import { Link } from 'react-router-dom';
import HelmetTitle from '../components/HelmetTitle';
import Error from '../components/Error';

export default class Doc extends Component {
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

  handleImport = doc => {
    if (!doc) {
      return import('./index.md');
    }

    return import(`./${doc}.md`).catch(() => import(`./${doc}/index.md`));
  };

  handleLoadDocument = async ({ match }) => {
    try {
      const { default: Document, meta } = await this.handleImport(match.url);

      this.setState({ Document, meta });
    } catch (error) {
      this.setState({ error });
    }
  };

  render() {
    const { match } = this.props;
    const { error, Document, meta } = this.state;

    if (error) {
      return <Error error={error} />;
    }

    if (!Document) {
      return null;
    }

    return (
      <div>
        {meta.title && <HelmetTitle title={meta.title} />}
        <Document
          factories={{
            a: ({ href, ...props }, ...children) => {
              if (href.startsWith('http')) {
                return (
                  <a
                    href={href}
                    {...props}
                    target="_blank"
                    rel="noopener noreferrer">
                    {children}
                  </a>
                );
              }

              return (
                <Link to={`${match.url}/${href}`} {...props}>
                  {children}
                </Link>
              );
            }
          }}
        />
      </div>
    );
  }
}
