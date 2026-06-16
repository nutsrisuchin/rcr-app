import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import data from '../data.json';
import wpsFiles from '../wps_files.json';
import api from '../api';
import { CHECKLIST_ITEMS, getInitialChecklistState, type ChecklistItemState } from '../checklistData';
import pttgcLogo from '../assets/PTTGC_Logo.png';

// Type definitions
interface ProcessDetail {
  ar2LineClass: string;
  pipeMaterial: string;
  pipeMaterialAlt?: string;
  pNo?: string;
  rt?: string;
  ut?: string;
  mpi?: string;
  dpi?: string;
  ht?: string;
  pmi?: string;
  pwht?: string;
  rating?: string;
}

interface MappingItem {
  rcrNo: string;
  ar2Class: string;
  pressureDesign?: string;
  pressureTest?: string;
  services?: string;
  defaultMaterial?: string;
  defaultPno?: string;
}

interface RcrData {
  plants: string[];
  rcrMapping: Record<string, MappingItem>;
  rcrStandards: Record<string, Record<string, ProcessDetail>>;
  materialToPno: Record<string, string>;
}

const typedData = data as RcrData;

const RcrForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const [topic, setTopic] = useState<string>('');
  const [selectedPlant, setSelectedPlant] = useState<string>('');
  const [unit, setUnit] = useState<string>('');
  const [selectedPipingClass, setSelectedPipingClass] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [pNo, setPNo] = useState<string>('');
  const [lineNo, setLineNo] = useState<string>('');
  const [drawingNo, setDrawingNo] = useState<string>('');

  // Custom Overrides / Form state
  const [thickness, setThickness] = useState<string>('');
  const [ratingOverride, setRatingOverride] = useState<string>('');
  const [production, setProduction] = useState<string>('');
  const [servicesOverride, setServicesOverride] = useState<string>('');

  // PWHT Warning Logic
  const getPwhtWarning = () => {
    if (!pNo || !thickness) return null;
    const t = parseFloat(thickness);
    if (isNaN(t)) return null;
    
    // Normalize string (e.g. "P-No. 1" -> "1")
    const p = pNo.toUpperCase().replace(/P-?NO\.?\s*/g, '').trim();
    
    if (p.includes('5B') || p.includes('P91') || p === '91') {
      return "Post weld heat treatment is required";
    } else if ((p === '1' || p.startsWith('1 ')) && t > 19) {
      return "Post weld heat treatment is required (at 595–650°C, 1 hour per 25 mm minimum)";
    } else if ((p === '4' || p.startsWith('4 ')) && t > 13) {
      return "Post weld heat treatment is required";
    } else if ((p === '5A' || p.startsWith('5A ')) && t > 13) {
      return "Post weld heat treatment is required";
    }
    return null;
  };
  const pwhtWarning = getPwhtWarning();
  const [tempOverride, setTempOverride] = useState<string>('');
  const [pressureDesignOverride, setPressureDesignOverride] = useState<string>('');
  const [pressureTestOverride, setPressureTestOverride] = useState<string>('');

  // NDT Overrides
  const [rtVal, setRtVal] = useState<string>('');
  const [utVal, setUtVal] = useState<string>('');
  const [mpiVal, setMpiVal] = useState<string>('');
  const [dpiVal, setDpiVal] = useState<string>('');
  const [htVal, setHtVal] = useState<string>('');
  const [pmiVal, setPmiVal] = useState<string>('');

  const [pwhtRadio, setPwhtRadio] = useState<string>('NO');
  const [pwhtComment, setPwhtComment] = useState<string>('');

  const [selectedWps, setSelectedWps] = useState<string>('');

  // Paint Code New States
  const [insulation, setInsulation] = useState<string>('NO');
  const [coatingMethod, setCoatingMethod] = useState<string>('Power Tool');
  const [paintCode, setPaintCode] = useState<string>('');

  const [inspectionEngineer, setInspectionEngineer] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Checklist State
  const [checklist, setChecklist] = useState<Record<string, ChecklistItemState>>(getInitialChecklistState());

  // Approval state
  const [approverName, setApproverName] = useState<string>('');
  const [approvedDate, setApprovedDate] = useState<string>('');

  // If edit mode, load data
  useEffect(() => {
    if (id) {
      api.get(`/requests/${id}`).then(res => {
        const req = res.data;
        setTopic(req.topic || '');
        setSelectedPlant(req.plant || '');
        setUnit(req.unit || '');
        setSelectedPipingClass(req.piping_class || '');
        setLineNo(req.line_no || '');
        setDrawingNo(req.drawing_no || '');
        setSelectedMaterial(req.material || '');
        setPNo(req.p_no || '');
        setThickness(req.thickness || '');
        setRatingOverride(req.rating || '');
        setProduction(req.production || '');
        setServicesOverride(req.services || '');
        setRtVal(req.nde_rt || '');
        setUtVal(req.nde_ut || '');
        setMpiVal(req.nde_mpi || '');
        setDpiVal(req.nde_dpi || '');
        setHtVal(req.nde_ht || '');
        setPmiVal(req.nde_pmi || '');
        setPwhtRadio(req.pwht || 'NO');
        setPwhtComment(req.pwht_comment || '');
        setTempOverride(req.design_temp || '');
        setPressureDesignOverride(req.design_pressure || '');
        setPressureTestOverride(req.test_pressure || '');
        setInsulation(req.insulation || 'NO');
        setCoatingMethod(req.coating_method || 'Power Tool');
        setPaintCode(req.paint_code || '');
        setSelectedWps(req.wps_document || '');
        setInspectionEngineer(req.inspection_engineer || '');
        if (req.checklist_data) {
          try {
            setChecklist(JSON.parse(req.checklist_data));
          } catch (e) {
            console.error('Failed to parse checklist', e);
          }
        }
        setApproverName(req.approver_name || '');
        setApprovedDate(req.approved_date || '');
        if (req.date) setDate(req.date);

        if (searchParams.get('print') === 'true') {
          setTimeout(() => {
              document.querySelectorAll('textarea:not(.fixed-rows)').forEach(ta => {
                const textarea = ta as HTMLTextAreaElement;
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
              });
              window.print();
            }, 500);
        }
      }).catch(err => console.error(err));
    }
  }, [id, searchParams]);

  // Extract unique piping classes for dropdown
  const pipingClasses = useMemo(() => {
    return Object.keys(typedData.rcrMapping).sort();
  }, []);

  const mappingItem = selectedPlant === 'GC6' && selectedPipingClass
    ? typedData.rcrMapping[selectedPipingClass]
    : null;

  const currentProcess = mappingItem && typedData.rcrStandards[mappingItem.rcrNo]
    ? typedData.rcrStandards[mappingItem.rcrNo][mappingItem.ar2Class]
    : null;

  // Get all unique material options
  const materialOptions = useMemo(() => {
    if (!currentProcess) return [];
    const opts = new Set<string>();
    if (mappingItem?.defaultMaterial) opts.add(mappingItem.defaultMaterial);
    if (currentProcess.pipeMaterial) opts.add(currentProcess.pipeMaterial);
    if (currentProcess.pipeMaterialAlt) opts.add(currentProcess.pipeMaterialAlt);
    return Array.from(opts);
  }, [currentProcess, mappingItem]);

  // Update selected material when process changes (only if NOT in edit mode, or if material is empty)
  useEffect(() => {
    if (currentProcess && mappingItem && !id) {
      const initialMat = mappingItem.defaultMaterial || currentProcess.pipeMaterial || '';
      setSelectedMaterial(initialMat);

      const initialPno = (mappingItem.defaultPno && initialMat === mappingItem.defaultMaterial)
        ? mappingItem.defaultPno
        : (typedData.materialToPno[initialMat] || currentProcess.pNo || '');
      setPNo(initialPno);

      // Pre-fill fields
      setRtVal(currentProcess.rt || '');
      setUtVal(currentProcess.ut || '');
      setMpiVal(currentProcess.mpi || '');
      setDpiVal(currentProcess.dpi || '');
      setHtVal(currentProcess.ht || '');
      setPmiVal(currentProcess.pmi || '');

      if (currentProcess.pwht === 'YES') {
        setPwhtRadio('YES');
        setPwhtComment('');
      } else {
        setPwhtRadio('NO');
        setPwhtComment(currentProcess.pwht || '');
      }

      setRatingOverride(getRating());
      setServicesOverride(mappingItem.services || '');
      setPressureDesignOverride(formatPressure(mappingItem.pressureDesign) || '');
      
      if (String(mappingItem.rcrNo) === '1') {
        setPressureTestOverride('');
        setChecklist(prev => {
          if (!prev['5_4']) return prev;
          return {
            ...prev,
            '5_4': { ...prev['5_4'], value: 'YES', remark: '' }
          };
        });
      } else {
        setPressureTestOverride(formatPressure(mappingItem.pressureTest) || '');
        setChecklist(prev => {
          if (!prev['5_4']) return prev;
          return {
            ...prev,
            '5_4': { ...prev['5_4'], value: '' } // Clear YES when switching away from RCR-STD-01
          };
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProcess, mappingItem, id]);

  // Effect to calculate paint code
  useEffect(() => {
    const isStainless = selectedMaterial.includes('316') || selectedMaterial.includes('304') || selectedMaterial.includes('321') || selectedMaterial.includes('347') || selectedMaterial.toLowerCase().includes('stainless');

    let prefix = 'CB';
    if (isStainless) {
      prefix = coatingMethod === 'Blasting' ? 'SB' : 'SP';
    } else {
      prefix = coatingMethod === 'Blasting' ? 'CB' : 'CP';
    }

    const temp = parseFloat(tempOverride);
    let suffix = '';

    if (!isNaN(temp)) {
      if (insulation === 'YES') {
        if (temp >= -196 && temp <= -46) suffix = '2';
        else if (temp > -46 && temp <= 200) suffix = '3';
        else if (temp > 200 && temp <= 400) suffix = '7';
        else if (temp > 400 && temp <= 650) suffix = '9';
      } else {
        if (temp >= -196 && temp <= -1) suffix = '1';
        else if (temp >= 0 && temp <= 120) suffix = '4';
        else if (temp > 120 && temp <= 200) suffix = '5';
        else if (temp > 200 && temp <= 400) suffix = '6';
        else if (temp > 400 && temp <= 650) suffix = '9';
      }
    }

    if (suffix) {
      setPaintCode(`${prefix}-${suffix}`);
    } else {
      setPaintCode('');
    }
  }, [selectedMaterial, coatingMethod, insulation, tempOverride]);

  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mat = e.target.value;
    setSelectedMaterial(mat);
    if (typedData.materialToPno && typedData.materialToPno[mat]) {
      setPNo(typedData.materialToPno[mat]);
    }
  };

  // Format pressures to 2 decimal places
  const formatPressure = (val?: string) => {
    if (!val) return '';
    const num = parseFloat(val);
    if (!isNaN(num)) return num.toFixed(2);
    return val;
  };

  // Calculate rating based on piping class
  const getRating = () => {
    if (!selectedPipingClass) return currentProcess?.rating || '';
    if (/^15\d+/.test(selectedPipingClass)) return '1500';
    if (/^9\d+/.test(selectedPipingClass)) return '900';
    if (/^6\d+/.test(selectedPipingClass)) return '600';
    if (/^3\d+/.test(selectedPipingClass)) return '300';
    if (/^1\d+/.test(selectedPipingClass)) return '150';
    return currentProcess?.rating || '';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = async () => {
    if (!selectedPlant || !selectedPipingClass) {
      alert("Please select a plant and piping class.");
      return;
    }

    const payload = {
      topic: topic,
      plant: selectedPlant,
      unit: unit,
      line_no: lineNo,
      piping_class: selectedPipingClass,
      rcr_standard: mappingItem ? `RCR-STD-${String(mappingItem.rcrNo).padStart(2, '0')}` : '',
      drawing_no: drawingNo,
      material: selectedMaterial,
      p_no: pNo,
      thickness: thickness,
      rating: ratingOverride,
      production: production,
      services: servicesOverride,
      nde_rt: rtVal,
      nde_ut: utVal,
      nde_mpi: mpiVal,
      nde_dpi: dpiVal,
      nde_ht: htVal,
      nde_pmi: pmiVal,
      pwht: pwhtRadio,
      pwht_comment: pwhtComment,
      design_temp: tempOverride,
      design_pressure: pressureDesignOverride,
      test_pressure: pressureTestOverride,
      insulation: insulation,
      coating_method: coatingMethod,
      paint_code: paintCode,
      wps_document: selectedWps,
      repair_method: '',
      inspection_engineer: inspectionEngineer,
      date: date,
      checklist_data: JSON.stringify(checklist)
    };

    try {
      if (id) {
        await api.put(`/requests/${id}`, payload);
        alert('Request updated successfully!');
      } else {
        await api.post('/requests', payload);
        alert('Request saved successfully!');
        navigate('/forms');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving request');
    }
  };

  return (
    <>
      <div className="controls-grid hide-on-print">
        <div className="form-group glass" style={{ padding: '1.5rem' }}>
          <label htmlFor="plant-select">Select Plant</label>
          <select
            id="plant-select"
            className="form-select"
            value={selectedPlant}
            onChange={(e) => setSelectedPlant(e.target.value)}
          >
            <option value="">-- Choose a Plant --</option>
            {typedData.plants.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="form-group glass" style={{ padding: '1.5rem' }}>
          <label htmlFor="piping-class-select">Select Piping Class</label>
          <select
            id="piping-class-select"
            className="form-select"
            value={selectedPipingClass}
            onChange={(e) => setSelectedPipingClass(e.target.value)}
            disabled={selectedPlant !== 'GC6'}
          >
            <option value="">-- Choose Piping Class --</option>
            {pipingClasses.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="results-container">
        {selectedPlant === 'GC4' && (
          <div className="empty-state glass hide-on-print">
            <h3>No Data Available</h3>
            <p>Data for Plant GC4 has not been populated yet.</p>
          </div>
        )}

        {selectedPlant === 'GC6' && !selectedPipingClass && (
          <div className="empty-state glass hide-on-print">
            <h3>Awaiting Selection</h3>
            <p>Please select a Piping Class to view the RCR fill-in form.</p>
          </div>
        )}

        {selectedPlant === 'GC6' && selectedPipingClass && currentProcess && mappingItem && (
          <div className="result-details">
            <div className="rcr-form-container">
              <div className="rcr-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: '30px', marginBottom: '4px' }}>
                <img src={pttgcLogo} alt="PTTGC Logo" style={{ position: 'absolute', left: 0, height: '25px', objectFit: 'contain' }} />
                <span>Requirements for Construction, Repair and Plant Changes (RCR)</span>
              </div>

              <div className="rcr-grid">
                <div className="rcr-field" style={{ gridColumn: '1 / -1' }}>
                  <label>Topic of Repair</label>
                  <textarea className="rcr-input fixed-rows" value={topic} onChange={e => setTopic(e.target.value)}
                  placeholder="Fill in Topic of Repair" style={{ width: '100%', resize: 'none' }} rows={4} />
                </div>
                <div className="rcr-field">
                  <label>Plant</label>
                  <input type="text" className="rcr-input" value={selectedPlant} readOnly />
                </div>
                <div className="rcr-field">
                  <label>Unit</label>
                  <input type="text" className="rcr-input" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Fill in Unit" />
                </div>
                <div className="rcr-field">
                  <label>Selected Piping Class</label>
                  <input type="text" className="rcr-input" value={selectedPipingClass} readOnly />
                </div>
                <div className="rcr-field">
                  <label>RCR Standard No.</label>
                  <input type="text" className="rcr-input" value={`RCR-STD-${String(mappingItem.rcrNo).padStart(2, '0')}`} readOnly />
                </div>
                <div className="rcr-field">
                  <label>Line No. / Equipment No.</label>
                  <input type="text" className="rcr-input" value={lineNo} onChange={e => setLineNo(e.target.value)} placeholder="Fill in Line No." />
                </div>
                <div className="rcr-field">
                  <label>Drawing No.</label>
                  <input type="text" className="rcr-input" value={drawingNo} onChange={e => setDrawingNo(e.target.value)} placeholder="Fill in Drawing No." />
                </div>
              </div>

              <table className="rcr-table">
                <tbody>
                  <tr>
                    <th style={{ width: '20%' }}>Pipe Material</th>
                    <td style={{ width: '30%' }}>
                      <select
                        className="rcr-select-light"
                        value={selectedMaterial}
                        onChange={handleMaterialChange}
                      >
                        {materialOptions.map(mat => (
                          <option key={mat} value={mat}>{mat}</option>
                        ))}
                        {materialOptions.length === 0 && <option value="">N/A</option>}
                      </select>
                    </td>
                    <th style={{ width: '20%' }}>P-No.</th>
                    <td style={{ width: '30%' }}>
                      <input
                        type="text"
                        className="rcr-input-inline"
                        value={pNo}
                        onChange={(e) => setPNo(e.target.value)}
                        placeholder="Enter P-No. or Comment"
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>Thickness (mm) <span style={{ color: 'red', fontWeight: 'normal', fontSize: '11px' }}>(mandatory)</span></th>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <input type="text" className="rcr-input-inline" value={thickness} onChange={e => setThickness(e.target.value)} placeholder="Enter Thickness (mm)" />
                        {pwhtWarning && (
                          <div className="hide-on-print" style={{ color: 'red', fontSize: '11px', fontWeight: 'bold' }}>
                            ⚠️ {pwhtWarning}
                          </div>
                        )}
                      </div>
                    </td>
                    <th>Rating</th>
                    <td>
                      <input type="text" className="rcr-input-inline" value={ratingOverride} onChange={e => setRatingOverride(e.target.value)} placeholder="Enter Rating or Comment" />
                    </td>
                  </tr>
                  <tr>
                    <th>Product/Fluid</th>
                    <td>
                      <input type="text" className="rcr-input-inline" value={production} onChange={e => setProduction(e.target.value)} placeholder="Enter Production or Comment" />
                    </td>
                    <th>Services</th>
                    <td>
                      <input type="text" className="rcr-input-inline" value={servicesOverride} onChange={e => setServicesOverride(e.target.value)} placeholder="Enter Services or Comment" />
                    </td>
                  </tr>
                  <tr>
                    <th>Design Temp (C) <span style={{ color: 'red', fontWeight: 'normal', fontSize: '11px' }}>(mandatory)</span></th>
                    <td>
                      <input type="text" className="rcr-input-inline" value={tempOverride} onChange={e => setTempOverride(e.target.value)} placeholder="Enter Temp or Comment" />
                    </td>
                    <th>Design Pressure (barg) <span style={{ color: 'red', fontWeight: 'normal', fontSize: '11px' }}>(mandatory)</span></th>
                    <td>
                      <input type="text" className="rcr-input-inline" value={pressureDesignOverride} onChange={e => setPressureDesignOverride(e.target.value)} placeholder="Enter Pressure or Comment" />
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* CHECKLIST TABLE */}
              <div className="checklist-container" style={{ marginTop: '2rem' }}>
                <table className="checklist-table">
                  <thead>
                    <tr>
                      <th style={{ width: '30%' }}>(Checks to be carried out)</th>
                      <th style={{ width: '15%' }}>(Percentage or No. required)</th>
                      <th style={{ width: '7%' }}>QC Contractor</th>
                      <th style={{ width: '7%' }}>Inspector</th>
                      <th style={{ width: '4%' }}>YES</th>
                      <th style={{ width: '4%' }}>N/A</th>
                      <th style={{ width: '33%' }}>Remark/Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['1 DOCUMENT AND MATERIAL VERIFICATION', '2 BEFORE WELDING', '3 WELDING', '4 AFTER WELDING'].map(category => (
                      <React.Fragment key={category}>
                        <tr className="checklist-header">
                          <td colSpan={7}>{category}</td>
                        </tr>
                        {CHECKLIST_ITEMS.filter(item => item.category === category).map(item => (
                          <tr key={item.id}>
                            <td className="checklist-label">
                              {item.label.includes('MPI/DPI') ? (
                                <>
                                  <div className="hide-on-print" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <select
                                      className="rcr-select-light"
                                      value={checklist[item.id]?.labelOverride || 'MPI/DPI'}
                                      onChange={e => setChecklist(prev => ({ ...prev, [item.id]: { ...prev[item.id], labelOverride: e.target.value } }))}
                                      style={{ width: '90px', padding: '2px', fontSize: '12px' }}
                                    >
                                      <option value="MPI/DPI">MPI/DPI</option>
                                      <option value="MPI">MPI</option>
                                      <option value="DPI">DPI</option>
                                    </select>
                                    <span>{item.label.replace('MPI/DPI', '')}</span>
                                  </div>
                                  <span className="show-on-print" style={{ display: 'none' }}>
                                    {checklist[item.id]?.labelOverride || 'MPI/DPI'}{item.label.replace('MPI/DPI', '')}
                                  </span>
                                </>
                              ) : (
                                item.label
                              )}
                            </td>
                            <td>
                              {item.type === 'percent' && item.bindTo === 'pmiVal' && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                  <input type="text" className="rcr-input-inline-small" value={pmiVal} onChange={e => setPmiVal(e.target.value)} /> %
                                </div>
                              )}
                              {item.type === 'percent' && item.bindTo === 'mpiVal' && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                  <input type="text" className="rcr-input-inline-small" value={mpiVal} onChange={e => setMpiVal(e.target.value)} /> %
                                </div>
                              )}
                              {item.type === 'percent' && item.bindTo === 'rtVal' && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                  <input type="text" className="rcr-input-inline-small" value={rtVal} onChange={e => setRtVal(e.target.value)} /> %
                                </div>
                              )}
                              {item.type === 'percent' && item.bindTo === 'htVal' && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                  <input type="text" className="rcr-input-inline-small" value={htVal} onChange={e => setHtVal(e.target.value)} /> %
                                </div>
                              )}
                              {item.type === 'percent' && item.bindTo === 'utVal' && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                  <input type="text" className="rcr-input-inline-small" value={utVal} onChange={e => setUtVal(e.target.value)} /> %
                                </div>
                              )}
                              {item.type === 'percent' && !item.bindTo && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                  <input type="text" className="rcr-input-inline-small"
                                    value={checklist[item.id]?.value || ''}
                                    onChange={e => setChecklist(prev => ({ ...prev, [item.id]: { ...prev[item.id], value: e.target.value } }))}
                                  /> %
                                </div>
                              )}
                              {!item.type && (
                                <textarea className="rcr-input-inline"
                                  value={checklist[item.id]?.value || ''}
                                  onChange={e => setChecklist(prev => ({ ...prev, [item.id]: { ...prev[item.id], value: e.target.value } }))}
                                  onInput={(e) => {
                                    const target = e.currentTarget;
                                    target.style.height = 'auto';
                                    target.style.height = target.scrollHeight + 'px';
                                  }}
                                  placeholder="Comment" style={{ width: '100%', resize: 'vertical', minHeight: '34px', padding: '6px' }} rows={1}
                                />
                              )}
                              {item.type === 'barg' && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                  <input type="text" className="rcr-input-inline-small" value={pressureTestOverride} onChange={e => setPressureTestOverride(e.target.value)} placeholder="barg" />
                                </div>
                              )}
                              {item.type === 'wps' && (
                                <select className="rcr-select-light" value={selectedWps} onChange={e => setSelectedWps(e.target.value)} style={{ width: '150px' }}>
                                  <option value="">-- WPS --</option>
                                  {wpsFiles.map((file, i) => <option key={i} value={file}>{file}</option>)}
                                </select>
                              )}
                              {item.type === 'pwht' && (
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                  <label><input type="radio" checked={pwhtRadio === 'YES'} onChange={() => setPwhtRadio('YES')} /> YES</label>
                                  <label><input type="radio" checked={pwhtRadio === 'NO'} onChange={() => setPwhtRadio('NO')} /> NO</label>
                                  <input type="text" className="rcr-input-inline-small" value={pwhtComment} onChange={e => setPwhtComment(e.target.value)} placeholder="Comment" style={{ width: '80px' }} />
                                </div>
                              )}
                              {item.type === 'coating' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <select className="rcr-select-light" value={coatingMethod} onChange={e => setCoatingMethod(e.target.value)} style={{ width: '120px' }}>
                                    <option value="Power Tool">Power Tool</option>
                                    <option value="Blasting">Blasting</option>
                                  </select>
                                  {paintCode && <span style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '14px' }}>Code: {paintCode}</span>}
                                </div>
                              )}
                              {item.type === 'insulation' && (
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <label><input type="radio" checked={insulation === 'YES'} onChange={() => setInsulation('YES')} /> YES</label>
                                  <label><input type="radio" checked={insulation === 'NO'} onChange={() => setInsulation('NO')} /> NO</label>
                                </div>
                              )}
                            </td>
                            <td>
                              <select className="checklist-select" value={checklist[item.id]?.qc || ''} onChange={e => setChecklist(prev => ({ ...prev, [item.id]: { ...prev[item.id], qc: e.target.value } }))}>
                                <option value=""></option>
                                <option value="H">H</option>
                                <option value="W">W</option>
                                <option value="R">R</option>
                              </select>
                            </td>
                            <td>
                              <select className="checklist-select" value={checklist[item.id]?.inspector || ''} onChange={e => setChecklist(prev => ({ ...prev, [item.id]: { ...prev[item.id], inspector: e.target.value } }))}>
                                <option value=""></option>
                                <option value="H">H</option>
                                <option value="W">W</option>
                                <option value="R">R</option>
                              </select>
                            </td>
                            <td className="center">
                              <input type="checkbox" className="checklist-checkbox" checked={checklist[item.id]?.yes || false} onChange={e => setChecklist(prev => ({ ...prev, [item.id]: { ...prev[item.id], yes: e.target.checked, na: e.target.checked ? false : prev[item.id].na } }))} />
                            </td>
                            <td className="center">
                              <input type="checkbox" className="checklist-checkbox" checked={checklist[item.id]?.na || false} onChange={e => setChecklist(prev => ({ ...prev, [item.id]: { ...prev[item.id], na: e.target.checked, yes: e.target.checked ? false : prev[item.id].yes } }))} />
                            </td>
                            <td>
                              <textarea className="rcr-input-inline" value={checklist[item.id]?.remark || ''} onChange={e => setChecklist(prev => ({ ...prev, [item.id]: { ...prev[item.id], remark: e.target.value } }))}
                              onInput={(e) => {
                                const target = e.currentTarget;
                                target.style.height = 'auto';
                                target.style.height = target.scrollHeight + 'px';
                              }}
                              placeholder="Remark" style={{ width: '100%', resize: 'vertical', minHeight: '34px', padding: '6px' }} rows={1} />
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}

                    <tr className="checklist-signature">
                      <td colSpan={3}><b>PART 4: WELDING ACCEPTANCE</b></td>
                      <td colSpan={2}>QC Contractor<br />PTTGC's Inspector</td>
                      <td colSpan={2}>(Sign here) --&gt;<br />(Sign here) --&gt;</td>
                    </tr>

                    {['5 PRESSURE TEST'].map(category => (
                      <React.Fragment key={category}>
                        <tr className="checklist-header">
                          <td colSpan={7}>{category}</td>
                        </tr>
                        {CHECKLIST_ITEMS.filter(item => item.category === category).map(item => (
                          <tr key={item.id}>
                            <td className="checklist-label">{item.label}</td>
                            <td>
                              {item.type === 'barg' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                    <input type="text" className="rcr-input-inline" value={pressureTestOverride} onChange={e => setPressureTestOverride(e.target.value)} placeholder="barg" style={{ width: '100%' }} />
                                  </div>
                                  <div className="hide-on-print" style={{ fontSize: '11px', color: '#666' }}>
                                    {pressureDesignOverride && !isNaN(parseFloat(pressureDesignOverride)) ? (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>1.5 x Design = <b>{(parseFloat(pressureDesignOverride) * 1.5).toFixed(2)}</b></span>
                                        <button 
                                          type="button" 
                                          style={{ padding: '2px 6px', fontSize: '10px', cursor: 'pointer', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px' }}
                                          onClick={() => setPressureTestOverride((parseFloat(pressureDesignOverride) * 1.5).toFixed(2))}
                                          title="Autofill with 1.5x Design Pressure"
                                        >
                                          Autofill
                                        </button>
                                      </div>
                                    ) : (
                                      <span><em>Enter Design Pressure to see 1.5x calculation</em></span>
                                    )}
                                  </div>
                                </div>
                              )}
                              {!item.type && (
                                <textarea className="rcr-input-inline"
                                  value={checklist[item.id]?.value || ''}
                                  onChange={e => setChecklist(prev => ({ ...prev, [item.id]: { ...prev[item.id], value: e.target.value } }))}
                                  onInput={(e) => {
                                    const target = e.currentTarget;
                                    target.style.height = 'auto';
                                    target.style.height = target.scrollHeight + 'px';
                                  }}
                                  placeholder="Comment" style={{ width: '100%', resize: 'vertical', minHeight: '34px', padding: '6px' }} rows={1}
                                />
                              )}
                            </td>
                            <td>
                              <select className="checklist-select" value={checklist[item.id]?.qc || ''} onChange={e => setChecklist(prev => ({ ...prev, [item.id]: { ...prev[item.id], qc: e.target.value } }))}>
                                <option value=""></option>
                                <option value="H">H</option>
                                <option value="W">W</option>
                                <option value="R">R</option>
                              </select>
                            </td>
                            <td>
                              <select className="checklist-select" value={checklist[item.id]?.inspector || ''} onChange={e => setChecklist(prev => ({ ...prev, [item.id]: { ...prev[item.id], inspector: e.target.value } }))}>
                                <option value=""></option>
                                <option value="H">H</option>
                                <option value="W">W</option>
                                <option value="R">R</option>
                              </select>
                            </td>
                            <td className="center">
                              <input type="checkbox" className="checklist-checkbox" checked={checklist[item.id]?.yes || false} onChange={e => setChecklist(prev => ({ ...prev, [item.id]: { ...prev[item.id], yes: e.target.checked, na: e.target.checked ? false : prev[item.id].na } }))} />
                            </td>
                            <td className="center">
                              <input type="checkbox" className="checklist-checkbox" checked={checklist[item.id]?.na || false} onChange={e => setChecklist(prev => ({ ...prev, [item.id]: { ...prev[item.id], na: e.target.checked, yes: e.target.checked ? false : prev[item.id].yes } }))} />
                            </td>
                            <td>
                              <textarea className="rcr-input-inline" value={checklist[item.id]?.remark || ''} onChange={e => setChecklist(prev => ({ ...prev, [item.id]: { ...prev[item.id], remark: e.target.value } }))}
                              onInput={(e) => {
                                const target = e.currentTarget;
                                target.style.height = 'auto';
                                target.style.height = target.scrollHeight + 'px';
                              }}
                              placeholder="Remark" style={{ width: '100%', resize: 'vertical', minHeight: '34px', padding: '6px' }} rows={1} />
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}

                    <tr className="checklist-signature">
                      <td colSpan={3}><b>PART 5: HYDROTEST ACCEPTANCE</b></td>
                      <td colSpan={2}>QC Contractor<br />PTTGC's Inspector</td>
                      <td colSpan={2}>(Sign here) --&gt;<br />(Sign here) --&gt;</td>
                    </tr>

                    {['6 FINAL COMPLETION'].map(category => (
                      <React.Fragment key={category}>
                        <tr className="checklist-header">
                          <td colSpan={7}>{category}</td>
                        </tr>
                        {CHECKLIST_ITEMS.filter(item => item.category === category).map(item => (
                          <tr key={item.id}>
                            <td className="checklist-label">{item.label}</td>
                            <td>
                              {item.type === 'percent' && item.bindTo === 'utVal' && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                  <input type="text" className="rcr-input-inline-small" value={utVal} onChange={e => setUtVal(e.target.value)} /> %
                                </div>
                              )}
                              {item.type === 'coating' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <select className="rcr-select-light" value={coatingMethod} onChange={e => setCoatingMethod(e.target.value)} style={{ width: '120px' }}>
                                    <option value="Power Tool">Power Tool</option>
                                    <option value="Blasting">Blasting</option>
                                  </select>
                                  {paintCode && <span style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '14px' }}>Code: {paintCode}</span>}
                                </div>
                              )}
                              {item.type === 'insulation' && (
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <label><input type="radio" checked={insulation === 'YES'} onChange={() => setInsulation('YES')} /> YES</label>
                                  <label><input type="radio" checked={insulation === 'NO'} onChange={() => setInsulation('NO')} /> NO</label>
                                </div>
                              )}
                              {item.type === 'percent' && !item.bindTo && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                  <input type="text" className="rcr-input-inline-small"
                                    value={checklist[item.id]?.value || ''}
                                    onChange={e => setChecklist(prev => ({ ...prev, [item.id]: { ...prev[item.id], value: e.target.value } }))}
                                  /> %
                                </div>
                              )}
                              {!item.type && (
                                <textarea className="rcr-input-inline"
                                  value={checklist[item.id]?.value || ''}
                                  onChange={e => setChecklist(prev => ({ ...prev, [item.id]: { ...prev[item.id], value: e.target.value } }))}
                                  onInput={(e) => {
                                    const target = e.currentTarget;
                                    target.style.height = 'auto';
                                    target.style.height = target.scrollHeight + 'px';
                                  }}
                                  placeholder="Comment" style={{ width: '100%', resize: 'vertical', minHeight: '34px', padding: '6px' }} rows={1}
                                />
                              )}
                            </td>
                            <td>
                              <select className="checklist-select" value={checklist[item.id]?.qc || ''} onChange={e => setChecklist(prev => ({ ...prev, [item.id]: { ...prev[item.id], qc: e.target.value } }))}>
                                <option value=""></option>
                                <option value="H">H</option>
                                <option value="W">W</option>
                                <option value="R">R</option>
                              </select>
                            </td>
                            <td>
                              <select className="checklist-select" value={checklist[item.id]?.inspector || ''} onChange={e => setChecklist(prev => ({ ...prev, [item.id]: { ...prev[item.id], inspector: e.target.value } }))}>
                                <option value=""></option>
                                <option value="H">H</option>
                                <option value="W">W</option>
                                <option value="R">R</option>
                              </select>
                            </td>
                            <td className="center">
                              <input type="checkbox" className="checklist-checkbox" checked={checklist[item.id]?.yes || false} onChange={e => setChecklist(prev => ({ ...prev, [item.id]: { ...prev[item.id], yes: e.target.checked, na: e.target.checked ? false : prev[item.id].na } }))} />
                            </td>
                            <td className="center">
                              <input type="checkbox" className="checklist-checkbox" checked={checklist[item.id]?.na || false} onChange={e => setChecklist(prev => ({ ...prev, [item.id]: { ...prev[item.id], na: e.target.checked, yes: e.target.checked ? false : prev[item.id].yes } }))} />
                            </td>
                            <td>
                              <textarea className="rcr-input-inline" value={checklist[item.id]?.remark || ''} onChange={e => setChecklist(prev => ({ ...prev, [item.id]: { ...prev[item.id], remark: e.target.value } }))}
                              onInput={(e) => {
                                const target = e.currentTarget;
                                target.style.height = 'auto';
                                target.style.height = target.scrollHeight + 'px';
                              }}
                              placeholder="Remark" style={{ width: '100%', resize: 'vertical', minHeight: '34px', padding: '6px' }} rows={1} />
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="print-bottom-section">
                <div className="rcr-grid" style={{ marginTop: '0.25rem' }}>
                  <div className="rcr-field">
                    <label>From (Inspection Engineer)</label>
                    <input type="text" className="rcr-input" value={inspectionEngineer} onChange={e => setInspectionEngineer(e.target.value)} placeholder="Engineer Name" />
                  </div>
                  <div className="rcr-field">
                    <label>Date</label>
                    <input type="date" className="rcr-input" value={date} onChange={e => setDate(e.target.value)} />
                  </div>
                </div>

                <div className="form-actions hide-on-print" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button className="btn-primary" type="button" onClick={handleSave}>
                    Save Request
                  </button>
                  <button className="btn-secondary" type="button" onClick={() => navigate('/')}>
                    Cancel
                  </button>
                  <button className="btn-secondary" type="button" onClick={handlePrint} style={{ marginLeft: 'auto' }}>
                    Print / Save PDF
                  </button>
                </div>

                {/* Print-only Approver Section */}
                <div className="print-approver-section" style={{ display: 'none', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                  <div className="rcr-grid" style={{ marginTop: '0.25rem' }}>
                    <div className="rcr-field">
                      <label>Approved By (Supervisor)</label>
                      <input type="text" className="rcr-input" value={approverName || 'N/A'} readOnly />
                    </div>
                    <div className="rcr-field">
                      <label>Approval Date</label>
                      <input type="text" className="rcr-input" value={approvedDate || 'N/A'} readOnly />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default RcrForm;
