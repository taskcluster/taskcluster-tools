// This implementation is a customization of the 'react-diff' module.
// https://github.com/cezary/react-diff

import { Component, PropTypes } from 'react';
import jsdiff from 'diff';

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
    inputA: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    inputB: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    type: PropTypes.oneOf(['chars', 'words', 'sentences', 'json', 'lines'])
  };

  getDefaultProps = () => ({
    inputA: '',
    inputB: '',
    type: 'chars'
  });

  render() {
    let diff = fnMap[this.props.type](this.props.inputA, this.props.inputB);

    // If the type equals our new 'lines' type, change the 'diff' assignement
    // to pass an option to InputB.
    if (this.props.propTypes === 'lines') {
      diff = fnMap[this.props.type](
        this.props.inputA,
        this.props.inputB[{ newlineIsToken: true }]
      );
    }

    // Change the original styling.
    const result = diff.map((part, index) => {
      let color = 'grey';
      let backgroundColor = null;

      if (part.added) {
        color = 'seagreen';
        backgroundColor = 'palegreen';
      } else if (part.removed) {
        color = 'red';
        backgroundColor = 'mistyrose';
      }

      const spanStyle = {
        color,
        backgroundColor
      };

      return (
        <span key={index} style={spanStyle}>
          {part.value}
        </span>
      );
    });

    return <pre className="diff-result">{result}</pre>;
  }
}
