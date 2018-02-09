import * as React from 'react';
import * as ReactDom from 'react-dom';
import * as d3 from 'd3';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import { PathRegion, Helpable, Utils } from './Utils';

export interface AnnotationsProps {
  annotations: any;
  posUpdate: any;
  chroms: any;
  pos: PathRegion[];
}

export interface AnnotationsState {
  annotations: any; // DSVParsedArray<DSVRowString>;
  loaded: boolean;
}

class Annotations extends React.Component<AnnotationsProps, AnnotationsState>
  implements Helpable {
  constructor(props: AnnotationsProps) {
    super(props);
    this.state = { annotations: props.annotations, loaded: false };
  }
  componentWillReceiveProps(props: AnnotationsProps) {
    if (
      this.props.annotations === undefined ||
      props.annotations.length !== this.props.annotations.length
    ) {
      this.setState({ annotations: props.annotations, loaded: true });
    }
  }
  help() {
    return (
      <div>
        <h3>Annotation-Table</h3>
        <p>
          The Table shows the list of annotations on the shown genomic
          coordinates.
        </p>
      </div>
    );
  }
  link() {
    return 'annotation-table';
  }
  render() {
    const columns = [
      {
        Header: () => <strong>GO</strong>,
        id: 'jump',
        width: 40,
        Filter: ({ filter, onChange }) => <div />,
        accessor: d => (
          <span
            title="Go to this region"
            style={{
              cursor: 'pointer',
              backgroundColor: d.color,
              color: 'white'
            }}>
            &#x2295;
          </span>
        )
      },
      {
        Header: 'track',
        width: 200,
        accessor: 'track'
      },
      {
        Header: 'name',
        id: 'name',
        accessor: d => (
          <a href={`http://togogenome.org/gene/9606:${d.name}`} target="_blank">
            {d.name}
          </a>
        )
      },
      {
        Header: 'chrom',
        width: 120,
        accessor: 'path',
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
        Header: 'start',
        id: 'start',
        accessor: d => Number(d.mrna_start),
        Cell: item => {
          const item2 = Utils.formatPretitter(item.value);
          return <span>{item2}</span>;
        }
      },
      {
        Header: 'end',
        id: 'end',
        accessor: d => Number(d.mrna_end),
        Cell: item => {
          const item2 = Utils.formatPretitter(item.value);
          return <span>{item2}</span>;
        }
      },
      {
        Header: '+/-',
        width: 40,
        id: 'strand',
        accessor: 'strand'
      },
      {
        Header: 'description',
        width: 400,
        accessor: 'description'
      }
    ];

    return (
      <ReactTable
        data={this.state.annotations}
        columns={columns}
        className="-striped -highlight"
        filterable={true}
        showPageSizeOptions={true}
        freezeWhenExpanded={true}
        defaultPageSize={5}
        noDataText={'No Data'}
        getTdProps={(state, rowInfo, column, instance) => {
          return {
            onClick: e => {
              // console.log('A Td Element was clicked!');
              // console.log('it produced this event:', e);
              // console.log('It was in this column:', column);
              // console.log('It was in this row:', rowInfo.row);
              if (column.id === 'jump' && rowInfo) {
                this.props.posUpdate(
                  [
                    new PathRegion(
                      rowInfo.row.path,
                      rowInfo.row.start,
                      rowInfo.row.end,
                      true,
                      [rowInfo.row.track]
                    )
                  ],
                  null
                );
              }
            }
          };
        }}
      />
    );
  }
}

export default Annotations;
