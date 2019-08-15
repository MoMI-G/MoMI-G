import * as React from 'react';
import * as d3 from 'd3';
import * as ReactDom from 'react-dom';
import LazyLoad from 'react-lazy-load';
import Dashboard, { addWidget } from 'react-dazzle';
// Default styles.
import 'react-dazzle/lib/style/style.css';
import './dashboard/custom.css';

import { Utils, PathRegion } from './widgets/Utils';
import AddWidgetDialog from './dashboard/AddWidgetDialog';
import EditBar from './dashboard/Editbar';
import CustomFrame from './dashboard/FrameWithManual';
import Header from './dashboard/Header';
import Footer from './dashboard/Footer';

import CircosView from './widgets/Circos';
import SVList from './widgets/SVList';
import Linear from './widgets/Linear';
import GraphWrapper from './widgets/GraphWrapper';
import { ThresholdSlider } from './widgets/Widgets';
import Annotations from './widgets/Annotations';
import Dnd from './widgets/Dnd';

const layoutPresets = require('./dashboard/preset.json');

export interface DashboardInnerProps {
  width: number;
  margin: any;
  _uuidUpdate: any;
  _posUpdate: any;
  _posUpdateWithFeature: any;
  _handleThreshold: any;
  _handleSelection: any;
  _nodesUpdate: any;
  _annotationsUpdate: any;
  _annotationsClean: any;
  sequentialId: number;
  _posReplace: any;
  _posReplaceWithFeature: any;
  _posConcatWithFeature: any;
  _arrayMode: () => void;
  _changeReference: (ref: string) => void;
  _nameUpdate: (name: string) => void;
  _toggleSubPathAnnotation: () => void;

  features?: any;
  featureId?: number;
  featureThreshold: number[];
  filteredFeatures?: any;
  featureSelection: boolean[];
  chroms?: any;
  posInner: PathRegion[];
  nodes: number[];
  annotations: any[];
  uuid: string;
  keyId: number;
  arrayMode: boolean;
  reference?: string;
  _keyIdUpdate: any;
  name?: string;
  staticFiles: any;
  subPathAnnotation: boolean;
  bigbedAnnotation: boolean;
}

export interface DashboardInnerState {
  // For dashboard
  widgets: any;
  layout: any;
  editMode: boolean;
  isModalOpen: boolean;
  addWidgetOptions: any;
  initialize: boolean;
}

class DashboardInner extends React.Component<
  DashboardInnerProps,
  DashboardInnerState
