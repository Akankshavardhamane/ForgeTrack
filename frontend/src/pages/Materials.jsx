import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Video, Link as LinkIcon, Plus } from 'lucide-react';

const Materials = () => {
  const [sessions, setSessions] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ session_id: '', title: '', type: 'slides', url: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.from('sessions').select('*').order('date', { ascending: false });
    if (sessionData) setSessions(sessionData);

    const { data: materialData } = await supabase.from('materials').select('*');
    if (materialData) setMaterials(materialData);
    
    setLoading(false);
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from('materials').insert([newMaterial]).select();
    if (!error && data) {
      setMaterials([...materials, ...data]);
      setIsModalOpen(false);
      setNewMaterial({ session_id: '', title: '', type: 'slides', url: '' });
    } else {
      alert('Error adding material: ' + error.message);
    }
  };

  const getIcon = (type) => {
    if (type === 'video' || type === 'recording') return <Video size={18} />;
    if (type === 'slides') return <FileText size={18} />;
    return <LinkIcon size={18} />;
  };

  if (loading) return <div className="text-secondary animate-pulse">Loading materials...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-display-sm text-primary">Class Materials</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Material
        </button>
      </div>

      <div className="space-y-8">
        {sessions.map(session => {
          const sessionMaterials = materials.filter(m => m.session_id === session.id);
          if (sessionMaterials.length === 0) return null;

          return (
            <div key={session.id} className="space-y-4">
              <h3 className="text-h4 text-secondary border-b border-subtle pb-2">
                {new Date(session.date).toLocaleDateString()} - {session.topic}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessionMaterials.map(m => (
                  <a 
                    key={m.id} 
                    href={m.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="card p-4 flex items-start gap-4 hover:border-accent-glow transition-colors group cursor-pointer"
                  >
                    <div className="p-2 bg-surface-inset rounded text-accent-glow group-hover:bg-accent-glow group-hover:text-void transition-colors">
                      {getIcon(m.type)}
                    </div>
                    <div>
                      <h4 className="text-body font-medium text-primary group-hover:text-accent-glow transition-colors">{m.title}</h4>
                      <span className="text-caption text-tertiary capitalize">{m.type}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm px-4">
          <div className="card w-full max-w-md p-6 border border-subtle">
            <h2 className="text-h3 mb-6 text-primary">Add New Material</h2>
            <form onSubmit={handleAddMaterial} className="space-y-4">
              <div>
                <label className="block text-label text-secondary mb-2">SESSION</label>
                <select 
                  required
                  value={newMaterial.session_id}
                  onChange={e => setNewMaterial({...newMaterial, session_id: e.target.value})}
                  className="input w-full"
                >
                  <option value="">Select a session...</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>{s.topic}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-label text-secondary mb-2">TITLE</label>
                <input 
                  required
                  type="text" 
                  className="input w-full"
                  placeholder="e.g. Week 1 Slides"
                  value={newMaterial.title}
                  onChange={e => setNewMaterial({...newMaterial, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-label text-secondary mb-2">TYPE</label>
                <select 
                  className="input w-full"
                  value={newMaterial.type}
                  onChange={e => setNewMaterial({...newMaterial, type: e.target.value})}
                >
                  <option value="slides">Slides</option>
                  <option value="recording">Recording</option>
                  <option value="link">External Link</option>
                  <option value="document">Document</option>
                </select>
              </div>

              <div>
                <label className="block text-label text-secondary mb-2">URL</label>
                <input 
                  required
                  type="url" 
                  className="input w-full"
                  placeholder="https://..."
                  value={newMaterial.url}
                  onChange={e => setNewMaterial({...newMaterial, url: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Add Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Materials;
