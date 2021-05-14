import * as React from 'react';
import * as d3 from 'd3';
import * as ReactDom from 'react-dom';
import * as pileup from 'pileup';
import { Utils, PathRegion, Helpable } from './Utils';
import './pileup.css';

export interface LinearProps {
  pos: PathRegion[];
  posUpdate: (reg: PathRegion[]) => void;
  width: number;
  nodes: number[];
  toggleNodes: boolean;
  p?: any;
  reference?: string;
  staticFiles: any[];
}

class Linear extends React.Component<LinearProps, LinearProps>
  implements Helpable {
  constructor(props: LinearProps) {
    super(props);
    this._linearReflection = this._linearReflection.bind(this);
    this._backportRegion = this._backportRegion.bind(this);
    this._getRawSequence = this._getRawSequence.bind(this);
    this.state = this.props;
  }
  help() {
    return (
      <div>
        <h3>Linear-browser</h3>
        <a href="https://github.com/hammerlab/pileup.js">
          {'https://github.com/hammerlab/pileup.js'}
        </a>
        <p>Displays the selected genomic region on the genome browser.</p>
        <p>
          Click on "Backport Regions" to reflect the selected region to partial
          graph view.
        </p>
      </div>
    );
  }
  link() {
    return 'linear-browser';
  }
  componentWillReceiveProps(props: LinearProps) {
    if (this.state.p !== undefined) {
      if (props.pos[0].stop !== undefined) {
        this.state.p.setRange({
          contig: props.pos[0].path,
          start: Math.round(props.pos[0].start),
          stop: Math.round(props.pos[0].stop)
        });
      } else {
        this.state.p.setRange({
          contig: props.pos[0].path,
          start: Math.round(props.pos[0].start),
          stop: Math.round(props.pos[0].start + 1)
        });
      }
    } else {
      if (props.staticFiles.length !== 0) {
        /* */
      }
    }
  }

  componentDidMount() {
    this.setPileup();
  }
  _getRawSequence() {
    /* Unimplemented */
  }
  _linearReflection() {
    /* TODO() Uncomment when /api/v2/linear becomes avalable.
    const _this = this;
    if (!this.state.toggleNodes) {
      const nodesList = this.props.nodes;
      if (this.props.pos[0].diff() < 50000) {
        fetch(
          '/api/v0/linear?path=' +
            this.props.pos[0].toQuery() +
            '&nodes=' +
            nodesList.join(',')
        )
          .then(function(response: Response) {
            return response.json();
          })
          .then(function(json: any) {
            // _this.drawSankey(json2);
            _this.setPileupWithNodes(json);
          })
          .catch(function(err: any) {
            console.error(err);
          });
      }
    } else {
      this.setPileup();
    }
    this.setState({ toggleNodes: !this.state.toggleNodes });
    */
    // this.props. this.setState({});
  }
  setPileupWithNodes(json: any) {
    /*var fileName = '/api/v0/bam';
    var bamSource = pileup.formats.bam({
      url: fileName,
      indexUrl: fileName + '.bai'
    });*/
    // console.error(json);
    const bedUrl = json.bed.replace('public', '');
    this.state.p.destroy();
    var sources = [
      {
        viz: pileup.viz.genome(),
        isReference: true,
        data: pileup.formats.twoBit({
          url: json.two_bit.replace('public', '')
        }),
        name: 'Reference'
      },
      {
        viz: pileup.viz.scale(),
        name: 'Scale'
      },
      {
        viz: pileup.viz.location(),
        name: 'Location'
      } /*
      {
        viz: pileup.viz.coverage(),
        data: bamSource,
        cssClass: 'normal',
        name: 'Alignments'
      },
      {
        viz: pileup.viz.pileup(),
        data: bamSource,
        cssClass: 'normal',
        name: 'Alignments'
      },*/,
      {
        viz: pileup.viz.genes(),
        data: pileup.formats.bigBed({
          url: bedUrl
        }),
        name: 'Regions'
      }
    ];
    var p = pileup.create(document.getElementById('pileup'), {
      range: {
        contig: json.contig,
        start: 0,
        stop: json.stop
      },
      tracks: sources
    });
    this.setState({ p: p });
  }

  staticFilesParser() {
    const nested = this.props.staticFiles
      .map(item => {
        // a.name and a.url, a.viz
        switch (item.viz) {
          case 'twobit':
            return {
              viz: pileup.viz.genome(),
              isReference: true,
              data: pileup.formats.twoBit({
                url: item.url
              }),
              name: item.name
            };
          case 'bigbed':
            return {
              viz: pileup.viz.genes(),
              data: pileup.formats.bigBed({
                url: item.url
              }),
              name: item.name
            };
          case 'variants':
            return {
              viz: pileup.viz.variants(),
              data: pileup.formats.vcf({
                url: item.url
              }),
              options: {
                variantHeightByFrequency: true,
                onVariantClicked: function(data: any) {
                  var content = 'Variants:\n';
                  for (var i = 0; i < data.length; i++) {
                    content += data[i].id + ' - ' + data[i].vcfLine + '\n';
                  }
                  // alert(content);
                }
              },
              name: item.name
            };
          case 'bam':
            var bamSource = pileup.formats.bam({
              url: item.url,
              indexUrl: item.url + '.bai'
            });
            return [
              {
                viz: pileup.viz.coverage(),
                data: bamSource,
                cssClass: 'normal',
                name: item.name
              },
              {
                viz: pileup.viz.pileup(),
                data: bamSource,
                cssClass: 'normal',
                name: item.name
              }
            ];
          default:
            // Ignored.
            return null;
        }
      })
      .filter(a => a);
    return [].concat(...nested);
  }

  setPileup() {
    if (this.state.p !== undefined) {
      this.state.p.destroy();
    } /*
    var fileName = '/api/v0/bam';
    var bamSource = pileup.formats.bam({
      url: fileName,
      indexUrl: fileName + '.bai'
    });*/
    let reference = this.props.reference;
    if (this.props.reference !== 'hg38') {
      reference = 'hg19';
    }
    let sources = this.staticFilesParser();
    if (sources.length === 0) {
      sources = [
        {
          viz: pileup.viz.genome(),
          isReference: true,
          data: pileup.formats.twoBit({
            // url: './samples/hg38.2bit'
            url: 'http://www.biodalliance.org/datasets/' + reference + '.2bit'
          }),
          name: 'Reference'
        },
        {
          viz: pileup.viz.scale(),
          name: 'Scale'
        },
        {
          viz: pileup.viz.location(),
          name: 'Location'
        } /*
      {
        viz: pileup.viz.variants(),
        data: pileup.formats.vcf({
          url: './samples/NA12878.sorted.vcf'
        }),
        options: {
          variantHeightByFrequency: true,
          onVariantClicked: function(data: any) {
            var content = 'Variants:\n';
            for (var i = 0; i < data.length; i++) {
              content += data[i].id + ' - ' + data[i].vcfLine + '\n';
            }
            // alert(content);
          }
        },
        name: 'Variants'
      },*/,
        /*
      {
        viz: pileup.viz.coverage(),
        data: bamSource,
        cssClass: 'normal',
        name: 'Alignments'
      },
      {
        viz: pileup.viz.pileup(),
        data: bamSource,
        cssClass: 'normal',
        name: 'Alignments'
      },*/ {
          viz: pileup.viz.genes(),
          data: pileup.formats.bigBed({
            url: 'http://www.biodalliance.org/datasets/ensGene.bb' // FIXME() It is for hg19.
          }),
          name: 'Genes'
        }
      ];
    }
    var p = pileup.create(document.getElementById('pileup'), {
      range: {
        contig: this.state.pos[0].path,
        start: Math.round(this.state.pos[0].start),
        stop: Math.round(this.state.pos[0].stop)
      },
      tracks: sources
    });
    this.setState({ p: p });
  }
  _backportRegion() {
    const range = this.state.p.getRange();
    this.props.posUpdate([
      new PathRegion(range.contig, range.start, range.stop)
    ]);
  }
  // _backportRegion() {}
  render() {
    return (
      <div className="linear-view">
        <div className="linear-view-header" style={{ display: 'flex' }}>
          <button
            className="btn btn-secondary"
            onClick={this._linearReflection}
            disabled={true}
            title="show selected nodes on the graph view">
            Toggle Nodes
          </button>
          <button
            className="btn btn-secondary"
            onClick={this._backportRegion}
            title="show the graph view selected on this linear view">
            Backport Region
          </button>
          <button
            className="btn btn-secondary"
            onClick={this._getRawSequence}
            disabled={true}
            title="download the raw sequence of selected region">
            Get Raw Sequence
          </button>
        </div>
        <div id="pileup" />
      </div>
    );
  }
}

export default Linear;
