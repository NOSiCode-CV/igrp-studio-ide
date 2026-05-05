import {
    convertActivitiToCamunda,
    convertBpmnEngine,
    convertCamundaToActiviti,
    detectBpmnEngine
} from './camunda-activiti'

const camundaUserTaskWithFormKey = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:camunda="http://camunda.org/schema/1.0/bpmn" id="Definitions_1">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" />
    <bpmn:userTask id="UserTask_1" name="Approve" camunda:formKey="approve-form" camunda:assignee="\${initiator}">
      <bpmn:extensionElements>
        <camunda:formData>
          <camunda:formField id="amount" label="Amount" type="long" />
        </camunda:formData>
      </bpmn:extensionElements>
    </bpmn:userTask>
    <bpmn:exclusiveGateway id="Gateway_1" />
    <bpmn:serviceTask id="ServiceTask_1" name="Notify" camunda:delegateExpression="\${notifierBean}" camunda:resultVariable="notifyResult" />
    <bpmn:endEvent id="EndEvent_1" />
  </bpmn:process>
</bpmn:definitions>`

const activitiUserTaskWithFormKey = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:activiti="http://activiti.org/bpmn" id="Definitions_1">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" />
    <bpmn:userTask id="UserTask_1" name="Approve" activiti:formKey="approve-form" activiti:assignee="\${initiator}">
      <bpmn:extensionElements>
        <activiti:formData>
          <activiti:formField id="amount" label="Amount" type="long" />
        </activiti:formData>
      </bpmn:extensionElements>
    </bpmn:userTask>
    <bpmn:exclusiveGateway id="Gateway_1" />
    <bpmn:serviceTask id="ServiceTask_1" name="Notify" activiti:delegateExpression="\${notifierBean}" activiti:resultVariable="notifyResult" />
    <bpmn:endEvent id="EndEvent_1" />
  </bpmn:process>
</bpmn:definitions>`

describe('detectBpmnEngine', () => {
    test('detects camunda namespace', () => {
        expect(detectBpmnEngine(camundaUserTaskWithFormKey)).toBe('camunda')
    })

    test('detects activiti namespace', () => {
        expect(detectBpmnEngine(activitiUserTaskWithFormKey)).toBe('activiti')
    })

    test('returns unknown for empty / non-string', () => {
        expect(detectBpmnEngine('')).toBe('unknown')
        expect(detectBpmnEngine(null as unknown as string)).toBe('unknown')
        expect(detectBpmnEngine('<bpmn:definitions />')).toBe('unknown')
    })
})

describe('convertCamundaToActiviti / convertActivitiToCamunda — direct conversion', () => {
    test('camunda → activiti rewrites namespace, attributes and elements', () => {
        const out = convertCamundaToActiviti(camundaUserTaskWithFormKey)
        expect(out).toContain('xmlns:activiti="http://activiti.org/bpmn"')
        expect(out).not.toContain('xmlns:camunda=')
        expect(out).toContain('activiti:formKey="approve-form"')
        expect(out).toContain('<activiti:formData>')
        expect(out).toContain('</activiti:formData>')
        expect(out).not.toContain('camunda:')
    })

    test('activiti → camunda rewrites namespace, attributes and elements', () => {
        const out = convertActivitiToCamunda(activitiUserTaskWithFormKey)
        expect(out).toContain('xmlns:camunda="http://camunda.org/schema/1.0/bpmn"')
        expect(out).not.toContain('xmlns:activiti=')
        expect(out).toContain('camunda:formKey="approve-form"')
        expect(out).toContain('<camunda:formData>')
        expect(out).toContain('</camunda:formData>')
        expect(out).not.toContain('activiti:')
    })
})

describe('round-trip determinism', () => {
    test('camunda → activiti → camunda is stable', () => {
        const once = convertCamundaToActiviti(camundaUserTaskWithFormKey)
        const back = convertActivitiToCamunda(once)
        expect(back).toBe(camundaUserTaskWithFormKey)
    })

    test('activiti → camunda → activiti is stable', () => {
        const once = convertActivitiToCamunda(activitiUserTaskWithFormKey)
        const back = convertCamundaToActiviti(once)
        expect(back).toBe(activitiUserTaskWithFormKey)
    })

    // Documents a known lossy behaviour ported from the online utils: running
    // the conversion twice strips `activiti:delegateExpression`, `:expression`
    // and `:resultVariable` because those regexes target the **target**
    // dialect's attributes (intended to dedupe pre-existing target attrs on a
    // mixed input). Conversion must be applied **once at the boundary**.
    test('double-converting to the same target drops delegate/expression/result attrs', () => {
        const once = convertCamundaToActiviti(camundaUserTaskWithFormKey)
        const twice = convertCamundaToActiviti(once)
        expect(once).toContain('activiti:delegateExpression="${notifierBean}"')
        expect(once).toContain('activiti:resultVariable="notifyResult"')
        expect(twice).not.toContain('activiti:delegateExpression=')
        expect(twice).not.toContain('activiti:resultVariable=')
    })
})

describe('convertBpmnEngine dispatch', () => {
    test('returns the input unchanged when already in target dialect', () => {
        expect(convertBpmnEngine(camundaUserTaskWithFormKey, 'camunda')).toBe(
            camundaUserTaskWithFormKey
        )
        expect(convertBpmnEngine(activitiUserTaskWithFormKey, 'activiti')).toBe(
            activitiUserTaskWithFormKey
        )
    })

    test('converts when dialect differs from target', () => {
        expect(convertBpmnEngine(camundaUserTaskWithFormKey, 'activiti')).toBe(
            convertCamundaToActiviti(camundaUserTaskWithFormKey)
        )
        expect(convertBpmnEngine(activitiUserTaskWithFormKey, 'camunda')).toBe(
            convertActivitiToCamunda(activitiUserTaskWithFormKey)
        )
    })
})

describe('edge cases', () => {
    test('empty / non-string inputs are returned unchanged', () => {
        expect(convertCamundaToActiviti('')).toBe('')
        expect(convertActivitiToCamunda('')).toBe('')
        expect(convertCamundaToActiviti(null as unknown as string)).toBe(null)
    })

    test('xml with no relevant namespace is left untouched', () => {
        const plain = '<bpmn:definitions xmlns:bpmn="..."><bpmn:process id="p"/></bpmn:definitions>'
        expect(convertCamundaToActiviti(plain)).toBe(plain)
        expect(convertActivitiToCamunda(plain)).toBe(plain)
    })
})
