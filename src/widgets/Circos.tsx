import * as React from 'react';
import * as ReactDom from 'react-dom';
import * as d3 from 'd3';
import * as math from 'mathjs';
import { OverViewProps, PathRegion, Helpable } from './Utils';
import * as FontAwesome from 'react-fontawesome';
import Selector from './ChromosomeSelector';

interface CircosViewState {
  initialize: boolean;
  chroms: any;
  selector: boolean;
}

const MAXITEMS = 1500;

class CircosView extends React.Component<OverViewProps, CircosViewState>
  implements Helpable {
  constructor(props: OverViewProps) {
    super(props);
    this.state = { initialize: false, chroms: props.chroms, selector: false };
    this._scaleLeft = this._scaleLeft.bind(this);
    this._scaleRight = this._scaleRight.bind(this);
    this._selectChrom = this._selectChrom.bind(this);
    this._toggleSelector = this._toggleSelector.bind(this);
  }
  help() {
    return (
      <div>
        <h3>Circos-plot</h3>
        <p>
          Twenty four arcs mean human chromosomes. The relation between the
          chromosomes is expressed.
        </p>
        <p>Click on the arc to select the entire chromosome.</p>
        <p>Click on the line between the arcs to select the feature.</p>
        <p>Shown items are limited {MAXITEMS} at maximum.</p>
      </div>
    );
  }
  link() {
    return 'circos-plot';
  }
  _toggleSelector() {
    this.setState({ selector: !this.state.selector });
  }
  tooltip(feature: any) {
    let tips = [
      'Start: ' +
        new PathRegion(feature.source_id, feature.source_breakpoint).toString(),
      'End: ' +
        new PathRegion(feature.target_id, feature.target_breakpoint).toString(),
      'Priority: ' + feature.priority
    ];
    if (feature.svtype !== undefined) {
      tips.push('SVtype: ' + feature.svtype);
    }
    return tips;
  }
  drawCircos(features: any, chroms: any) {
    // Initialize Informations

    var chromsLen = chroms.map(function(k) {
      return k.len;
    });

    var chromsName = chroms.map(function(k) {
      return k.id;
    });

    var colors = chroms.map(function(k) {
      return k.color;
    });

    var chordMatrix = math.diag(chromsLen);
    var maxLen = Math.max.apply(null, chromsLen) / 10;
    var ticks = maxLen.toExponential(0);

    var groupTicks = function(d, step) {
      var k = (d.endAngle - d.startAngle) / d.value;
      return d3.range(0, d.value, step).map(function(value: number) {
        return { value: value, angle: value * k + d.startAngle };
      });
    };

    var svg = d3.select('#circos'),
      width = +svg.attr('width'),
      height = +svg.attr('height'),
      outerRadius = Math.min(width, height) * 0.35,
      innerRadius = outerRadius * 0.85;

    var formatValue = d3.formatPrefix(',.0', Number(ticks));

    var chord = d3
      .chord()
      .padAngle(0.025)
      .sortSubgroups(d3.descending);

    var arc = d3
      .arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    var ribbon = d3.ribbon().radius(innerRadius);

    var color = d3
      .scaleOrdinal()
      .domain(d3.range(colors.length).map(a => String(a)))
      .range(colors);

    var chordDatum = chord(chordMatrix);

    svg.selectAll('g').remove();

    var g = svg
      .append('g')
      .attr('transform', 'translate(' + width * 0.5 + ',' + height * 0.5 + ')')
      .datum(chordDatum);

    var group = g
      .append('g')
      .attr('class', 'groups')
      .selectAll('g')
      .data(function(chords: d3.Chords) {
        return chords.groups;
      })
      .enter()
      .append('g');

    var fade = function(opacity: number) {
      return function(d, i) {
        d3.select(d3.event.currentTarget).style('fill-opacity', 1 - opacity);
        ribbons
          .filter(function(d2: any) {
            return (
              chromsName.indexOf(d2.source_id) !== i &&
              chromsName.indexOf(d2.target_id) !== i
            );
          })
          .transition()
          .style('opacity', opacity);
      };
    };
    group
      .append('path')
      .style('stroke', function(d: d3.ChordGroup) {
        return String(d3.rgb(String(color(String(d.index)))).darker());
      })
      .style('fill-opacity', function(d: any) {
        return 0.5;
      })
      .style('fill', function(d: d3.ChordGroup) {
        return String(d3.rgb(String(color(String(d.index)))));
      })
      .attr('d', arc as any)
      .on('click', function(d: d3.ChordGroup, i) {
        // Click a chromosome arc
        this_.props.posUpdate(
          [new PathRegion(chromsName[d.index], 0, chromsLen[d.index])],
          null
        );
      })
      .on(
        'mouseover',
        fade(0.1)
      )
      .on(
        'mouseout',
        fade(
          0.5
        )
      );

    group
      .selectAll('.name')
      .data(function(d: d3.ChordGroup) {
        return [
          {
            index: chromsName[d.index],
            angle: (d.startAngle + d.endAngle) / 2 - 0.05
          }
        ];
      })
      .enter()
      .append('g')
      .attr('transform', function(d: any) {
        return (
          'rotate(' +
          (d.angle * 180 / Math.PI - 90) +
          ') translate(' +
          (outerRadius + 40) +
          ',0)'
        );
      })
      .attr('x', 8)
      .attr('dy', '.35em')
      .append('text')
      .text(function(d: any) {
        return d.index;
      })
      .style('font-size', '11px')
      .attr('transform', function(d: any) {
        return 'rotate(' + 90 + ')';
      });

    var groupTick = group
      .selectAll('.group-tick')
      .data(function(d: d3.ChordGroup) {
        return groupTicks(d, ticks);
      })
      .enter()
      .append('g')
      .attr('class', 'group-tick')
      .attr('transform', function(d: any) {
        return (
          'rotate(' +
          (d.angle * 180 / Math.PI - 90) +
          ') translate(' +
          outerRadius +
          ',0)'
        );
      });

    groupTick.append('line').attr('x2', 6);

    groupTick
      .filter(function(d) {
        return d.value % (Number(ticks) * 5) === 0;
      })
      .append('text')
      .attr('x', 8)
      .attr('dy', '.35em')
      .attr('transform', function(d) {
        return d.angle > Math.PI ? 'rotate(180) translate(-16)' : null;
      })
      .style('text-anchor', function(d) {
        return d.angle > Math.PI ? 'end' : null;
      })
      .style('font-size', '8px')
      .text(function(d) {
        return formatValue(d.value);
      });

    var connectionPointRadius = innerRadius;
    var genomeToAngle = function(chromosome: number, position: number) {
      var chrom = chromsName.indexOf(chromosome);
      if (chrom !== -1) {
        var chromPos = position / chordDatum.groups[chrom].value;
        return (
          (chordDatum.groups[chrom].endAngle -
            chordDatum.groups[chrom].startAngle) *
            chromPos +
          chordDatum.groups[chrom].startAngle
        );
      }
    };
    var genomeToCircosX = function(chromosome: number, position: number) {
      return Math.cos(genomeToAngle(chromosome, position) - Math.PI / 2);
    };
    var genomeToCircosY = function(chromosome: number, position: number) {
      return Math.sin(genomeToAngle(chromosome, position) - Math.PI / 2);
    };

    var circosConnectionPathGenerator = function(d: any) {
      var x1 =
          connectionPointRadius *
          genomeToCircosX(d.source_id, d.source_breakpoint),
        y1 =
          connectionPointRadius *
          genomeToCircosY(d.source_id, d.source_breakpoint),
        x2 =
          connectionPointRadius *
          genomeToCircosX(d.target_id, d.target_breakpoint),
        y2 =
          connectionPointRadius *
          genomeToCircosY(d.target_id, d.target_breakpoint);

      var xmid = (x1 + x2) / 3.5,
        ymid = (y1 + y2) / 3.5; // The 2/3.5 of (O,  the cener of (x1, x2))

      return (
        'M ' + x1 + ' ' + y1 + ' S ' + xmid + ' ' + ymid + ' ' + x2 + ' ' + y2
      );
    };

    var tooltip = d3.select('#tooltip');
    const filteredData = features
      .filter(function(d2: any) {
        return (
          chromsName.indexOf(d2.source_id) !== -1 &&
          chromsName.indexOf(d2.target_id) !== -1
        );
      })
      .slice(0, MAXITEMS);
    const this_ = this;
    var ribbons = g
      .append('g')
      .attr('class', 'path')
      .selectAll('path.circos_connection')
      .data(filteredData)
      .enter()
      .append('path')
      .attr('class', 'circos_connection')
      .attr('d', circosConnectionPathGenerator as any)
      .style('opacity', 0.5)
      .style('stroke-width', 2)
      .style('stroke', function(d: any) {
        var chromId = chromsName.indexOf(d.source_id);
        return colors[chromId];
      })
      .style('fill', 'none')
      .on('mouseover', function(d: any) {
        return (tooltip
            .style('visibility', 'visible')
            .selectAll('tspan')
            .data((() => this_.tooltip(d))())
            .enter()
            .append('tspan')
            .text(function(d2: string) {
              return d2;
            }) );
      })
      .on('mousemove', function(d: any) {
        return tooltip
          .style('top', d3.event.pageY - 20 + 'px')
          .style('left', d3.event.pageX + 10 + 'px');
      })
      .on('mouseout', function(d: any) {
        return tooltip
          .style('visibility', 'hidden')
          .selectAll('tspan')
          .remove();
      })
      .on('click', function(d: any, i: number) {
        // Click a chromosome arc
        const false_ = false;
        if (false_ && d.hasOwnProperty('id')) {
          this_.props.posUpdate(
            [new PathRegion(d.id, null, null, false, [d.svtype, d.priority])],
            i
          );
        } else {
          if (d.source_id !== d.target_id) {
            this_.props.posUpdate(
              [
                new PathRegion(
                  d.source_id,
                  d.source_breakpoint,
                  d.source_breakpoint,
                  true,
                  [d.svtype, d.priority]
                ),
                new PathRegion(
                  d.target_id,
                  d.target_breakpoint,
                  d.target_breakpoint,
                  true,
                  [d.svtype, d.priority]
                )
              ],
              i
            );
          } else {
            this_.props.posUpdate(
              [
                new PathRegion(
                  d.source_id,
                  d.source_breakpoint,
                  d.target_breakpoint,
                  true,
                  [d.svtype, d.priority]
                )
              ],
              i
            );
          }
        }
      });
  }
  componentDidMount() {
    if (this.props.features && this.props.chroms) {
      this.drawCircos(this.props.features, this.props.chroms);
      this.setState({ initialize: true, chroms: this.props.chroms });
    }
  }
  _scaleRight() {
    let chroms = this.state.chroms;
    const tail = chroms.pop();
    chroms.unshift(tail);
    this.setState({ chroms: chroms });
    this.drawCircos(this.props.features, chroms);
  }
  _scaleLeft() {
    let chroms = this.state.chroms;
    const head = chroms.shift();
    chroms.push(head);
    this.setState({ chroms: chroms });
    this.drawCircos(this.props.features, chroms);
  }
  _selectChrom(chromsLabel: string[]) {
    if (chromsLabel.filter(a => a.length > 0).length > 0) {
      const chroms = this.props.chroms.filter(
        a => chromsLabel.indexOf(a.label) !== -1
      );
      this.setState({
        chroms: chroms
      });
      this.drawCircos(this.props.features, chroms);
    }
  }
  componentWillReceiveProps(newProps: OverViewProps) {
    if (
      newProps.features &&
      newProps.chroms &&
      (this.props.features === undefined ||
        newProps.features.length !== this.props.features.length)
    ) {
      this.drawCircos(newProps.features, newProps.chroms);
      this.setState({ initialize: true, chroms: newProps.chroms });
    }
  }
  render() {
    return (
      <div id="circosWrapper">
        <svg
          width={this.props.width > 640 ? 640 : this.props.width}
          height={this.props.width > 640 ? 640 : this.props.width}
          id="circos"
        />
        <div
          className="form-group"
          style={{
            justifyContent: 'space-between',
            display: 'flex'
          }}>
          <button
            className="btn btn-outline-primary"
            onClick={this._scaleLeft}
            title="Turn clockwise">
            {'<-'}
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={this._toggleSelector}
            title="Select chromosomes to be shown">
            {'Select Chromosomes'}
          </button>
          <button
            className="btn btn-outline-primary"
            onClick={this._scaleRight}
            title="Turn counterclockwise">
            {'->'}
          </button>
        </div>
        {(() => {
          if (this.state.selector) {
            return (
              <Selector
                allChroms={this.props.chroms}
                selectChrom={this._selectChrom}
              />
            );
          }
        })()}
      </div>
    );
  }
}

export default CircosView;