> {
  constructor(props: DashboardInnerProps) {
    super(props);
    this.toggleEdit = this.toggleEdit.bind(this);
    this.onAdd = this.onAdd.bind(this);
    this.state = {
      // Widgets that are available in the dashboard
      widgets: {},
      // Layout of the dashboard
      layout: {
        rows: [
          {
            columns: [
              {
                className: 'col-md-6 col-sm-6 col-xs-6',
                widgets: []
              },
              {
                className: 'col-md-6 col-sm-6 col-xs-6',
                widgets: []
              }
            ]
          },
          {
            columns: [
              {
                className: 'col-md-12 col-sm-12 col-xs-12',
                widgets: []
              }
            ]
          }
        ]
      },
      editMode: false,
      isModalOpen: false,
      addWidgetOptions: null,
      initialize: false
    };
  }
  /**
   * When a widget is removed, the layout should be set again.
   */
  onRemove = layout => {
    this.setState({
      layout: layout
    });
  };

  /**
   * Adds new widgget.
   */
  onAdd = (layout, rowIndex, columnIndex) => {
    // Open the AddWidget dialog by seting the 'isModalOpen' to true.
    // Also preserve the details such as the layout, rowIndex, and columnIndex  in 'addWidgetOptions'.
    //  This will be used later when user picks a widget to add.
    this.setState({
      isModalOpen: true,
      addWidgetOptions: {
        layout,
        rowIndex,
        columnIndex
      }
    });
  };

  /**
   * When a widget moved, this will be called. Layout should be given back.
   */
  onMove = layout => {
    this.setState({
      layout: layout
    });
  };

  /**
   * This will be called when user tries to close the modal dialog.
   */
  onRequestClose = () => {
    this.setState({
      isModalOpen: false
    });
  };
  componentWillReceiveProps(props: DashboardInnerProps) {
    this.updateWidget(props);
  }
  componentDidMount() {
  }
  updateWidget(props: DashboardInnerProps) {
    // On mounted
    // const width = 1280;
    // const margin = { top: 20, right: 20, bottom: 20, left: 10 };

    if (props.keyId !== this.props.keyId || !this.state.initialize) {
      this.setState({
        layout: layoutPresets[Object.keys(layoutPresets)[props.keyId]],
        initialize: true
      });
    }

    const uploaderProps = {
      width: props.width / 2,
      posInner: props.posInner,
      uuidUpdate: props._uuidUpdate,
      uuid: props.uuid,
      reference: props.reference,
      changeReference: props._changeReference,
      nameUpdate: props._nameUpdate
    };

    const overViewProps = {
      pos: props.posInner,
      width: props.width * 0.45,
      posUpdate: props._posConcatWithFeature,
      featureThreshold: props.featureThreshold,
      features: props.filteredFeatures,
      featureSelection: props.featureSelection,
      chroms: props.chroms,
      closeModal: null,
      reference: props.reference
    };
    const wholeScaleProps = {
      margin: props.margin,
      height: 50,
      width: props.width * 0.97,
      pos: props.posInner,
      posUpdate: props._posReplace,
      chroms: props.chroms
    };

    const graphScaleProps = {
      margin: props.margin,
      height: 50,
      width: props.width * 0.97,
      pos: props.posInner,
      posUpdate: props._posReplaceWithFeature,
      chroms: props.chroms,
      features: props.features,
      featureThreshold: props.featureThreshold
    };

    const pathRegionProps = {
      pos: props.posInner,
      posUpdate: props._posUpdateWithFeature,
      posConcat: props._posConcatWithFeature,
      arrayMode: props._arrayMode,
      reference: props.reference,
      chroms: props.chroms
    };

    const graphProps = {
      width: props.width * 0.95,
      height: 500,
      chroms: props.chroms,
      pos: props.posInner,
      nodesUpdate: props._nodesUpdate,
      annotationsUpdate: props._annotationsUpdate,
      annotationsClean: props._annotationsClean,
      uuid: props.uuid,
      sequentialId: props.sequentialId,
      reference: props.reference,
      subPathAnnotation: props.subPathAnnotation,
      bigbedAnnotation: props.bigbedAnnotation,
      toggleSubPathAnnotation: props._toggleSubPathAnnotation,
      features: props.filteredFeatures,
    };

    const annotationsProps = {
      annotations: props.annotations,
      pos: props.posInner,
      chroms: props.chroms,
      posUpdate: props._posUpdateWithFeature
    };

    const linearProps = {
      pos: props.posInner,
      posUpdate: props._posReplace,
      width: props.width,
      nodes: props.nodes,
      toggleNodes: false,
      reference: props.reference,
      staticFiles: props.staticFiles
    };

    const thresholdSliderProps = {
      featureThreshold: props.featureThreshold,
      handleThreshold: props._handleThreshold,
      featureSelection: props.featureSelection,
      handleSelection: props._handleSelection
    };

    this.setState({
      widgets: {
        CircosWidget: {
          type: CircosView,
          title: 'Overall View: Circos',
          props: overViewProps
        },
        PathRegionWidget: {
          type: Dnd,
          title: 'Overall View: Path Region Array',
          props: pathRegionProps
        },
        ThresholdWidget: {
          type: ThresholdSlider,
          title: 'Overall View: Threshold Filter',
          props: thresholdSliderProps
        },
        FeatureTableWidget: {
          type: SVList,
          title: 'Overall View: Feature Table',
          props: overViewProps
        },
        TubeMapWidget: {
          type: GraphWrapper,
          title: 'Graph View: SequenceTubeMap',
          props: graphProps
        },
        AnnotationWidget: {
          type: Annotations,
          title: 'Linear View: Annotations',
          props: annotationsProps
        },
        PileupWidget: {
          type: Linear,
          title: 'Linear View: Pileup.js',
          props: linearProps
        }
      }
    });
  }
  /**
   * Toggeles edit mode in dashboard.
   */
  toggleEdit = () => {
    this.setState({
      editMode: !this.state.editMode
    });
  };

  /**
   * When user selects a widget from the modal dialog, this will be called.
   * By calling the 'addWidget' method, the widget could be added to the previous requested location.
   */
  handleWidgetSelection = widgetName => {
    const { layout, rowIndex, columnIndex } = this.state.addWidgetOptions;

    /**
     * 'AddWidget' method gives you the new layout.
     */
    this.setState({
      layout: addWidget(layout, rowIndex, columnIndex, widgetName)
    });

    // Close the dialogbox
    this.onRequestClose();
  };

  render() {
    return (
      <div className="container-fluid">
        <AddWidgetDialog
          widgets={this.state.widgets}
          isModalOpen={this.state.isModalOpen}
          onRequestClose={this.onRequestClose}
          onWidgetSelect={this.handleWidgetSelection}
        />
        <Header
          keyId={this.props.keyId}
          updateKeyId={this.props._keyIdUpdate}
          layoutPresets={layoutPresets}
          name={this.props.name}
          pos={this.props.posInner}
          onEdit={this.toggleEdit}
        />
        <Dashboard
          frameComponent={CustomFrame}
          onRemove={this.onRemove}
          layout={this.state.layout}
          widgets={this.state.widgets}
          editable={this.state.editMode}
          onAdd={this.onAdd}
          onMove={this.onMove}
          addWidgetComponentText="Add New Widget"
        />
        {(() => {
          if (this.props.keyId !== 4) {
            return (
              <Footer
                pos={this.props.posInner}
                posUpdate={this.props._posUpdateWithFeature}
                posConcat={this.props._posConcatWithFeature}
                arrayMode={this.props._arrayMode}
                reference={this.props.reference}
                chroms={this.props.chroms}
              />
            );
          }
        })()}
      </div>
    );
  }
}

export default DashboardInner;
