import { Component } from 'react';
import PropTypes from 'prop-types';
import jsdiff from 'diff';
import { addition, deletion, unchanged } from './styles.module.css';

// This implementation is a customization of the 'react-diff' module.
// https://github.com/cezary/react-diff

// Add a new 'lines' type to fnMap that was not present in the original module.
const fnMap = {
  chars: jsdiff.diffChars,
  words: jsdiff.diffWords,
  sentences: jsdiff.diffSentences,
  json: jsdiff.diffJson,
  lines: jsdiff.diffLines
};

export default class Diff extends Component {
  static propTypes = {
    original: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    updated: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    type: PropTypes.oneOf(['chars', 'words', 'sentences', 'json', 'lines'])
  };

  static defaultProps = {
    original: '',
    updated: '',
    type: 'chars'
  };

  render() {
    // If the type equals our new 'lines' type, change the 'diff' assignement
    // to pass an option to updated.
    const diff =
      this.props.propTypes === 'lines'
        ? fnMap[this.props.type](
            this.props.original,
            this.props.updated[{ newlineIsToken: true }]
          )
        : fnMap[this.props.type](this.props.original, this.props.updated);
    const result = diff.map((part, index) => {
      let spanStyle = unchanged;

      if (part.added) spanStyle = addition;
      else if (part.removed) spanStyle = deletion;

      return (
        <span key={index} className={spanStyle}>
          {part.value}
        </span>
      );
    });

    return <pre>{result}</pre>;
  }
}
