namespace backend.Utils;

public static class BpmnUtils
{
    public static string GenerateDefaultBpmnXml(string workflowName)
    {
        return $@"<?xml version=""1.0"" encoding=""UTF-8""?>
<bpmn:definitions xmlns:bpmn=""http://www.omg.org/spec/BPMN/20100524/MODEL"" 
                  xmlns:bpmndi=""http://www.omg.org/spec/BPMN/20100524/DI"" 
                  xmlns:dc=""http://www.omg.org/spec/DD/20100524/DC"" 
                  xmlns:di=""http://www.omg.org/spec/DD/20100524/DI""
                  id=""Definitions_1"" 
                  targetNamespace=""http://bpmn.io/schema/bpmn"">
  <bpmn:process id=""Process_1"" isExecutable=""true"">
    <bpmn:startEvent id=""StartEvent_1"" name=""Start"" />
    <bpmn:task id=""Task_1"" name=""Todo"" />
    <bpmn:task id=""Task_2"" name=""In Progress"" />
    <bpmn:task id=""Task_3"" name=""Review"" />
    <bpmn:endEvent id=""EndEvent_1"" name=""Done"" />
    <bpmn:sequenceFlow id=""Flow_1"" sourceRef=""StartEvent_1"" targetRef=""Task_1"" />
    <bpmn:sequenceFlow id=""Flow_2"" sourceRef=""Task_1"" targetRef=""Task_2"" />
    <bpmn:sequenceFlow id=""Flow_3"" sourceRef=""Task_2"" targetRef=""Task_3"" />
    <bpmn:sequenceFlow id=""Flow_4"" sourceRef=""Task_3"" targetRef=""EndEvent_1"" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id=""BPMNDiagram_1"">
    <bpmndi:BPMNPlane id=""BPMNPlane_1"" bpmnElement=""Process_1"">
      <bpmndi:BPMNShape id=""StartEvent_1_di"" bpmnElement=""StartEvent_1"">
        <dc:Bounds x=""152"" y=""102"" width=""36"" height=""36"" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id=""Task_1_di"" bpmnElement=""Task_1"">
        <dc:Bounds x=""240"" y=""80"" width=""100"" height=""80"" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id=""Task_2_di"" bpmnElement=""Task_2"">
        <dc:Bounds x=""390"" y=""80"" width=""100"" height=""80"" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id=""Task_3_di"" bpmnElement=""Task_3"">
        <dc:Bounds x=""540"" y=""80"" width=""100"" height=""80"" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id=""EndEvent_1_di"" bpmnElement=""EndEvent_1"">
        <dc:Bounds x=""692"" y=""102"" width=""36"" height=""36"" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>";
    }
}
