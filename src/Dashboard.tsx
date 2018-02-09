import * as React from 'react';
import * as d3 from 'd3';
import * as ReactDom from 'react-dom';
import * as Raven from 'raven-js';
import { Utils, PathRegion } from './widgets/Utils';
import LazyLoad from 'react-lazy-load';
import * as QueryString from 'query-string';
import DashboardInner from './DashboardInner';

Raven.config(
  'https://7d69f10d11104fa9a644cff495db7d6f@sentry.io/197647'
).install();

const chroms = require('./samples/GRCh37.json'); // TODO(): Should be removed.

export interface ContainerProps {
  uuid: string;
  posText: string[];
  keyId: number;
  reference: string;
  subPathAnnotation: boolean;
}

export interface ContainerState {
  features?: any;
  featureId?: number;
  featureThreshold: number[];
  filteredFeatures?: any;
  featureSelection: boolean[]; //  Inter-chromosomal / Intra-chromosomal
  chroms?: any;
  chromsAll?: any;
  posInner: PathRegion[];
  nodes: number[];
  annotations: any[];
  uuid: string;
  keyId: number;
  sequentialId: number;
  arrayMode: boolean;
  reference?: string;
  name?: string;
  staticFiles: any[];
  subPathAnnotation: boolean;
  steps: number;
}

class DashBoard extends React.Component<ContainerProps, ContainerState> {
  constructor(props: ContainerProps) {
    super(props);
    this._posUpdate = this._posUpdate.bind(this);
    this._posUpdateWithFeature = this._posUpdateWithFeature.bind(this);
    this._posConcat = this._posConcat.bind(this);
    this._posConcatWithFeature = this._posConcatWithFeature.bind(this);
    this._posReplaceWithFeature = this._posReplaceWithFeature.bind(this);
    this._posReplace = this._posReplace.bind(this);
    this._nodesUpdate = this._nodesUpdate.bind(this);
    this._annotationsUpdate = this._annotationsUpdate.bind(this);
    this._annotationsClean = this._annotationsClean.bind(this);
    this._uuidUpdate = this._uuidUpdate.bind(this);
    this._keyIdUpdate = this._keyIdUpdate.bind(this);
    this._handleThreshold = this._handleThreshold.bind(this);
    this._handleSelection = this._handleSelection.bind(this);
    this._changeReference = this._changeReference.bind(this);
    this._arrayMode = this._arrayMode.bind(this);
    this._nameUpdate = this._nameUpdate.bind(this);
    this._stepsUpdate = this._stepsUpdate.bind(this);
    this._toggleSubPathAnnotation = this._toggleSubPathAnnotation.bind(this);

    this.state = {
      chroms: chroms,
      chromsAll: null,
      nodes: [],
      annotations: [],
      featureThreshold: [0, 100],
      featureSelection: [true, true],
      posInner: Utils.strsToRegion(props.posText),
      uuid: props.uuid === undefined ? '' : props.uuid,
      keyId: props.keyId,
      sequentialId: 0,
      reference: props.reference, // default is hg19.
      name: null,
      arrayMode: false,
      staticFiles: [],
      subPathAnnotation: props.subPathAnnotation,
      steps: 3
    };
  }

  componentDidMount() {
    this.fetchOverview();
  }

  _arrayMode() {
    this.setState({ arrayMode: true });
  }

  _changeReference(newReference: string) {
    this.setState({ reference: newReference });
    if (this.state.chromsAll !== null && newReference !== null) {
      this.setState({ chroms: this.state.chromsAll[newReference] });
      this._dumpPosition({
        path: this.state.posInner,
        uuid: this.state.uuid,
        reference: newReference,
        layout: this.state.keyId,
        subPath: this.state.subPathAnnotation
      });
    }
  }

  fetchOverview() {
    const this_ = this;
    const uuidQuery = this.state.uuid !== '' ? '&uuid=' + this.state.uuid : '';
    d3.csv('/api/v2/overview?source=features' + uuidQuery, function(
      error: any,
      data: any
    ) {
      if (error) {
        d3.csv('./samples/fusion-genes.csv', function(sampleData: any) {
          this_.setState({
            features: sampleData,
            filteredFeatures: sampleData
          });
        });
      } else {
        const sortedData = data.sort(function(a, b) {
          return d3.descending(+a.priority, +b.priority);
        });
        this_.setState({
          features: sortedData,
          filteredFeatures: sortedData
        });
      }
    });

    fetch('/api/v2/overview?source=chromosomes')
      .then(function(response: Response) {
        return response.json();
      })
      .then(function(json2: any) {
        this_.setState({
          chromsAll: json2,
          chroms: json2[this_.state.reference]
        });
      })
      .catch(function(err: any) {
        // handle error
        console.error(err);
        this_.setState({ chroms: chroms });
      });

    if (this.props.uuid === undefined || this.props.uuid.length === 0) {
      fetch('/api/v2/overview?source=metadata')
        .then(function(response: Response) {
          return response.json();
        })
        .then(function(json: any) {
          this_.setState({
            reference: json.ref_id,
            name: json.name,
            staticFiles: json.static_files
          });
        })
        .catch(function(err: any) {
          // handle error
          console.error(err);
          this_.setState({ name: 'demo' });
        });
    }
  }

