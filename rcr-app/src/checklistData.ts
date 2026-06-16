export interface ChecklistItemDef {
  id: string;
  category: string;
  label: string;
  type?: 'percent' | 'barg' | 'checkbox' | 'wps' | 'pwht' | 'coating' | 'insulation' | 'none';
  defaultQc?: string;
  defaultInspector?: string;
  bindTo?: string;
}

export const CHECKLIST_ITEMS: ChecklistItemDef[] = [
  // 1 DOCUMENT AND MATERIAL VERIFICATION
  { id: '1_1', category: '1 DOCUMENT AND MATERIAL VERIFICATION', label: 'Material acc. Piping class', defaultQc: 'H', defaultInspector: 'R' },
  { id: '1_2', category: '1 DOCUMENT AND MATERIAL VERIFICATION', label: 'Material Certificates (Not require for normal carbon steel)' },
  { id: '1_3', category: '1 DOCUMENT AND MATERIAL VERIFICATION', label: 'WPS & PQR', defaultQc: 'H', defaultInspector: 'R', type: 'wps' },
  { id: '1_4', category: '1 DOCUMENT AND MATERIAL VERIFICATION', label: 'WPQ', defaultQc: 'H', defaultInspector: 'R' },
  { id: '1_4_1', category: '1 DOCUMENT AND MATERIAL VERIFICATION', label: 'Filler Metal', defaultQc: 'H', defaultInspector: 'R' },
  { id: '1_5', category: '1 DOCUMENT AND MATERIAL VERIFICATION', label: 'Heat treatment procedure' },
  
  // 2 BEFORE WELDING
  { id: '2_1', category: '2 BEFORE WELDING', label: 'PMI of base material and consumable', type: 'percent' },
  { id: '2_2', category: '2 BEFORE WELDING', label: 'MPI/DPI of weld bevels', type: 'percent' },
  { id: '2_3', category: '2 BEFORE WELDING', label: 'Fit-up condition and material confirmation (stamp and thickness)', defaultQc: 'H', defaultInspector: 'R' },
  
  // 3 WELDING
  { id: '3_1', category: '3 WELDING', label: 'Preheat and interpass temperature control' },
  { id: '3_2', category: '3 WELDING', label: 'Visual check of root pass', type: 'percent' },
  { id: '3_3', category: '3 WELDING', label: 'MPI/DPI of root pass', type: 'percent' },
  { id: '3_4', category: '3 WELDING', label: 'Visual check of completed weld before released for PWHT' },
  
  // 4 AFTER WELDING
  { id: '4_1', category: '4 AFTER WELDING', label: 'PMI of deposit weld', type: 'percent', bindTo: 'pmiVal' },
  { id: '4_2', category: '4 AFTER WELDING', label: 'Ferrite content' },
  { id: '4_3', category: '4 AFTER WELDING', label: 'MPI/DPI of complete weld', type: 'percent', bindTo: 'mpiVal' },
  { id: '4_4', category: '4 AFTER WELDING', label: 'Radiography ***', type: 'percent', defaultQc: 'H', defaultInspector: 'R', bindTo: 'rtVal' },
  { id: '4_5', category: '4 AFTER WELDING', label: 'Hardness testing', type: 'percent', bindTo: 'htVal' },
  { id: '4_6', category: '4 AFTER WELDING', label: 'Heat treatment (diagrams) review****', type: 'pwht' },
  { id: '4_7', category: '4 AFTER WELDING', label: 'Traceability record (History sheet) verification', defaultQc: 'H', defaultInspector: 'R' },
  
  // 5 PRESSURE TEST
  { id: '5_1', category: '5 PRESSURE TEST', label: 'Punch list before pressure test was cleared', defaultQc: 'H', defaultInspector: 'R' },
  { id: '5_2', category: '5 PRESSURE TEST', label: 'Hydrotest Pressure <= 1.5 times of design pressure', type: 'barg', defaultQc: 'H', defaultInspector: 'W', bindTo: 'pressureTestOverride' },
  { id: '5_3', category: '5 PRESSURE TEST', label: 'Hydro test witness is delegated to authorised person' },
  { id: '5_4', category: '5 PRESSURE TEST', label: 'Service Test', defaultQc: 'H' },
  
  // 6 FINAL COMPLETION
  { id: '6_1', category: '6 FINAL COMPLETION', label: 'Baseline UT', type: 'percent', bindTo: 'utVal' },
  { id: '6_2', category: '6 FINAL COMPLETION', label: 'Painting', defaultQc: 'H', defaultInspector: 'R', type: 'coating' },
  { id: '6_3', category: '6 FINAL COMPLETION', label: 'Insulation', type: 'insulation' },
  { id: '6_4', category: '6 FINAL COMPLETION', label: 'Punch list after pressure test was cleared' },
  { id: '6_5', category: '6 FINAL COMPLETION', label: 'Document completion', defaultQc: 'H', defaultInspector: 'R' }
];

export interface ChecklistItemState {
  qc: string;
  inspector: string;
  yes: boolean;
  na: boolean;
  value?: string;
  labelOverride?: string;
  remark?: string;
}

export const getInitialChecklistState = (): Record<string, ChecklistItemState> => {
  const state: Record<string, ChecklistItemState> = {};
  CHECKLIST_ITEMS.forEach(item => {
    state[item.id] = {
      qc: item.defaultQc || '',
      inspector: item.defaultInspector || '',
      yes: false,
      na: false,
      value: '',
      labelOverride: ''
    };
  });
  return state;
};
