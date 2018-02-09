import * as React from 'react';
import * as ReactDom from 'react-dom';
import * as d3 from 'd3';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import { OverViewProps, PathRegion, Helpable, Utils } from './Utils';
import AutoComplete from './AutoComplete';
import styled from 'styled-components';

const FeatureTableContainer = styled.div`
  font-size: 12px;
`;

export interface SVListState {
  fusions: any; // DSVParsedArray<DSVRowString>;
  loading: boolean;
  filter: string;
}

class SVList extends React.Component<OverViewProps, SVListState>
  implements Helpable {
  constructor(props: OverViewProps) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.filterExec = this.filterExec.bind(this);
    this.filterByPosition = this.filterByPosition.bind(this);
    this.filterCancel = this.filterCancel.bind(this);
    this.state = { fusions: props.features, loading: false, filter: '' };
  }
  componentWillReceiveProps(props: OverViewProps) {
    if (
      this.props.features === undefined ||
      props.features.length !== this.props.features.length
    ) {
      this.setState({ fusions: props.features, loading: false });
    }
  }
  help() {
    return (
      <div>
        <h3>Feature-Table</h3>
        <p>The Table shows the list of features between genomic coordinates.</p>
        <p>Structural variations are listed here.</p>
        <p>Click on the row to select the feature.</p>
        <p>Input genomic coorinates or gene name to filter variations.</p>
      </div>
    );
  }
  link() {
    return 'feature-table';
  }
  filterExec() {
    const pos = Utils.strToRegion(this.state.filter);
    const this_ = this;
    if (pos[0] !== null) {
      this.filterByPosition(pos[0]);
    } else {
      fetch(
        '/api/v2/feature?ref=' +
          this.props.reference +
          '&equals=' +
          this.state.filter.toUpperCase()
      )
        .then(function(response: Response) {
          return response.json();
        })
        .then(function(json2: any) {
          // FIXME()
          if (Object.prototype.toString.call(json2) === '[object Array]')
            json2 = json2[1]; // For Compatible
          var pos2;
          if (json2.start <= json2.stop) {
            pos2 = new PathRegion(json2.path, json2.start, json2.stop);
          } else {
            pos2 = new PathRegion(json2.path, json2.stop, json2.start);
          }
          this_.filterByPosition(pos2);
        })
        .catch(function(err: any) {
          // handle error
          // console.error(err);
        });
    }
  }
  filterByPosition(pos: PathRegion) {
    const filteredFeatures = this.props.features.filter(a => {
      return (
        (a.source_id === pos.path &&
          pos.start <= a.source_breakpoint &&
          a.source_breakpoint <= pos.stop) ||
        (a.target_id === pos.path &&
          pos.start <= a.target_breakpoint &&
          a.target_breakpoint <= pos.stop)
      );
    });
    this.setState({ fusions: filteredFeatures });
  }
  filterCancel() {
    this.setState({ fusions: this.props.features, filter: '' });
  }
  onChange = (event, { newValue }) => {
    this.setState({ filter: newValue });
    if (newValue === '') {
      this.filterCancel();
    }
  };
  filter = ({ filter, onChange }) => (
    <select
      onChange={event => onChange(event.target.value)}
      style={{ width: '100%', display: 'inline-block' }}
      className="form-control"
      value={filter ? filter.value : ''}>
      <option value="">Show All</option>
      {this.props.chroms.map(a => (
        <option key={a.id} value={a.id}>
          {a.label}
        </option>
      ))}
    </select>
  );
  render() {
    const columns = [
      {
        Header: () => <strong>GO</strong>,
        id: 'jump',
        width: 35,
        Filter: ({ filter, onChange }) => <div />,
        accessor: d => (
          <a title="Go to this region" style={{ cursor: 'pointer' }}>
            <strong>&#x2295;</strong>
          </a>
        )
      },
      {
        Header: 'Source',
        columns: [
          {
            Header: 'chrom',
            accessor: 'source_id',
            Filter: this.filter,
            filterMethod: (filter, row) =>
              String(row[filter.id]) === filter.value,
            Cell: item => {
              return (
                <span>
                  <span
                    style={{
                      color: Utils.strToColor(item.value, this.props.chroms),
                      transition: 'all .3s ease'
                    }}>
                    &#x25cf;
                  </span>{' '}
                  {item.value}
                </span>
              );
            }
          },
          {
            Header: 'breakpoint',
            id: 'source_breakpoint',
            accessor: d => Number(d.source_breakpoint),
            Cell: item => {
              const item2 = Utils.formatPretitter(item.value);
              return <span>{item2}</span>;
            }
          },
          {
            Header: '+/-',
            width: 40,
            accessor: 'source_strand'
          }
        ]
      },
      {
        Header: 'Target',
        columns: [
          {
            Header: 'chrom',
            accessor: 'target_id',
            Filter: this.filter,
            filterMethod: (filter, row) =>
              String(row[filter.id]) === filter.value,
            Cell: item => {
              return (
                <span>
                  <span
                    style={{
                      color: Utils.strToColor(item.value, this.props.chroms),
                      transition: 'all .3s ease'
                    }}>
                    &#x25cf;
                  </span>{' '}
                  {item.value}
                </span>
              );
            }
          },
          {
            Header: 'breakpoint',
            id: 'target_breakpoint',
            accessor: d => Number(d.target_breakpoint),
            Cell: item => {
              const item2 = Utils.formatPretitter(item.value);
              return <span>{item2}</span>;
            }
          },
          {
            Header: '+/-',
            width: 40,
            accessor: 'target_strand'
          }
        ]
      },
      {
        Header: 'Stats',
        columns: [
          {
            Header: 'priority',
            width: 80,
            id: 'priority',
            accessor: d => Number(d.priority)
          },
          {
            Header: 'svtype',
            width: 80,
            filterMethod: (filter, row) =>
              row[filter.id].startsWith(filter.value.toUpperCase()),
            accessor: 'svtype',
            Cell: item => {
              return (
                <span>
                  <span
                    style={{
                      color: Utils.svTypeToColor(item.value),
                      transition: 'all .3s ease'
                    }}>
                    &#x25cf;
                  </span>{' '}
                  {item.value}
                </span>
              );
            }
          }
        ]
      }
    ];

    return (
      <FeatureTableContainer>
        <ReactTable
          defaultSorted={[
            {
              id: 'priority',
              desc: true
            }
          ]}
          loading={this.state.loading}
          data={this.state.fusions}
          columns={columns}
          className="-striped -highlight"
          filterable={true}
          showPageSizeOptions={true}
          freezeWhenExpanded={true}
          defaultPageSize={10}
          filters={[
            {
              // the current filters model
              id: 'source_id',
              value: this.props.pos[0].path
            }
          ]}
          getTdProps={(state, rowInfo, column, instance) => {
            return {
              onClick: e => {
                if (column.id === 'jump' && rowInfo) {
                  const false_ = false;
                  let annotations = [rowInfo.row.svtype, rowInfo.row.priority];
                  if (this.state.filter !== '') {
                    annotations.push(this.state.filter);
                  }
                  if (false_ && rowInfo.row._original.hasOwnProperty('id')) {
                    this.props.posUpdate(
                      [
                        new PathRegion(
                          rowInfo.row._original.id,
                          null,
                          null,
                          false,
                          annotations
                        )
                      ],
                      rowInfo.row._index
                    );
                  } else {
                    if (rowInfo.row.source_id === rowInfo.row.target_id) {
                      this.props.posUpdate(
                        [
                          new PathRegion(
                            rowInfo.row.source_id,
                            rowInfo.row.source_breakpoint,
                            rowInfo.row.target_breakpoint,
                            true,
                            annotations
                          ),
                          new PathRegion(
                            rowInfo.row._original.id,
                            null,
                            null,
                            false,
                            annotations
                          )
                        ],
                        rowInfo.row._index
                      );
                    } else {
                      this.props.posUpdate(
                        [
                          new PathRegion(
                            rowInfo.row.source_id,
                            rowInfo.row.source_breakpoint,
                            rowInfo.row.source_breakpoint,
                            true,
                            annotations
                          ),
                          new PathRegion(
                            rowInfo.row.target_id,
                            rowInfo.row.target_breakpoint,
                            rowInfo.row.target_breakpoint,
                            true,
                            annotations
                          ),
                          new PathRegion(
                            rowInfo.row._original.id,
                            null,
                            null,
                            false,
                            annotations
                          )
                        ],
                        rowInfo.row._index
                      );
                    }
                  }
                }
                // console.log('It was in this table instance:', instance);
              }
            };
          }}
        />
        <div id="SelectByRegion">
          <div className="form-group" style={{ display: 'flex' }}>
            <label>Filter: </label>
            <AutoComplete
              value={this.state.filter}
              onChange={this.onChange}
              reference={this.props.reference}
              width={300}
              title="Type a genomic region(path:start-stop) or gene name to filter items."
              placeholder="genomic region or gene name"
            />
          </div>
          <div className="form-group" style={{ display: 'flex' }}>
            <input
              type="submit"
              className="btn btn-primary"
              value="filter"
              title="Filter all items by a genomic region(path:start-stop) or gene name."
              onClick={this.filterExec}
            />
            <input
              type="submit"
              className="btn btn-secondary"
              value="cancel"
              title="Cancel filtering"
              onClick={this.filterCancel}
            />
          </div>
        </div>
      </FeatureTableContainer>
    );
  }
}

export default SVList;
