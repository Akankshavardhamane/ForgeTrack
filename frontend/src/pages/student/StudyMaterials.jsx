import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { BookOpen, FileText, Video, Link as LinkIcon, Download } from 'lucide-react';

const StudyMaterials = () => {
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    let mounted = true;

    const fetchMaterials = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('materials')
          .select(`
            *,
            sessions (topic, date)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (mounted && data) {
          setMaterials(data);
        }
      } catch (error) {
        console.error('Error fetching materials:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchMaterials();
    return () => mounted = false;
  }, []);

  if (loading) {
    return <div className="text-secondary animate-pulse p-8">Loading materials...</div>;
  }

  const getIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'recording': return <Video size={24} className="text-primary" />;
      case 'document': return <FileText size={24} className="text-success-fg" />;
      case 'link': return <LinkIcon size={24} className="text-warning-fg" />;
      default: return <BookOpen size={24} className="text-secondary" />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pt-4">
      {/* Hero Section */}
      <div>
        <h1 className="text-[48px] md:text-[64px] font-bold text-white tracking-tight leading-none mb-2">
          Study Materials
        </h1>
        <p className="text-body text-secondary mt-4">
          Access resources, slides, and recordings from your classes.
        </p>
      </div>

      <div className="card bg-surface-inset border border-subtle overflow-hidden mt-8">
        {materials.length > 0 ? (
          <div className="divide-y divide-subtle">
            {materials.map((material) => (
              <div key={material.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-surface-raised/30 transition-colors group">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-xl bg-surface-raised flex items-center justify-center shrink-0 shadow-inner">
                    {getIcon(material.type)}
                  </div>
                  <div>
                    <h3 className="text-h4 text-white mb-1 group-hover:text-primary transition-colors">
                      {material.title}
                    </h3>
                    {material.description && (
                      <p className="text-body-sm text-secondary mb-2 line-clamp-2">
                        {material.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-caption font-medium text-secondary/70">
                      <span className="uppercase tracking-wider">{material.type}</span>
                      {material.sessions && (
                        <>
                          <span>•</span>
                          <span>{material.sessions.topic}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="md:shrink-0 self-start md:self-center">
                  <a 
                    href={material.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-surface-raised hover:bg-white text-white hover:text-void font-bold px-5 py-2.5 rounded-md transition-all shadow-sm"
                  >
                    <Download size={16} />
                    {material.type === 'recording' ? 'Watch' : 'Open'}
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-surface-raised rounded-2xl flex items-center justify-center mx-auto mb-6 text-secondary/50">
              <BookOpen size={32} />
            </div>
            <h3 className="text-h3 text-white mb-2">No Materials Yet</h3>
            <p className="text-secondary max-w-md mx-auto">
              Your mentors haven't uploaded any study materials yet. Check back later!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyMaterials;
