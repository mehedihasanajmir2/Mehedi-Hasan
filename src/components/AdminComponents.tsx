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
  Mail,
  Linkedin,
  MessageCircle,
  User,
  MapPin,
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
  aboutImage?: string;
  contactImage?: string;
  bio: string;
  profileImage: string;
  email: string;
  businessEmail?: string;
  whatsapp?: string;
  linkedin?: string;
  points?: string[];
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
  logo?: string;
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
  const [activeTab, setActiveTab] = useState<'settings' | 'projects' | 'experience' | 'stats' | 'blogs' | 'contact' | 'about'>('settings');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingExp, setEditingExp] = useState<Experience | null>(null);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);

  const tabs = [
    { id: 'settings', label: 'General', icon: Settings },
    { id: 'about', label: 'About Content', icon: User },
    { id: 'contact', label: 'Contact Info', icon: Mail },
    { id: 'stats', label: 'Stats', icon: Monitor },
    { id: 'projects', label: 'Projects', icon: Layout },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'blogs', label: 'Blogs & Gallery', icon: ImageIcon },
  ] as const;

  return (
    <div className="fixed inset-0 z-[100] bg-neutral-950 flex flex-col md:flex-row h-screen overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <aside className="w-full md:w-72 bg-neutral-900/40 backdrop-blur-xl border-b md:border-b-0 md:border-r border-neutral-800/50 p-4 md:p-8 flex flex-col z-20 shrink-0">
        <div className="flex flex-row md:flex-col items-center justify-between md:justify-start gap-4 md:gap-8 mb-4 md:mb-12">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Zap className="w-5 h-5 md:w-6 h-6" fill="currentColor" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm md:text-base font-black text-white uppercase tracking-tighter leading-none">Mehedi</h1>
              <span className="text-[9px] md:text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-0.5">Control Center</span>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden p-2 rounded-xl bg-neutral-800/50 border border-neutral-700/50 text-neutral-400 hover:text-white transition-all"><X className="w-5 h-5" /></button>
        </div>

        <nav className="flex md:flex-col gap-1 md:gap-1.5 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-hide no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-none md:w-full flex items-center gap-3 px-4 py-2.5 md:py-3.5 rounded-xl text-xs md:text-sm font-black uppercase tracking-widest transition-all duration-300 group ${
                activeTab === tab.id 
                ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/30' 
                : 'text-neutral-500 hover:text-neutral-100 hover:bg-neutral-800/50'
              }`}
            >
              <tab.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'text-white' : 'text-neutral-600 group-hover:text-indigo-400'}`} />
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-neutral-800/50 hidden md:block">
          <div className="flex items-center gap-3 p-3 bg-neutral-800/30 rounded-2xl border border-neutral-800/50 mb-4 overflow-hidden">
            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-neutral-700">
              <img src={settings.profileImage} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-[10px] font-black text-white uppercase tracking-tight truncate">{settings.name}</span>
              <span className="text-[9px] font-bold text-neutral-600 truncate">{user.email}</span>
            </div>
          </div>
          <button onClick={() => { 
            logout(); 
            sessionStorage.removeItem('admin_authenticated');
            localStorage.removeItem('admin_session_expiry');
            onClose(); 
          }} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-300">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-grow overflow-y-auto p-4 md:p-16 relative z-10 custom-scrollbar scroll-smooth">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-20">
            <div>
              <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600 mb-2">
                <span>Admin</span>
                <span className="w-4 h-px bg-neutral-800" />
                <span className="text-indigo-500">{activeTab}</span>
              </nav>
              <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">{activeTab}</h2>
            </div>
            <div className="flex gap-3">
              {activeTab === 'experience' && (
                <button 
                  onClick={() => setEditingExp({ id: '', company: '', role: '', period: '', description: '', order: experiences.length })} 
                  className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Add Experience
                </button>
              )}
              <button onClick={onClose} className="flex items-center gap-2 bg-neutral-800/80 backdrop-blur-md text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-700 transition-all active:scale-95 border border-neutral-700/50">
                <X className="w-4 h-4" /> Close Panel
              </button>
            </div>
          </div>
          
          {activeTab === 'settings' && <SettingsEditor settings={settings} />}
          {activeTab === 'about' && <AboutEditor settings={settings} />}
          {activeTab === 'contact' && <ContactInfoEditor settings={settings} />}
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

  React.useEffect(() => {
    setData(settings);
  }, [settings]);

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
      await setDoc(doc(db, 'settings', 'global'), data);
      alert('Settings saved successfully!');
    } catch (err) { 
      handleFirestoreError(err, OperationType.WRITE, 'settings/global'); 
    }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-900/40 p-6 md:p-10 rounded-[32px] border border-neutral-800/50 backdrop-blur-sm shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Settings className="w-32 h-32" />
        </div>
        <InputField label="Name" icon={Type} value={data.name} onChange={v => setData({...data, name: v})} />
        <InputField label="Surname" icon={Type} value={data.surname} onChange={v => setData({...data, surname: v})} />
        <InputField label="Role" icon={Monitor} value={data.role} onChange={v => setData({...data, role: v})} />
        <InputField label="Email" icon={Mail} value={data.email} onChange={v => setData({...data, email: v})} />

        <div className="md:col-span-2 border-t border-neutral-800/50 pt-8 mt-4">
          <label className="block text-[10px] uppercase font-black text-neutral-500 mb-6 tracking-[0.2em]">Profile Identity</label>
          <div className="flex flex-col md:flex-row items-center gap-8 bg-neutral-950/50 p-6 rounded-2xl border border-neutral-800/50">
            <div className="relative group/photo">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-neutral-800 shadow-2xl bg-neutral-900 flex-shrink-0 transition-transform group-hover/photo:scale-105 duration-500">
                {data.profileImage ? (
                  <img src={data.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-700">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
              </div>
              <div className="absolute bottom-2 right-2 w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white border-4 border-neutral-900 shadow-xl cursor-help">
                <Zap className="w-4 h-4" fill="currentColor" />
              </div>
            </div>
            
            <div className="flex-grow text-center md:text-left">
              <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
                <div className="relative inline-block">
                  <button className="bg-white text-black px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-all shadow-xl active:scale-95">
                    Update Profile
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
                
                <div className="relative inline-block">
                  <button className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/30 transition-all active:scale-95">
                    Update Contact
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
                            const compressed = await compressImage(reader.result, 600, 600, 0.8);
                            setData({ ...data, contactImage: compressed });
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }} 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                  />
                </div>

                <div className="relative inline-block">
                  <button className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/30 transition-all active:scale-95">
                    Update About
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
                            const compressed = await compressImage(reader.result, 800, 800, 0.8);
                            setData({ ...data, aboutImage: compressed });
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }} 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                  />
                </div>
              </div>
              <p className="text-[9px] text-neutral-500 mt-4 uppercase font-bold tracking-widest leading-loose">Square for Profile. Landscape for Contact/About overrides.<br/>Current: {data.contactImage ? 'Custom Contact Set' : 'Using Profile for Contact'} | {data.aboutImage ? 'Custom About Set' : 'Using Profile for About'}</p>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-2 border-t border-neutral-800/50 pt-8 mt-4">
          <div className="flex items-center justify-between mb-6">
            <label className="block text-[10px] uppercase font-black text-neutral-500 tracking-[0.2em]">Skill Highlights</label>
            <button 
              onClick={addPoint}
              className="flex items-center gap-2 text-[10px] uppercase font-black text-indigo-400 hover:text-white transition-all bg-indigo-500/10 px-4 py-2 rounded-lg border border-indigo-500/20"
            >
              <Plus className="w-3 h-3" /> Add Highlight
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {points.map((point, index) => (
              <div key={index} className="relative group/point transform transition-all hover:translate-x-1 duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-neutral-800/50 border border-neutral-700/50 flex items-center justify-center text-neutral-500 group-hover/point:text-indigo-400 group-hover/point:border-indigo-400/30 transition-all shrink-0">
                    <span className="text-[10px] font-black">{index + 1}</span>
                  </div>
                  <div className="flex-grow">
                    <input
                      type="text"
                      value={point}
                      onChange={e => updatePoint(index, e.target.value)}
                      placeholder="e.g. Expert in Creative Solutions..."
                      className="w-full bg-neutral-800/30 border border-neutral-800/50 rounded-xl py-4 px-6 text-white text-sm focus:border-indigo-500/50 outline-none transition-all placeholder:text-neutral-700"
                    />
                  </div>
                  <button 
                    onClick={() => removePoint(index)}
                    className="p-3 text-neutral-600 hover:text-red-500 transition-all hover:bg-red-500/10 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 pt-8 border-t border-neutral-800/50 mt-4">
          <label className="block text-[10px] uppercase font-black text-neutral-500 mb-4 tracking-[0.2em]">Short Bio</label>
          <div className="relative group/bio">
            <AlignLeft className="absolute right-4 top-4 w-4 h-4 text-neutral-700 group-focus-within/bio:text-indigo-500 transition-colors" />
            <textarea 
              value={data.bio} 
              onChange={e => setData({...data, bio: e.target.value})} 
              className="w-full bg-neutral-800/30 border border-neutral-700/50 rounded-2xl p-6 text-white text-sm focus:border-indigo-500/50 outline-none transition-all h-32 resize-none leading-relaxed placeholder:italic" 
              placeholder="A short punchy bio for the homepage..."
            />
          </div>
        </div>
        <button 
          onClick={save} 
          disabled={saving} 
          className="md:col-span-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-[20px] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-indigo-600/30 active:scale-[0.98] mt-4 uppercase tracking-[0.3em] text-xs"
        >
          {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? 'Processing...' : 'Sync Settings'}
        </button>
      </div>
    </div>
  );
}

function ProjectsManager({ projects, onEdit }: { projects: Project[], onEdit: (p: Project) => void }) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'web' | 'app' | 'graphic' | 'digital' | 'cpa'>('all');

  const deleteProject = async (id: string) => { 
    if (confirm('Permanently remove this project from your portfolio?')) { 
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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4 p-2 bg-neutral-950/30 rounded-[24px] border border-neutral-800/30">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`flex flex-col items-center justify-center gap-2 md:gap-3 p-3 md:p-6 rounded-2xl border transition-all duration-300 relative group overflow-hidden ${
                activeFilter === tab.id 
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-500/20' 
                : 'bg-transparent border-transparent text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/40'
              }`}
            >
              {activeFilter === tab.id && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
              )}
              <Icon className={`w-4 h-4 md:w-5 h-5 transition-transform group-active:scale-90 ${activeFilter === tab.id ? 'text-white' : 'text-neutral-600'}`} />
              <span className="text-[8px] md:text-[9px] uppercase font-black tracking-[0.2em]">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800/50 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
          <h3 className="text-xs uppercase font-black tracking-[0.3em] text-neutral-400">
            Cataloging: <span className="text-white">{activeFilter} Works</span>
          </h3>
        </div>
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
            className="group bg-white text-black px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-neutral-200 transition-all active:scale-95 shadow-xl shadow-white/5"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" /> 
            Add New {activeFilter}
          </button>
        )}
      </div>

      <div className="grid gap-6">
        {filtered.map((p, idx) => (
          <div 
            key={p.id} 
            className="flex items-center gap-5 md:gap-8 bg-neutral-900/40 backdrop-blur-sm p-4 md:p-6 rounded-[28px] border border-neutral-800/50 group/item hover:border-indigo-500/30 hover:bg-neutral-800/40 transition-all duration-500"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="relative shrink-0">
              <img src={p.image} className="w-16 h-16 md:w-24 md:h-24 rounded-2xl object-cover border border-neutral-800 shadow-xl group-hover/item:scale-105 transition-transform duration-500" alt="" />
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-[9px] font-black border-2 border-neutral-900 shadow-lg">
                {idx + 1}
              </div>
            </div>
            
            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-2 mb-1 md:mb-2">
                <span className="text-[9px] uppercase font-black text-indigo-400 tracking-[0.2em] bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">{p.type}</span>
                {p.dateReceived && <span className="text-[9px] uppercase font-bold text-neutral-600 tracking-widest">{p.dateReceived}</span>}
              </div>
              <h4 className="font-black text-white text-base md:text-lg truncate group-hover/item:text-indigo-400 transition-colors">{p.title}</h4>
              <p className="text-neutral-500 text-xs truncate max-w-md hidden md:block">{p.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => onEdit(p)} 
                className="p-3.5 bg-neutral-800/80 rounded-2xl hover:bg-indigo-500 hover:text-white text-neutral-400 transition-all hover:shadow-lg hover:shadow-indigo-500/20 border border-neutral-700/50 group/btn"
              >
                <Settings className="w-4 h-4 group-hover/btn:rotate-90 transition-transform duration-500" />
              </button>
              <button 
                onClick={() => deleteProject(p.id)} 
                className="p-3.5 bg-red-950/20 rounded-2xl hover:bg-red-500 hover:text-white text-red-500 transition-all border border-red-900/20"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-24 text-center rounded-[32px] border-2 border-dashed border-neutral-900 group">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center text-neutral-800 group-hover:bg-neutral-800 group-hover:text-neutral-700 transition-all">
                <Layout className="w-8 h-8" />
              </div>
              <p className="text-neutral-600 italic tracking-widest uppercase text-[10px] font-black">No artifacts found in this sector</p>
            </div>
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
        alert('File payload limit (1MB) exceeded. For larger builds, please provide a direct cloud link.');
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
        alert('Gallery quota reached (8 items max). Recalibrate your selection.');
        return;
      }
      Array.from(files).forEach((file: any) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          if (typeof reader.result === 'string') {
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
      alert('Incomplete data. Verify Title, Identity Image, and Description.');
      return;
    }

    const size = new Blob([JSON.stringify(data)]).size;
    if (size > 950000) {
      alert('Maximum document size exceeded. Reduce photo resolution or gallery count.');
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

  const titleLabel = data.type === 'app' ? 'Application Identity' : 'Project Title';

  return (
    <div className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-4 md:p-8 backdrop-blur-xl animate-in fade-in duration-500">
      <div 
        className="absolute inset-0 z-0" 
        onClick={onClose}
      />
      
      <div className="bg-neutral-900 w-full max-w-2xl rounded-[40px] border border-neutral-800/50 shadow-[0_0_80px_rgba(0,0,0,0.5)] max-h-full overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-500 relative">
        <div className="p-8 border-b border-neutral-800/50 flex items-center justify-between bg-neutral-950/30 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
              <Layout className="w-5 h-5" />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">Manifest Entry</h3>
          </div>
          <button onClick={onClose} className="p-3 bg-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-all"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-grow p-8 md:p-12 space-y-10 overflow-y-auto custom-scrollbar">
          <InputField label={titleLabel} value={data.title} onChange={(v: string) => setData({...data, title: v})} icon={Type} />
          
          <div className="space-y-6">
            <label className="block text-[10px] uppercase font-black text-neutral-500 tracking-widest">Visual Cover</label>
            <div className="relative group/cover">
              <div className="absolute inset-0 bg-indigo-500/10 rounded-3xl opacity-0 group-hover/cover:opacity-100 transition-opacity pointer-events-none" />
              <div className={`w-full aspect-[16/9] rounded-3xl border-2 border-dashed ${data.image ? 'border-indigo-500/50 bg-neutral-950' : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700'} overflow-hidden transition-all relative flex flex-col items-center justify-center gap-4`}>
                {data.image ? (
                  <img src={data.image} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center text-neutral-700">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-neutral-600 tracking-widest">Select Visual Cover</span>
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                />
              </div>
              {data.image && (
                <p className="text-[9px] uppercase font-black text-indigo-400 mt-3 text-center tracking-[0.2em] animate-pulse">Select again to swap cover</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] uppercase font-black text-neutral-500 tracking-widest">Supporting Gallery</label>
              <div className="relative">
                <button className="flex items-center gap-2 text-[10px] uppercase font-black text-indigo-400 hover:text-white transition-all bg-indigo-500/10 px-4 py-2 rounded-lg border border-indigo-500/20">
                  <Plus className="w-3 h-3" /> Insert Frame
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
            
            <div className="grid grid-cols-4 gap-3 bg-neutral-950/30 p-4 rounded-3xl border border-neutral-800/50">
              {(data.gallery || []).map((img, i) => (
                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-neutral-800 group/gal">
                  <img src={img} alt="" className="w-full h-full object-cover transition-transform group-hover/gal:scale-110 duration-500" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/gal:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => removeGalleryImage(i)}
                      className="p-2 bg-red-500 text-white rounded-xl shadow-xl transform translate-y-2 group-hover/gal:translate-y-0 transition-all duration-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {(data.gallery || []).length < 8 && (
                <div className="aspect-square rounded-2xl border-2 border-dashed border-neutral-800 flex flex-col items-center justify-center relative hover:border-neutral-700 transition-colors group/galplus">
                  <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center text-neutral-700 group-hover/galplus:bg-neutral-800 group-hover/galplus:text-neutral-500 transition-all">
                    <Plus className="w-4 h-4" />
                  </div>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    onChange={handleGalleryAdd} 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                  />
                </div>
              )}
            </div>
          </div>

          <InputField label="Direct Transmission Link" value={data.link} onChange={(v: string) => setData({...data, link: v})} icon={LinkIcon} placeholder="https://..." />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
            <InputField label="Genesis Date" value={data.dateReceived || ''} onChange={(v: string) => setData({...data, dateReceived: v})} icon={Calendar} placeholder="e.g. Q2 2024" />
            <InputField label="Execution Period" value={data.completionTime || ''} onChange={(v: string) => setData({...data, completionTime: v})} icon={Briefcase} placeholder="e.g. 14 Days" />
          </div>

          {data.type === 'app' && (
            <div className="bg-indigo-600/5 p-8 rounded-[32px] border border-indigo-500/20 space-y-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Smartphone className="w-24 h-24" />
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] uppercase font-black text-indigo-400 tracking-[0.2em]">Application Icon</label>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-indigo-500/30 bg-neutral-950 flex-shrink-0 shadow-2xl relative group/logo">
                    {data.appLogo ? (
                      <img src={data.appLogo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-800">
                        <Smartphone className="w-8 h-8" />
                      </div>
                    )}
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
                      className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Status: {data.appLogo ? 'Configured' : 'Missing'}</span>
                    <p className="text-[9px] text-neutral-600 leading-relaxed max-w-[180px] uppercase font-black">Tap the icon frame to upload logo (PNG/JPG)</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                   <label className="block text-[10px] uppercase font-black text-white tracking-widest">Build Distribution</label>
                </div>
                
                <div className="space-y-4">
                   <div className="group/dist relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 group-focus-within/dist:scale-110 transition-transform" />
                    <input
                      type="text"
                      value={data.downloadUrl?.startsWith('data:') ? '' : data.downloadUrl}
                      onChange={(v) => {
                        setData({...data, downloadUrl: v.target.value, downloadFileName: 'External Build'});
                        setAppFileName('External Build');
                      }}
                      placeholder="Transmission Link (Direct/Cloud)..."
                      className="w-full bg-neutral-950/50 border border-indigo-500/20 rounded-2xl py-5 pl-12 pr-4 text-white text-sm focus:border-indigo-500/50 outline-none transition-all placeholder:text-neutral-700"
                    />
                  </div>

                  <div className="relative group/up">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 group-hover/up:rotate-12 transition-transform" />
                    <div className="w-full bg-neutral-950/50 border border-indigo-500/20 rounded-2xl py-5 pl-12 pr-4 text-white text-sm flex items-center justify-between cursor-pointer hover:bg-neutral-950 transition-colors">
                      <span className="truncate opacity-60 italic font-mono text-xs">{appFileName || 'Upload Direct APK artifact...'}</span>
                      <input 
                        type="file" 
                        onChange={handleAppUpload} 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                      />
                      <Plus className="w-4 h-4 text-indigo-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <label className="block text-[10px] uppercase font-black text-neutral-500 tracking-widest">Manifest Brief</label>
            <textarea 
              value={data.description} 
              onChange={e => setData({...data, description: e.target.value})} 
              placeholder="Synthesize project objectives and technical execution..."
              className="w-full bg-neutral-950/50 border border-neutral-800 rounded-3xl p-6 text-white text-base leading-relaxed focus:border-indigo-500/50 outline-none transition-all h-40 resize-none custom-scrollbar" 
            />
          </div>
        </div>

        <div className="p-8 border-t border-neutral-800/50 bg-neutral-950/30 backdrop-blur-md flex flex-row gap-4 sticky bottom-0 z-20">
          <button onClick={onClose} className="flex-grow bg-neutral-800 text-white font-black py-5 rounded-2xl hover:bg-neutral-700 transition-all uppercase tracking-[0.2em] text-[10px]">Erase</button>
          <button 
            onClick={save} 
            disabled={saving} 
            className="flex-grow-[2] bg-indigo-600 text-white font-black py-5 rounded-2xl hover:bg-indigo-500 transition-all uppercase tracking-[0.3em] text-[10px] disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 active:scale-95"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Syncing...' : 'Seal Manifest'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ExperienceManager({ experiences, onEdit }: { experiences: Experience[], onEdit: (e: Experience) => void }) {
  const deleteExp = async (id: string) => { 
    if (confirm('Erase this career node from history?')) { 
      try { 
        await deleteDoc(doc(db, 'experience', id));
      } catch (err) { handleFirestoreError(err, OperationType.DELETE, `experience/${id}`); } 
    } 
  };
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
            <Briefcase className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Career Timeline</h3>
            <p className="text-[10px] uppercase font-black text-neutral-500 tracking-[0.2em]">Professional journey and milestones</p>
          </div>
        </div>
        <button 
          onClick={() => onEdit({ id: '', company: '', role: '', period: '', description: '', logo: '', order: experiences.length })}
          className="flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-600/20 active:scale-95 group"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          Archive Experience
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {experiences.map(e => (
          <div 
            key={e.id} 
            className="group relative bg-neutral-900/40 backdrop-blur-sm border border-neutral-800/50 p-8 rounded-[32px] hover:border-indigo-500/30 transition-all duration-500 overflow-hidden"
          >
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
            
            <div className="flex flex-col md:flex-row md:items-center gap-8">
              <div className="w-20 h-20 bg-neutral-950 rounded-3xl flex-shrink-0 flex items-center justify-center border border-neutral-800 group-hover:border-indigo-500/40 transition-colors overflow-hidden shadow-2xl">
                {e.logo ? (
                  <img src={e.logo} alt="" className="w-full h-full object-cover p-2" />
                ) : (
                  <Briefcase className="w-8 h-8 text-neutral-700" />
                )}
              </div>
              <div className="flex-grow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                  <div>
                    <h4 className="text-white text-xl font-black uppercase tracking-tight group-hover:text-indigo-400 transition-colors">{e.role}</h4>
                    <span className="text-indigo-400/70 font-bold text-xs uppercase tracking-widest">{e.company}</span>
                  </div>
                  <div className="px-4 py-1.5 bg-neutral-950 rounded-full border border-neutral-800 text-neutral-400 font-mono text-[10px] w-fit">
                    {e.period}
                  </div>
                </div>
                <p className="text-neutral-500 text-sm leading-relaxed max-w-2xl line-clamp-2 uppercase font-black tracking-tight">{e.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => onEdit(e)}
                  className="px-6 py-4 bg-neutral-800 hover:bg-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 hover:text-white rounded-xl transition-all"
                >
                  Modify
                </button>
                <button 
                  onClick={() => deleteExp(e.id)}
                  className="p-4 bg-red-950/20 hover:bg-red-500 text-red-500 hover:text-white rounded-xl border border-red-900/20 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExperienceModal({ exp, onClose }: { exp: Experience, onClose: () => void }) {
  const [data, setData] = useState(exp);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!data.company || !data.role || !data.period) {
       alert('Verify Corporate Entity, Role, and Performance Period.');
       return;
    }
    setSaving(true);
    const id = exp?.id || Math.random().toString(36).substr(2, 9);
    const finalData = { ...data, id };
    try { 
      await setDoc(doc(db, 'experience', id), finalData);
      onClose(); 
    } catch (err) { handleFirestoreError(err, OperationType.WRITE, `experience/${id}`); }
    finally { setSaving(false); }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === 'string') {
          const compressed = await compressImage(reader.result, 200, 200, 0.9);
          setData({ ...data, logo: compressed });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-4 md:p-8 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="absolute inset-0 z-0" onClick={onClose} />
      
      <div className="bg-neutral-900 w-full max-w-xl rounded-[40px] border border-neutral-800/50 shadow-2xl max-h-full overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-500 relative">
        <div className="p-8 border-b border-neutral-800/50 flex items-center justify-between bg-neutral-950/30">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Timeline Entry</h3>
          </div>
          <button onClick={onClose} className="p-3 bg-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-all"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-grow p-8 md:p-12 space-y-10 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col md:flex-row items-center gap-8 bg-neutral-950/50 p-6 rounded-3xl border border-neutral-800/50">
            <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-indigo-500/20 bg-neutral-950 flex-shrink-0 relative group">
              {data.logo ? (
                <img src={data.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-800">
                  <Briefcase className="w-8 h-8" />
                </div>
              )}
              <input type="file" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
            </div>
            <div className="flex-grow space-y-2 text-center md:text-left">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Entity Identifier</span>
              <p className="text-[11px] text-neutral-500 leading-relaxed uppercase font-bold">Upload a distinctive company emblem or symbol (PNG/JPG)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InputField label="Corporate Entity" value={data.company} onChange={(v: string) => setData({...data, company: v})} icon={MapPin} placeholder="e.g. Google Cloud" />
            <InputField label="Genesis Period" value={data.period} onChange={(v: string) => setData({...data, period: v})} icon={Calendar} placeholder="e.g. 2022 - 2024" />
          </div>

          <InputField label="Operational Role" value={data.role} onChange={(v: string) => setData({...data, role: v})} icon={Briefcase} placeholder="e.g. Lead Developer" />
          
          <div className="space-y-4">
            <label className="block text-[10px] uppercase font-black text-neutral-500 tracking-widest">Entry Digest</label>
            <textarea 
              value={data.description} 
              onChange={e => setData({...data, description: e.target.value})} 
              placeholder="Synthesize core responsibilities and tactical achievements..."
              className="w-full bg-neutral-950/50 border border-neutral-800 rounded-3xl p-6 text-white text-base leading-relaxed focus:border-indigo-500/50 outline-none transition-all h-40 resize-none custom-scrollbar" 
            />
          </div>
        </div>

        <div className="p-8 border-t border-neutral-800/50 bg-neutral-950/30 backdrop-blur-md flex flex-row gap-4 sticky bottom-0 z-20">
          <button onClick={onClose} className="flex-grow bg-neutral-800 text-white font-black py-5 rounded-2xl hover:bg-neutral-700 transition-all uppercase tracking-[0.2em] text-[10px]">Abandon</button>
          <button 
            onClick={save} 
            disabled={saving} 
            className="flex-grow-[2] bg-blue-600 text-white font-black py-5 rounded-2xl hover:bg-blue-500 transition-all uppercase tracking-[0.3em] text-[10px] disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 active:scale-95"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Transmitting...' : 'Solidify Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactInfoEditor({ settings }: { settings: SiteSettings }) {
  const [data, setData] = useState(settings);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setData(settings);
  }, [settings]);

  const save = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), data);
      alert('Contact networks established successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/global');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-neutral-900/40 backdrop-blur-sm p-8 md:p-12 rounded-[40px] border border-neutral-800/50 shadow-2xl relative overflow-hidden group animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] group-hover:bg-indigo-500/10 transition-colors" />
      
      <div className="flex items-center gap-6 mb-12">
        <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
          <Share2 className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Connection Nodes</h3>
          <p className="text-[10px] uppercase font-black text-neutral-500 tracking-[0.2em]">Manage your digital communication channels</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <InputField 
          label="Primary Email" 
          icon={Mail} 
          value={data.email} 
          onChange={(v: string) => setData({...data, email: v})} 
          placeholder="e.g. personal@email.com"
        />
        <InputField 
          label="Professional Inquiries" 
          icon={Briefcase} 
          value={data.businessEmail || ''} 
          onChange={(v: string) => setData({...data, businessEmail: v})} 
          placeholder="e.g. business@company.com"
        />
        <InputField 
          label="Direct WhatsApp" 
          icon={MessageCircle} 
          value={data.whatsapp || ''} 
          onChange={(v: string) => setData({...data, whatsapp: v})} 
          placeholder="Include country code (+880...)"
        />
        <InputField 
          label="LinkedIn Profile" 
          icon={Linkedin} 
          value={data.linkedin || ''} 
          onChange={(v: string) => setData({...data, linkedin: v})} 
          placeholder="Username only (e.g. mehedi-hasan)"
        />
      </div>

      <div className="border-t border-neutral-800/50 pt-8 mt-4 mb-10">
        <label className="block text-[10px] uppercase font-black text-neutral-500 mb-6 tracking-[0.2em]">Contact Display Identity</label>
        <div className="flex flex-col md:flex-row items-center gap-8 bg-neutral-950/50 p-6 rounded-2xl border border-neutral-800/50">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden border-2 border-indigo-500/20 bg-neutral-900 shrink-0">
            {data.contactImage || data.profileImage ? (
              <img src={data.contactImage || data.profileImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-800">
                <ImageIcon className="w-8 h-8" />
              </div>
            )}
          </div>
          <div className="flex-grow text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="relative inline-block">
                <button className="bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-400 transition-all shadow-xl active:scale-95">
                  Update Contact Photo
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
                          const compressed = await compressImage(reader.result, 600, 600, 0.8);
                          setData({ ...data, contactImage: compressed });
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                />
              </div>
              {data.contactImage && (
                <button 
                  onClick={() => setData({ ...data, contactImage: '' })}
                  className="bg-neutral-800 text-neutral-400 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-700 hover:text-white transition-all active:scale-95"
                >
                  Reset
                </button>
              )}
            </div>
            <p className="text-[9px] text-neutral-500 mt-4 uppercase font-bold tracking-widest leading-loose">This photo appears in the Email/Contact modal. If missing, profile photo is used.</p>
          </div>
        </div>
      </div>

      <button 
        onClick={save} 
        disabled={saving} 
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-[22px] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-indigo-600/30 active:scale-[0.98] uppercase tracking-[0.3em] text-xs"
      >
        {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
        {saving ? 'Transmitting...' : 'Update Networks'}
      </button>
    </div>
  );
}

function AboutEditor({ settings }: { settings: SiteSettings }) {
  const [data, setData] = useState(settings);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setData(settings);
  }, [settings]);

  const save = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), data);
      alert('Narrative data updated successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/global');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-neutral-900/40 backdrop-blur-sm p-8 md:p-12 rounded-[40px] border border-neutral-800/50 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-6 mb-10">
          <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Your Narrative</h3>
            <p className="text-[10px] uppercase font-black text-neutral-500 tracking-[0.2em]">Detailed biographical data for the about section</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex flex-col md:flex-row items-center gap-8 bg-neutral-950/50 p-6 rounded-3xl border border-neutral-800/50 mb-8">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] overflow-hidden border-2 border-blue-500/20 bg-neutral-900 shrink-0 shadow-2xl">
              {data.aboutImage || data.profileImage ? (
                <img src={data.aboutImage || data.profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-800">
                  <ImageIcon className="w-10 h-10" />
                </div>
              )}
            </div>
            <div className="flex-grow text-center md:text-left">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-4">Biographical Portrait</span>
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <div className="relative inline-block">
                  <button className="bg-blue-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl active:scale-95">
                    Update About Photo
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
                            const compressed = await compressImage(reader.result, 800, 800, 0.8);
                            setData({ ...data, aboutImage: compressed });
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }} 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                  />
                </div>
                {data.aboutImage && (
                  <button 
                    onClick={() => setData({ ...data, aboutImage: '' })}
                    className="bg-neutral-800 text-neutral-400 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-700 hover:text-white transition-all active:scale-95"
                  >
                    Reset
                  </button>
                )}
              </div>
              <p className="text-[9px] text-neutral-600 mt-4 uppercase font-bold tracking-widest leading-loose">Portrait used in the detailed About overlay. If missing, profile photo is used.</p>
            </div>
          </div>

          <div className="group/about relative">
            <div className="flex items-center justify-between mb-4 px-2">
              <label className="block text-[10px] uppercase font-black text-neutral-500 tracking-widest group-focus-within/about:text-indigo-400 transition-colors">Long Bio Content</label>
              <div className="text-[9px] font-bold text-neutral-700 bg-neutral-950 px-3 py-1 rounded-full border border-neutral-800">Support Markdown / Plain Text</div>
            </div>
            <textarea 
              value={data.about || ''} 
              onChange={e => setData({...data, about: e.target.value})} 
              placeholder="Tell your life story, professional journey, and what drives you..."
              className="w-full bg-neutral-950/50 border border-neutral-800 rounded-3xl p-8 text-white text-base leading-relaxed focus:border-indigo-500/50 outline-none transition-all h-[500px] resize-none custom-scrollbar shadow-inner" 
            />
          </div>

          <button 
            onClick={save} 
            disabled={saving} 
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-[22px] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-indigo-600/30 active:scale-[0.98] uppercase tracking-[0.3em] text-xs"
          >
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Syncing Narrative...' : 'Protect Narrative'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatsEditor({ settings, projects }: { settings: SiteSettings, projects: Project[] }) {
  const [data, setData] = useState(settings.stats);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setData(settings.stats);
  }, [settings.stats]);

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
      await setDoc(doc(db, 'settings', 'global'), payload);
      alert('Portfolio metrics recalibrated!');
    } catch (err) { 
      handleFirestoreError(err, OperationType.WRITE, 'settings/global'); 
    }
    finally { setSaving(false); }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-neutral-900/40 backdrop-blur-sm p-8 md:p-12 rounded-[40px] border border-neutral-800/50 shadow-2xl relative overflow-hidden group">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <Monitor className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Growth Matrix</h3>
              <p className="text-[10px] uppercase font-black text-neutral-500 tracking-[0.2em]">Visualizing success across sectors</p>
            </div>
          </div>
          <button 
            onClick={sync}
            className="flex items-center gap-3 px-6 py-3 rounded-xl bg-neutral-950 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white border border-neutral-800 hover:border-indigo-400/40 transition-all active:scale-95 group/sync shadow-lg"
          >
            <Zap className="w-4 h-4 group-hover:fill-indigo-500 transition-colors" />
            Auto-Sync with Data
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-neutral-950/50 p-6 rounded-3xl border border-neutral-800/50 transform transition-all hover:scale-105 duration-500 group-hover:border-indigo-500/20">
            <InputField label="Marketing Influence" icon={Layout} value={data.socialProjects} onChange={(v: string) => setData({...data, socialProjects: v})} />
          </div>
          <div className="bg-neutral-950/50 p-6 rounded-3xl border border-neutral-800/50 transform transition-all hover:scale-105 duration-500 group-hover:border-blue-500/20 shadow-xl">
            <InputField label="Technical Apps" icon={Monitor} value={data.webApps} onChange={(v: string) => setData({...data, webApps: v})} />
          </div>
          <div className="bg-neutral-950/50 p-6 rounded-3xl border border-neutral-800/50 transform transition-all hover:scale-105 duration-500 group-hover:border-green-500/20">
            <InputField label="Conversion Rate" icon={Type} value={data.successRate} onChange={(v: string) => setData({...data, successRate: v})} />
          </div>
        </div>

        <button 
          onClick={save} 
          disabled={saving} 
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-[22px] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-indigo-600/30 active:scale-[0.98] uppercase tracking-[0.3em] text-xs"
        >
          {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? 'Processing Matrix...' : 'Lock Matrix'}
        </button>
      </div>
    </div>
  );
}

