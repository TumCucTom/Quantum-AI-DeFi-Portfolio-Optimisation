declare module 'react-heatmap-grid' {
    import * as React from 'react';

    interface HeatMapGridProps {
        xLabels: string[];
        yLabels: string[];
        data: (number | string)[][];
        background?: (x: number, y: number, value: number | string) => string;
        cellRender?: (x: number, y: number, value: number | string) => React.ReactNode;
        cellStyle?: (x: number, y: number, value: number | string) => React.CSSProperties;
        xLabelsLocation?: 'top' | 'bottom';
        xLabelsVisibility?: boolean[];
        yLabelsLocation?: 'left' | 'right';
        yLabelsVisibility?: boolean[];
        square?: boolean;
        height?: number;
        onClick?: (x: number, y: number) => void;
    }

    const HeatMapGrid: React.FC<HeatMapGridProps>;
    export default HeatMapGrid;
}
