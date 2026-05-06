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
  Layout
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

interface SiteSettings {
  name: string;
  surname: string;
  role: string;
  bio: string;
  email: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  link: string;
  tech: string[];
  category: 'web' | 'app' | 'other';
  order: number;
}

interface Experience {
  id: string;
  company: string;
  role: string;
  period: string;
  description: string;
  order: number;
}

export function AdminDashboard({ user, onClose, settings, projects, experiences }: { 
  user: FirebaseUser; 
  onClose: () => void;
  settings: SiteSettings;
  projects: Project[];
  experiences: Experience[];
}) {
  const [activeTab, setActiveTab] = useState<'settings' | 'projects' | 'experience'>('settings');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingExp, setEditingExp] = useState<Experience | null>(null);

  const tabs = [
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'projects', label: 'Projects', icon: Layout },
    { id: 'experience', label: 'Experience', icon: Briefcase },
  ] as const;

  return (
    <div className="fixed inset-0 z-[100] bg-neutral-950 flex flex-col md:flex-row h-screen">
      <aside className="w-full md:w-64 bg-neutral-900/50 border-b md:border-b-0 md:border-r border-neutral-800 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-12">
          <div className="font-black text-xl tracking-tighter text-neutral-100">ADMIN PANEL</div>
          <button onClick={onClose} className="md:hidden text-neutral-400 hover:text-white"><X /></button>
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
          <button onClick={() => { logout(); onClose(); }} className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-400 transition-colors"><LogOut className="w-4 h-4" /> Sign Out</button>
        </div>
      </aside>
      <main className="flex-grow overflow-y-auto p-4 md:p-12 pb-32">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">{activeTab}</h2>
            <div className="flex gap-2">
              {activeTab === 'projects' && <button onClick={() => setEditingProject({ id: '', title: '', description: '', image: '', link: '', tech: [], category: 'web', order: projects.length })} className="bg-white text-black px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-neutral-200 transition-colors"><Plus className="w-4 h-4" /> Add Project</button>}
              {activeTab === 'experience' && <button onClick={() => setEditingExp({ id: '', company: '', role: '', period: '', description: '', order: experiences.length })} className="bg-white text-black px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-neutral-200 transition-colors"><Plus className="w-4 h-4" /> Add Exp</button>}
              <button onClick={onClose} className="hidden md:flex items-center gap-2 bg-neutral-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-neutral-700 transition-colors"><X className="w-4 h-4" /> Close</button>
            </div>
          </div>
          
          {activeTab === 'settings' && <SettingsEditor settings={settings} />}
          {activeTab === 'projects' && <ProjectsManager projects={projects} onEdit={setEditingProject} />}
          {activeTab === 'experience' && <ExperienceManager experiences={experiences} onEdit={setEditingExp} />}
        </div>
      </main>

      {editingProject && <ProjectModal project={editingProject} onClose={() => setEditingProject(null)} />}
      {editingExp && <ExperienceModal exp={editingExp} onClose={() => setEditingExp(null)} />}
    </div>
  );
}

function SettingsEditor({ settings }: { settings: SiteSettings }) {
  const [data, setData] = useState(settings);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), data);
      alert('Settings saved!');
    } catch (err) { handleFirestoreError(err, OperationType.WRITE, 'settings/global'); }
    finally { setSaving(false); }
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-900/30 p-8 rounded-3xl border border-neutral-800">
      <InputField label="Name" icon={Type} value={data.name} onChange={v => setData({...data, name: v})} />
      <InputField label="Surname" icon={Type} value={data.surname} onChange={v => setData({...data, surname: v})} />
      <InputField label="Role" icon={Monitor} value={data.role} onChange={v => setData({...data, role: v})} />
      <InputField label="Email" icon={Type} value={data.email} onChange={v => setData({...data, email: v})} />
      <div className="md:col-span-2">
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
  const deleteProject = async (id: string) => { 
    if (confirm('Are you sure?')) { 
      try { 
        await deleteDoc(doc(db, 'projects', id));
      } catch (err) { handleFirestoreError(err, OperationType.DELETE, `projects/${id}`); } 
    } 
  };
  return (
    <div className="grid gap-4">
      {projects.map(p => (
        <div key={p.id} className="flex items-center gap-6 bg-neutral-900/30 p-4 rounded-2xl border border-neutral-800 group">
          <img src={p.image} className="w-20 h-20 rounded-xl object-cover" alt="" />
          <div className="flex-grow">
            <h4 className="font-bold text-white">{p.title}</h4>
            <p className="text-xs text-neutral-500 uppercase tracking-widest">{p.category}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onEdit(p)} className="p-3 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors"><Settings className="w-4 h-4 text-neutral-400" /></button>
            <button onClick={() => deleteProject(p.id)} className="p-3 bg-red-900/20 rounded-xl hover:bg-red-900/40 transition-colors"><Trash2 className="w-4 h-4 text-red-500" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectModal({ project, onClose }: { project: Project, onClose: () => void }) {
  const [data, setData] = useState(project);
  const [techInput, setTechInput] = useState(project.tech.join(', '));
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    const id = project?.id || Math.random().toString(36).substr(2, 9);
    const finalData = { ...data, id, tech: techInput.split(',').map(t => t.trim()).filter(Boolean) };
    try { 
      await setDoc(doc(db, 'projects', id), finalData);
      onClose(); 
    } catch (err) { handleFirestoreError(err, OperationType.WRITE, `projects/${id}`); }
    finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-neutral-900 w-full max-w-xl rounded-3xl p-8 border border-neutral-800 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-black text-white mb-8 border-b border-neutral-800 pb-4">PROJECT DETAILS</h3>
        <div className="space-y-6">
          <InputField label="Title" value={data.title} onChange={v => setData({...data, title: v})} icon={Type} />
          <InputField label="Image URL" value={data.image} onChange={v => setData({...data, image: v})} icon={ImageIcon} />
          <InputField label="Live Link" value={data.link} onChange={v => setData({...data, link: v})} icon={LinkIcon} />
          <InputField label="Tech Stack (comma separated)" value={techInput} onChange={setTechInput} icon={Layout} />
          <div>
            <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-2">Category</label>
            <select value={data.category} onChange={e => setData({...data, category: e.target.value as any})} className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 text-white text-sm outline-none">
              <option value="web">Web</option>
              <option value="app">Mobile App</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex gap-4">
            <button onClick={onClose} className="flex-grow bg-neutral-800 text-white font-bold py-4 rounded-xl hover:bg-neutral-700 transition-all uppercase tracking-widest text-xs">Cancel</button>
            <button onClick={save} disabled={saving} className="flex-grow bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-500 transition-all uppercase tracking-widest text-xs disabled:opacity-50 flex items-center justify-center gap-2"><Save className="w-4 h-4" /> {saving ? 'SAVING...' : 'SAVE PROJECT'}</button>
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
