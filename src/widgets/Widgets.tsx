import * as React from 'react';
import { Utils, PathRegion, Helpable } from './Utils';

import Slider, { Range } from 'rc-slider';
import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';

interface ThresholdSliderProps {
  featureThreshold: number[];
  featureSelection: boolean[];
  handleThreshold: any;
  handleSelection: any;
}

export class ThresholdSlider extends React.Component<ThresholdSliderProps, {}>
  implements Helpable {
  constructor(props: ThresholdSliderProps) {
    super(props);
  }
  help() {
    return (
      <div>
        <h3>Threshold-selector</h3>
        <p>A threshold of features are changed as you move the slider.</p>
        <p>The check boxes select the features to be displayed.</p>
      </div>
    );
  }
  link() {
    return '';
  }
  render() {
    return (
      <div className="threshold-slider">
        <span>Priority threshold: Low {'<=>'} High </span>
        <Range
          min={0}
          max={100}
          title="Filter genomic feature with the range of priority"
          value={this.props.featureThreshold}
          onChange={this.props.handleThreshold}
          tipFormatter={value => `${value}%`}
        />
        <div className="input-group">
          <span className="input-group-prepend">
            <div className="input-group-text">
              <input
                type="checkbox"
                checked={this.props.featureSelection[0]}
                onChange={_ => this.props.handleSelection(0)}
                aria-label="Checkbox for inter-chromosomal feature"
              />
            </div>
          </span>
          <label className="form-control">Inter-Chromosomal</label>
          <span className="input-group-prepend">
            <div className="input-group-text">
              <input
                type="checkbox"
                checked={this.props.featureSelection[1]}
                onChange={_ => this.props.handleSelection(1)}
                aria-label="Checkbox for intra-chromosomal feature"
              />
            </div>
          </span>
          <label className="form-control">Intra-Chromosomal</label>
        </div>
      </div>
    );
  }
}
