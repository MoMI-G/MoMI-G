import * as React from 'react';
import * as ReactDom from 'react-dom';
import {
  Utils,
  PathRegion,
  Helpable,
  SPARQList,
  PathRegionWithPrevLen
} from './Utils';
import * as d3 from 'd3';
import TubeMap from './SequenceTubeMap';
import Wrapper from './Manual';
import AutosizeInput from 'react-input-autosize';

enum HaploidColorful {
  Reference,
  Variant,
  Green
}

enum GeneColor {
  Colorful,
  Green
}

const greys_old = [
  // '#d9d9d9',
  '#bdbdbd',
  '#737373',
  '#252525',
  '#969696',
  '#525252'
  // '#000000'
].reverse();

const greys = [
  // '#d9d9d9',
  //'#bdbdbd',
  //'#737373',
  '#252525',
  //'#969696',
  '#525252',
  '#000000'
]; //.reverse();

const greysWhite = ['#d9d9d9'];

const plainColors = [
  '#1f77b4',
  '#ff7f0e',
  // '#2ca02c', // Without Green
  '#d62728',
  '#9467bd',
  '#8c564b',
  '#e377c2',
  // '#7f7f7f',　// Without grey
  '#bcbd22',
  '#17becf'
]; // d3 category10

const lightColors = [
  '#ABCCE3',
  '#FFCFA5',
  // '#B0DBB0',
  '#F0AEAE',
  '#D7C6E6',
  '#C6ABA5',
  '#F4CCE8',
  // '#CFCFCF',　// Without grey
  '#E6E6AC',
  '#A8E7ED'
]; // d3 category10

const greens = [
  '#e5f5e0',
  '#c7e9c0',
  '#a1dd9b',
  '#74c476',
  '#41ab5d',
  '#238b45',
  '#006d2c',
  '#00441b'
];

const greenDarkColors = greens.slice(4, 8);
const greenLightColors = greens.slice(0, 4);

export interface GraphWrapperProps {
  width: number;
  height: number;
  chroms: any;
  pos: PathRegion[];
  nodesUpdate: (reg: number[]) => void;
  annotationsUpdate: (annotations: any[]) => void;
  annotationsClean: () => void;
  subPathAnnotation: boolean;
  toggleSubPathAnnotation: () => void;
  uuid: string;
  sequentialId: number;
  reference: string;
  features: any;
}

export interface GraphWrapperState {
  pos: PathRegion;
  graph: any;
  exon: any;
  gam: any;
  loading: boolean;
  initialize: boolean;
  sequentialId: number;
  annotations?: any;
  showGeneInfo: any[];
  subPathAnnotation: boolean;
  steps: number;
  pathNameDict: any;
  colorOption: [HaploidColorful, GeneColor];
}