function InputField({ label, icon: Icon, value, onChange, placeholder }: any) {
  return (
    <div className="group/field w-full">
      <label className="block text-[10px] uppercase font-black text-neutral-500 mb-3 tracking-widest transition-colors group-focus-within/field:text-indigo-400">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-neutral-800/50 border border-neutral-700/50 flex items-center justify-center text-neutral-500 group-focus-within/field:bg-indigo-500 group-focus-within/field:text-white transition-all duration-300">
          <Icon className="w-3.5 h-3.5" />
        </div>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-neutral-800/20 md:bg-neutral-800/40 border border-neutral-800/50 rounded-xl py-4 pl-16 pr-4 text-white text-sm focus:border-indigo-500/50 outline-none transition-all duration-300 hover:bg-neutral-800/50"
        />
      </div>
    </div>
  );
}

function BlogsManager({ blogs, onEdit }: { blogs: Blog[], onEdit: (b: Blog) => void }) {
  const deleteBlog = async (id: string) => { 
    if (confirm('Delete this archival post?')) { 
      try { 
        await deleteDoc(doc(db, 'blogs', id)); 
      } catch (err) { handleFirestoreError(err, OperationType.DELETE, `blogs/${id}`); } 
    } 
  };
  
  const sorted = [...blogs].sort((a, b) => b.order - a.order);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-indigo-600/5 border border-indigo-500/20 p-8 rounded-[32px]">
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-1">Journal & Media</h3>
          <p className="text-[10px] uppercase font-black text-indigo-400 tracking-[0.2em]">Archiving experiences and insights</p>
        </div>
        <button 
          onClick={() => onEdit({ id: '', title: '', content: '', image: '', date: new Date().toLocaleDateString(), order: blogs.length })} 
          className="group bg-white text-black px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-neutral-200 transition-all active:scale-95 shadow-xl shadow-white/5 whitespace-nowrap"
        >
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" /> 
          Compose Entry
        </button>
      </div>

      <div className="grid gap-4">
        {sorted.map((b, idx) => (
          <div 
            key={b.id} 
            className="flex items-center gap-6 bg-neutral-900/40 backdrop-blur-sm p-4 rounded-[28px] border border-neutral-800/50 group/item hover:border-indigo-500/30 hover:bg-neutral-800/40 transition-all duration-500"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="relative shrink-0">
              <img src={b.image} className="w-20 h-20 rounded-2xl object-cover border border-neutral-800 shadow-xl group-hover/item:scale-105 transition-transform duration-500" alt="" />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-black/80 backdrop-blur-md rounded-lg flex items-center justify-center text-white border border-neutral-800 shadow-lg">
                <ImageIcon className="w-3.5 h-3.5 text-neutral-400" />
              </div>
            </div>
            
            <div className="flex-grow min-w-0">
              <span className="text-[9px] uppercase font-black text-neutral-600 tracking-[0.2em] mb-1 block">{b.date}</span>
              <h4 className="font-black text-white text-base md:text-lg truncate group-hover/item:text-indigo-400 transition-colors uppercase tracking-tight">{b.title}</h4>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => onEdit(b)} 
                className="p-3.5 bg-neutral-800/80 rounded-2xl hover:bg-indigo-500 hover:text-white text-neutral-400 transition-all hover:shadow-lg border border-neutral-700/50"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button 
                onClick={() => deleteBlog(b.id)} 
                className="p-3.5 bg-red-950/20 rounded-2xl hover:bg-red-500 hover:text-white text-red-500 transition-all border border-red-900/20"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="py-24 text-center rounded-[32px] border-2 border-dashed border-neutral-900">
            <p className="text-neutral-700 italic tracking-widest uppercase text-[9px] font-black">History is unwritten</p>
          </div>
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
          const compressed = await compressImage(reader.result, 1200, 800, 0.6);
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
        alert('Intel overflow (10 items max per broadcast).');
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
      alert('Incomplete transmission. Verify Title, Cover Artifact, and Intelligence Content.');
      return;
    }

    const size = new Blob([JSON.stringify(data)]).size;
    if (size > 950000) {
      alert('Signal strength exceeded (Doc too large). Reduce photo resolution or gallery count.');
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
    <div className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-4 md:p-8 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="absolute inset-0 z-0" onClick={onClose} />
      
      <div className="bg-neutral-900 w-full max-w-2xl rounded-[40px] border border-neutral-800/50 shadow-2xl max-h-full overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-500 relative">
        <div className="p-8 border-b border-neutral-800/50 flex items-center justify-between bg-neutral-950/30 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Intel Publication</h3>
          </div>
          <button onClick={onClose} className="p-3 bg-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-all"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-grow p-8 md:p-12 space-y-10 overflow-y-auto custom-scrollbar">
          <InputField label="Intel Designation" value={data.title} onChange={(v: string) => setData({...data, title: v})} icon={Type} placeholder="e.g. Design Systems Implementation" />
          
          <div className="space-y-6">
            <label className="block text-[10px] uppercase font-black text-neutral-500 tracking-widest">Visual Cover</label>
            <div className="relative group/blogcover">
               <div className={`w-full aspect-[16/9] rounded-3xl border-2 border-dashed ${data.image ? 'border-emerald-500/30 bg-neutral-950' : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700'} overflow-hidden transition-all relative flex flex-col items-center justify-center gap-4`}>
                {data.image ? (
                  <img src={data.image} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center text-neutral-700">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-neutral-600 tracking-widest">Select Cover Artifact</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              </div>
               {data.image && (
                <p className="text-[9px] uppercase font-black text-emerald-400 mt-3 text-center tracking-[0.2em] animate-pulse">Select again to swap cover</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] uppercase font-black text-neutral-500 tracking-widest">Intelligence Gallery</label>
              <div className="relative">
                <button className="flex items-center gap-2 text-[10px] uppercase font-black text-emerald-400 hover:text-white transition-all bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-500/20">
                  <Plus className="w-3 h-3" /> Insert Frame
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
            
            <div className="grid grid-cols-4 gap-3 bg-neutral-950/30 p-4 rounded-3xl border border-neutral-800/50">
              {(data.gallery || []).map((img, i) => (
                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-neutral-800 group/gal">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/gal:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => removeGalleryImage(i)}
                      className="p-2 bg-red-500 text-white rounded-xl shadow-xl"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <InputField label="Genesis Date" value={data.date} onChange={(v: string) => setData({...data, date: v})} icon={Calendar} />

          <div className="space-y-4">
            <label className="block text-[10px] uppercase font-black text-neutral-500 tracking-widest">Intelligence Stream (Markdown Manifest)</label>
            <textarea 
              value={data.content} 
              onChange={e => setData({...data, content: e.target.value})} 
              placeholder="Stream your consciousness... markdown patterns supported."
              className="w-full bg-neutral-950/50 border border-neutral-800 rounded-3xl p-8 text-white text-base leading-relaxed focus:border-emerald-500/50 outline-none transition-all h-[500px] resize-none custom-scrollbar shadow-inner" 
            />
          </div>
        </div>

        <div className="p-8 border-t border-neutral-800/50 bg-neutral-950/30 backdrop-blur-md flex flex-row gap-4 sticky bottom-0 z-20">
          <button onClick={onClose} className="flex-grow bg-neutral-800 text-white font-black py-5 rounded-2xl hover:bg-neutral-700 transition-all uppercase tracking-[0.2em] text-[10px]">Depublish</button>
          <button 
            onClick={save} 
            disabled={saving} 
            className="flex-grow-[2] bg-emerald-600 text-white font-black py-5 rounded-2xl hover:bg-emerald-500 transition-all uppercase tracking-[0.3em] text-[10px] disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/20 active:scale-95"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Transmitting...' : 'Broadcast Intel'}
          </button>
        </div>
      </div>
    </div>
  );
}
