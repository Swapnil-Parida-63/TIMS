import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card } from '../components/common/Card';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export const Finalization = () => {
  const { id } = useParams(); // interview id
  const navigate = useNavigate();
  const [cpc, setCpc] = useState('');
  const [classCode, setClassCode] = useState('');
  const [options, setOptions] = useState([]);
  const [boards, setBoards] = useState('');
  const [classes, setClasses] = useState('');
  const [slots, setSlots] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAssignCpc = async () => {
    try {
      await axios.patch(`/api/interview/${id}/cpc`, { cpc });
      const res = await axios.get(`/api/interview/${id}/class-options`);
      setOptions(res.data.data || []);
      alert('CPC Assigned & Options fetched!');
    } catch (e) {
      alert(e.response?.data?.message || 'Error');
    }
  };

  const handleFinalize = async () => {
    setLoading(true);
    try {
      // We bypass the patch and inject classCode natively as finalizeTeacher architecture demands it:
      await axios.post(`/api/teacher/${id}/finalize`, {
        classCode: classCode,
        boards: boards.split(',').map(b => b.trim()),
        classes: classes.split(',').map(c => c.trim()),
        slots: Number(slots)
      });
      alert('Teacher Finalized! PDFs generating and Emails dispatched!');
      navigate('/teachers');
    } catch (e) {
      alert(e.response?.data?.message || 'Finalization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
      <h2 className="text-2xl font-bold text-slate-800">Finalization Engine</h2>
      <Card className="flex flex-col gap-6 p-8">
         <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-start gap-4 text-orange-800">
            <AlertTriangle className="shrink-0 mt-0.5" />
            <p className="font-semibold text-sm">Proceed cautiously! These actions calculate permanent financial metrics and officially legally bind the LoA documents via our internal generators structure. Only Super-Admins may attach Top-Level CPC codes natively!</p>
         </div>

         <div className="space-y-4 pt-4 border-t border-slate-100">
           <h3 className="font-bold text-slate-700 flex items-center gap-2">
             <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs">1</span> 
             Assign Base Payload (Super Admin)
           </h3>
           <div className="flex gap-4">
              <input value={cpc} onChange={(e)=>setCpc(e.target.value.toUpperCase())} placeholder="e.g. AP-3" className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
              <button onClick={handleAssignCpc} className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-6 py-2 rounded-xl whitespace-nowrap">Assign CPC Array</button>
           </div>
         </div>

         <div className="space-y-4 pt-6 mt-2 border-t border-slate-100">
           <h3 className="font-bold text-slate-700 flex items-center gap-2">
             <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs">2</span> 
             Define Class Structures
           </h3>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                 <label className="text-sm font-semibold text-slate-500">Class Code</label>
                 <select value={classCode} onChange={(e)=>setClassCode(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="">Select derived maps...</option>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                 </select>
              </div>

              <div className="flex flex-col gap-2">
                 <label className="text-sm font-semibold text-slate-500">Slots Target (Max 11)</label>
                 <input type="number" min="1" max="11" value={slots} onChange={(e)=>setSlots(e.target.value)} placeholder="e.g. 5" className="w-full px-4 py-2 border rounded-xl outline-none" />
               </div>
               
               <div className="flex flex-col gap-2">
                 <label className="text-sm font-semibold text-slate-500">Boards (comma separated)</label>
                 <input type="text" value={boards} onChange={(e)=>setBoards(e.target.value)} placeholder="CBSE, ICSE" className="w-full px-4 py-2 border rounded-xl outline-none" />
               </div>
               
               <div className="flex flex-col gap-2">
                 <label className="text-sm font-semibold text-slate-500">Classes Taught (comma separated)</label>
                 <input type="text" value={classes} onChange={(e)=>setClasses(e.target.value)} placeholder="9th, 10th" className="w-full px-4 py-2 border rounded-xl outline-none" />
               </div>
           </div>
         </div>

         <button 
           onClick={handleFinalize} 
           disabled={loading}
           className="mt-6 w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold text-lg px-6 py-4 rounded-xl shadow-lg shadow-primary-500/30 transition-all"
         >
           {loading ? 'Processing Contracts...' : <><CheckCircle2 /> Finalize Official Launch Profiles</>}
         </button>

      </Card>
    </div>
  );
};