class GraphWrapper extends React.Component<GraphWrapperProps, GraphWrapperState>
  implements Helpable {
  private maximumRange: number;
  private tubemap: any;
  constructor(props: GraphWrapperProps) {
    super(props);
    this.maximumRange = 1000 * 1000 * 1.5;
    this.help = this.help.bind(this);
    this.changeSubPathAnnotation = this.changeSubPathAnnotation.bind(this);
    this.selectNodeId = this.selectNodeId.bind(this);
    this.doNotUseCache = this.doNotUseCache.bind(this);
    this.reload = this.reload.bind(this);
    this.stepsUpdate = this.stepsUpdate.bind(this);
    this.forceCache = this.forceCache.bind(this);
    this.toggleAnnotationColor = this.toggleAnnotationColor.bind(this);
    this.toggleGam = this.toggleGam.bind(this);
    this.selectUniqueColor = this.selectUniqueColor.bind(this);
    this.state = {
      graph: '',
      gam: true,
      exon: [],
      loading: false,
      initialize: false,
      sequentialId: 0,
      pos: props.pos[0],
      subPathAnnotation: props.subPathAnnotation,
      showGeneInfo: [],
      steps: 3,
      pathNameDict: {},
      colorOption: [HaploidColorful.Variant, GeneColor.Green]
    };
  }
  help() {
    // prettier-ignore
    return (
      <div>
        <h3>SequenceTubeMap</h3>
        <a href="https://github.com/vgteam/sequenceTubeMap">
          {'https://github.com/vgteam/sequenceTubeMap'}
        </a>
        <p>Designs are modified to represent variations on human genome.</p>
        <p>Wide and dark paths mean the reference chromosome.</p>
        <p>Wide and light paths mean structural variations or haplotypes.</p>
        <p>
          Thin paths means annotations, i.e. genes. Dark regions are exon and
          otherwise are intron.
        </p>
        <p>The selected path moves upper when you double-click the path.</p>
      </div>
    );
  }
  link() {
    return 'sequencetubemap';
  }
  toggleGam(next: boolean) {
    if (next) {
      this.reload();
    }
  }
  toggleAnnotationColor() {
    if (this.state.colorOption[1] === GeneColor.Green) {
      this.setState({
        colorOption: [HaploidColorful.Variant, GeneColor.Colorful],
        sequentialId: this.state.sequentialId + 1
      });
    } else {
      this.setState({
        colorOption: [HaploidColorful.Variant, GeneColor.Green],
        sequentialId: this.state.sequentialId + 1
      });
    }
  }
  uniqueTrackId(name: string) {
    const dict = this.state.pathNameDict;
    if (name in dict) {
      return dict[name];
    }
    const lastitem = Object.keys(dict).length;
    dict[name] = lastitem;
    return lastitem;
  }
  uniqueTrackIdWithType(name: string, type: string) {
    const allDict = this.state.pathNameDict;

    if (!(type in allDict)) {
      allDict[type] = {};
    }
    const dict = allDict[type];
    if (name in dict) {
      return dict[name];
    }
    const lastitem = Object.keys(dict).length;
    dict[name] = lastitem;
    this.setState({ pathNameDict: allDict });
    return lastitem;
  }
  selectUniqueColor(
    name: string,
    type?: string,
    colorOption = this.state.colorOption
  ) {
    const sameColor = (color: string) => {
      return { haplotype_color: color, exon_color: color };
    };
    const differenceColor = (haplotypeColor: string, exonColor: string) => {
      return { haplotype_color: haplotypeColor, exon_color: exonColor };
    };
    switch (type) {
      case 'reference':
      case 'variation':
        if (colorOption[0] === HaploidColorful.Reference) {
          // Set reference as referenecolor, variations as greyscale.
          if (Utils.strToColor(name, this.props.chroms) !== '') {
            // When reference
            return differenceColor(
              Utils.strToColor(name, this.props.chroms),
              greysWhite[
                this.uniqueTrackIdWithType(name, type) % greysWhite.length
              ]
            );
          } else {
            // When Variants:
            return differenceColor(
              greys[this.uniqueTrackIdWithType(name, type) % greys.length],
              greysWhite[
                this.uniqueTrackIdWithType(name, type) % greysWhite.length
              ]
            );
          }
        } else if (colorOption[0] === HaploidColorful.Green) {
          return {
            haplotype_color:
              greenDarkColors[
                this.uniqueTrackIdWithType(name, type) % greenDarkColors.length
              ],
            exon_color:
              greenLightColors[
                this.uniqueTrackIdWithType(name, type) % greenLightColors.length
              ]
          };
        } else {
          // Set reference as greyscale, variations as colorful.
          if (type === 'reference') {
            return differenceColor(
              greys[this.uniqueTrackIdWithType(name, type) % greys.length],
              greysWhite[
                this.uniqueTrackIdWithType(name, type) % greysWhite.length
              ]
            );
          } else {
            // When Variants:
            return {
              haplotype_color:
                plainColors[
                  this.uniqueTrackIdWithType(name, 'plain') % plainColors.length
                ],
              exon_color:
                lightColors[
                  this.uniqueTrackIdWithType(name, 'plain') % lightColors.length
                ]
            };
          }
        }
      case 'gene':
        if (colorOption[1] === GeneColor.Colorful) {
          return {
            haplotype_color:
              plainColors[
                this.uniqueTrackIdWithType(name, 'plain') % plainColors.length
              ],
            exon_color:
              lightColors[
                this.uniqueTrackIdWithType(name, 'plain') % lightColors.length
              ]
          };
        } else {
          // Gene colors are unified in green.
          return {
            haplotype_color:
              greenDarkColors[
                this.uniqueTrackIdWithType(name, type) % greenDarkColors.length
              ],
            exon_color:
              greenLightColors[
                this.uniqueTrackIdWithType(name, type) % greenLightColors.length
              ],
            hideLegend: true
          };
        }
      default:
        // Other annotations.
        return sameColor(
          greys[this.uniqueTrackIdWithType(name, type) % greys.length]
        );
    }
  }
  stepsUpdate(stepInput: string) {
    let step = Number(stepInput);
    if (step < 0) {
      step = 0;
    } else if (step > 10) {
      step = 10;
    }
    this.setState({ steps: step });
  }
  componentDidMount() {
    this.setState({ initialize: true });
    this.fetchGraph(this.props.pos[0], this.props.uuid, true);
  }
  componentWillReceiveProps(props: GraphWrapperProps) {
    if (
      this.state.initialize &&
      this.props.sequentialId !== props.sequentialId
    ) {
      this.fetchGraph(props.pos[0], props.uuid, true);
    }
  }
  doNotUseCache() {
    this.fetchGraph(this.props.pos[0], this.props.uuid, false);
  }
  reload() {
    this.fetchGraph(this.props.pos[0], this.props.uuid, true);
  }
  forceCache(pos: PathRegion) {
    const uuidQuery = this.props.uuid !== '' ? '&uuid=' + this.props.uuid : '';
    [
      pos.scaleUp().toQuery(),
      pos
        .scaleDown()
        .scaleDown()
        .toQuery(),
      pos
        .scaleUp()
        .scaleLeft()
        .toQuery(),
      pos
        .scaleRight()
        .scaleRight()
        .toQuery()
    ].forEach(newPos => {
      fetch(
        '/api/v2/graph?raw=true&cache=true' +
          '&steps=' +
          this.state.steps +
          '&path=' +
          newPos +
          uuidQuery
      );
    });
    pos.scaleLeft();
  }
  fetchGraph(pos: PathRegion, uuid: string, cache: boolean) {

    this.setState({ pos: pos });
    const this_ = this;
    if (pos.diff() < this.maximumRange) {
      this.setState({ loading: true });
      this.tubemap.fadeout();
      const uuidQuery =
        this.props.uuid !== '' ? '&uuid=' + this.props.uuid : '';
      fetch(
        '/api/v2/graph?raw=true&cache=' +
          cache +
          '&gam=' +
          this.state.gam +
          '&steps=' +
          this.state.steps +
          '&path=' +
          pos.toQuery() +
          uuidQuery
      )
        .then(function(response: Response) {
          return response.json();
        })
        .then(function(graph: any) {
          if (Object.keys(graph).length !== 0) {
            var pathItem = undefined;
            pathItem = graph.path.find(a => a.name === pos.path);

            var pathRemaining = graph.path
              .filter(a => a.name !== pathItem.name)
              .sort((a, b) => b.name.length - a.name.length);
            var mapping = pathItem.mapping.map(a => a.position.node_id);
            var path = [pathItem];
            var genes = [];
            pathRemaining.forEach(a => {
              if (
                a.mapping.some(b => mapping.indexOf(b.position.node_id) !== -1)
              ) {
                path.push(a);
                mapping = mapping.concat(
                  a.mapping.map(c => c.position.node_id)
                );
              }
            });
            const referencePath = path.filter(
              a => a.indexOfFirstBase !== undefined
            );
            let allExonPaths = [];
            path.filter(a => a.indexOfFirstBase === undefined).forEach(i => {
              const diff = i.mapping.map((a, idx) => {
                if (idx >= 1) {
                  return a.rank - i.mapping[idx - 1].rank;
                } else {
                  return 1;
                }
              });
              let traversedNodeLength = 0;
              let currentNodeLength = 0;
              let allInverse = true;
              let currentPathExon = [];
              diff.forEach((a, idx) => {
                if (i.mapping[idx].position.is_reverse !== true) {
                  allInverse = false;
                }
                if (a !== 1) {
                  currentPathExon.push({
                    track: i.name,
                    start: traversedNodeLength,
                    end: currentNodeLength - 1,
                    type: 'exon',
                    name: i.name
                  });
                  traversedNodeLength = currentNodeLength;
                }
                currentNodeLength =
                  currentNodeLength +
                  Number(
                    graph.node.find(
                      a => a.id === i.mapping[idx].position.node_id
                    ).sequence.length
                  );
              });
              if (
                i.mapping[i.mapping.length - 1].position.is_reverse === false
              ) {
                // Confirm whether last one is inverted or not.
                allInverse = false;
              }

              currentPathExon.push({
                track: i.name,
                start: traversedNodeLength,
                end: currentNodeLength - 1,
                type: 'exon',
                name: i.name
              });
              if (allInverse) {
                currentPathExon = currentPathExon.map(a => {
                  let tmp = currentNodeLength - 1 - a.start;
                  a.start = currentNodeLength - 1 - a.end;
                  a.end = tmp;
                  return a;
                });
              }
              allExonPaths = allExonPaths.concat(currentPathExon);
            });

            path = path.map(i => {
              i.type =
                i.indexOfFirstBase !== undefined ? 'reference' : 'variation';
              i.freq = i.indexOfFirstBase !== undefined ? 100 : 8;
              return i;
            });

            referencePath.forEach(i => {
              const diff = i.mapping.map((a, idx) => {
                if (idx >= 1) {
                  return a.rank - i.mapping[idx - 1].rank;
                } else {
                  return 1;
                }
              });
              let lastIndex = 0;
              let traversedNodeLength = 0;
              let paths: PathRegionWithPrevLen[] = [];
              diff.forEach((a, idx) => {
                if (a !== 1) {
                  paths.push(
                    new PathRegionWithPrevLen(
                      i.name,
                      i.mapping[lastIndex].position.coordinate,
                      i.mapping[idx - 1].position.coordinate +
                        Number(
                          graph.node.find(
                            a => a.id === i.mapping[idx - 1].position.node_id
                          ).sequence.length
                        ),
                      traversedNodeLength,
                      lastIndex,
                      idx
                    )
                  );
                  let distance =
                    i.mapping[idx - 1].position.coordinate +
                    Number(
                      graph.node.find(
                        a => a.id === i.mapping[idx - 1].position.node_id
                      ).sequence.length
                    ) -
                    i.mapping[lastIndex].position.coordinate;
                  allExonPaths.push({
                    track: i.name,
                    start: traversedNodeLength,
                    end: distance + traversedNodeLength - 1,
                    type: 'exon',
                    name: i.name
                  });
                  traversedNodeLength += distance;
                  lastIndex = idx;
                }
              });

              paths.push(
                new PathRegionWithPrevLen(
                  i.name,
                  i.mapping[lastIndex].position.coordinate,
                  i.mapping[i.mapping.length - 1].position.coordinate +
                    Number(
                      graph.node.find(
                        a =>
                          a.id ===
                          i.mapping[i.mapping.length - 1].position.node_id
                      ).sequence.length
                    ),
                  traversedNodeLength,
                  lastIndex,
                  i.mapping.length
                )
              );
              let distance =
                i.mapping[i.mapping.length - 1].position.coordinate +
                Number(
                  graph.node.find(
                    a =>
                      a.id === i.mapping[i.mapping.length - 1].position.node_id
                  ).sequence.length
                ) -
                i.mapping[lastIndex].position.coordinate;
              allExonPaths.push({
                track: i.name,
                start: traversedNodeLength,
                end: distance + traversedNodeLength - 1,
                type: 'exon',
                name: i.name
              });

              paths
                .filter(a => !(a.start === 0 && a.stop !== a.stop)) // isNaN
                .forEach(pathPos => {
                  const url: string = SPARQList.buildSparqlistRequest(
                    pathPos,
                    this_.props.reference
                  );
                  fetch(url, { headers: { Accept: 'application/json' } })
                    .then(function(response: Response) {
                      return response.json();
                    })
                    .then(function(res: any) {
                      const annotations = SPARQList.convertToAnnotationFromSparqlist(
                        res,
                        pathPos
                      );
                      const i_mapping = i.mapping.slice(
                        pathPos.startIndex,
                        pathPos.stopIndex
                      );
                      const convertIsoformToPath = (isoform: any) => {
                        let startNodeIndex = i_mapping.findIndex(
                          a => a.position.coordinate >= isoform.mrna_start
                        );
                        let endNodeIndex = i_mapping.findIndex(
                          a => a.position.coordinate > isoform.mrna_end
                        );
                        if (startNodeIndex >= 1) {
                          startNodeIndex = startNodeIndex - 1;
                        }
                        if (endNodeIndex === -1) {
                          endNodeIndex = i_mapping.length;
                        }
                        let newMapping = i_mapping.slice(
                          startNodeIndex,
                          endNodeIndex
                        );
                        if (newMapping.length > 1) {
                          newMapping = JSON.parse(JSON.stringify(newMapping)); // Deep copy
                          newMapping[0].position.offset =
                            isoform.mrna_start -
                            newMapping[0].position.coordinate;
                          newMapping[newMapping.length - 1].position.offset =
                            isoform.mrna_end -
                            (newMapping[newMapping.length - 1].position
                              .coordinate +
                              Number(
                                graph.node.find(
                                  a =>
                                    a.id ===
                                    newMapping[newMapping.length - 1].position
                                      .node_id
                                ).sequence.length
                              ));
                          const newPath = {
                            name: isoform.name + ' (' + isoform.track + ')',
                            mapping: newMapping,
                            freq: 2,
                            type: 'gene'
                          };
                          return newPath;
                        } else {
                          return null;
                        }
                      };
                      if (
                        annotations.isoform.length > 0 &&
                        this_.props.subPathAnnotation
                      ) {
                        let additionalPath = annotations.isoform
                          .map(a => convertIsoformToPath(a))
                          .filter(a => a);
                        let exons = annotations.exon
                          .map(a => {
                            var offset = additionalPath.filter(
                              b => b.name === a.track
                            )[0].mapping[0].position.offset;
                            if (offset < 0) offset = 0;
                            a.start += offset;
                            a.end += offset;
                            return a;
                          })
                          .filter(a => a);
                        let hash = {};

                        genes.forEach(a => (hash[a.name] = 1));
                        additionalPath.forEach(a => {
                          if (!(a.name in hash)) {
                            genes.push(a);
                          }
                        });
                        let coloredIsoform = annotations.isoform.map(a => {
                          a['color'] = this_.selectUniqueColor(
                            a.name + ' (' + a.track + ')',
                            'gene',
                            [this_.state.colorOption[0], GeneColor.Colorful]
                          ).haplotype_color;
                          return a;
                        });

                        graph.genes = genes;
                        this_.props.annotationsUpdate(annotations.isoform);
                        this_.setState({
                          loading: false,
                          graph: graph,
                          exon: this_.state.exon.concat(exons),
                          sequentialId: this_.state.sequentialId + 1,
                          annotations: coloredIsoform
                        });
                      }
                    })
                    .catch(function(err: any) {
                      // handle error
                      console.error(err);
                    });
                });
            });
            graph.path = path;
            graph.genes = [];
            this_.props.annotationsClean();
            this_.setState({
              loading: false,
              graph: graph,
              exon: allExonPaths,
              annotations: [],
              sequentialId: this_.state.sequentialId + 1
            });
          }
        })
        .catch(function(err: any) {
          // handle error
          this_.tubemap.fadein();
          console.error(err);
        });
    }
  }
  changeSubPathAnnotation() {
    this.props.toggleSubPathAnnotation();
    this.fetchGraph(this.props.pos[0], this.props.uuid, true);
  }
  selectNodeId(id: number) {
    const paths = this.state.graph.path
      .filter(a => a.mapping.some(b => b.position.node_id === Number(id)))
      .map(a => a.name);
    const annotations = this.state.annotations.filter(a =>
      paths.some(b => b === a.track)
    );

    this.setState({ showGeneInfo: annotations });
  }
  render() {
    return (
      <div>
        <TubeMap
          ref={tubemap => (this.tubemap = tubemap)}
          width={this.props.width}
          graph={this.state.graph}
          gam={this.state.gam}
          pos={this.props.pos}
          sequentialId={this.state.sequentialId}
          exon={this.state.exon}
          subPathAnnotation={this.props.subPathAnnotation}
          changeSubPathAnnotation={this.changeSubPathAnnotation}
          selectNodeId={this.selectNodeId}
          selectUniqueColor={this.selectUniqueColor}
          changeGam={this.toggleGam}
        />
        <div
          id="wrapperContents"
          style={{ display: 'flex' }}
          className="form-group">
          <input
            title="Reload using cache"
            type="button"
            className="btn btn-primary"
            onClick={this.reload}
            value="Reload"
          />
          <input
            title="Discard cache on the server and reload"
            type="button"
            className="btn btn-secondary"
            onClick={this.doNotUseCache}
            value="Discard cache"
          />
          <input
            type="button"
            className="btn btn-secondary"
            onClick={this.toggleAnnotationColor}
            value="Toggle gene"
          />
          <label>Context steps:</label>
          <input
            type="text"
            name="uuid"
            className="form-control"
            title="expand the context of the subgraph this many steps"
            value={this.state.steps}
            onChange={e => this.stepsUpdate(e.target.value)}
          />
        </div>
      </div>
    );
  }
}

export default GraphWrapper;
