import React, { useEffect, useState } from 'react';

import { IGRPBpmnModeler } from '@igrp/framework-process-studio-bpmn-editor';

const newDiagram = (
    processKey: string,
    processName: string
) => `?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:activiti="http://activiti.org/bpmn" id="sample-diagram" targetNamespace="http://activiti.org/bpmn" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd">
  <bpmn2:process id="${processKey}" name="${processName}" isExecutable="false">
    <bpmn2:startEvent id="StartEvent_1"/>
  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${processKey}">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds height="36.0" width="36.0" x="412.0" y="240.0"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`;

interface BPMNDiagramViewerProps {
    bpmnContent: string;
}

export const BPMNDiagramViewer: React.FC<BPMNDiagramViewerProps> = ({
    bpmnContent,
}) => {
    const [currentXml, setCurrentXml] = useState('');

    useEffect(() => {
        if (bpmnContent) {
            setCurrentXml(bpmnContent);
        } else {
            setCurrentXml(newDiagram('test-process', 'Test Process'));
        }
    }, [bpmnContent]);

    const handleXmlChange = (xml: string) => {
        setCurrentXml(xml);
        console.log('BPMN XML changed, new length:', xml.length);
    };

    const handleModelerLoad = (modeler: any) => {
        console.log('BPMN Modeler loaded successfully');
        console.log('Modeler instance:', typeof modeler);
    };

    return (
        <IGRPBpmnModeler
            xml={currentXml}
            processKey="test-process"
            processName="Test Process"
            onChange={handleXmlChange}
            onLoad={handleModelerLoad}
            className="h-[78vh]"
        />
    );
};

export default BPMNDiagramViewer;
