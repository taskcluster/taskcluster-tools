import { PureComponent } from 'react';
import { string } from 'prop-types';
import markdown from 'markdown-it';
import { container } from './styles.module.css';

export default class Markdown extends PureComponent {
  render() {
    /* eslint-disable react/no-danger */
    return (
      <span
        className={container}
        dangerouslySetInnerHTML={{
          __html: markdown().render(this.props.children)
        }}
      />
    );
    /* eslint-enable react/no-danger */
  }
}

Markdown.propTypes = {
  children: string.isRequired
};

Markdown.defaultProps = {
  children: ''
};
