import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Briefcase, 
  Plus, 
  Trash2, 
  LogOut,
  Image as ImageIcon,
  Link as LinkIcon,
  Type,
  AlignLeft,
  Calendar,
  Save,
  Monitor,
  Layout,
  Smartphone,
  Palette,
  Share2,
  Zap,
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  db, 
  logout, 
  handleFirestoreError, 
  OperationType 
} from '../lib/firebase';
import { 
  doc, 
  setDoc, 
  deleteDoc,
  collection
} from 'firebase/firestore';

import { Logo } from './Logo';

interface SiteSettings {
  name: string;
  surname: string;
  role: string;
  bio: string;
  email: string;
  points?: string[];
  github?: string;
  linkedin?: string;
  twitter?: string;
  stats: {
    socialProjects: string;
    webApps: string;
    successRate: string;
  };
}

interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  appLogo?: string;
  gallery?: string[];
  link: string;
  type: 'web' | 'app' | 'graphic' | 'digital' | 'cpa' | 'other';
  order: number;
  dateReceived?: string;
  completionTime?: string;
  downloadUrl?: string;
  downloadFileName?: string;
}

interface Experience {
  id: string;
  company: string;
  role: string;
  period: string;
  description: string;
  order: number;
}

interface Blog {
  id: string;
  title: string;
  content: string;
  image: string;
  gallery?: string[];
  date: string;
  order: number;
}

const compressImage = (base64: string, maxWidth = 1200, maxHeight = 1200, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
};

export function AdminDashboard({ user, onClose, settings, projects, experiences, blogs }: { 
  user: FirebaseUser; 
  onClose: () => void;
  settings: SiteSettings;
  projects: Project[];
  experiences: Experience[];
  blogs: Blog[];
}) {
  const [activeTab, setActiveTab] = useState<'settings' | 'projects' | 'experience' | 'stats' | 'blogs'>('settings');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingExp, setEditingExp] = useState<Experience | null>(null);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);

  const tabs = [
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'stats', label: 'Stats', icon: Monitor },
    { id: 'projects', label: 'Projects', icon: Layout },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'blogs', label: 'Blogs & Gallery', icon: ImageIcon },
  ] as const;

  return (
    <div className="fixed inset-0 z-[100] bg-neutral-950 flex flex-col md:flex-row h-screen">
      <aside className="w-full md:w-64 bg-neutral-900/50 border-b md:border-b-0 md:border-r border-neutral-800 p-6 flex flex-col">
        <div className="flex flex-col items-center gap-6 mb-12">
          <Logo onClick={onClose} className="scale-[0.55] -mt-4 cursor-pointer hover:opacity-80 transition-opacity" />
          <div className="flex items-center justify-between w-full">
            <div className="font-black text-xs uppercase tracking-[0.3em] text-neutral-600 bg-neutral-800/50 px-3 py-1 rounded-full">ADMIN PANEL</div>
            <button onClick={onClose} className="md:hidden text-neutral-400 hover:text-white"><X /></button>
          </div>
        </div>
        <nav className="space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-neutral-500 hover:text-neutral-100 hover:bg-neutral-800'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-neutral-800">
          <div className="text-[10px] uppercase font-bold text-neutral-600 mb-2 truncate">Logged in as {user.email}</div>
          <button onClick={() => { 
            logout(); 
            sessionStorage.removeItem('admin_authenticated');
            localStorage.removeItem('admin_session_expiry');
            onClose(); 
          }} className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-400 transition-colors"><LogOut className="w-4 h-4" /> Sign Out</button>
        </div>
      </aside>
      <main className="flex-grow overflow-y-auto p-4 md:p-12 pb-32">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">{activeTab}</h2>
            <div className="flex gap-2">
              {activeTab === 'experience' && <button onClick={() => setEditingExp({ id: '', company: '', role: '', period: '', description: '', order: experiences.length })} className="bg-white text-black px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-neutral-200 transition-colors"><Plus className="w-4 h-4" /> Add Exp</button>}
              <button onClick={onClose} className="hidden md:flex items-center gap-2 bg-neutral-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-neutral-700 transition-colors"><X className="w-4 h-4" /> Close</button>
            </div>
          </div>
          
          {activeTab === 'settings' && <SettingsEditor settings={settings} />}
          {activeTab === 'stats' && <StatsEditor settings={settings} projects={projects} />}
          {activeTab === 'projects' && <ProjectsManager projects={projects} onEdit={setEditingProject} />}
          {activeTab === 'experience' && <ExperienceManager experiences={experiences} onEdit={setEditingExp} />}
          {activeTab === 'blogs' && <BlogsManager blogs={blogs} onEdit={setEditingBlog} />}
        </div>
      </main>

      {editingProject && <ProjectModal project={editingProject} onClose={() => setEditingProject(null)} />}
      {editingExp && <ExperienceModal exp={editingExp} onClose={() => setEditingExp(null)} />}
      {editingBlog && <BlogModal blog={editingBlog} onClose={() => setEditingBlog(null)} />}
    </div>
  );
}

