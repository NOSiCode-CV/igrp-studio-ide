'use client'

import * as go from 'gojs'
import { useEffect, useRef } from 'react'
import type { ModelData, RelationData } from './types'

interface ERDCanvasProps {
    models: ModelData[]
    relations: RelationData[]
    /**
     * Fired with the new gojs location ("x y") whenever the user finishes
     * dragging a node. Caller is expected to debounce + persist.
     */
    onNodeMoved?: (key: string, loc: string) => void
    /** Fired when the user clicks a node in the canvas. */
    onNodeClicked?: (key: string) => void
    /**
     * Optional handle into the underlying gojs diagram so callers can
     * implement actions like "Auto layout" via toolbar buttons.
     */
    onDiagramReady?: (diagram: go.Diagram) => void
    /** When set, overrides the default 100vh height. */
    height?: string | number
}

export default function ERDCanvas({
    models,
    relations,
    onNodeMoved,
    onNodeClicked,
    onDiagramReady,
    height
}: ERDCanvasProps) {
    const diagramRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!diagramRef.current) return

        const $ = go.GraphObject.make

        const diagram = $(go.Diagram, diagramRef.current, {
            'undoManager.isEnabled': true,
            layout: $(go.ForceDirectedLayout, {
                maxIterations: 200,
                defaultSpringLength: 100,
                defaultElectricalCharge: 100
            }),
            initialContentAlignment: go.Spot.Center,
            'animationManager.initialAnimationStyle': go.AnimationManager.None,
            model: new go.GraphLinksModel({ linkKeyProperty: 'key' })
        })

        function makeAttributeTemplate() {
            return $(
                go.Panel,
                'Horizontal',
                {
                    stretch: go.GraphObject.Horizontal,
                    margin: new go.Margin(3, 0)
                },
                $(
                    go.Shape,
                    {
                        width: 12,
                        height: 12,
                        margin: new go.Margin(2, 4, 2, 0)
                    },
                    new go.Binding('figure', 'figure'),
                    new go.Binding('fill', 'color')
                ),
                $(
                    go.TextBlock,
                    {
                        font: '12px sans-serif',
                        stroke: 'white'
                    },
                    new go.Binding('text', 'name')
                )
            )
        }

        // Node template
        diagram.nodeTemplate = $(
            go.Node,
            'Auto',
            {
                selectable: true,
                resizable: true,
                layoutConditions: go.Part.LayoutStandard & ~go.Part.LayoutNodeSized,
                click: (_e, obj) => {
                    const node = obj as go.Node
                    if (onNodeClicked && node.data?.key)
                        onNodeClicked(String(node.data.key))
                }
            },
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            $(go.Shape, 'Rectangle', {
                fill: '#2F4F4F',
                stroke: '#00FFFF',
                strokeWidth: 2
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
                        margin: new go.Margin(0, 0, 8, 0)
                    },
                    new go.Binding('text', 'name')
                ),
                // Regular Attributes
                $(
                    go.Panel,
                    'Vertical',
                    {
                        stretch: go.GraphObject.Horizontal,
                        alignment: go.Spot.Left
                    },
                    new go.Binding('itemArray', 'items'),
                    {
                        itemTemplate: makeAttributeTemplate()
                    }
                ),
                // Inherited Attributes
                $(
                    go.Panel,
                    'Vertical',
                    {
                        stretch: go.GraphObject.Horizontal,
                        alignment: go.Spot.Left,
                        margin: new go.Margin(8, 0, 0, 0)
                    },
                    $(
                        go.TextBlock,
                        {
                            alignment: go.Spot.Left,
                            font: 'italic 12px sans-serif',
                            stroke: 'white'
                        },
                        'Inherited Attributes'
                    ),
                    new go.Binding('itemArray', 'inheritedItems'),
                    {
                        itemTemplate: makeAttributeTemplate()
                    }
                )
            )
        )

        // Link template
        diagram.linkTemplate = $(
            go.Link,
            {
                routing: go.Link.AvoidsNodes,
                curve: go.Link.JumpOver,
                corner: 5,
                toShortLength: 4
            },
            $(go.Shape, { strokeWidth: 1.5, stroke: '#00FFFF' }),
            $(go.Shape, {
                toArrow: 'Standard',
                stroke: '#00FFFF',
                fill: '#00FFFF'
            }),
            $(
                go.TextBlock, // the "from" label
                {
                    textAlign: 'center',
                    font: 'bold 12px sans-serif',
                    stroke: 'gray',
                    segmentIndex: 0,
                    segmentOffset: new go.Point(NaN, NaN),
                    segmentOrientation: go.Link.OrientUpright
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
                    segmentOrientation: go.Link.OrientUpright
                },
                new go.Binding('text', 'toText')
            )
        )

        // Initialize the model data
        diagram.model = new go.GraphLinksModel(models, relations)

        // Persist drag positions back to the caller. SelectionMoved fires once
        // at the end of a drag (mouse up); the binding above keeps node.data.loc
        // in sync, so we just forward the new value.
        if (onNodeMoved) {
            diagram.addDiagramListener('SelectionMoved', () => {
                diagram.selection.each((part) => {
                    if (part instanceof go.Node && part.data?.key) {
                        onNodeMoved(String(part.data.key), String(part.data.loc ?? ''))
                    }
                })
            })
        }

        onDiagramReady?.(diagram)

        return () => {
            diagram.div = null
        }
    }, [models, relations, onNodeMoved, onNodeClicked, onDiagramReady])

    return <div ref={diagramRef} style={{ height: height ?? '100vh' }} />
}
