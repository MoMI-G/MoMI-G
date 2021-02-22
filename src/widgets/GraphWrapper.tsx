import * as React from 'react';
import * as ReactDom from 'react-dom';
import {
  Utils,
  PathRegion,
  Helpable,
  SPARQList,
  BedAnnotation,
  WigAnnotation,
  PackAnnotation,
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
  // '#bdbdbd',
  // '#737373',
  '#252525',
  // '#969696',
  '#525252',
  '#000000'
]; // .reverse();

const greysWhite = ['#d9d9d9'];
const white = ['#ffffff'];

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
// const greenDarkColors = ['#238b45', '#b2e2e2'].reverse();
// const greenLightColors = ['#66c2a4', '#edf8fb'].reverse();

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

const greenDarkColors = greens.slice(4, 8); // .filter((a, i) => i % 2 === 1);
const greenLightColors = greens.slice(0, 4); // .filter((a, i) => i % 2 === 0);

export interface GraphWrapperProps {
  width: number;
  height: number;
  chroms: any;
  pos: PathRegion[];
  nodesUpdate: (reg: number[]) => void;
  annotationsUpdate: (annotations: any[]) => void;
  annotationsClean: () => void;
  subPathAnnotation: boolean;
  bigbedAnnotation?: boolean;
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
  // sequentialIdProp: number;
  annotations?: any;
  showGeneInfo: any[];
  subPathAnnotation: boolean;
  steps: number;
  pathNameDict: any;
  colorOption: [HaploidColorful, GeneColor];
  nodeCoverages?: {[key: number]: number[]};
  metaNodeCoverages?: {min: number, max: number}[];
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
    if (next === true) {
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
    colorOption: [HaploidColorful, GeneColor] = this.state.colorOption
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
          // Set reference as grayscale, variations as colorful.
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
                plainColors[
                  this.uniqueTrackIdWithType(name, 'plain') % plainColors.length
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
              ],
            white_color: white[
              this.uniqueTrackIdWithType(name, type) % white.length
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
            white_color: white[
              this.uniqueTrackIdWithType(name, type) % white.length
            ],
            hideLegend: true
          };
        }
      default:
        // Other annotations.
        return { 
          haplotype_color:
            greys[this.uniqueTrackIdWithType(name, type) % greys.length],
          exon_color: white[
            this.uniqueTrackIdWithType(name, type) % white.length
          ],
          hideLegend: true
        };
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
    // console.log(props)
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
    const _this = this;
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
            let pathAsAllExon = [];
            let allIsoforms = [];
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
              pathAsAllExon = pathAsAllExon.concat(currentPathExon);
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
                  pathAsAllExon.push({
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
              pathAsAllExon.push({
                track: i.name,
                start: traversedNodeLength,
                end: distance + traversedNodeLength - 1,
                type: 'exon',
                name: i.name
              });
              let nodeCoverages: { [key: string]: number[]; } = {};
              let nodeIds = i.mapping.map(pos => {
                return new PathRegionWithPrevLen(
                  i.name,
                  pos.position.coordinate,
                  pos.position.coordinate +
                    Number(
                      graph.node.find(
                        a =>
                          a.id ===
                          pos.position.node_id
                      ).sequence.length
                    ),
                  0,
                  pos.position.node_id,
                  i.mapping.length
                ); });
                // console.log(nodeIds)
              const url: string = WigAnnotation.buildAnnotationRequests(nodeIds);
              fetch(url, { headers: { Accept: 'application/json' } })
                  .then(function(response: Response) {
                    return response.json();
                  })
                  .then(function(res: any) {
                    const wigs = WigAnnotation.convertToAnnotations(
                      res,
                      nodeIds
                    );
                    // Convert from array of nodes to nodes of array.
                    const metaNodeCoverages = wigs.map((wig, index) => {
                    // console.log(values, min, max);
                      Object.keys(wig.values).map(function(key: string) {
                        if (nodeCoverages[key] === undefined) {
                          nodeCoverages[key] = new Array(wigs.length);
                        }
                        nodeCoverages[key][index] = wig.values[key]; // In original value
                      });
                      return {min: wig.min, max: wig.max};
                    });
                   
                    _this.setState({
                      loading: false,
                      sequentialId: _this.state.sequentialId + 1,
                      nodeCoverages,
                      metaNodeCoverages
                    });
                  }).catch(function(err: any) {
                    // handle error
                    console.error(err);
                  });

              const pack_url: string = PackAnnotation.buildAnnotationRequests(nodeIds);
              fetch(pack_url, { headers: { Accept: 'application/json' } })
                .then(function(response: Response) {
                  return response.json();
                })
                .then(function(res: any) {
                  // Convert from array of nodes to nodes of array.
                  const metaNodeCoverages = res.map((wig, index) => {
                  // console.log(values, min, max);
          
                    Object.keys(wig['values']).map(function(key: string) {
                      let array = wig['values'][key].values;
                      
                      if (nodeCoverages[key] === undefined) {
                        nodeCoverages[key] = new Array(res.length);
                      }
                      nodeCoverages[key][index] = array; // In original value
                    });
                    return {min: wig.min, max: wig.max};
                  });
                  
                  _this.setState({
                    loading: false,
                    sequentialId: _this.state.sequentialId + 1,
                    nodeCoverages,
                    metaNodeCoverages
                  });
                }).catch(function(err: any) {
                  // handle error
                  // console.error(err);
                });

              if (_this.props.bigbedAnnotation === true) {
              if (paths.length === 0) {
                  paths.push(_this.props.pos[0].withPrevLen());
              }
              paths
                .filter(a => !(a.start === 0 && a.stop !== a.stop)) // isNaN
                .forEach(pathPos => {
                  // const pos = new PathRegion(i.name, i.indexOfFirstBase, stop);
                  const url: string = BedAnnotation.buildBedAnnotationRequest(
                    pathPos,
                  );
                  fetch(url, { headers: { Accept: 'application/json' } })
                    .then(function(response: Response) {
                      return response.json();
                    })
                    .then(function(res: any) {
                      const annotations = BedAnnotation.convertToAnnotation(
                        res,
                        pathPos
                      );

                      const i_mapping = i.mapping.slice(
                        pathPos.startIndex,
                        pathPos.stopIndex
                      );
                      const convertIsoformToPath = (isoform: any) => {
                        // console.log(isoform, i.mapping);
                        let startNodeIndex = i_mapping.findIndex(
                          a => a.position.coordinate >= isoform.mrna_start
                        );
                        let endNodeIndex = i_mapping.findIndex(
                          a => a.position.coordinate > isoform.mrna_end
                        );
                        // console.log(endNodeIndex, startNodeIndex)
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
                        // console.log(newMapping)
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
                              )); // FIXME() untested
                          const newPath = {
                            name: isoform.name + ' (' + isoform.track + ')',
                            mapping: newMapping,
                            freq: 2,
                            type: 'bed',
                            full_length: isoform.mrna_end - isoform.mrna_start,
                            start: isoform.mrna_start -
                            newMapping[0].position.coordinate,
                            end: isoform.mrna_end - isoform.mrna_start + 
                            (newMapping[newMapping.length - 1].position
                              .coordinate +
                              Number(
                                graph.node.find(
                                  a =>
                                    a.id ===
                                    newMapping[newMapping.length - 1].position
                                      .node_id
                                ).sequence.length))
                          };
                          // console.log(newPath)
                          return newPath;
                        } else {
                          return null;
                        }
                      };
                      // console.log(annotations);
                      if (
                        annotations.isoform.length > 0 &&
                        _this.props.subPathAnnotation
                      ) {
                        let additionalPath = annotations.isoform
                          .map(a => convertIsoformToPath(a))
                          .filter(a => a);

                        let exons = additionalPath
                          .map(a => {
//                            let b = a.mapping[0].position.offset;
                              return {start: a.start, end: a.start + a.full_length, track: a.name, name: a.name, type: 'exon'};
                          })
                          .filter(a => a);
                        // console.log(exons);
                        /*additionalPath = Utils.arrayUniqueByName(
                          additionalPath
                        );*/
                        /*.filter(
                            (a, index, self) =>
                              a !== null &&
                              self.findIndex(b => b.name === a.name) === index
                          );*/
                        // console.log("path:", additionalPath);
                        let hash = {};

                        genes.forEach(a => (hash[a.name] = 1));
                        additionalPath.forEach(a => {
                          if (!(a.name in hash)) {
                            genes.push(a);
                          }
                        });
                        // path = path.concat(additionalPath);
                        let colouredIsoform = annotations.isoform.map(a => {
                          a['color'] = _this.selectUniqueColor(
                            a.name + ' (' + a.track + ')',
                            'bed',
                            [_this.state.colorOption[0], GeneColor.Colorful]
                          ).haplotype_color;
                          return a;
                        });
                        allIsoforms = colouredIsoform;

                        graph.genes = genes;
                        // console.log("path:",graph.path);
                        _this.props.annotationsUpdate(annotations.isoform);
                        _this.setState({
                          loading: false,
                          graph: graph,
                          exon: _this.state.exon.concat(exons),
                          sequentialId: _this.state.sequentialId + 1,
                          annotations: colouredIsoform // annotations.isoform
                        });
                      }
                    })
                    .catch(function(err: any) {
                      // handle error
                      console.error(err);
                    });
                });
              }

              paths
                .filter(a => !(a.start === 0 && a.stop !== a.stop)) // isNaN
                .forEach(pathPos => {
                  const url: string = SPARQList.buildSparqlistRequest(
                    pathPos,
                    _this.props.reference
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
                            type: 'gene',
                            feature: 'gene',
                            full_length: isoform.mrna_end - isoform.mrna_start
                          };
                          return newPath;
                        } else {
                          return null;
                        }
                      };
                      if (
                        annotations.isoform.length > 0 &&
                        _this.props.subPathAnnotation
                      ) {
                        let additionalPath = annotations.isoform
                          .map(a => convertIsoformToPath(a))
                          .filter(a => a);
                        let exons = annotations.exon
                          .map(a => {
                            var offset = additionalPath.filter(
                              b => b.name === a.track
                            )[0].mapping[0].position.offset;
                            // console.log(offset);
                            if (offset < 0) offset = 0;
                            a.start += offset;
                            a.end += offset;
                            return a;
                          })
                          .filter(a => a);
                        let margin_exons = additionalPath
                          .map(a => { if ( a.mapping[a.mapping.length - 1].position.offset < 0 ) {return [
                            {start: 0, end: a.mapping[0].position.offset, track: a.name, name: a.name, type: 'margin'},
                            {
                              start: a.full_length + a.mapping[0].position.offset,
                              end: a.full_length + a.mapping[0].position.offset - a.mapping[a.mapping.length - 1].position.offset,
                              track: a.name,
                              name: a.name,
                              type: 'margin'
                            },
                          ]; } else {return [
                            {start: 0, end: a.mapping[0].position.offset, track: a.name, name: a.name, type: 'margin'}
                          ]; } });
                        let flatten_exons = [].concat(...margin_exons);
                        exons = exons.concat(flatten_exons);
                        let hash = {};

                        genes.forEach(a => (hash[a.name] = 1));
                        additionalPath.forEach(a => {
                          if (!(a.name in hash)) {
                            genes.push(a);
                          }
                        });
                        let colouredIsoform = annotations.isoform.map(a => {
                          a['color'] = _this.selectUniqueColor(
                            a.name + ' (' + a.track + ')',
                            'gene',
                            [_this.state.colorOption[0], GeneColor.Colorful]
                          ).haplotype_color;
                          return a;
                        });

                        graph.genes = genes;
                        _this.props.annotationsUpdate(annotations.isoform);
                        _this.setState({
                          loading: false,
                          graph: graph,
                          exon: _this.state.exon.concat(exons),
                          sequentialId: _this.state.sequentialId + 1,
                          annotations: colouredIsoform
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
            // console.log(graph.path);
            _this.props.annotationsClean();
            _this.setState({
              loading: false,
              graph: graph,
              exon: pathAsAllExon,
              annotations: [],
              sequentialId: _this.state.sequentialId + 1
            });
          }
        })
        .catch(function(err: any) {
          // handle error
          _this.tubemap.fadein();
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
          nodeCoverages={this.state.nodeCoverages}
          metaNodeCoverages={this.state.metaNodeCoverages}
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
