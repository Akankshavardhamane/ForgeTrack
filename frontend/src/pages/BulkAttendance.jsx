import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { 
  Upload, 
  FileSpreadsheet, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  X,
  Calendar,
  User,
  MoreVertical,
  Check,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { bulkUploadAgent } from '../lib/bulkUploadAgent';

const BulkAttendance = () => {
  const [file, setFile] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [selectedSheets, setSelectedSheets] = useState([]);
  const [analysisResults, setAnalysisResults] = useState({}); // { sheetName: { dateColumns: [], usnColumnIndex, nameColumnIndex, fullData } }
  const [step, setStep] = useState(1); // 1: Upload, 2: Config, 3: Conflicts, 4: Progress, 5: Success
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState('Monday, Wednesday, Friday');
  const [referenceDate, setReferenceDate] = useState(new Date().toISOString().split('T')[0]);
  const [conflicts, setConflicts] = useState({}); // { date: sessionObject }
  const [decisions, setDecisions] = useState({}); // { 'sheet:date': 'overwrite' | 'skip' }
  const [importStatus, setImportStatus] = useState({ total: 0, current: 0 });

  // 1. Initial File Upload
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      setSheets(wb.SheetNames);
      setSelectedSheets([wb.SheetNames[0]]);
      setStep(2);
    };
    reader.readAsBinaryString(uploadedFile);
  };

  // 2. AI/Heuristic Analysis
  const analyzeSheets = async () => {
    setLoading(true);
    try {
      const reader = new FileReader();
      
      const results = await new Promise((resolve, reject) => {
        reader.onload = async (evt) => {
          try {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const sheetResults = {};
            
            for (const name of selectedSheets) {
              const ws = wb.Sheets[name];
              let data = XLSX.utils.sheet_to_json(ws, { header: 1 });
              
              // Skip empty rows at the top
              let headerRowIndex = 0;
              while (headerRowIndex < data.length && (!data[headerRowIndex] || data[headerRowIndex].length === 0 || !data[headerRowIndex].some(cell => cell))) {
                headerRowIndex++;
              }
              
              if (headerRowIndex >= data.length) continue;
              
              const headers = data[headerRowIndex];
              const actualData = data.slice(headerRowIndex);
              
              let usnIdx = -1;
              let nameIdx = -1;
              const dateCols = [];

              headers.forEach((h, i) => {
                if (!h) return;
                const head = String(h).toLowerCase();
                if (head.includes('usn') || head.includes('id')) usnIdx = i;
                if (head.includes('name')) nameIdx = i;
                
                // Enhanced date detection for DD/MM/YY or DD-MM-YYYY
                if (/\d{1,2}[/-]\d{1,2}/.test(head) || /[A-Za-z]{3,}\s\d{1,2}/.test(head)) {
                  // Try to parse the date from the header itself
                  let parsedDate = null;
                  try {
                    // Handle DD/MM/YY
                    const parts = head.match(/(\d{1,2})[/-](\d{1,2})[/-]?(\d{2,4})?/);
                    if (parts) {
                      const day = parseInt(parts[1]);
                      const month = parseInt(parts[2]);
                      const year = parts[3] ? (parts[3].length === 2 ? '20' + parts[3] : parts[3]) : '2026';
                      parsedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    }
                  } catch (e) {}

                  dateCols.push({ 
                    index: i, 
                    header: h, 
                    detectedDate: parsedDate, 
                    status: parsedDate ? 'ok' : 'missing' 
                  });
                }
              });

              sheetResults[name] = { 
                usnColumnIndex: usnIdx, 
                nameColumnIndex: nameIdx, 
                dateColumns: dateCols,
                fullData: actualData 
              };
            }
            resolve(sheetResults);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsBinaryString(file);
      });

      setAnalysisResults(results);
      await handleMissingHeaderReasoning(results);
    } catch (err) {
      console.error(err);
      alert("Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleMissingHeaderReasoning = async (updatedResults, data) => {
    const reference = referenceDate;
    
    for (const sheetName of selectedSheets) {
      const analysis = updatedResults[sheetName];
      if (analysis) {
        const missingIndices = analysis.dateColumns
          .filter(c => c.status === 'missing')
          .map(c => c.index);
        
        if (missingIndices.length > 0 && schedule) {
          try {
            const suggested = await bulkUploadAgent.suggestMissingDates(missingIndices, schedule, reference);
            suggested.forEach((date, i) => {
              const colIndex = missingIndices[i];
              const col = analysis.dateColumns.find(c => c.index === colIndex);
              if (col) {
                col.detectedDate = date;
                col.status = 'ok';
              }
            });
          } catch (error) {
            console.error("AI Date reasoning failed, using deterministic fallback:", error);
            
            // Deterministic fallback:
            const dayMap = { 'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6 };
            const allowedDays = schedule.toLowerCase().split(',').map(d => dayMap[d.trim()]).filter(d => d !== undefined);
            
            if (allowedDays.length > 0 && reference) {
              let lastDate = new Date(reference);
              const headers = analysis.fullData[0];
              const newDateColumns = [];

              headers.forEach((h, i) => {
                const head = String(h).toUpperCase();
                // Skip USN, Name, and clearly non-date headers
                if (i === analysis.usnColumnIndex || i === analysis.nameColumnIndex) return;
                if (head.includes('EMAIL') || head.includes('NAME') || head.includes('USN') || 
                    head.includes('SL NO') || head.includes('ADMISSION') || head.includes('BRANCH') ||
                    head.includes('INVITE') || head.includes('SERIAL') || head.includes('PHONE')) return;

                let nextDate = new Date(lastDate);
                nextDate.setDate(nextDate.getDate() + 1);
                while (!allowedDays.includes(nextDate.getDay())) {
                  nextDate.setDate(nextDate.getDate() + 1);
                }
                
                newDateColumns.push({ 
                  index: i, 
                  header: h, 
                  detectedDate: nextDate.toISOString().split('T')[0], 
                  status: 'ok' 
                });
                lastDate = nextDate;
              });
              analysis.dateColumns = newDateColumns;
            }
          }
        }
      }
    }
    
    setAnalysisResults(updatedResults);
    checkConflicts(updatedResults);
    setStep(3);
  };

  // 4. Check for Existing Sessions (Duplication)
  const checkConflicts = async (currentResults = analysisResults) => {
    setLoading(true);
    try {
      const allDates = [];
      Object.values(currentResults).forEach(res => {
        res.dateColumns.forEach(col => {
          if (col.detectedDate) allDates.push(col.detectedDate);
        });
      });
      
      const uniqueDates = [...new Set(allDates)];
      
      if (uniqueDates.length > 0) {
        const { data: existingSessions } = await supabase
          .from('sessions')
          .select('*')
          .in('date', uniqueDates);
        
        const conflictMap = {};
        const newDecisions = {};
        
        existingSessions?.forEach(s => {
          conflictMap[s.date] = s;
        });

        Object.entries(currentResults).forEach(([sheetName, res]) => {
          res.dateColumns.forEach(col => {
            const key = `${sheetName}:${col.detectedDate}`;
            if (conflictMap[col.detectedDate]) {
              newDecisions[key] = 'overwrite';
            } else {
              newDecisions[key] = 'create';
            }
          });
        });

        setConflicts(conflictMap);
        setDecisions(newDecisions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 5. Final Import
  const startImport = async () => {
    setLoading(true);
    try {
      // 1. Extract ALL unique students from ALL selected sheets first
      const uniqueStudents = new Map();
      Object.entries(analysisResults).forEach(([sheetName, res]) => {
        if (!selectedSheets.includes(sheetName)) return;
        const { fullData, usnColumnIndex, nameColumnIndex } = res;
        for (let i = 2; i < fullData.length; i++) {
          const row = fullData[i];
          const usn = String(row[usnColumnIndex] || '').trim().toUpperCase();
          const name = String(row[nameColumnIndex] || '').trim();
          if (usn && name && !uniqueStudents.has(usn)) {
            uniqueStudents.set(usn, { usn, name, branch_code: 'General' });
          }
        }
      });

      if (uniqueStudents.size > 0) {
        const { error: upsertErr } = await supabase
          .from('students')
          .upsert(Array.from(uniqueStudents.values()), { onConflict: 'usn' });
        if (upsertErr) console.error("Auto-student upsert error:", upsertErr);
      }

      const { data: students, error: fetchErr } = await supabase.from('students').select('id, usn');
      if (fetchErr) throw fetchErr;

      const studentMap = {};
      students.forEach(s => {
        if (s.usn) studentMap[s.usn.toUpperCase()] = s.id;
      });

      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || 'unknown_system';

      for (const sheetName of selectedSheets) {
        const analysis = analysisResults[sheetName];
        const { usnColumnIndex, dateColumns, fullData } = analysis;

        const { data: logEntry, error: logErr } = await supabase
          .from('import_log')
          .insert({
            filename: `${file.name} [${sheetName}]`,
            uploaded_by: userEmail,
            total_rows: fullData.length - 1, // Header was already skipped in actualData
            imported_rows: 0,
            skipped_rows: 0,
            status: 'processing'
          })
          .select()
          .single();

        if (logErr || !logEntry) throw new Error(`Failed to create log: ${logErr?.message}`);

        for (const col of dateColumns) {
          const decisionKey = `${sheetName}:${col.detectedDate}`;
          if (decisions[decisionKey] === 'skip') continue;

          let sessionId;
          const existing = conflicts[col.detectedDate];
          if (existing && decisions[decisionKey] === 'overwrite') {
            sessionId = existing.id;
          } else {
            const { data: newSession, error: sErr } = await supabase
              .from('sessions')
              .upsert({ 
                date: col.detectedDate, 
                topic: `Imported: ${sheetName}`,
                month_number: new Date(col.detectedDate).getMonth() + 1
              }, { onConflict: 'date' })
              .select()
              .single();
            
            if (sErr || !newSession) throw new Error(`Session error for ${col.detectedDate}`);
            sessionId = newSession.id;
          }

          const attendanceRecords = [];
          for (let j = 2; j < fullData.length; j++) {
            const row = fullData[j];
            const usn = String(row[usnColumnIndex] || '').trim().toUpperCase();
            const studentId = studentMap[usn];
            if (!studentId) continue;

            const val = row[col.index];
            const isPresent = val === true || val === 'P' || val === 1 || 
                             String(val).toLowerCase() === 'present' || 
                             String(val).toLowerCase() === 'p' ||
                             String(val) === '1';
            
            attendanceRecords.push({
              student_id: studentId,
              session_id: sessionId,
              present: isPresent,
              import_id: logEntry.id
            });
          }

          if (attendanceRecords.length > 0) {
            await supabase.from('attendance').upsert(attendanceRecords, { onConflict: 'student_id, session_id' });
          }
        }
        await supabase.from('import_log').update({ status: 'completed' }).eq('id', logEntry.id);
      }
      setStep(5);
    } catch (error) {
      console.error(error);
      alert("Import failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-sm text-primary">Bulk Attendance Upload</h1>
          <p className="text-body-sm text-tertiary">Powered by ForgeTrack AI Agent</p>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(s => (
            <div key={s} className={`w-8 h-1 rounded-full ${step >= s ? 'bg-accent-glow' : 'bg-surface'}`} />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="card p-12 border-dashed border-2 flex flex-col items-center text-center space-y-4 border-subtle">
          <div className="w-16 h-16 bg-surface-raised rounded-full flex items-center justify-center text-accent-glow">
            <Upload size={32} />
          </div>
          <div>
            <h3 className="text-h4 text-primary">Upload Attendance File</h3>
            <p className="text-body-sm text-tertiary mt-1">Excel (.xlsx) or CSV files supported</p>
          </div>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
          />
          <label htmlFor="file-upload" className="btn-primary px-8 py-3 cursor-pointer">
            Select File
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="card p-6 space-y-6 border border-subtle">
            <h3 className="text-h4 text-primary flex items-center gap-2">
              <FileSpreadsheet className="text-accent-glow" /> Configure Import
            </h3>
            
            <div className="space-y-4">
              <label className="text-label text-tertiary uppercase">Select Sheets to Import</label>
              <div className="flex flex-wrap gap-2">
                {sheets.map(name => (
                  <button
                    key={name}
                    onClick={() => setSelectedSheets(prev => 
                      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
                    )}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      selectedSheets.includes(name) 
                        ? 'bg-surface-raised border-accent-glow text-primary' 
                        : 'bg-surface-inset border-subtle text-secondary'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-label text-tertiary uppercase">Class Schedule</label>
                <input 
                  type="text" 
                  value={schedule} 
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="e.g. Monday, Wednesday, Friday"
                  className="input w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-label text-tertiary uppercase">Reference Date (Start)</label>
                <input 
                  type="date" 
                  value={referenceDate} 
                  onChange={(e) => setReferenceDate(e.target.value)}
                  className="input w-full"
                />
              </div>
            </div>

            <button 
              onClick={analyzeSheets} 
              disabled={selectedSheets.length === 0 || loading}
              className="btn-primary w-full py-4 mt-4 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <ChevronRight size={20} />}
              Analyze Sheets
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="card p-6 border border-subtle">
            <h3 className="text-h4 text-primary mb-4">Conflict Resolution & Mapping</h3>
            
            <div className="space-y-6">
              {Object.entries(analysisResults).map(([sheetName, res]) => (
                <div key={sheetName} className="space-y-4">
                  <div className="flex items-center gap-2 text-accent-glow font-bold uppercase tracking-widest text-[10px]">
                    <div className="h-[1px] flex-1 bg-subtle"></div>
                    Sheet: {sheetName}
                    <div className="h-[1px] flex-1 bg-subtle"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4" key={sheetName + (res.fullData?.[0]?.length || 0)}>
                    {res.fullData && res.fullData[0] && (
                      <>
                        <div className="space-y-2">
                          <label className="text-[10px] text-tertiary uppercase font-bold">USN Column</label>
                          <select 
                            value={res.usnColumnIndex}
                            onChange={(e) => setAnalysisResults(prev => ({
                              ...prev,
                              [sheetName]: { ...prev[sheetName], usnColumnIndex: parseInt(e.target.value) }
                            }))}
                            className="input w-full text-xs"
                          >
                            <option value="-1">Select Header...</option>
                            {res.fullData[0].map((h, i) => <option key={i} value={i}>{h || `Column ${i+1}`}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] text-tertiary uppercase font-bold">Name Column</label>
                          <select 
                            value={res.nameColumnIndex}
                            onChange={(e) => setAnalysisResults(prev => ({
                              ...prev,
                              [sheetName]: { ...prev[sheetName], nameColumnIndex: parseInt(e.target.value) }
                            }))}
                            className="input w-full text-xs"
                          >
                            <option value="-1">Select Header...</option>
                            {res.fullData[0].map((h, i) => <option key={i} value={i}>{h || `Column ${i+1}`}</option>)}
                          </select>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-3">
                    {res.dateColumns.map((col, idx) => {
                      const decisionKey = `${sheetName}:${col.detectedDate}`;
                      const isConflict = !!conflicts[col.detectedDate];
                      
                      return (
                        <div key={idx} className="bg-surface-inset border border-subtle rounded-xl p-4 flex items-center justify-between gap-4 group hover:border-secondary transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-secondary font-bold text-xs border border-subtle group-hover:border-secondary">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="date"
                                  value={col.detectedDate}
                                  onChange={(e) => {
                                    const newResults = {...analysisResults};
                                    newResults[sheetName].dateColumns[idx].detectedDate = e.target.value;
                                    setAnalysisResults(newResults);
                                  }}
                                  className="bg-transparent text-primary font-bold focus:outline-none focus:ring-1 focus:ring-accent-glow rounded px-1 -ml-1 cursor-pointer"
                                />
                                <Calendar size={14} className="text-tertiary" />
                              </div>
                              <p className="text-[10px] text-tertiary uppercase font-medium mt-0.5 truncate max-w-[150px]">{col.header}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {isConflict && (
                              <div className="text-[9px] text-accent-glow italic hidden sm:block max-w-[200px] text-right leading-tight opacity-80">
                                Already exists in: {conflicts[col.detectedDate].topic || 'Database'}
                              </div>
                            )}
                            <div className="flex bg-surface rounded-lg p-1 border border-subtle">
                              <button
                                onClick={() => setDecisions(prev => ({ ...prev, [decisionKey]: isConflict ? 'overwrite' : 'create' }))}
                                className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                                  decisions[decisionKey] !== 'skip' 
                                    ? 'bg-surface-raised text-primary shadow-lg' 
                                    : 'text-tertiary hover:text-secondary'
                                }`}
                              >
                                {isConflict ? 'Overwrite' : 'Create'}
                              </button>
                              <button
                                onClick={() => setDecisions(prev => ({ ...prev, [decisionKey]: 'skip' }))}
                                className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                                  decisions[decisionKey] === 'skip' 
                                    ? 'bg-danger-bg/20 text-danger-fg shadow-lg' 
                                    : 'text-tertiary hover:text-secondary'
                                }`}
                              >
                                Skip
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={startImport} 
              disabled={loading}
              className="btn-primary w-full py-4 mt-8 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
              {loading ? 'Processing...' : 'Commit Attendance to Database'}
            </button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="card p-12 text-center space-y-6 border border-subtle">
          <div className="w-20 h-20 bg-success-bg/20 text-success-fg rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={48} />
          </div>
          <div>
            <h2 className="text-display-sm text-primary">Import Complete!</h2>
            <p className="text-body-lg text-secondary mt-2">All sessions and attendance records have been successfully saved.</p>
          </div>
          <div className="flex gap-4 justify-center">
            <button onClick={() => window.location.reload()} className="btn-secondary px-8 py-3">
              Upload Another
            </button>
            <button onClick={() => window.location.href='/dashboard'} className="btn-primary px-8 py-3">
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkAttendance;
