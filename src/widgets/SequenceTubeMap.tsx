import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Utils, PathRegion, Helpable } from './Utils';
import * as d3 from 'd3';
import * as FontAwesome from 'react-fontawesome';

import * as tubeMap from './tubemap';
// import Graph from './Graph';
// import * as tubeMap from 'sequenceTubeMap/frontend/app/scripts/tubemap';

const greys = [
  '#d9d9d9',
  '#bdbdbd',
  // '#737373',
  '#969696'
  // '#525252'
  // '#000000'
];

export interface TubeMapProps {
  graph: any;
  gam: any;
  pos: PathRegion[];
  width: number;
  sequentialId: number;
  exon: any[];
  changeSubPathAnnotation: () => void;
  selectNodeId: (id: number) => void;
  subPathAnnotation: boolean;
  selectUniqueColor: (
    path: string,
    type: string
  ) => { [key: string]: string | boolean };
  nodeWidthOpt?: number;
  changeGam: (gam: boolean) => void;
  annotations?: any;
  nodeCoverages?: {[key: number]: number[]};
  metaNodeCoverages?: any;
}

export interface TubeMapState {
  nodeId?: number;
  initialize: boolean;
  mergeNodes: boolean;
  nodeWidthOpt: number;
  showReads: boolean;
  softClips: boolean;
  changedExonVisibility: boolean;
  subPathAnnotation: boolean;
  sequentialId: number;
  pathNameDict: any[];
}

class TubeMap extends React.Component<TubeMapProps, TubeMapState> {
  constructor(props: TubeMapProps) {
    super(props);
    this.setInitFlag = this.setInitFlag.bind(this);
    this.setNodeWidth = this.setNodeWidth.bind(this);
    this.setMergeNodes = this.setMergeNodes.bind(this);
    this.changeSubPathAnnotation = this.changeSubPathAnnotation.bind(this);
    this.changeNodeId = this.changeNodeId.bind(this);
    this.changeGam = this.changeGam.bind(this);
    this.selectNodeId = this.selectNodeId.bind(this);
    this.fadeout = this.fadeout.bind(this);
    this.fadein = this.fadein.bind(this);
    this.clickDownload = this.clickDownload.bind(this);
    this.readNameDownload = this.readNameDownload.bind(this);
    this.state = {
      initialize: false,
      mergeNodes: true,
      nodeWidthOpt: 3,
      showReads: false,
      softClips: true,
      changedExonVisibility: false,
      subPathAnnotation: props.subPathAnnotation,
      sequentialId: 0,
      pathNameDict: []
    };
  }
  help() {
    return (
      <div>
        <h3>SequenceTubeMap</h3>
        <a href="https://github.com/vgteam/sequenceTubeMap">
          {'https://github.com/vgteam/sequenceTubeMap'}
        </a>
      </div>
    );
  }
  link(): string {
    return '';
  }
  changeSubPathAnnotation() {
    this.setState({ subPathAnnotation: !this.state.subPathAnnotation });
    this.props.changeSubPathAnnotation();
  }
  changeGam() {
    if (this.state.showReads) {
      this.setState({ showReads: !this.state.showReads });
      tubeMap.setShowReadsFlag(!this.state.showReads);
    } else {
      this.setState({ showReads: !this.state.showReads });
      this.setState({ mergeNodes: false });
      tubeMap.setMergeNodesFlag(false);

      tubeMap.setShowReadsFlag(!this.state.showReads);
    }
    this.props.changeGam(!this.state.showReads);
  }
  setInitFlag() {
    this.setState({ initialize: !this.state.initialize });
  }
  setMergeNodes() {
    if (this.state.mergeNodes) {
      this.setState({ mergeNodes: !this.state.mergeNodes });
      tubeMap.setMergeNodesFlag(!this.state.mergeNodes);
    } else {
      this.setState({ mergeNodes: !this.state.mergeNodes });
      this.setState({ showReads: false });
      this.props.changeGam(false);
      tubeMap.setShowReadsFlag(false);
      tubeMap.setMergeNodesFlag(!this.state.mergeNodes);
    }
  }
  setNodeWidth(event: any) {
    this.setState({ nodeWidthOpt: Number(event.target.value) });
    tubeMap.setNodeWidthOption(Number(event.target.value));
  }
  componentDidMount() {
    this.fadeout();
    this.setInitFlag();
  }
  componentWillReceiveProps(props: TubeMapProps) {
    if (
      props.graph !== '' &&
      props.graph.path !== undefined &&
      this.state.initialize &&
      this.state.sequentialId !== props.sequentialId
    ) {
      this.setState({ sequentialId: props.sequentialId });
      d3
        .select('#svg')
        .selectAll('*')
        .remove();
      d3.select('#svg').attr('width', 100);
      const graph = props.graph;
      const gam = this.state.showReads ? graph.gam || {} : {}; // JSON.parse(props.gam);
      const bed = props.exon;
      console.log(bed);
      const nodes = tubeMap.vgExtractNodes(graph);
      const path = graph.path.concat(graph.genes);
      const tracks = this.vgExtractTracks(path);
      const nodeCoverages = props.nodeCoverages;
      const metaNodeCoverages = props.metaNodeCoverages;
      // const reads = this.vgExtractTracks(graph.genes);
      const reads = tubeMap
        .vgExtractReads(nodes, tracks, gam)
        .map((alignment, index) => {
          alignment.reverse_read_color = alignment.forward_read_color =
            greys[index % greys.length];
          return alignment;
        });

      this.createTubeMap(nodes, tracks, reads, bed, nodeCoverages, metaNodeCoverages);
    }
  }

