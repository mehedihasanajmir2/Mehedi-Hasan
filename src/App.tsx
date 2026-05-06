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
  Edit2,
  Lock,
  ShieldAlert
} from 'lucide-react';
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { 
  auth, 
  db, 
  signIn, 
  logout, 
  handleFirestoreError, 
  OperationType,
  loginWithEmail
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
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [loginStep, setLoginStep] = useState<'pin' | 'login'>('pin');
  const [logoClicks, setLogoClicks] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'web' | 'app' | 'other'>('all');

  // Disable scrolling when PIN modal is open
  useEffect(() => {
    if (isPinModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isPinModalOpen]);

  // Handle Logo Clicks (Triple click to open PIN modal)
  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastClickTime < 500) {
      const newClicks = logoClicks + 1;
      setLogoClicks(newClicks);
      if (newClicks >= 3) {
        setLoginStep('pin');
        setIsPinModalOpen(true);
        setLogoClicks(0);
      }
    } else {
      setLogoClicks(1);
    }
    setLastClickTime(now);
  };

  useEffect(() => {
    // Check if previously authenticated via PIN in this session
    const isAuth = sessionStorage.getItem('admin_authenticated') === 'true';
    if (isAuth) setIsAdminAuthenticated(true);

    // Auth Listener
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });

    // Subscriptions
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as SiteSettings);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/global');
    });

    const projectsQuery = query(collection(db, 'projects'), orderBy('order', 'asc'));
    const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projectsData);
      setLoading(false); // Only stop loading after we have projects or settings
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
      setLoading(false);
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

  // Removed blocking global loading screen for instant feel
  
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

  if (showAdmin && isAdminAuthenticated) {
    return (
      <AdminDashboard 
        user={user || { email: 'Admin' } as any} 
        onClose={() => setShowAdmin(false)} 
        settings={siteData as any}
        projects={projects as any}
        experiences={experiences as any}
      />
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
            <Logo onClick={handleLogoClick} className="scale-75 origin-left" />
          </div>
          <div className="flex gap-12 items-center">
            <div className="hidden md:flex gap-12 text-xs font-bold uppercase tracking-[0.2em] opacity-60">
              {['About', 'Projects', 'Experience', 'Contact'].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-white hover:opacity-100 transition-all">{item}</a>
              ))}
            </div>
            {isAdminAuthenticated && (
              <button 
                onClick={() => setShowAdmin(true)}
                className="p-2 rounded-full bg-neutral-900 border border-neutral-800 hover:border-indigo-500 transition-colors text-white"
              >
                <SettingsIcon className="w-4 h-4" />
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
      <AnimatePresence>
        {isPinModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
            {loginStep === 'pin' ? (
              <PinForm 
                onSuccess={() => {
                  setLoginStep('login');
                }} 
                onCancel={() => setIsPinModalOpen(false)} 
              />
            ) : (
              <LoginForm 
                onSuccess={() => {
                  setIsAdminAuthenticated(true);
                  sessionStorage.setItem('admin_authenticated', 'true');
                  setIsPinModalOpen(false);
                  setShowAdmin(true);
                }}
                onCancel={() => setIsPinModalOpen(false)}
              />
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LoginForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await loginWithEmail(email, password);
      onSuccess();
    } catch (err: any) {
      setError('Invalid credentials or access denied.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="w-full max-w-sm bg-neutral-900 border border-neutral-800 p-8 rounded-3xl"
    >
      <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">Final Step</h3>
      <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-[0.2em] mb-8">Admin Credentials Required</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-black text-neutral-600 tracking-widest">Email</label>
          <input 
            type="email" 
            required 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-xs focus:outline-none focus:border-indigo-500 text-white" 
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-black text-neutral-600 tracking-widest">Password</label>
          <input 
            type="password" 
            required 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-xs focus:outline-none focus:border-indigo-500 text-white" 
          />
        </div>
        {error && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">{error}</p>}
        <div className="flex flex-col gap-3">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-indigo-500 transition-all"
          >
            {loading ? 'Authenticating...' : 'Login to Dashboard'}
          </button>
          <button 
            type="button" 
            onClick={onCancel} 
            className="w-full py-2 text-neutral-600 font-bold uppercase tracking-widest text-[8px] hover:text-white transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function PinForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isBlasting, setIsBlasting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    if (pin === '2005') {
      onSuccess();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPin('');
      
      if (newAttempts >= 3) {
        setIsLocked(true);
        // Step 1: Red Alert starts immediately with intense screen pulse
        const alertFlash = document.createElement('div');
        alertFlash.className = 'fixed inset-0 bg-red-600/40 z-[300] pointer-events-none mix-blend-overlay';
        alertFlash.style.animation = 'pulse 0.2s infinite';
        document.body.appendChild(alertFlash);

        const style = document.createElement('style');
        style.innerHTML = `@keyframes pulse { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.8; } }`;
        document.head.appendChild(style);

        // Step 2: 2 seconds later - The Massive Fire Blast
        setTimeout(() => {
          setIsBlasting(true);
          if (alertFlash.parentNode) document.body.removeChild(alertFlash);

          // Additional Screen Shake
          document.body.style.animation = 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both';
          const shakeStyle = document.createElement('style');
          shakeStyle.innerHTML = `
            @keyframes shake {
              10%, 90% { transform: translate3d(-2px, 0, 0); }
              20%, 80% { transform: translate3d(4px, 0, 0); }
              30%, 50%, 70% { transform: translate3d(-8px, 0, 0); }
              40%, 60% { transform: translate3d(8px, 0, 0); }
            }
          `;
          document.head.appendChild(shakeStyle);

          setTimeout(() => {
            setIsBlasting(false);
            setError('SYSTEM DESTROYED: SECURITY BREACH');
            setAttempts(0);
            document.body.style.animation = '';
            setTimeout(() => setIsLocked(false), 5000); // 5 sec lockdown
          }, 3000);
        }, 2000); 
      } else {
        setError(`Access Denied. ${3 - newAttempts} attempts remaining.`);
      }
    }
  };

  return (
    <div className="relative w-full max-w-[400px] perspective-1000">
      {/* Red Alert Flash */}
      <AnimatePresence>
        {isLocked && !isBlasting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 0.5 }}
            className="fixed inset-0 bg-red-600/20 z-[300] pointer-events-none"
          />
        )}
      </AnimatePresence>

      <motion.div 
        animate={isBlasting ? { 
          scale: [1, 1.5, 0],
          rotate: [0, 30, -30, 0],
          x: [0, -30, 30, -30, 30, 0],
          y: [0, 30, -30, 30, -30, 0],
          filter: ["blur(0px)", "blur(20px)", "blur(80px)"]
        } : {}}
        transition={{ duration: 2.5, ease: "easeInOut" }}
        className="w-full bg-neutral-900 border-8 border-neutral-800 p-10 rounded-[40px] shadow-[0_0_100px_rgba(255,0,0,0.4)] relative overflow-hidden"
      >
        {/* Vault Dial Effect */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse" />
        
        <div className="mb-8 flex flex-col items-center">
          <div className="relative">
            <div className={`p-6 rounded-full bg-neutral-950 border-4 ${attempts > 0 ? 'border-red-600 shadow-[0_0_20px_rgba(255,0,0,0.5)]' : 'border-neutral-800'} transition-all duration-500`}>
              <motion.div
                animate={attempts > 0 ? { rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 0.3 }}
              >
                {isLocked ? (
                  <ShieldAlert className="w-12 h-12 text-red-500 animate-pulse" />
                ) : (
                  <Lock className={`w-12 h-12 ${attempts > 0 ? 'text-red-500' : 'text-indigo-500'}`} />
                )}
              </motion.div>
            </div>
            {/* Status Lights */}
            <div className="flex gap-2 mt-4 justify-center">
              {[1, 2, 3].map(i => (
                <div key={i} className={`w-3 h-3 rounded-full transition-all duration-300 ${attempts >= i ? 'bg-red-500 shadow-[0_0_15px_red] scale-125' : 'bg-neutral-800'}`} />
              ))}
            </div>
          </div>
        </div>

        <h3 className="text-xl font-black uppercase tracking-[0.2em] text-white text-center mb-1">Vault Secure</h3>
        <p className="text-neutral-500 text-[8px] uppercase font-bold tracking-[0.3em] text-center mb-10">Encrypted Terminal V.2</p>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="relative group">
            <input 
              type="password" 
              autoFocus 
              disabled={isLocked}
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="0000"
              className={`w-full bg-black border-4 ${isLocked ? 'border-red-900 text-red-600 shadow-[inset_0_0_20px_rgba(255,0,0,0.3)]' : 'border-neutral-800 text-white'} rounded-2xl py-6 text-center text-4xl font-mono focus:border-indigo-500 transition-all tracking-[0.4em] outline-none shadow-inner`}
            />
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center bg-red-500/10 py-2 rounded-lg"
            >
              {error}
            </motion.p>
          )}

          <div className="flex flex-col gap-4">
            <button 
              type="submit" 
              disabled={isLocked}
              className={`w-full py-5 ${isLocked ? 'bg-neutral-800' : 'bg-indigo-600 hover:bg-indigo-500'} text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl transition-all shadow-lg active:scale-95`}
            >
              Initialize Unlock
            </button>
            <button 
              type="button" 
              onClick={onCancel} 
              className="w-full text-neutral-600 font-bold uppercase tracking-widest text-[8px] hover:text-white transition-all"
            >
              Abort Entry
            </button>
          </div>
        </form>

        {/* Decorative Bolts */}
        <div className="absolute top-4 left-4 w-3 h-3 bg-neutral-800 rounded-full shadow-inner" />
        <div className="absolute top-4 right-4 w-3 h-3 bg-neutral-800 rounded-full shadow-inner" />
        <div className="absolute bottom-4 left-4 w-3 h-3 bg-neutral-800 rounded-full shadow-inner" />
        <div className="absolute bottom-4 right-4 w-3 h-3 bg-neutral-800 rounded-full shadow-inner" />
      </motion.div>

      {/* Explosion Particles */}
      <AnimatePresence>
        {isBlasting && (
          <>
            {/* Intense Screen Flash */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.8, 1, 0] }}
              transition={{ duration: 2 }}
              className="fixed inset-0 bg-white/50 z-[280] pointer-events-none mix-blend-overlay"
            />

            {/* Shockwaves */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`shock-${i}`}
                initial={{ scale: 0, opacity: 1, border: '8px solid white' }}
                animate={{ scale: 80, opacity: 0, border: '1px solid orange' }}
                transition={{ duration: 1, delay: i * 0.05, ease: "easeOut" }}
                className="absolute top-1/2 left-1/2 w-10 h-10 rounded-full z-[260] pointer-events-none blur-md"
                style={{ marginLeft: -20, marginTop: -20 }}
              />
            ))}

            {/* Massive Fire and Plumes */}
            {[...Array(120)].map((_, i) => (
              <motion.div
                key={`fire-${i}`}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ 
                  x: (Math.random() - 0.5) * 2500, 
                  y: (Math.random() - 0.5) * 2500, 
                  opacity: 0,
                  scale: [1, 6, 0],
                  rotate: Math.random() * 2000
                }}
                transition={{ duration: 2 + Math.random(), ease: "easeOut" }}
                className={`absolute top-1/2 left-1/2 rounded-full z-[250] ${
                  i % 6 === 0 ? 'bg-white w-20 h-20 blur-xl' : 
                  i % 6 === 1 ? 'bg-yellow-300 w-16 h-16 blur-md' : 
                  i % 6 === 2 ? 'bg-orange-500 w-24 h-24 blur-2xl' :
                  i % 6 === 3 ? 'bg-red-600 w-20 h-20 shadow-[0_0_80px_#ff0000]' :
                  i % 6 === 4 ? 'bg-orange-400 w-4 h-4' : // Embers
                  'bg-zinc-100 w-1 h-1 shadow-[0_0_10px_white]' // Extreme sparks
                }`}
                style={{ marginLeft: -10, marginTop: -10 }}
              />
            ))}

            {/* Heavy Smoke Clouds */}
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={`smoke-${i}`}
                initial={{ x: 0, y: 0, opacity: 0.9, scale: 1 }}
                animate={{ 
                  x: (Math.random() - 0.5) * 1500, 
                  y: (Math.random() - 0.5) * 1500, 
                  opacity: 0,
                  scale: [1, 25],
                }}
                transition={{ duration: 4, ease: "easeOut" }}
                className="absolute top-1/2 left-1/2 w-48 h-48 bg-neutral-900/90 rounded-full blur-[80px] z-[240]"
                style={{ marginLeft: -96, marginTop: -96 }}
              />
            ))}

            {/* Ultimate Central Fire Core */}
            <motion.div 
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: [0, 80, 100], opacity: [1, 1, 0] }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute top-1/2 left-1/2 w-32 h-32 bg-gradient-radial from-white via-yellow-400 via-orange-600 to-red-800 rounded-full z-[270] blur-3xl shadow-[0_0_150px_rgba(255,100,0,1)]"
              style={{ marginLeft: -64, marginTop: -64 }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}


