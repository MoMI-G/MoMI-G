import * as React from 'react';
import * as ReactDom from 'react-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { PathRegion, Helpable, PathRegionProps, Utils } from './Utils';
import PathRegionForm from './PathRegionForm';
import styled from 'styled-components';

const DropZone = styled.div`
  display: flex;
  /*
      Needed to avoid growth in list due to lifting the first item
      Caused by display: inline-flex strangeness
    */
  align-items: start;
  /* stop the list collapsing when empty */
  min-width: 600px;
`;

const ScrollContainer = styled.div`
  overflow: auto;
`;

const Container = styled.div`
  /* flex child */
  flex-grow: 1;
  /* flex parent */
  /* needed to allow width to grow greater than body */
  display: inline-flex;
`;

// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
  const result = list; // Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

// using some little inline style helpers to make the app look okay
const grid = 8;
const getItemStyle = (draggableStyle, isDragging, index) => ({
  // some basic styles to make the items look a bit nicer
  userSelect: 'none',
  padding: grid,
  // marginBottom: grid,
  width: 400,
  border: 'solid 1px #333',

  // change background colour if dragging
  // background: isDragging ? 'lightgreen' : index === 0 ? 'lightyellow' : 'white',

  // styles we need to apply on draggables
  ...draggableStyle
});

const getListStyle = isDraggingOver => ({
  background: isDraggingOver ? '#c9fcff' : '#b4ebfa',
  padding: '1px',
  display: 'flex'
});

interface DndState {
  items: PathRegion[];
}

class Dnd extends React.Component<PathRegionProps, DndState>
  implements Helpable {
  constructor(props: PathRegionProps) {
    super(props);
    this.state = {
      items: this.props.pos
    };
    this.onDragEnd = this.onDragEnd.bind(this);
    this.onItemDelete = this.onItemDelete.bind(this);
    this.onItemUpdate = this.onItemUpdate.bind(this);
    this.onItemSelect = this.onItemSelect.bind(this);
    this.onItemDuplicate = this.onItemDuplicate.bind(this);
  }

  componentDidMount() {
    this.props.arrayMode();
  }

  onDragEnd(result) {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    const items = reorder(
      this.state.items,
      result.source.index,
      result.destination.index
    );

    this.setState({
      items
    });
    this.props.posUpdate(items, null);
  }

  onItemMoveToHead(index: number) {
    var result = this.state.items;
    let tmp = result[0];
    result[0] = result[index];
    result[index] = tmp;
    this.props.posUpdate(result, null);
  }

  onItemUpdate(index: number, newpos: PathRegion) {
    var result = this.state.items;

    result[index] = newpos;
    this.props.posUpdate(result, null, index);
  }

  onItemDuplicate(index: number) {
    var result = this.state.items;
    result.unshift(result[index]);
    this.props.posUpdate(result, null);
  }

  onItemDelete(index: number) {
    var result = this.state.items;
    result.splice(index, 1);
    this.setState({
      items: result
    });
    this.props.posUpdate(result, null);
  }

  onItemSelect(index: number) {
    const result = this.state.items.filter(
      (item, i) => i === index || item.isLocked
    );
    this.props.posUpdate(result, null);
  }

  help() {
    return (
      <div>
        <h3>Path-Region Array</h3>
        <p>
          Put the target coordinate such as (chr:start or chr:start-end) on the
          input box.
        </p>
        <p>
          Put the gene name such as (MYC or TP53), gene name is suggested by
          prefix search and coordinate are autocompleted if you select a exact
          one gene.
        </p>
        <p>Gene name is currently referring to GENCODE.</p>
        <p>Remove the genomic region item on click &#x2716; button.</p>
        <p>Remove except for the genomic region on click &#x2B55; button.</p>
      </div>
    );
  }
  link() {
    return 'path-region-array';
  }
  componentWillReceiveProps(props: PathRegionProps) {
    this.setState({
      items: props.pos
    });
  }

  // Normally you would want to split things out into separate components.
  // But in this example everything is just done in one place for simplicity
  render() {
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Droppable droppableId="droppable" direction="horizontal">
          {(provided, snapshot) => (
            <div
              className={
                snapshot.isDraggingOver ? 'dnd-list-dragging' : 'dnd-list'
              }
              style={{
                ...getListStyle(snapshot.isDraggingOver),
                width: '100%'
              }}>
              <ScrollContainer>
                <Container>
                  <div
                    className={
                      snapshot.isDraggingOver ? 'dnd-list-dragging' : 'dnd-list'
                    }
                    style={getListStyle(snapshot.isDraggingOver)}
                    ref={provided.innerRef}>
                    {this.state.items.map((item, index) => (
                      <Draggable
                        key={index + 1}
                        draggableId={index + 1}
                        index={index}>
                        {(provided, snapshot) => (
                          <div>
                            <div
                              onDoubleClick={() => {
                                this.onItemMoveToHead(index);
                              }}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={
                                snapshot.isDragging
                                  ? 'dnd-item-dragging'
                                  : index === 0
                                    ? 'dnd-item-selected'
                                    : 'dnd-item-default'
                              }
                              style={getItemStyle(
                                provided.draggableProps.style,
                                snapshot.isDragging,
                                index
                              )}
                              {...provided.dragHandleProps}>
                              <PathRegionForm
                                reference={
                                  this.props.reference === null
                                    ? 'hg19'
                                    : this.props.reference
                                }
                                pos={item}
                                posUpdate={(newPos: PathRegion) =>
                                  this.onItemUpdate(index, newPos)
                                }
                                posConcat={() => this.onItemDuplicate(index)}
                                color={Utils.strToColor(
                                  item.path,
                                  this.props.chroms
                                )}
                                closeVisible={
                                  this.state.items.length > 1 && !item.isLocked
                                }
                                onItemDelete={() => this.onItemDelete(index)}
                                onItemSelect={() => this.onItemSelect(index)}
                              />
                            </div>
                            {provided.placeholder}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </Container>
              </ScrollContainer>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  }
}

export default Dnd;