function SettingsEditor({ settings }: { settings: SiteSettings }) {
  const [data, setData] = useState(settings);
  const [saving, setSaving] = useState(false);

  const points = data.points || [];

  const updatePoint = (index: number, value: string) => {
    const newPoints = [...points];
    newPoints[index] = value;
    setData({ ...data, points: newPoints });
  };

  const addPoint = () => {
    setData({ ...data, points: [...points, ''] });
  };

  const removePoint = (index: number) => {
    const newPoints = points.filter((_, i) => i !== index);
    setData({ ...data, points: newPoints });
  };

  const save = async () => {
    setSaving(true);
    try {
      console.log('Saving settings:', data);
      await setDoc(doc(db, 'settings', 'global'), data);
      alert('Settings saved successfully!');
    } catch (err) { 
      console.error('Save failed:', err);
      handleFirestoreError(err, OperationType.WRITE, 'settings/global'); 
    }
    finally { setSaving(false); }
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-900/30 p-8 rounded-3xl border border-neutral-800">
      <InputField label="Name" icon={Type} value={data.name} onChange={v => setData({...data, name: v})} />
      <InputField label="Surname" icon={Type} value={data.surname} onChange={v => setData({...data, surname: v})} />
      <InputField label="Role" icon={Monitor} value={data.role} onChange={v => setData({...data, role: v})} />
      <InputField label="Email" icon={Type} value={data.email} onChange={v => setData({...data, email: v})} />

      <div className="md:col-span-2 border-t border-neutral-800 pt-6 mt-2">
        <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-4">Profile Image</label>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-neutral-800 bg-neutral-900 flex-shrink-0">
            {data.profileImage ? (
              <img src={data.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-700">
                <ImageIcon className="w-8 h-8" />
              </div>
            )}
          </div>
          <div className="flex-grow">
            <div className="relative">
              <button className="bg-neutral-800 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-700 transition-all">
                Change Photo
              </button>
              <input 
                type="file" 
                accept="image/*" 
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                      if (typeof reader.result === 'string') {
                        const compressed = await compressImage(reader.result, 400, 400, 0.8);
                        setData({ ...data, profileImage: compressed });
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }} 
                className="absolute inset-0 opacity-0 cursor-pointer" 
              />
            </div>
            <p className="text-[9px] text-neutral-600 mt-2 uppercase font-bold">Recommended: Square image, max 400x400px</p>
          </div>
        </div>
      </div>
      
      <div className="md:col-span-2 border-t border-neutral-800 pt-6 mt-2">
        <div className="flex items-center justify-between mb-4">
          <label className="block text-[10px] uppercase font-bold text-neutral-500">Professional Highlights</label>
          <button 
            onClick={addPoint}
            className="flex items-center gap-1 text-[10px] uppercase font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Point
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {points.map((point, index) => (
            <div key={index} className="relative group">
              <InputField 
                label={`Point ${index + 1}`} 
                icon={Plus} 
                value={point} 
                onChange={(v: string) => updatePoint(index, v)} 
                placeholder="e.g. Building robust web architectures..." 
              />
              <button 
                onClick={() => removePoint(index)}
                className="absolute right-2 top-8 p-2 text-neutral-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                title="Remove Point"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {points.length === 0 && (
            <div className="md:col-span-2 py-8 border-2 border-dashed border-neutral-800 rounded-2xl flex flex-col items-center justify-center text-neutral-600 italic text-sm">
              No highlights added yet.
            </div>
          )}
        </div>
      </div>

      <div className="md:col-span-2 pt-6 border-t border-neutral-800 mt-2">
        <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-2">Bio</label>
        <textarea value={data.bio} onChange={e => setData({...data, bio: e.target.value})} className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 text-white text-sm focus:border-indigo-500 outline-none transition-colors h-32" />
      </div>
      <button onClick={save} disabled={saving} className="md:col-span-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
        <Save className="w-5 h-5" /> {saving ? 'SAVING...' : 'SAVE CHANGES'}
      </button>
    </div>
  );
}

function ProjectsManager({ projects, onEdit }: { projects: Project[], onEdit: (p: Project) => void }) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'web' | 'app' | 'graphic' | 'digital' | 'cpa'>('all');

  const deleteProject = async (id: string) => { 
    if (confirm('Are you sure?')) { 
      try { 
        await deleteDoc(doc(db, 'projects', id));
      } catch (err) { handleFirestoreError(err, OperationType.DELETE, `projects/${id}`); } 
    } 
  };

  const filtered = projects
    .filter(p => activeFilter === 'all' || p.type === activeFilter)
    .sort((a, b) => (b.order || 0) - (a.order || 0));

  const tabs = [
    { id: 'all', label: 'All', icon: Layout },
    { id: 'web', label: 'Web', icon: Monitor },
    { id: 'app', label: 'App', icon: Smartphone },
    { id: 'graphic', label: 'Graphic', icon: Palette },
    { id: 'digital', label: 'Digital', icon: Share2 },
    { id: 'cpa', label: 'CPA', icon: Zap },
  ] as const;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border transition-all ${
                activeFilter === tab.id 
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                : 'bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'
              }`}
            >
              <Icon className={`w-5 h-5 ${activeFilter === tab.id ? 'text-white' : 'text-neutral-600'}`} />
              <span className="text-[10px] uppercase font-black tracking-widest">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <h3 className="text-sm uppercase font-black tracking-widest text-neutral-400">
          Showing: <span className="text-white">{activeFilter}</span>
        </h3>
        {activeFilter !== 'all' && (
          <button 
            onClick={() => onEdit({ 
              id: '', 
              title: '', 
              description: '', 
              image: '', 
              link: '', 
              type: activeFilter, 
              order: projects.length,
              dateReceived: '',
              completionTime: ''
            })} 
            className="bg-white text-black px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-neutral-200 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add {activeFilter} Project
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {filtered.map(p => (
          <div key={p.id} className="flex items-center gap-6 bg-neutral-900/30 p-4 rounded-2xl border border-neutral-800 group">
            <img src={p.image} className="w-20 h-20 rounded-xl object-cover" alt="" />
            <div className="flex-grow">
              <h4 className="font-bold text-white">{p.title}</h4>
              <span className="text-[10px] uppercase font-bold text-indigo-500">{p.type}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onEdit(p)} className="p-3 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors"><Settings className="w-4 h-4 text-neutral-400" /></button>
              <button onClick={() => deleteProject(p.id)} className="p-3 bg-red-900/20 rounded-xl hover:bg-red-900/40 transition-colors"><Trash2 className="w-4 h-4 text-red-500" /></button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-20 text-center text-neutral-600 italic">
            No projects found in this category.
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectModal({ project, onClose }: { project: Project, onClose: () => void }) {
  const [data, setData] = useState(project);
  const [saving, setSaving] = useState(false);
  const [fileName, setFileName] = useState('');
  const [appFileName, setAppFileName] = useState(project.downloadFileName || '');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === 'string') {
          const compressed = await compressImage(reader.result);
          setData({ ...data, image: compressed });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAppUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert('File is too large. Max size is 1MB. Please use an external link for larger files.');
        return;
      }
      setAppFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setData({ 
            ...data, 
            downloadUrl: reader.result, 
            downloadFileName: file.name 
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      if ((data.gallery || []).length + files.length > 8) {
        alert('Max 8 images allowed in gallery to keep loading fast.');
        return;
      }
      Array.from(files).forEach((file: any) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          if (typeof reader.result === 'string') {
            // Smaller resolution and lower quality for gallery items
            const compressed = await compressImage(reader.result, 800, 800, 0.5);
            setData(prev => ({
              ...prev,
              gallery: [...(prev.gallery || []), compressed]
            }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeGalleryImage = (index: number) => {
    setData(prev => ({
      ...prev,
      gallery: (prev.gallery || []).filter((_, i) => i !== index)
    }));
  };

  const save = async () => {
    if (!data.title || !data.image || !data.description) {
      alert('Please fill in Name, Image and Description');
      return;
    }

    // Basic size check before saving to prevent Firestore 1MB error
    const size = new Blob([JSON.stringify(data)]).size;
    if (size > 950000) {
      alert('This project has too much data (likely too many large photos). Please remove some gallery images or use smaller ones.');
      return;
    }

    setSaving(true);
    const id = project?.id || Math.random().toString(36).substr(2, 9);
    try { 
      await setDoc(doc(db, 'projects', id), { ...data, id });
      onClose(); 
    } catch (err) { handleFirestoreError(err, OperationType.WRITE, `projects/${id}`); }
    finally { setSaving(false); }
  };

  const titleLabel = data.type === 'app' ? 'App Name' : 'Title';

  return (
    <div className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-neutral-900 w-full max-w-xl rounded-3xl p-8 border border-neutral-800 max-h-[90vh] overflow-y-auto scrollbar-hide">
        <h3 className="text-2xl font-black text-white mb-8 border-b border-neutral-800 pb-4 uppercase tracking-tighter">Project Details</h3>
        <div className="space-y-6">
          <InputField label={titleLabel} value={data.title} onChange={(v: string) => setData({...data, title: v})} icon={Type} />
          
          <div>
            <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-2">Project Image</label>
            <div className="relative">
              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <div className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl py-4 pl-12 pr-4 text-white text-sm flex items-center justify-between">
                <span className="truncate opacity-60 italic">{fileName || 'Choose image file...'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                />
              </div>
            </div>
            {data.image && (
              <div className="mt-4 rounded-xl overflow-hidden border border-neutral-800 bg-black/50 flex justify-center items-center">
                <img src={data.image} alt="Preview" className="max-w-full h-auto object-contain" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] uppercase font-bold text-neutral-500">Project Gallery (Multiple Photos)</label>
              <div className="relative">
                <button className="flex items-center gap-1 text-[10px] uppercase font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                  <Plus className="w-3 h-3" /> Add Photos
                </button>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleGalleryAdd} 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(data.gallery || []).map((img, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-neutral-800 group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => removeGalleryImage(i)}
                    className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <div className="aspect-square rounded-lg border-2 border-dashed border-neutral-800 flex items-center justify-center relative">
                <ImageIcon className="w-4 h-4 text-neutral-700" />
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleGalleryAdd} 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                />
              </div>
            </div>
          </div>

          <InputField label="Live Link" value={data.link} onChange={(v: string) => setData({...data, link: v})} icon={LinkIcon} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Date Received" value={data.dateReceived || ''} onChange={(v: string) => setData({...data, dateReceived: v})} icon={Calendar} placeholder="e.g. 15th May 2024" />
            <InputField label="Completion Period" value={data.completionTime || ''} onChange={(v: string) => setData({...data, completionTime: v})} icon={Briefcase} placeholder="e.g. 3 Weeks" />
          </div>

          {data.type === 'app' && (
            <div className="space-y-6">
              <div className="bg-neutral-800/30 p-6 rounded-2xl border border-neutral-800">
                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-4">App Logo (Icon)</label>
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border border-neutral-700 bg-neutral-900 flex-shrink-0">
                    {data.appLogo ? (
                      <img src={data.appLogo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-800">
                        <Smartphone className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="relative">
                      <button className="bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-all">
                        Upload App Icon
                      </button>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = async () => {
                              if (typeof reader.result === 'string') {
                                const compressed = await compressImage(reader.result, 200, 200, 0.8);
                                setData({ ...data, appLogo: compressed });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }} 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-500/5 border border-indigo-500/20 p-6 rounded-2xl">
                <label className="block text-[10px] uppercase font-bold text-indigo-400 mb-2">App Download Options</label>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1 font-mono">Option A: Link (Google Drive / Mega)</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                      <input
                        type="text"
                        value={data.downloadUrl?.startsWith('data:') ? '' : data.downloadUrl}
                        onChange={(v) => {
                          setData({...data, downloadUrl: v.target.value, downloadFileName: 'External Link'});
                          setAppFileName('External Link');
                        }}
                        placeholder="Paste Google Drive/External link here..."
                        className="w-full bg-neutral-800/80 border border-indigo-500/30 rounded-xl py-4 pl-12 pr-4 text-white text-sm focus:border-indigo-500 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="h-px flex-grow bg-indigo-500/10"></div>
                    <span className="text-[9px] font-black text-neutral-600">OR</span>
                    <div className="h-px flex-grow bg-indigo-500/10"></div>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1 font-mono">Option B: Upload Direct File (Max 1MB)</label>
                    <div className="relative">
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                      <div className="w-full bg-neutral-800/80 border border-indigo-500/30 rounded-xl py-4 pl-12 pr-4 text-white text-sm flex items-center justify-between">
                        <span className="truncate opacity-60 italic">{appFileName || 'Upload APK/ZIP...'}</span>
                        <input 
                          type="file" 
                          onChange={handleAppUpload} 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {data.downloadUrl && (
                  <p className="mt-3 text-[9px] text-green-400 uppercase font-black tracking-widest flex items-center gap-1">
                    <Zap className="w-3 h-3" /> App link setup complete
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-2">Description</label>
            <textarea 
              value={data.description} 
              onChange={e => setData({...data, description: e.target.value})} 
              placeholder="Describe the project objective, process and outcome..."
              className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 text-white text-sm focus:border-indigo-500 outline-none transition-colors h-32" 
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button onClick={onClose} className="flex-grow bg-neutral-800 text-white font-bold py-4 rounded-xl hover:bg-neutral-700 transition-all uppercase tracking-widest text-xs">Cancel</button>
            <button onClick={save} disabled={saving} className="flex-grow bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-500 transition-all uppercase tracking-widest text-xs disabled:opacity-50 flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> {saving ? 'SAVING...' : 'SAVE PROJECT'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExperienceManager({ experiences, onEdit }: { experiences: Experience[], onEdit: (e: Experience) => void }) {
  const deleteExp = async (id: string) => { 
    if (confirm('Are you sure?')) { 
      try { 
        await deleteDoc(doc(db, 'experience', id));
      } catch (err) { handleFirestoreError(err, OperationType.DELETE, `experience/${id}`); } 
    } 
  };
  return (
    <div className="grid gap-4">
      {experiences.map(e => (
        <div key={e.id} className="flex items-center gap-6 bg-neutral-900/30 p-6 rounded-2xl border border-neutral-800">
          <div className="flex-grow">
            <h4 className="font-bold text-white">{e.company}</h4>
            <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">{e.role}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onEdit(e)} className="p-3 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors"><Settings className="w-4 h-4 text-neutral-400" /></button>
            <button onClick={() => deleteExp(e.id)} className="p-3 bg-red-900/20 rounded-xl hover:bg-red-900/40 transition-colors"><Trash2 className="w-4 h-4 text-red-500" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ExperienceModal({ exp, onClose }: { exp: Experience, onClose: () => void }) {
  const [data, setData] = useState(exp);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    const id = exp?.id || Math.random().toString(36).substr(2, 9);
    const finalData = { ...data, id };
    try { 
      await setDoc(doc(db, 'experience', id), finalData);
      onClose(); 
    } catch (err) { handleFirestoreError(err, OperationType.WRITE, `experience/${id}`); }
    finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-neutral-900 w-full max-w-xl rounded-3xl p-8 border border-neutral-800">
        <h3 className="text-2xl font-black text-white mb-8 border-b border-neutral-800 pb-4 uppercase tracking-tighter">Experience Details</h3>
        <div className="space-y-6">
          <InputField label="Company" value={data.company} onChange={v => setData({...data, company: v})} icon={Briefcase} />
          <InputField label="Role" value={data.role} onChange={v => setData({...data, role: v})} icon={Monitor} />
          <InputField label="Period" value={data.period} onChange={v => setData({...data, period: v})} icon={Calendar} />
          <div>
            <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-2">Description</label>
            <textarea value={data.description} onChange={e => setData({...data, description: e.target.value})} className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 text-white text-sm focus:border-indigo-500 outline-none transition-colors h-32" />
          </div>
          <div className="flex gap-4">
            <button onClick={onClose} className="flex-grow bg-neutral-800 text-white font-bold py-4 rounded-xl hover:bg-neutral-700 transition-all uppercase tracking-widest text-xs">Cancel</button>
            <button onClick={save} disabled={saving} className="flex-grow bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-500 transition-all uppercase tracking-widest text-xs disabled:opacity-50 flex items-center justify-center gap-2"><Save className="w-4 h-4" /> {saving ? 'SAVING...' : 'SAVE EXP'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsEditor({ settings, projects }: { settings: SiteSettings, projects: Project[] }) {
  const [data, setData] = useState(settings.stats);
  const [saving, setSaving] = useState(false);

  const sync = () => {
    const webApps = projects.filter(p => p.type === 'web' || p.type === 'app').length;
    const socialProjects = projects.filter(p => p.type === 'graphic' || p.type === 'digital' || p.type === 'cpa').length;
    
    setData({
      ...data,
      webApps: `${webApps}+`,
      socialProjects: `${socialProjects}+`
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...settings, stats: data };
      console.log('Saving stats payload:', payload);
      await setDoc(doc(db, 'settings', 'global'), payload);
      alert('Stats updated successfully!');
    } catch (err) { 
      console.error('Stats save failed:', err);
      handleFirestoreError(err, OperationType.WRITE, 'settings/global'); 
    }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-neutral-900/30 p-8 rounded-3xl border border-neutral-800">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Site Statistics</h3>
          <p className="text-xs text-neutral-500 uppercase tracking-widest">Manage your public metrics</p>
        </div>
        <button 
          onClick={sync}
          className="text-[10px] uppercase font-black text-indigo-400 hover:text-indigo-300 transition-colors border border-indigo-400/20 px-4 py-2 rounded-lg hover:bg-indigo-400/5"
        >
          Sync with Portfolio
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <InputField label="Social Projects" icon={Layout} value={data.socialProjects} onChange={(v: string) => setData({...data, socialProjects: v})} />
        <InputField label="Web Apps" icon={Monitor} value={data.webApps} onChange={(v: string) => setData({...data, webApps: v})} />
        <InputField label="Success Rate" icon={Type} value={data.successRate} onChange={(v: string) => setData({...data, successRate: v})} />
      </div>

      <button onClick={save} disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
        <Save className="w-5 h-5" /> {saving ? 'SAVING...' : 'SAVE STATS'}
      </button>
    </div>
  );
}

function InputField({ label, icon: Icon, value, onChange, placeholder }: any) {
  return (
    <div>
      <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-2">{label}</label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl py-4 pl-12 pr-4 text-white text-sm focus:border-indigo-500 outline-none transition-colors"
        />
      </div>
    </div>
  );
}

function BlogsManager({ blogs, onEdit }: { blogs: Blog[], onEdit: (b: Blog) => void }) {
  const deleteBlog = async (id: string) => { 
    if (confirm('Delete this post?')) { 
      try { 
        await deleteDoc(doc(db, 'blogs', id)); 
      } catch (err) { handleFirestoreError(err, OperationType.DELETE, `blogs/${id}`); } 
    } 
  };
  
  const sorted = [...blogs].sort((a, b) => b.order - a.order);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={() => onEdit({ id: '', title: '', content: '', image: '', date: new Date().toLocaleDateString(), order: blogs.length })} 
          className="bg-white text-black px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-neutral-200 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Blog Post
        </button>
      </div>

      <div className="grid gap-4">
        {sorted.map(b => (
          <div key={b.id} className="flex items-center gap-6 bg-neutral-900/30 p-4 rounded-2xl border border-neutral-800 group">
            <img src={b.image} className="w-20 h-20 rounded-xl object-cover" alt="" />
            <div className="flex-grow">
              <h4 className="font-bold text-white">{b.title}</h4>
              <span className="text-[10px] uppercase font-bold text-neutral-500">{b.date}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onEdit(b)} className="p-3 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors"><Settings className="w-4 h-4 text-neutral-400" /></button>
              <button onClick={() => deleteBlog(b.id)} className="p-3 bg-red-900/20 rounded-xl hover:bg-red-900/40 transition-colors"><Trash2 className="w-4 h-4 text-red-500" /></button>
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="py-20 text-center text-neutral-600 italic">No posts yet.</div>
        )}
      </div>
    </div>
  );
}

function BlogModal({ blog, onClose }: { blog: Blog, onClose: () => void }) {
  const [data, setData] = useState(blog);
  const [saving, setSaving] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === 'string') {
          const compressed = await compressImage(reader.result);
          setData({ ...data, image: compressed });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      if ((data.gallery || []).length + files.length > 10) {
        alert('Max 10 images allowed per blog post.');
        return;
      }
      Array.from(files).forEach((file: any) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          if (typeof reader.result === 'string') {
            const compressed = await compressImage(reader.result, 800, 800, 0.4);
            setData(prev => ({
              ...prev,
              gallery: [...(prev.gallery || []), compressed]
            }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeGalleryImage = (index: number) => {
    setData(prev => ({
      ...prev,
      gallery: (prev.gallery || []).filter((_, i) => i !== index)
    }));
  };

  const save = async () => {
    if (!data.title || !data.image || !data.content) {
      alert('Please fill in Title, Image and Content');
      return;
    }

    const size = new Blob([JSON.stringify(data)]).size;
    if (size > 950000) {
      alert('Blog post is too large. Please use fewer or smaller images.');
      return;
    }

    setSaving(true);
    const id = blog?.id || Math.random().toString(36).substr(2, 9);
    try { 
      await setDoc(doc(db, 'blogs', id), { ...data, id });
      onClose(); 
    } catch (err) { handleFirestoreError(err, OperationType.WRITE, `blogs/${id}`); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-neutral-900 w-full max-w-xl rounded-3xl p-8 border border-neutral-800 max-h-[90vh] overflow-y-auto scrollbar-hide">
        <h3 className="text-2xl font-black text-white mb-8 border-b border-neutral-800 pb-4 uppercase tracking-tighter">Blog Entry</h3>
        <div className="space-y-6">
          <InputField label="Title" value={data.title} onChange={(v: string) => setData({...data, title: v})} icon={Type} />
          
          <div>
            <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-2">Featured Image</label>
            <div className="relative">
              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <div className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl py-4 pl-12 pr-4 text-white text-sm flex items-center justify-between">
                <span className="truncate opacity-60 italic">{fileName || 'Choose image file...'}</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>
            {data.image && (
              <div className="mt-4 rounded-xl overflow-hidden border border-neutral-800 bg-black/50 flex justify-center items-center">
                <img src={data.image} alt="Preview" className="max-w-full h-auto object-contain" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] uppercase font-bold text-neutral-500">Gallery Photos</label>
              <div className="relative">
                <button className="flex items-center gap-1 text-[10px] uppercase font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                  <Plus className="w-3 h-3" /> Add Photos
                </button>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleGalleryAdd} 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(data.gallery || []).map((img, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-neutral-800 group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => removeGalleryImage(i)}
                    className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <div className="aspect-square rounded-lg border-2 border-dashed border-neutral-800 flex items-center justify-center relative">
                <ImageIcon className="w-4 h-4 text-neutral-700" />
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleGalleryAdd} 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                />
              </div>
            </div>
          </div>

          <InputField label="Date" value={data.date} onChange={(v: string) => setData({...data, date: v})} icon={Calendar} />

          <div>
            <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-2">Blog Content / Thoughts</label>
            <textarea 
              value={data.content} 
              onChange={e => setData({...data, content: e.target.value})} 
              placeholder="What's on your mind?..."
              className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 text-white text-sm focus:border-indigo-500 outline-none transition-colors h-32" 
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button onClick={onClose} className="flex-grow bg-neutral-800 text-white font-bold py-4 rounded-xl hover:bg-neutral-700 transition-all uppercase tracking-widest text-xs">Cancel</button>
            <button onClick={save} disabled={saving} className="flex-grow bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-500 transition-all uppercase tracking-widest text-xs disabled:opacity-50 flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> {saving ? 'SAVING...' : 'SAVE POST'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