  _posUpdate(path: PathRegion[], updatedIndex: number = 0) {
    this._dumpPosition({
      path: path,
      reference: this.state.reference,
      uuid: this.state.uuid,
      layout: this.state.keyId,
      subPath: this.state.subPathAnnotation
    });
    if (updatedIndex === 0) {
      this.setState({ sequentialId: this.state.sequentialId + 1 });
    }
    this.setState({
      posInner: path
    });
  }
  _posUpdateWithFeature(
    path: PathRegion[],
    featureId: number,
    updatedIndex?: number
  ) {
    this.setState({ featureId: featureId });
    this._posUpdate(path, updatedIndex);
  }
  _posConcat(path: PathRegion[]) {
    if (!this.state.arrayMode) {
      this._posUpdate(path);
    }
    if (path.length !== 1 || !path[0].compare(this.state.posInner[0])) {
      var result = path.concat(this.state.posInner);
      this._posUpdate(result);
    }
  }
  _posConcatWithFeature(path: PathRegion[], featureId: number) {
    this.setState({ featureId: featureId });
    this._posConcat(path);
  }
  _posReplace(path: PathRegion[]) {
    if (!this.state.arrayMode) {
      this._posUpdate(path);
    }
    var result = this.state.posInner;
    if (!result[0].isLocked) {
      result[0] = path[0];
      this._posUpdate(result);
    }
  }
  _posReplaceWithFeature(path: PathRegion[], featureId: number) {
    this.setState({ featureId: featureId });
    this._posReplace(path);
  }
  _nodesUpdate(nodes: number[]) {
    this.setState({ nodes: nodes });
  }
  _annotationsUpdate(annotations: any[]) {
    this.setState({ annotations: this.state.annotations.concat(annotations) });
  }
  _annotationsClean() {
    this.setState({ annotations: [] });
  }
  _nameUpdate(name: string) {
    this.setState({ name: name });
  }
  _stepsUpdate(steps: number) {
    this.setState({ steps: steps });
  }
  _dumpPosition(item: {
    path: PathRegion[];
    uuid: string;
    reference: string;
    layout: number;
    subPath: boolean;
  }) {
    window.parent.location.hash =
      '#' +
      QueryString.stringify({
        path: item.path.map(a => a.toUnreadableString()),
        uuid: item.uuid,
        reference: item.reference,
        layout: item.layout,
        annotations: item.subPath
      });
  }
  _keyIdUpdate(keyId: number) {
    // console.log(keyId);
    this._dumpPosition({
      path: this.state.posInner,
      uuid: this.state.uuid,
      reference: this.state.reference,
      layout: keyId,
      subPath: this.state.subPathAnnotation
    });
    this.setState({ keyId: keyId });
  }
  _uuidUpdate(uuid: string) {
    this.setState({ uuid: uuid });
    this._dumpPosition({
      path: this.state.posInner,
      uuid: uuid,
      reference: this.state.reference,
      layout: this.state.keyId,
      subPath: this.state.subPathAnnotation
    });
    this.fetchOverview();
  }
  _handleThreshold(event: any) {
    const featureSelection = this.state.featureSelection;
    const currentFeatures = this.state.features
      .filter(function(d2: any) {
        return d2.source_id === d2.target_id || featureSelection[0];
      })
      .filter(function(d2: any) {
        return d2.source_id !== d2.target_id || featureSelection[1];
      });
    this.setState({
      featureThreshold: event,
      filteredFeatures: currentFeatures.slice(
        (1 - event[1] / 100) * currentFeatures.length,
        (1 - event[0] / 100) * currentFeatures.length
      )
    });
  }
  _handleSelection(selectId: number) {
    var select = this.state.featureSelection;
    select[selectId] = !select[selectId];
    const currentFeatures = this.state.features
      .filter(function(d2: any) {
        return select[0] || d2.source_id === d2.target_id;
      })
      .filter(function(d2: any) {
        return select[1] || d2.source_id !== d2.target_id;
      });
    this.setState({
      featureSelection: select,
      filteredFeatures: currentFeatures.slice(
        (1 - this.state.featureThreshold[1] / 100) * currentFeatures.length,
        (1 - this.state.featureThreshold[0] / 100) * currentFeatures.length
      )
    });
  }
  _toggleSubPathAnnotation() {
    this.setState({ subPathAnnotation: !this.state.subPathAnnotation });
    this._dumpPosition({
      path: this.state.posInner,
      uuid: this.state.uuid,
      reference: this.state.reference,
      layout: this.state.keyId,
      subPath: !this.state.subPathAnnotation
    });
  }

  render() {
    return (
      <DashboardInner
        {...this.state}
        width={window.innerWidth}
        margin={{ top: 20, right: 20, bottom: 20, left: 10 }}
        _uuidUpdate={this._uuidUpdate}
        _posUpdate={this._posUpdate}
        _posUpdateWithFeature={this._posUpdateWithFeature}
        _posReplace={this._posReplace}
        _posReplaceWithFeature={this._posReplaceWithFeature}
        _posConcatWithFeature={this._posConcatWithFeature}
        _handleThreshold={this._handleThreshold}
        _nodesUpdate={this._nodesUpdate}
        _annotationsUpdate={this._annotationsUpdate}
        _annotationsClean={this._annotationsClean}
        _keyIdUpdate={this._keyIdUpdate}
        _handleSelection={this._handleSelection}
        _arrayMode={this._arrayMode}
        _changeReference={this._changeReference}
        _nameUpdate={this._nameUpdate}
        _toggleSubPathAnnotation={this._toggleSubPathAnnotation}
      />
    );
  }
}

export default DashBoard;
