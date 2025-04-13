'use client';
import React, {useState} from 'react';
import HeatMap from "react-heatmap-grid";

const HeatmapComponent = ({ data, title }: { data: number[][]; title: string }) => {
    if (!data || data.length === 0 || data[0]?.length === 0) {
        return <div>No heatmap data available.</div>;
    }

    const xLabels = data[0]?.map((_, i) => i.toString()) || [];
    const yLabels = data.map((_, i) => i.toString());

    return (
        <div style={{ marginBottom: "2rem" }}>
            <h4>{title}</h4>
            <HeatMap
                xLabels={xLabels}
                yLabels={yLabels}
                data={data}
                background={(x: any, y: any, value: any) =>
                    `rgb(66, 135, 245, ${value})`
                }
                height={20}
            />
        </div>
    );
};
export default HeatmapComponent;

