import React from 'react';
import { string } from 'prop-types';
import markdown from 'markdown-it';
import { container } from './styles.css';

export default class Markdown extends React.PureComponent {
  render() {
    return (
      <span
        className={container}
        dangerouslySetInnerHTML={{
          __html: markdown().render(this.props.children)
        }} />
    );
  }
}

Markdown.propTypes = {
  children: string.isRequired
};

Markdown.defaultProps = {
  children: ''
};
