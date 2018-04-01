'use strict';

var React = require('react');
var jsdiff = require('diff');

var fnMap = {
  'chars': jsdiff.diffChars,
  'words': jsdiff.diffWords,
  'sentences': jsdiff.diffSentences,
  'json': jsdiff.diffJson,
  'lines': jsdiff.diffLines
};

module.exports = React.createClass({
  displayName: 'Diff',

  getDefaultProps: function getDefaultProps() {
    return {
      inputA: '',
      inputB: '',
      type: 'chars'
    };
  },

  propTypes: {
    inputA: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.object]),
    inputB: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.object]),
    type: React.PropTypes.oneOf(['chars', 'words', 'sentences', 'json', 'lines'])
  },

  render: function render() {
    var diff = fnMap[this.props.type](this.props.inputA, this.props.inputB);

    if (this.props.propTypes === 'lines') {
      diff = fnMap[this.props.type](this.props.inputA, this.props.inputB[{ newlineIsToken: true }]);
    }
    
    var result = diff.map(function (part, index) {
      var spanStyle = {
        color: part.added ? 'seagreen' : part.removed ? 'red' : 'grey',
        backgroundColor: part.added ? 'springgreen' : part.removed ? 'mistyrose' : null
      };
      return React.createElement(
        'span',
        { key: index, style: spanStyle },
        part.value
      );
    });
    return React.createElement(
      'pre',
      { className: 'diff-result' },
      result
    );
  }
});
