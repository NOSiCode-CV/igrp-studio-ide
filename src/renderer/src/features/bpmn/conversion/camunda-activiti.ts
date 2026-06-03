/**
 * BPMN XML conversion between Camunda and Activiti dialects.
 *
 * Ported from `process/studio/frontend/igrp-process-studio-ui/src/app/(myapp)/functions/utils.ts`.
 * Behaviour kept identical so the two products stay in sync until a shared
 * package is published. The modeler consumes Camunda XML; the Process API
 * stores Activiti XML — convert at the boundary on every load/save.
 */

export function convertCamundaToActiviti(xml: string): string {
    if (!xml || typeof xml !== 'string') {
        return xml
    }

    let convertedXml = xml

    const hasActivitiNamespace = convertedXml.includes('xmlns:activiti=')

    if (!hasActivitiNamespace) {
        convertedXml = convertedXml.replace(
            /xmlns:camunda="http:\/\/camunda\.org\/schema\/1\.0\/bpmn"/g,
            'xmlns:activiti="http://activiti.org/bpmn"'
        )
    } else {
        convertedXml = convertedXml.replace(
            /xmlns:camunda="http:\/\/camunda\.org\/schema\/1\.0\/bpmn"/g,
            ''
        )
    }

    convertedXml = convertedXml.replace(/(\s+activiti:delegateExpression="[^"]*")/g, '')
    convertedXml = convertedXml.replace(/(\s+activiti:expression="[^"]*")/g, '')
    convertedXml = convertedXml.replace(/(\s+activiti:resultVariable="[^"]*")/g, '')

    convertedXml = convertedXml.replace(/camunda:/g, 'activiti:')

    convertedXml = convertedXml.replace(/<camunda:([^>]+)>/g, '<activiti:$1>')
    convertedXml = convertedXml.replace(/<\/camunda:([^>]+)>/g, '</activiti:$1>')

    return convertedXml
}

export function convertActivitiToCamunda(xml: string): string {
    if (!xml || typeof xml !== 'string') {
        return xml
    }

    let convertedXml = xml

    const hasCamundaNamespace = convertedXml.includes('xmlns:camunda=')

    if (!hasCamundaNamespace) {
        convertedXml = convertedXml.replace(
            /xmlns:activiti="http:\/\/activiti\.org\/bpmn"/g,
            'xmlns:camunda="http://camunda.org/schema/1.0/bpmn"'
        )
    } else {
        convertedXml = convertedXml.replace(/xmlns:activiti="http:\/\/activiti\.org\/bpmn"/g, '')
    }

    convertedXml = convertedXml.replace(/(\s+camunda:delegateExpression="[^"]*")/g, '')
    convertedXml = convertedXml.replace(/(\s+camunda:expression="[^"]*")/g, '')
    convertedXml = convertedXml.replace(/(\s+camunda:resultVariable="[^"]*")/g, '')

    convertedXml = convertedXml.replace(/activiti:/g, 'camunda:')

    convertedXml = convertedXml.replace(/<activiti:([^>]+)>/g, '<camunda:$1>')
    convertedXml = convertedXml.replace(/<\/activiti:([^>]+)>/g, '</camunda:$1>')

    return convertedXml
}

export type BpmnEngine = 'camunda' | 'activiti' | 'unknown'

export function detectBpmnEngine(xml: string): BpmnEngine {
    if (!xml || typeof xml !== 'string') {
        return 'unknown'
    }
    if (xml.includes('xmlns:camunda=')) return 'camunda'
    if (xml.includes('xmlns:activiti=')) return 'activiti'
    return 'unknown'
}

export function convertBpmnEngine(xml: string, targetEngine: 'camunda' | 'activiti'): string {
    const currentEngine = detectBpmnEngine(xml)
    if (currentEngine === targetEngine) {
        return xml
    }
    if (targetEngine === 'activiti') {
        return convertCamundaToActiviti(xml)
    }
    return convertActivitiToCamunda(xml)
}
