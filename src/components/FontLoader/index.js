import React, { Component } from 'react';
import FoutStager from 'react-fout-stager';
import 'material-design-icons/iconfont/material-icons.css';

export default class FontLoader extends Component {
  render() {
    return (
      <FoutStager
        stages={[
          {
            className: 'font-stage-material-icons',
            families: [{ family: 'Material Icons' }]
          },
          {
            className: 'font-stage-primary',
            families: [{ family: 'FiraSans400' }],
            stages: [
              {
                className: 'font-stage-secondary',
                families: [
                  { family: 'FiraSans200', options: { weight: 200 } },
                  { family: 'FiraSans300', options: { weight: 300 } },
                  { family: 'FiraSans500', options: { weight: 500 } },
                  { family: 'FiraSans400Italic', options: { style: 'italic' } },
                  { family: 'FiraSans700', options: { weight: 700 } },
                  {
                    family: 'FiraSans700Italic',
                    options: { weight: 700, style: 'italic' }
                  }
                ]
              },
              {
                className: 'font-stage-tertiary',
                families: [
                  { family: 'FiraMono' },
                  { family: 'FiraMonoBold', options: { weight: 700 } }
                ]
              }
            ]
          }
        ]}
      />
    );
  }
}