  vgExtractTracks(vg: any) {
    const result = [];
    vg.forEach((path, index) => {
      const sequence = [];
      let isCompletelyReverse = true;
      path.mapping.forEach(pos => {
        if (
          pos.position.hasOwnProperty('is_reverse') &&
          pos.position.is_reverse === true
        ) {
          sequence.push(`-${pos.position.node_id}`);
        } else {
          sequence.push(`${pos.position.node_id}`);
          isCompletelyReverse = false;
        }
      });
      if (isCompletelyReverse) {
        sequence.reverse();
        sequence.forEach((node, index2) => {
          sequence[index2] = node.substr(1);
        });
      }
      const track: { [key: string]: any } = this.props.selectUniqueColor(
        path.name,
        path.type
      );
      track['id'] = index;
      track['sequence'] = sequence;
      if (path.hasOwnProperty('feature')) track['feature'] = 'gene';
      if (path.hasOwnProperty('freq')) track['freq'] = path.freq;
      if (path.hasOwnProperty('name')) track['name'] = path.name;
      if (path.hasOwnProperty('indexOfFirstBase')) {
        track['indexOfFirstBase'] = Number(path.indexOfFirstBase);
        track['coordinate'] = path.mapping.map(
          node => node.position.coordinate
        );
      }
      // where within node does read start
      track['firstNodeOffset'] = 0;
      if (path.mapping[0].position.hasOwnProperty('offset')) {
        track['firstNodeOffset'] = path.mapping[0].position.offset;
      }
      result.push(track);
    });
    return result;
  }
  /*
  componentWillUpdate() {
    if (
      this.props.graph !== '' &&
      this.props.graph.path !== undefined &&
      this.state.initialize // &&
      // this.props.graph !== props.graph
    ) {
      const graph = this.props.graph;
      const gam = JSON.parse(this.props.gam);
      const nodes = tubeMap.vgExtractNodes(graph);
      const tracks = tubeMap.vgExtractTracks(graph);
      const reads = tubeMap.vgExtractReads(nodes, tracks, gam);
      this.createTubeMap(nodes, tracks, reads);
    }
  }
  */
  createTubeMap(nodes: any, tracks: any, reads: any, bed: any, nodeCoverages?: any, metaNodeCoverages?: any) {
    // console.log(this.state);
    // console.info('bed: ', bed);
    tubeMap.create({
      svgID: '#svg',
      clickableNodes: true,
      firstTrackLinear: true,
      fillNodes: false,
      bed,
      nodes,
      tracks,
      reads,
      nodeCoverages,
      metaNodeCoverages,
    });
    if (!this.state.changedExonVisibility) {
      tubeMap.changeExonVisibility(); //
      this.setState({ changedExonVisibility: true });
    }
    tubeMap.setShowReadsFlag(this.state.showReads);
    tubeMap.setMergeNodesFlag(this.state.mergeNodes);
    tubeMap.setNodeWidthOption(this.state.nodeWidthOpt);
    tubeMap.setSoftClipsFlag(this.state.softClips);
    tubeMap.setColorSet('haplotypeColors', 'plainColors');
    this.fadein();
  }
  readNameDownload() {
    const gam = this.props.graph.gam; // || {} : {};
    if (gam !== {} && gam !== undefined) {
      // const readNames = gam.map(a => a.name ).join('\n');
      const fasta = gam.map(a => `>${a.name}\n${a.sequence}`).join('\n');

      var svgBlob = new Blob([fasta], {type: 'text/plain'});
      var svgUrl = URL.createObjectURL(svgBlob);
      var downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = this.props.pos[0].toString() + '.fasta';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  }
  clickDownload() {
    var source = document.getElementById('svg').outerHTML;  
 //   var svgData = $("#tubeMap")[0].outerHTML;
    // add name spaces.
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
      source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    // add xml declaration
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    var svgBlob = new Blob([source], {type: 'image/svg+xml;charset=utf-8'});
    var svgUrl = URL.createObjectURL(svgBlob);
    var downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = this.props.pos[0].toString() + '.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }
  changeNodeId(event: any) {
    this.setState({ nodeId: event.target.value });
  }
  selectNodeId() {
    this.props.selectNodeId(this.state.nodeId);
  }
  fadeout() {
    var svg = d3.select('#svg'),
      width = +svg.attr('width'),
      height = +svg.attr('height');
    var filter = svg
      .append('rect')
      .attr('class', 'rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'gray')
      .attr('fill-opacity', 0.5);
  }

  fadein() {
    var svg = d3.select('#svg'),
      width = +svg.attr('width'),
      height = +svg.attr('height');
    var filter = svg.selectAll('.rect').remove();
  }
  render() {
    return (
      <div>
        <div className="tubeMapSVG">
          <svg id="svg" />
        </div>
        <div className="legendWrapper" style={{ display: 'flex' }}>
          <div id="legendDiv" />
          {this.props.annotations}
        </div>
        <div id="tubeMapConfig" className="form-group">
          <div className="input-group">
            <span className="input-group-prepend">
              <div className="input-group-text">
                <input
                  name="MergeNodes"
                  type="checkbox"
                  title="Merge redundant nodes"
                  disabled={false}
                  checked={this.state.mergeNodes}
                  onChange={this.setMergeNodes}
                />
              </div>
            </span>
            <label className="form-control">MergeNodes</label>
            <span className="input-group-prepend">
              <div className="input-group-text">
                <input
                  name="subPathAnnotation"
                  type="checkbox"
                  title="Add gene annotations as path"
                  disabled={false}
                  checked={this.state.subPathAnnotation}
                  onChange={this.changeSubPathAnnotation}
                />
              </div>
            </span>
            <label className="form-control">Annotations</label>
            <span className="input-group-prepend">
              <div className="input-group-text">
                <input
                  name="alignments"
                  type="checkbox"
                  title="Add alignments as reads"
                  disabled={false}
                  checked={this.state.showReads}
                  onChange={this.changeGam}
                />
              </div>
            </span>
            <label className="form-control d-inline-flex">Alignments
              <button className="btn btn-primary-outline" style={{padding: '0 5px', marginLeft: '10px'}} onClick={this.readNameDownload}>
                <FontAwesome name="download" />
              </button>
            </label>
            <select
              value={this.state.nodeWidthOpt}
              onChange={this.setNodeWidth}
              className="form-control"
              title="Design of tubemap: show all nucleotides or compressed design"
              style={{ width: '200px', display: 'inline-block', height: '45px' }}>
              <option value={0}>all sequence</option>
              <option value={1}>compressed</option>
              <option value={2}>compressed proportional</option>
              <option value={3}>compressed proportional(small)</option>
            </select>
            <button className="btn btn-primary" style={{ height: '45px', margin: 0}} onClick={this.clickDownload}><FontAwesome name="download" /></button>
          </div>
        </div>

        <div id="nodeInformation">
          <div className="form-group" style={{ display: 'none' }}>
            <label>uuid: </label>
            <input
              type="text"
              name="nodeId"
              id="hgvmNodeID"
              className="form-control"
              value={this.state.nodeId}
              onChange={this.changeNodeId}
            />
            <button id="hgvmPostButton" onClick={this.selectNodeId} />
          </div>
        </div>
      </div>
    );
  }
}

export default TubeMap;
