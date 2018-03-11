import { PureComponent } from 'react';
import { string, object } from 'prop-types';
import { getLanguage, highlight } from 'highlight.js';
import 'highlight.js/styles/github.css';

export default class Code extends PureComponent {
  render() {
    const { children, language, style } = this.props;
    const code = highlight(language, children, true);

    /* eslint-disable react/no-danger */
    return (
      <pre className={`language-${language}`} style={style}>
        <code dangerouslySetInnerHTML={{ __html: code.value }} />
      </pre>
    );
    /* eslint-enable react/no-danger */
  }
}

Code.propTypes = {
  children: string.isRequired,
  style: object,
  /* eslint-disable consistent-return */
  language: (props, propName) => {
    const language = props[propName];

    if (!getLanguage(language)) {
      return new Error(`Language '${language}' not supported by highlight.js`);
    }
  }
  /* eslint-enable consistent-return */
};
