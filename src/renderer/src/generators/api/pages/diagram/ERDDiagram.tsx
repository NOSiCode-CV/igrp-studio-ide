'use client';

import { useEffect, useRef } from 'react';
import * as go from 'gojs';
import { ModelData, RelationData } from './types';

interface ERDDiagramProps {
    models: ModelData[];
    relations: RelationData[];
}

export default function ERDDiagram({ models, relations }: ERDDiagramProps) {
    const diagramRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!diagramRef.current) return;

        const $ = go.GraphObject.make;

        const diagram = $(go.Diagram, diagramRef.current, {
            'undoManager.isEnabled': true,
            layout: $(go.ForceDirectedLayout, {
                maxIterations: 200,
                defaultSpringLength: 100,
                defaultElectricalCharge: 100,
            }),
            initialContentAlignment: go.Spot.Center,
            'animationManager.initialAnimationStyle': go.AnimationManager.None,
            model: new go.GraphLinksModel({ linkKeyProperty: 'key' }),
        });

        function makeAttributeTemplate() {
            return $(
                go.Panel,
                'Horizontal',
                {
                    stretch: go.GraphObject.Horizontal,
                    margin: new go.Margin(3, 0),
                },
                $(
                    go.Shape,
                    {
                        width: 12,
                        height: 12,
                        margin: new go.Margin(2, 4, 2, 0),
                    },
                    new go.Binding('figure', 'figure'),
                    new go.Binding('fill', 'color')
                ),
                $(
                    go.TextBlock,
                    {
                        font: '12px sans-serif',
                        stroke: 'white',
                    },
                    new go.Binding('text', 'name')
                )
            );
        }

        // Node template
        diagram.nodeTemplate = $(
            go.Node,
            'Auto',
            {
                selectable: true,
                resizable: true,
                layoutConditions:
                    go.Part.LayoutStandard & ~go.Part.LayoutNodeSized,
            },
            $(go.Shape, 'Rectangle', {
                fill: '#2F4F4F',
                stroke: '#00FFFF',
                strokeWidth: 2,
            }),
            $(
                go.Panel,
                'Vertical',
                { margin: 8 },
                // Title
                $(
                    go.TextBlock,
                    {
                        alignment: go.Spot.Center,
                        font: 'bold 14px sans-serif',
                        stroke: 'white',
                        margin: new go.Margin(0, 0, 8, 0),
                    },
                    new go.Binding('text', 'name')
                ),
                // Regular Attributes
                $(
                    go.Panel,
                    'Vertical',
                    {
                        stretch: go.GraphObject.Horizontal,
                        alignment: go.Spot.Left,
                    },
                    new go.Binding('itemArray', 'items'),
                    {
                        itemTemplate: makeAttributeTemplate(),
                    }
                ),
                // Inherited Attributes
                $(
                    go.Panel,
                    'Vertical',
                    {
                        stretch: go.GraphObject.Horizontal,
                        alignment: go.Spot.Left,
                        margin: new go.Margin(8, 0, 0, 0),
                    },
                    $(
                        go.TextBlock,
                        {
                            alignment: go.Spot.Left,
                            font: 'italic 12px sans-serif',
                            stroke: 'white',
                        },
                        'Inherited Attributes'
                    ),
                    new go.Binding('itemArray', 'inheritedItems'),
                    {
                        itemTemplate: makeAttributeTemplate(),
                    }
                )
            )
        );

        // Link template
        diagram.linkTemplate = $(
            go.Link,
            {
                routing: go.Link.AvoidsNodes,
                curve: go.Link.JumpOver,
                corner: 5,
                toShortLength: 4,
            },
            $(go.Shape, { strokeWidth: 1.5, stroke: '#00FFFF' }),
            $(go.Shape, {
                toArrow: 'Standard',
                stroke: '#00FFFF',
                fill: '#00FFFF',
            }),
            $(
                go.TextBlock, // the "from" label
                {
                    textAlign: 'center',
                    font: 'bold 12px sans-serif',
                    stroke: 'gray',
                    segmentIndex: 0,
                    segmentOffset: new go.Point(NaN, NaN),
                    segmentOrientation: go.Link.OrientUpright,
                },
                new go.Binding('text', 'text')
            ),
            $(
                go.TextBlock, // the "to" label
                {
                    textAlign: 'center',
                    font: 'bold 12px sans-serif',
                    stroke: 'gray',
                    segmentIndex: -1,
                    segmentOffset: new go.Point(NaN, NaN),
                    segmentOrientation: go.Link.OrientUpright,
                },
                new go.Binding('text', 'toText')
            )
        );

        // Initialize the model data
        diagram.model = new go.GraphLinksModel(models, relations);

        return () => {
            diagram.div = null;
        };
    }, [models, relations]);

    return <div ref={diagramRef} style={{ height: '100vh' }} />;
}
