declare module 'react-plotly.js' {
  import * as React from 'react';
  
  interface PlotParams {
    data: any[];
    layout?: any;
    frames?: any[];
    config?: any;
    useResizeHandler?: boolean;
    style?: React.CSSProperties;
    className?: string;
    debug?: boolean;
    divId?: string;
    revision?: number;
    onInitialized?: (figure: any, graphDiv: HTMLElement) => void;
    onUpdate?: (figure: any, graphDiv: HTMLElement) => void;
    onPurge?: (figure: any, graphDiv: HTMLElement) => void;
    onError?: (err: Error) => void;
    onAfterExport?: () => void;
    onAfterPlot?: () => void;
    onAnimated?: () => void;
    onAnimatingFrame?: (event: any) => void;
    onAnimationInterrupted?: () => void;
    onAutoSize?: () => void;
    onBeforeExport?: () => void;
    onButtonClicked?: (event: any) => void;
    onClick?: (event: any) => void;
    onClickAnnotation?: (event: any) => void;
    onDeselect?: () => void;
    onDoubleClick?: () => void;
    onFramework?: () => void;
    onHover?: (event: any) => void;
    onLegendClick?: (event: any) => boolean;
    onLegendDoubleClick?: (event: any) => boolean;
    onRelayout?: (event: any) => void;
    onRestyle?: (event: any) => void;
    onRedraw?: () => void;
    onSelected?: (event: any) => void;
    onSelecting?: (event: any) => void;
    onSliderChange?: (event: any) => void;
    onSliderEnd?: (event: any) => void;
    onSliderStart?: (event: any) => void;
    onTransitioning?: () => void;
    onTransitionInterrupted?: () => void;
    onUnhover?: (event: any) => void;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface PlotlyHTMLElement extends HTMLElement {
    // Add any specific methods or properties if needed
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  class Plot extends React.Component<PlotParams> {}

  export default Plot;
}