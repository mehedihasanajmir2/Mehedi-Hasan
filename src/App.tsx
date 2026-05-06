import { motion, AnimatePresence } from 'motion/react';
import { 
  Github, 
  Linkedin, 
  Mail, 
  ExternalLink, 
  Code2, 
  Briefcase, 
  User, 
  Layers,
  ChevronRight,
  Globe,
  Smartphone,
  Plus,
  Trash2,
  Save,
  LogOut,
  Settings as SettingsIcon,
  X,
  Edit2
} from 'lucide-react';
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { 
  auth, 
  db, 
  signIn, 
  logout, 
  handleFirestoreError, 
  OperationType 
} from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc
} from 'firebase/firestore';

import { Logo } from './components/Logo';

// Lazy load admin components to speed up initial site load
const AdminDashboard = lazy(() => import('./components/AdminComponents').then(module => ({ default: module.AdminDashboard })));

// --- Error Handling ---
// handleFirestoreError is imported from ./lib/firebase

// --- Types ---
interface SiteSettings {
  name: string;
  surname: string;
  bio: string;
  profileImage: string;
  email: string;
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
  tech: string[];
  link?: string;
  github?: string;
  type: 'web' | 'app' | 'other';
  image: string;
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

// --- Components ---

function Section({ title, id, children, icon: Icon }: { title: string; id: string; children: React.ReactNode; icon: any }) {
  return (
    <section id={id} className="py-24 border-t border-neutral-900">
      <div className="flex items-center gap-3 mb-12">
        <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
          <Icon className="w-5 h-5 text-neutral-400" />
        </div>
        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-neutral-600">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function App() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'web' | 'app' | 'other'>('all');

  useEffect(() => {
    // Auth Listener
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });

    // Subscriptions
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as SiteSettings);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/global');
      setLoading(false);
    });

    const projectsQuery = query(collection(db, 'projects'), orderBy('order', 'asc'));
    const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projectsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });

    const experienceQuery = query(collection(db, 'experience'), orderBy('order', 'asc'));
    const unsubscribeExperience = onSnapshot(experienceQuery, (snapshot) => {
      const expData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Experience));
      setExperiences(expData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'experience');
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSettings();
      unsubscribeProjects();
      unsubscribeExperience();
    };
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 flex flex-col items-center"
      >
        <Logo className="scale-150 mb-12 animate-pulse" />
        <div className="w-12 h-[2px] bg-neutral-900 overflow-hidden rounded-full">
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-full h-full bg-indigo-500"
          />
        </div>
      </motion.div>
    </div>
  );

  const siteData = settings || {
    name: 'Mehedi',
    surname: 'Hasan',
    bio: 'Full-stack developer building robust web architectures.',
    profileImage: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhsH3QzxWYJ-ILrnEjlNRNRuiKnkL06aNaPkLjPOInRW1EKGt_3U6Ug8W9Cbmi7Tg9IA6fj47XHAVkjWFJJswRc1m2DhwwycS6f3ZK6-9YZylwfMDs8ea4uCJlDQ2iURDiOkumcsbxrKWOfpLpxdFay6t_yQ0GU38s3-GA4KBedaO3FKaDec_tHVxYvma30/s1332/Gemini_Generated_Image_cohv0rcohv0rcohv.png',
    email: 'mehedihasanajmir2@gmail.com',
    stats: { socialProjects: '50+', webApps: '25+', successRate: '100%' }
  };

  const filteredProjects = activeTab === 'all' 
    ? projects 
    : projects.filter(p => p.type === activeTab);

  if (showAdmin && user) {
    return (
      <Suspense fallback={
        <div className="fixed inset-0 z-[100] bg-neutral-950 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">Loading System...</span>
          </div>
        </div>
      }>
        <AdminDashboard 
          user={user} 
          onClose={() => setShowAdmin(false)} 
          settings={siteData as any}
          projects={projects as any}
          experiences={experiences as any}
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-400 font-sans selection:bg-indigo-500/30 selection:text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neutral-900/10 blur-[120px] rounded-full" />
      </div>

      <nav className="fixed top-0 left-0 w-full z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-900">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center">
            <Logo className="scale-75 origin-left" />
          </div>
          <div className="flex gap-12 items-center">
            <div className="hidden md:flex gap-12 text-xs font-bold uppercase tracking-[0.2em] opacity-60">
              {['About', 'Projects', 'Experience', 'Contact'].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-white hover:opacity-100 transition-all">{item}</a>
              ))}
            </div>
            {user ? (
              <button 
                onClick={() => setShowAdmin(true)}
                className="p-2 rounded-full bg-neutral-900 border border-neutral-800 hover:border-indigo-500 transition-colors text-white"
              >
                <SettingsIcon className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={() => setShowAdmin(true)} 
                className="text-[10px] uppercase font-black tracking-widest text-neutral-600 hover:text-white"
              >
                Admin
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-32 pb-24">
        <section className="mb-32 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-12 lg:col-span-7">

            <h1 className="text-[60px] sm:text-[100px] lg:text-[140px] leading-[0.8] font-black text-neutral-100 uppercase tracking-tighter mb-10">
              {siteData.name} <br />
              <span className="text-neutral-800">{siteData.surname}</span>
            </h1>
            <p className="max-w-md text-xl md:text-2xl font-light text-neutral-400 leading-tight">
              {siteData.bio}
            </p>
          </motion.div>

          <div className="md:col-span-12 lg:col-span-5 grid grid-cols-1 gap-12">
            <div className="relative aspect-[1332/710] bg-neutral-900 overflow-hidden border border-neutral-800 rounded-3xl">
              <img src={siteData.profileImage} className="w-full h-full object-cover" />
            </div>

            <div className="flex flex-row flex-wrap gap-12 border-t border-neutral-900 pt-8">
               <div>
                <div className="text-4xl lg:text-5xl font-black mb-1 italic text-indigo-500 tracking-tighter">{siteData.stats.socialProjects}</div>
                <div className="text-[10px] uppercase tracking-widest font-bold opacity-50">Social Projects</div>
              </div>
              <div>
                <div className="text-4xl lg:text-5xl font-black mb-1 italic text-indigo-500 tracking-tighter">{siteData.stats.webApps}</div>
                <div className="text-[10px] uppercase tracking-widest font-bold opacity-50">Web Apps</div>
              </div>
              <div>
                <div className="text-4xl lg:text-5xl font-black mb-1 italic text-indigo-500 tracking-tighter">{siteData.stats.successRate}</div>
                <div className="text-[10px] uppercase tracking-widest font-bold opacity-50">Success</div>
              </div>
            </div>
          </div>
        </section>

        <section id="projects" className="py-24 border-t border-neutral-900">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-xs uppercase tracking-[0.4em] font-black text-neutral-600 mb-4">Portfolio</h2>
              <h3 className="text-4xl font-black uppercase tracking-tighter text-neutral-100">Featured Work</h3>
            </div>
            <div className="flex gap-4 border-b border-neutral-900 pb-2 overflow-x-auto whitespace-nowrap">
              {(['all', 'web', 'app', 'other'] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`text-[10px] uppercase tracking-widest font-black px-4 py-2 transition-all relative ${activeTab === tab ? 'text-indigo-500' : 'text-neutral-600 hover:text-neutral-300'}`}>
                  {tab === 'other' ? 'Marketing & Design' : tab}
                  {activeTab === tab && <motion.div layoutId="tab-underline" className="absolute bottom-[-9px] left-0 right-0 h-[2px] bg-indigo-500" />}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project, idx) => (
                <motion.div layout key={project.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.5, delay: idx * 0.05 }} className="group relative bg-neutral-900 border border-neutral-800 overflow-hidden hover:border-indigo-500/50 transition-all duration-500">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={project.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" />
                  </div>
                  <div className="p-8">
                     <div className="flex items-center justify-between mb-4">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-600 group-hover:text-indigo-500 transition-colors">{project.type}</span>
                      <div className="flex gap-3">
                        {project.github && <a href={project.github} className="text-neutral-600 hover:text-white transition-colors"><Github className="w-4 h-4" /></a>}
                        {project.link && <a href={project.link} className="text-neutral-600 hover:text-white transition-colors"><ExternalLink className="w-4 h-4" /></a>}
                      </div>
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-neutral-100 mb-3">{project.title}</h3>
                    <p className="text-neutral-500 text-sm mb-6 leading-tight line-clamp-2 uppercase">{project.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {project.tech.map(t => (
                        <span key={t} className="text-[10px] font-bold text-neutral-700 uppercase tracking-widest">{t}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        <div className="grid md:grid-cols-12 gap-24 py-24 border-t border-neutral-900">
          <div className="md:col-span-4">
            <h2 className="text-xs uppercase tracking-[0.4em] font-black text-neutral-600 mb-8">Bio</h2>
            <p className="text-xl font-light text-neutral-400 leading-snug uppercase">{siteData.bio}</p>
          </div>
          <div className="md:col-span-8 flex flex-col gap-12">
            <h2 className="text-xs uppercase tracking-[0.4em] font-black text-neutral-600">History</h2>
            <div className="space-y-16">
              {experiences.map((exp, idx) => (
                <motion.div key={exp.id} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="group">
                  <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 mb-4 border-b border-neutral-900 pb-4 group-hover:border-indigo-500 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-neutral-700 font-bold">0{idx + 1}</span>
                      <h3 className="text-2xl font-bold uppercase tracking-tight text-neutral-200">{exp.role}</h3>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-neutral-700 italic">{exp.period}</span>
                  </div>
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <p className="text-sm font-bold uppercase tracking-widest text-indigo-500 opacity-80">{exp.company}</p>
                    <p className="text-neutral-500 leading-tight max-w-lg text-sm uppercase">{exp.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <footer id="contact" className="mt-24 pt-24 border-t border-neutral-900">
           <div className="flex flex-col md:flex-row items-end justify-between gap-12 mb-24">
             <div className="max-w-2xl">
               <h3 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-neutral-100 leading-[0.85]">
                 Let's start <br />
                 <span className="text-indigo-600">something</span>
               </h3>
             </div>
             <a href={`mailto:${siteData.email}`} className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-neutral-100 hover:text-indigo-500 transition-colors border-b-4 border-neutral-100 hover:border-indigo-500 pb-2">Send Mail</a>
           </div>
           <div className="flex flex-col md:flex-row justify-between items-end pb-8 gap-8">
              <div className="flex gap-16">
                <div>
                  <div className="text-[10px] uppercase opacity-40 tracking-widest font-black mb-2">Location</div>
                  <div className="text-sm font-bold uppercase tracking-tight text-neutral-300">Dhaka, BD</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase opacity-40 tracking-widest mb-2 italic">Handcrafted with precision</div>
                <div className="text-sm font-black uppercase tracking-tighter text-neutral-100">© 2024 {siteData.name} {siteData.surname}</div>
              </div>
           </div>
        </footer>
      </main>
      {!user && showAdmin && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"><LoginForm onCancel={() => setShowAdmin(false)} /></div>}
    </div>
  );
}

function LoginForm({ onCancel }: { onCancel: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loginWithGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      await signIn();
    } catch (err: any) {
      setError(err.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('Only Google Login is supported for admin access.');
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm bg-neutral-900 border border-neutral-800 p-8 rounded-2xl">
      <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Admin Access</h3>
      <p className="border-b border-neutral-800 pb-4 text-zinc-500 text-xs mb-8 uppercase font-bold tracking-widest italic">Authorized access only</p>
      
      <button 
        onClick={loginWithGoogle} 
        disabled={loading}
        className="w-full py-4 mb-8 bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] rounded-full hover:bg-indigo-500 transition-all flex items-center justify-center gap-3"
      >
        <Globe className="w-4 h-4" />
        {loading ? 'Processing...' : 'Continue with Google'}
      </button>

      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-800"></div></div>
        <div className="relative flex justify-center text-[8px] uppercase font-black tracking-widest text-neutral-600"><span className="bg-neutral-900 px-2 italic">or email login</span></div>
      </div>

      <form onSubmit={loginWithEmail} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-black text-neutral-600 tracking-widest">Email</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-xs focus:outline-none focus:border-indigo-500" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-black text-neutral-600 tracking-widest">Password</label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-xs focus:outline-none focus:border-indigo-500" />
        </div>
        {error && <p className="text-red-500 text-[10px] font-bold uppercase">{error}</p>}
        <div className="flex gap-4">
          <button type="submit" disabled={loading} className="flex-grow py-4 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-full hover:bg-neutral-200 transition-all">
            {loading ? 'Checking...' : 'Login'}
          </button>
          <button type="button" onClick={onCancel} className="px-6 py-4 bg-neutral-800 text-white font-black uppercase tracking-widest text-[10px] rounded-full">Cancel</button>
        </div>
      </form>
    </motion.div>
  );
}


