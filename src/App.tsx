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
  ArrowLeft,
  Globe,
  Smartphone,
  Plus,
  Trash2,
  Save,
  LogOut,
  X,
  Edit2,
  Lock,
  ShieldAlert,
  Image as ImageIcon,
  Zap,
  Copy,
  Check,
  Menu,
  MessageCircle
} from 'lucide-react';
import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
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
  role: string;
  bio: string;
  about?: string;
  aboutImage?: string;
  contactImage?: string;
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
  link?: string;
  github?: string;
  type: 'web' | 'app' | 'graphic' | 'digital' | 'cpa' | 'other';
  image: string;
  appLogo?: string;
  gallery?: string[];
  order: number;
  dateReceived?: string;
  completionTime?: string;
  downloadUrl?: string;
  downloadFileName?: string;
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

interface Experience {
  id: string;
  company: string;
  role: string;
  period: string;
  description: string;
  order: number;
  logo?: string;
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

function Counter({ value }: { value: string }) {
  const [count, setCount] = useState(0);
  const nodeRef = useRef<HTMLDivElement>(null);
  const isInView = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView.current) {
          isInView.current = true;
          startAnimation();
        }
      },
      { threshold: 0.1 }
    );

    if (nodeRef.current) observer.observe(nodeRef.current);
    return () => observer.disconnect();
  }, [value]);

  const startAnimation = () => {
    const target = parseInt(value) || 0;
    const duration = 2000; // 2 seconds
    const start = 0;
    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4); // Quart ease out
      
      const current = Math.floor(start + (target - start) * eased);
      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  };

  const suffix = (value || '').toString().replace(/[0-9]/g, '');

  return (
    <div ref={nodeRef} className="text-4xl lg:text-5xl font-black mb-1 italic text-indigo-500 tracking-tighter">
      {count}{suffix}
    </div>
  );
}

function GalleryModal({ images, onClose, title }: { images: string[]; onClose: () => void; title: string }) {
  const [active, setActive] = useState(0);
  
  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col p-4 md:p-12 overflow-hidden">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{title} Gallery</h3>
        <button onClick={onClose} className="p-4 bg-neutral-900 text-white rounded-full hover:bg-neutral-800 transition-all">
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <div className="flex-grow flex flex-col md:flex-row gap-8 items-center justify-center min-h-0">
        <div className="w-full md:w-3/4 h-full relative flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.img 
              key={active}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              src={images[active]} 
              className="max-w-full max-h-full w-auto h-auto object-contain rounded-3xl shadow-2xl"
            />
          </AnimatePresence>
          
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 pointer-events-none">
            <button 
              onClick={() => setActive(prev => (prev > 0 ? prev - 1 : images.length - 1))}
              className="p-4 bg-black/50 text-white rounded-full backdrop-blur-md pointer-events-auto hover:bg-black/80 transition-all border border-white/10"
            >
              <ChevronRight className="w-6 h-6 rotate-180" />
            </button>
            <button 
              onClick={() => setActive(prev => (prev < images.length - 1 ? prev + 1 : 0))}
              className="p-4 bg-black/50 text-white rounded-full backdrop-blur-md pointer-events-auto hover:bg-black/80 transition-all border border-white/10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="w-full md:w-1/4 h-full overflow-y-auto pr-4 scrollbar-hide flex flex-row md:flex-col gap-4">
          {images.map((img, i) => (
            <button 
              key={i} 
              onClick={() => setActive(i)}
              className={`relative aspect-video rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${active === i ? 'border-indigo-500 scale-105' : 'border-transparent opacity-40 hover:opacity-100'}`}
            >
              <img src={img} className="w-full h-full object-cover" alt="" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [loginStep, setLoginStep] = useState<'pin' | 'login'>('pin');
  const [logoClicks, setLogoClicks] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'graphic' | 'digital' | 'cpa' | 'web' | 'app' | 'other'>('all');
  const [viewingGallery, setViewingGallery] = useState<{ images: string[], title: string } | null>(null);
  const [selectedPost, setSelectedPost] = useState<{ type: 'project' | 'blog' | 'experience', id: string } | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const selectedPostData = selectedPost ? (
    selectedPost.type === 'project' 
      ? projects.find(p => p.id === selectedPost.id) 
      : selectedPost.type === 'blog'
      ? blogs.find(b => b.id === selectedPost.id)
      : experiences.find(e => e.id === selectedPost.id)
  ) : null;

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

    const blogsQuery = query(collection(db, 'blogs'), orderBy('order', 'desc'));
    const unsubscribeBlogs = onSnapshot(blogsQuery, (snapshot) => {
      const blogData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Blog));
      setBlogs(blogData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'blogs');
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSettings();
      unsubscribeProjects();
      unsubscribeExperience();
      unsubscribeBlogs();
    };
  }, []);

  // Removed blocking global loading screen for instant feel
  
  const defaults: SiteSettings = {
    name: 'Mehedi',
    surname: 'Hasan',
    role: 'Full-Stack Developer | Digital Marketer | CPA Marketer | Creative Designer',
    bio: 'Building robust web architectures and scaling businesses through creative design and strategic marketing.',
    about: `With over a year of experience as a versatile Freelancer, I have successfully helped brands enhance their digital presence through data-driven Social Media Marketing and custom Graphic Design solutions. I specialize in building high-performance mobile applications using Java and XML, including the end-to-end development of the social connectivity app "AddaSangi". My expertise also includes full-stack mobile integration, where I have a proven track record of converting web-based platforms into functional Android applications. From managing complex hardware permissions to designing professional marketing mockups, I deliver comprehensive digital solutions that combine technical precision with creative flair.`,
    aboutImage: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhsH3QzxWYJ-ILrnEjlNRNRuiKnkL06aNaPkLjPOInRW1EKGt_3U6Ug8W9Cbmi7Tg9IA6fj47XHAVkjWFJJswRc1m2DhwwycS6f3ZK6-9YZylwfMDs8ea4uCJlDQ2iURDiOkumcsbxrKWOfpLpxdFay6t_yQ0GU38s3-GA4KBedaO3FKaDec_tHVxYvma30/s1332/Gemini_Generated_Image_cohv0rcohv0rcohv.png',
    contactImage: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhsH3QzxWYJ-ILrnEjlNRNRuiKnkL06aNaPkLjPOInRW1EKGt_3U6Ug8W9Cbmi7Tg9IA6fj47XHAVkjWFJJswRc1m2DhwwycS6f3ZK6-9YZylwfMDs8ea4uCJlDQ2iURDiOkumcsbxrKWOfpLpxdFay6t_yQ0GU38s3-GA4KBedaO3FKaDec_tHVxYvma30/s1332/Gemini_Generated_Image_cohv0rcohv0rcohv.png',
    profileImage: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhsH3QzxWYJ-ILrnEjlNRNRuiKnkL06aNaPkLjPOInRW1EKGt_3U6Ug8W9Cbmi7Tg9IA6fj47XHAVkjWFJJswRc1m2DhwwycS6f3ZK6-9YZylwfMDs8ea4uCJlDQ2iURDiOkumcsbxrKWOfpLpxdFay6t_yQ0GU38s3-GA4KBedaO3FKaDec_tHVxYvma30/s1332/Gemini_Generated_Image_cohv0rcohv0rcohv.png',
    email: 'mehedihasanajmir1000@gmail.com',
    businessEmail: 'mehedihasanajmir2@gmail.com',
    whatsapp: '+8801946406095',
    linkedin: 'mehedi-hasan-781014234',
    points: [
      '🚀 Building robust web architectures and scaling businesses with CPA & Digital Marketing.',
      '🎨 Crafting visual identities through Graphic Design.',
      '💻 Turning complex problems into elegant, market-ready digital solutions.'
    ],
    stats: { socialProjects: '50+', webApps: '25+', successRate: '100%' }
  };

  const siteData: SiteSettings = settings ? {
    ...defaults,
    ...settings,
    stats: { ...defaults.stats, ...settings.stats },
    points: (settings.points && settings.points.some(p => p.trim() !== '')) ? settings.points : defaults.points
  } : defaults;

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
        blogs={blogs as any}
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
        <div className="max-w-7xl mx-auto px-6 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center">
            <Logo onClick={handleLogoClick} className="scale-75 origin-left" />
          </div>
          
            {/* Desktop Nav */}
          <div className="hidden md:flex gap-12 items-center">
            <div className="flex gap-12 text-xs font-bold uppercase tracking-[0.2em] opacity-60">
              <button onClick={() => setShowAboutModal(true)} className="hover:text-white hover:opacity-100 transition-all font-black">About</button>
              {['Projects', 'Experience', 'Contact'].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-white hover:opacity-100 transition-all font-black">{item}</a>
              ))}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-all flex items-center justify-center"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-20 left-0 w-full bg-neutral-950 border-b border-neutral-900 p-8 md:hidden z-40"
            >
              <div className="flex flex-col gap-8">
                {['About', 'Projects', 'Experience', 'Contact'].map((item) => (
                  <a 
                    key={item} 
                    href={item === 'About' ? '#' : `#${item.toLowerCase()}`} 
                    onClick={(e) => {
                      if (item === 'About') {
                        e.preventDefault();
                        setShowAboutModal(true);
                      }
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-2xl font-black uppercase tracking-tighter text-neutral-100 hover:text-indigo-500 transition-all flex items-center justify-between group"
                  >
                    <span>{item}</span>
                    <ChevronRight className="w-5 h-5 text-neutral-800 group-hover:text-indigo-500 transition-colors" />
                  </a>
                ))}
              </div>
              
              <div className="mt-12 pt-8 border-t border-neutral-900">
                <button 
                  onClick={() => {
                    setShowEmailModal(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] transition-all"
                >
                  <Mail className="w-4 h-4" />
                  Send me a message
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-32 pb-24">
        <section id="about" className="mb-32 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-12 lg:col-span-7">

            <h1 className="text-[60px] sm:text-[100px] lg:text-[140px] leading-[0.8] font-black text-neutral-100 uppercase tracking-tighter mb-10">
              {siteData.name} <br />
              <span className="text-neutral-800">{siteData.surname}</span>
            </h1>

            {/* Desktop Role - Visible under name on LG screens */}
            <h2 className="hidden lg:block text-xs uppercase tracking-[0.4em] font-black text-indigo-500 mb-12 border-l-2 border-indigo-500 pl-4">
              {siteData.role}
            </h2>

            {/* Mobile View: Photo then Role */}
            <div className="lg:hidden w-full">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-8 relative aspect-[1332/710] bg-neutral-900 overflow-hidden border border-neutral-800 rounded-3xl"
              >
                <img src={siteData.profileImage} className="w-full h-full object-cover" />
              </motion.div>
              
              <h2 className="text-xs uppercase tracking-[0.3em] font-black text-indigo-500 mb-12 border-l-2 border-indigo-500 pl-4 leading-relaxed">
                {siteData.role}
              </h2>
            </div>

            <div className="space-y-6 max-w-xl">
              {siteData.points && siteData.points.map((point, index) => (
                <motion.p 
                  key={index}
                  initial={{ opacity: 0, x: -100 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ 
                    duration: 1, 
                    delay: index * 0.4,
                    type: "spring",
                    stiffness: 50
                  }}
                  className="text-lg md:text-xl font-light text-neutral-400 leading-snug border-l border-neutral-900 pl-6 hover:border-indigo-500 transition-colors"
                >
                  {point}
                </motion.p>
              ))}
            </div>
          </motion.div>

          <div className="md:col-span-12 lg:col-span-5 grid grid-cols-1 gap-12">
            <div className="hidden lg:block relative aspect-[1332/710] bg-neutral-900 overflow-hidden border border-neutral-800 rounded-3xl">
              <img src={siteData.profileImage} className="w-full h-full object-cover" />
            </div>

            <div className="flex flex-row flex-wrap gap-12 border-t border-neutral-900 pt-8">
               <div>
                <Counter value={siteData.stats.socialProjects} />
                <div className="text-[10px] uppercase tracking-widest font-bold opacity-50">Social Projects</div>
              </div>
              <div>
                <Counter value={siteData.stats.webApps} />
                <div className="text-[10px] uppercase tracking-widest font-bold opacity-50">Web Apps</div>
              </div>
              <div>
                <Counter value={siteData.stats.successRate} />
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
            <div className="flex gap-2 md:gap-4 border-b border-neutral-900 pb-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
              {(['all', 'graphic', 'digital', 'cpa', 'web', 'app'] as const).map((tab) => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)} 
                  className={`text-[9px] md:text-[10px] uppercase tracking-widest font-black px-3 md:px-4 py-2 transition-all relative ${activeTab === tab ? 'text-indigo-500' : 'text-neutral-600 hover:text-neutral-300'}`}
                >
                  {tab === 'all' && 'All'}
                  {tab === 'graphic' && 'Graphic Design'}
                  {tab === 'digital' && 'Digital Marketing'}
                  {tab === 'cpa' && 'CPA Marketing'}
                  {tab === 'web' && 'Web'}
                  {tab === 'app' && 'App'}
                  {activeTab === tab && <motion.div layoutId="tab-underline" className="absolute bottom-[-9px] left-0 right-0 h-[2px] bg-indigo-500" />}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project, idx) => (
                <motion.div layout key={project.id} initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95 }} 
                transition={{ duration: 0.5, delay: idx * 0.05 }} 
                onClick={() => setSelectedPost({ type: 'project', id: project.id })}
                className="group relative bg-neutral-900 border border-neutral-800 overflow-hidden hover:border-indigo-500/50 transition-all duration-500 cursor-pointer"
              >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={project.image} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
                  </div>
                  <div className="p-3">
                     <div className="flex items-center justify-between mb-2">
                      <span className="text-[7px] font-black uppercase tracking-[0.2em] text-neutral-600 group-hover:text-indigo-500 transition-colors uppercase">{project.type}</span>
                      <div className="flex gap-2 text-neutral-600" onClick={(e) => e.stopPropagation()}>
                        {project.github && <a href={project.github} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" title="GitHub Source"><Github className="w-3.5 h-3.5" /></a>}
                        {project.link && <a href={project.link} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" title="Live Preview"><ExternalLink className="w-3.5 h-3.5" /></a>}
                      </div>
                    </div>

                    {project.type === 'app' && project.appLogo ? (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-neutral-800 bg-neutral-900 group-hover:border-indigo-500/30 transition-colors shrink-0">
                          <img src={project.appLogo} className="w-full h-full object-cover" alt="App Logo" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-tighter text-neutral-100 line-clamp-1">{project.title}</h3>
                          <div className="flex items-center gap-1 text-[6px] font-black uppercase tracking-wider text-green-500">
                            <Smartphone className="w-2 h-2" /> Stable
                          </div>
                        </div>
                      </div>
                    ) : (
                      <h3 className="text-sm font-black uppercase tracking-tighter text-neutral-100 mb-2 line-clamp-1">{project.title}</h3>
                    )}

                    {project.type === 'app' && project.downloadUrl && (
                      <div className="mb-4" onClick={(e) => e.stopPropagation()}>
                        <a 
                          href={project.downloadUrl} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] transition-all group/btn"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          Download
                        </a>
                      </div>
                    )}

                    {project.gallery && project.gallery.length > 0 && (
                      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-2 scrollbar-hide" onClick={(e) => e.stopPropagation()}>
                        {project.gallery.slice(0, 3).map((img, i) => (
                          <div key={i} onClick={() => setViewingGallery({ images: project.gallery!, title: project.title })} className="w-10 h-10 rounded-lg overflow-hidden border border-neutral-800 flex-shrink-0 cursor-zoom-in hover:border-indigo-500 transition-colors">
                            <img src={img} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-all" />
                          </div>
                        ))}
                        {project.gallery.length > 3 && (
                          <div onClick={() => setViewingGallery({ images: project.gallery!, title: project.title })} className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center text-[9px] font-black text-neutral-400 flex-shrink-0 cursor-zoom-in hover:bg-neutral-700 transition-colors">
                            +{project.gallery.length - 3}
                          </div>
                        )}
                      </div>
                    )}

                    {(project.dateReceived || project.completionTime) && (
                      <div className="flex flex-col gap-1.5 mt-auto border-t border-neutral-800 pt-3">
                        {project.dateReceived && (
                          <div className="flex justify-between items-center text-[8px] uppercase font-black tracking-widest text-neutral-600">
                            <span>Started:</span>
                            <span className="text-neutral-400">{project.dateReceived}</span>
                          </div>
                        )}
                        {project.completionTime && (
                          <div className="flex justify-between items-center text-[9px] uppercase font-black tracking-widest text-neutral-600">
                            <span>Period:</span>
                            <span className="text-neutral-400">{project.completionTime}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        <section id="experience" className="grid md:grid-cols-12 gap-24 py-24 border-t border-neutral-900">
          <div className="md:col-span-4">
            <h2 className="text-xs uppercase tracking-[0.4em] font-black text-neutral-600 mb-8">Bio</h2>
            <p className="text-xl font-light text-neutral-400 leading-snug uppercase">{siteData.bio}</p>
          </div>
          <div className="md:col-span-8 flex flex-col gap-12">
            <h2 className="text-xs uppercase tracking-[0.4em] font-black text-neutral-600">Experience</h2>
            <div className="space-y-16">
              {experiences.map((exp, idx) => (
                <motion.div 
                  key={exp.id} 
                  initial={{ opacity: 0, x: 20 }} 
                  whileInView={{ opacity: 1, x: 0 }} 
                  viewport={{ once: true }} 
                  onClick={() => setSelectedPost({ type: 'experience', id: exp.id })}
                  className="group cursor-pointer"
                >
                  <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 mb-4 border-b border-neutral-900 pb-4 group-hover:border-indigo-500 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-neutral-700 font-bold">0{idx + 1}</span>
                      <h3 className="text-2xl font-bold uppercase tracking-tight text-neutral-200">{exp.role}</h3>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-neutral-700 italic">{exp.period}</span>
                  </div>
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <p className="text-sm font-bold uppercase tracking-widest text-indigo-500 opacity-80">{exp.company}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="blogs" className="py-24 border-t border-neutral-900">
          <div className="mb-16">
            <h2 className="text-xs uppercase tracking-[0.4em] font-black text-neutral-600 mb-4">Gallery & Thoughts</h2>
            <h3 className="text-4xl font-black uppercase tracking-tighter text-neutral-100">Blogs & Photos</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {blogs.map((blog, idx) => (
              <motion.div 
                key={blog.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelectedPost({ type: 'blog', id: blog.id })}
                className="group relative bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col"
              >
                <div className="w-full overflow-hidden">
                  <img src={blog.image} alt={blog.title} className="w-full h-auto object-contain transition-all duration-700" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-8 flex flex-col justify-end transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-500">{blog.date}</span>
                    {blog.gallery && blog.gallery.length > 0 && (
                      <div className="flex items-center gap-1 bg-indigo-500/10 px-2 py-1 rounded text-[8px] font-black text-indigo-400 uppercase tracking-widest">
                        <ImageIcon className="w-2 h-2" /> {blog.gallery.length + 1} Photos
                      </div>
                    )}
                  </div>
                  <h4 className="text-xl font-bold uppercase tracking-tight text-white mb-2">{blog.title}</h4>
                </div>
              </motion.div>
            ))}
          </div>
          {blogs.length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-neutral-900 rounded-3xl">
              <p className="text-neutral-600 italic">No blog posts yet.</p>
            </div>
          )}
        </section>

        <footer id="contact" className="mt-24 pt-24 border-t border-neutral-900">
           <div className="flex flex-col md:flex-row items-end justify-between gap-12 mb-24">
             <div className="max-w-2xl">
               <h3 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-neutral-100 leading-[0.85]">
                 Let's start <br />
                 <span className="text-indigo-600">something</span>
               </h3>
             </div>
             <button 
               onClick={() => setShowEmailModal(true)}
               className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-neutral-100 hover:text-indigo-500 transition-colors border-b-4 border-neutral-100 hover:border-indigo-500 pb-2 cursor-pointer"
             >
               Send Mail
             </button>
           </div>
           <div className="flex flex-col md:flex-row justify-between items-end pb-8 gap-8">
              <div className="flex gap-16">
                <div>
                  <div className="text-[10px] uppercase opacity-40 tracking-widest font-black mb-2">Location</div>
                  <div className="text-sm font-bold uppercase tracking-tight text-neutral-300">Narail, Khulna, Dhaka, Bangladesh</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase opacity-40 tracking-widest mb-2 italic">Handcrafted with precision</div>
                <div className="text-sm font-black uppercase tracking-tighter text-neutral-100">© 2005 {siteData.name} {siteData.surname}</div>
              </div>
           </div>
        </footer>
      </main>

      <AnimatePresence>
        {showEmailModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] flex items-center justify-center p-4 md:p-8 overflow-hidden"
          >
            <div 
              className="absolute inset-0 bg-black/90 backdrop-blur-xl" 
              onClick={() => setShowEmailModal(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-[40px] overflow-y-auto shadow-2xl custom-scrollbar"
            >
              <button 
                onClick={() => setShowEmailModal(false)}
                className="absolute top-6 right-6 z-[60] p-4 rounded-2xl bg-neutral-800/80 backdrop-blur-md text-neutral-400 hover:text-white border border-neutral-700 hover:border-indigo-500/50 transition-all transition-all group"
              >
                <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
              </button>

              <div className="p-8 md:p-12">
                <div className="mb-10 flex justify-center">
                  <div className="relative group">
                    <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-neutral-800 shadow-2xl ring-4 ring-indigo-500/20">
                      <img 
                        src={siteData.contactImage || siteData.profileImage} 
                        alt={siteData.name} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                    {/* Verified Badge */}
                    <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 w-8 h-8 md:w-10 md:h-10 bg-blue-500 border-4 border-neutral-900 rounded-full flex items-center justify-center shadow-xl z-20">
                      <Check className="w-4 h-4 md:w-5 h-5 text-white stroke-[4]" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-start mb-12 relative overflow-hidden">
                  <div className="relative z-10">
                    <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white leading-none">
                      Get in <br />
                      <span className="text-indigo-600">touch</span>
                    </h2>
                    <p className="mt-4 text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Choose your preferred communication channel</p>
                  </div>
                  <div className="absolute -right-4 -top-8 opacity-5">
                    <Mail className="w-48 h-48 text-indigo-500" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Personal Email */}
                  <motion.a 
                    whileHover={{ scale: 1.02, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    href={`mailto:${siteData.email}`}
                    className="group relative flex flex-col p-8 rounded-3xl bg-neutral-950 border border-neutral-800 hover:border-indigo-500/50 transition-all overflow-hidden h-full"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <User className="w-24 h-24" />
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-500/20 relative">
                      <User className="w-6 h-6" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-black border border-indigo-500 rounded-lg flex items-center justify-center">
                        <Mail className="w-2.5 h-2.5 text-indigo-500" />
                      </div>
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-tight text-white mb-1">Personal Email</h3>
                    <div className="flex items-center gap-2 mb-4 group/mail">
                      <p className="text-[10px] text-indigo-400 font-bold tracking-tight lowercase truncate">{siteData.email}</p>
                      <button 
                        onClick={(e) => handleCopy(e, siteData.email)}
                        className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-white hover:border-indigo-500/50 transition-all shrink-0"
                      >
                        {copiedId === siteData.email ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest mb-4">Direct Communication</p>
                    <div className="mt-auto flex items-center gap-2 text-indigo-500 group-hover:gap-4 transition-all">
                      <span className="text-[10px] font-black uppercase tracking-widest">Connect Now</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </motion.a>

                  {/* Business Email */}
                  {siteData.businessEmail && (
                    <motion.a 
                      whileHover={{ scale: 1.02, y: -5 }}
                      whileTap={{ scale: 0.98 }}
                      href={`mailto:${siteData.businessEmail}`}
                      className="group relative flex flex-col p-8 rounded-3xl bg-neutral-950 border border-neutral-800 hover:border-indigo-500/50 transition-all overflow-hidden h-full"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Briefcase className="w-24 h-24" />
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-500/20 relative">
                        <Briefcase className="w-6 h-4" />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-black border border-blue-500 rounded-lg flex items-center justify-center">
                          <Mail className="w-2.5 h-2.5 text-blue-500" />
                        </div>
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-tight text-white mb-1">Business Email</h3>
                      <div className="flex items-center gap-2 mb-4 group/mail">
                        <p className="text-[10px] text-blue-400 font-bold tracking-tight lowercase truncate">{siteData.businessEmail}</p>
                        <button 
                          onClick={(e) => handleCopy(e, siteData.businessEmail!)}
                          className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-white hover:border-blue-500/50 transition-all shrink-0"
                        >
                          {copiedId === siteData.businessEmail ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest mb-4">Professional Inquiries</p>
                      <div className="mt-auto flex items-center gap-2 text-blue-500 group-hover:gap-4 transition-all">
                        <span className="text-[10px] font-black uppercase tracking-widest">Connect Now</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </motion.a>
                  )}

                  {/* WhatsApp */}
                  {siteData.whatsapp && (
                    <motion.a 
                      whileHover={{ scale: 1.02, y: -5 }}
                      whileTap={{ scale: 0.98 }}
                      href={`https://wa.me/${siteData.whatsapp.replace(/\+/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex flex-col p-8 rounded-3xl bg-neutral-950 border border-neutral-800 hover:border-green-500/50 transition-all overflow-hidden h-full"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <MessageCircle className="w-24 h-24 text-green-500" />
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center text-white mb-6 shadow-lg shadow-green-500/20 relative">
                        <User className="w-6 h-6" />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-black border border-green-500 rounded-lg flex items-center justify-center">
                          <MessageCircle className="w-2.5 h-2.5 text-green-500" />
                        </div>
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-tight text-white mb-1">WhatsApp</h3>
                      <div className="flex items-center gap-2 mb-4 group/mail">
                        <p className="text-[10px] text-green-400 font-bold tracking-tight truncate">{siteData.whatsapp}</p>
                        <button 
                          onClick={(e) => handleCopy(e, siteData.whatsapp!)}
                          className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-white hover:border-green-500/50 transition-all shrink-0"
                        >
                          {copiedId === siteData.whatsapp ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest mb-4">Instant Chat</p>
                      <div className="mt-auto flex items-center gap-2 text-green-500 group-hover:gap-4 transition-all">
                        <span className="text-[10px] font-black uppercase tracking-widest">Message Me</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </motion.a>
                  )}

                  {/* LinkedIn */}
                  {siteData.linkedin && (
                    <motion.a 
                      whileHover={{ scale: 1.02, y: -5 }}
                      whileTap={{ scale: 0.98 }}
                      href={siteData.linkedin.startsWith('http') ? siteData.linkedin : `https://www.linkedin.com/in/${siteData.linkedin}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex flex-col p-8 rounded-3xl bg-neutral-950 border border-neutral-800 hover:border-blue-400/50 transition-all overflow-hidden h-full"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Linkedin className="w-24 h-24 text-blue-400" />
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-blue-800 flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-900/20 relative">
                        <Briefcase className="w-6 h-4" />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-black border border-blue-400 rounded-lg flex items-center justify-center">
                          <Linkedin className="w-2.5 h-2.5 text-blue-400" />
                        </div>
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-tight text-white mb-1">LinkedIn</h3>
                      <div className="flex items-center gap-2 mb-4 group/mail">
                        <p className="text-[10px] text-blue-400 font-bold tracking-tight truncate">{siteData.linkedin}</p>
                        <button 
                          onClick={(e) => handleCopy(e, siteData.linkedin)}
                          className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-white hover:border-blue-400/50 transition-all shrink-0"
                        >
                          {copiedId === siteData.linkedin ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest mb-4">Professional Profile</p>
                      <div className="mt-auto flex items-center gap-2 text-blue-400 group-hover:gap-4 transition-all">
                        <span className="text-[10px] font-black uppercase tracking-widest">Connect Now</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </motion.a>
                  )}
                </div>

                <div className="mt-12 pt-8 border-t border-neutral-800 flex justify-center">
                  <div className="flex items-center gap-3 text-neutral-600 text-[9px] font-black uppercase tracking-[0.3em]">
                    <Mail className="w-3 h-3" />
                    Response time: ~24 Hours
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAboutModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] flex items-center justify-center p-4 md:p-8 overflow-hidden"
          >
            <div 
              className="absolute inset-0 bg-black/90 backdrop-blur-xl" 
              onClick={() => setShowAboutModal(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-[40px] overflow-y-auto shadow-2xl custom-scrollbar"
            >
              <button 
                onClick={() => setShowAboutModal(false)}
                className="absolute top-6 right-6 z-[60] p-4 rounded-2xl bg-neutral-800/80 backdrop-blur-md text-neutral-400 hover:text-white border border-neutral-700 hover:border-indigo-500/50 transition-all group"
              >
                <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
              </button>

              <div className="p-8 md:p-12">
                <div className="mb-10 flex justify-center">
                  <div className="relative group">
                    <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-neutral-800 shadow-2xl ring-4 ring-indigo-500/20">
                      <img 
                        src={siteData.aboutImage || siteData.profileImage} 
                        alt={siteData.name} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                    {/* Verified Badge */}
                    <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 w-8 h-8 md:w-10 md:h-10 bg-blue-500 border-4 border-neutral-900 rounded-full flex items-center justify-center shadow-xl z-20">
                      <Check className="w-4 h-4 md:w-5 h-5 text-white stroke-[4]" />
                    </div>
                  </div>
                </div>

                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white leading-none mb-4">
                    About <span className="text-indigo-500">{siteData.name}</span>
                  </h2>
                  <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600">
                    <span className="w-8 h-px bg-neutral-800" />
                    Creative Full-Stack Developer
                    <span className="w-8 h-px bg-neutral-800" />
                  </div>
                </div>

                <div className="prose prose-invert max-w-none">
                  <p className="text-lg md:text-xl text-neutral-400 leading-relaxed font-light whitespace-pre-wrap">
                    {siteData.about || defaults.about}
                  </p>
                </div>

                <div className="mt-12 pt-8 border-t border-neutral-800 flex justify-center">
                  <button 
                    onClick={() => {
                      setShowAboutModal(false);
                      setShowEmailModal(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-8 rounded-2xl flex items-center gap-3 text-xs uppercase tracking-[0.2em] transition-all active:scale-95"
                  >
                    <Mail className="w-4 h-4" />
                    Let's Connect
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedPost && selectedPostData && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-[150] bg-neutral-950 overflow-y-auto"
          >
            <div className="max-w-7xl mx-auto px-8 pt-32 pb-24 relative">
              <button 
                onClick={() => setSelectedPost(null)}
                className="fixed top-24 left-8 z-[160] flex items-center gap-2 bg-neutral-900/50 backdrop-blur-md border border-neutral-800 text-neutral-400 hover:text-white px-6 py-3 rounded-2xl transition-all font-black uppercase tracking-widest text-[10px]"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Feed
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                <div className="lg:col-span-8">
                  {selectedPost.type !== 'experience' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-3xl overflow-hidden border border-neutral-900 mb-12 bg-neutral-900 flex justify-center items-center group max-w-xl"
                    >
                      <img 
                        src={selectedPost.type === 'project' ? (selectedPostData as Project).image : (selectedPostData as Blog).image} 
                        className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-105" 
                        alt=""
                      />
                    </motion.div>
                  )}

                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter text-white mb-8">
                    {selectedPost.type === 'experience' ? (selectedPostData as Experience).role : selectedPostData.title}
                  </h1>

                  <div className="flex flex-wrap gap-8 items-center mb-12 py-8 border-y border-neutral-900">
                    <div>
                      <div className="text-[10px] uppercase font-black tracking-widest text-neutral-600 mb-1">Type</div>
                      <div className="text-sm font-bold uppercase tracking-tight text-indigo-500">
                        {selectedPost.type === 'project' ? (selectedPostData as Project).type : selectedPost.type === 'blog' ? 'Blog Post' : 'Experience'}
                      </div>
                    </div>
                    {selectedPost.type === 'project' && (selectedPostData as Project).dateReceived && (
                      <div>
                        <div className="text-[10px] uppercase font-black tracking-widest text-neutral-600 mb-1">Started</div>
                        <div className="text-sm font-bold uppercase tracking-tight text-neutral-400">{(selectedPostData as Project).dateReceived}</div>
                      </div>
                    )}
                    {selectedPost.type === 'blog' && (selectedPostData as Blog).date && (
                      <div>
                        <div className="text-[10px] uppercase font-black tracking-widest text-neutral-600 mb-1">Published</div>
                        <div className="text-sm font-bold uppercase tracking-tight text-neutral-400">{(selectedPostData as Blog).date}</div>
                      </div>
                    )}
                    {selectedPost.type === 'experience' && (selectedPostData as Experience).period && (
                      <div>
                        <div className="text-[10px] uppercase font-black tracking-widest text-neutral-600 mb-1">Period</div>
                        <div className="text-sm font-bold uppercase tracking-tight text-neutral-400">{(selectedPostData as Experience).period}</div>
                      </div>
                    )}
                    {selectedPost.type === 'experience' && (selectedPostData as Experience).company && (
                      <div>
                        <div className="text-[10px] uppercase font-black tracking-widest text-neutral-600 mb-1">Company</div>
                        <div className="text-sm font-bold uppercase tracking-tight text-neutral-400">{(selectedPostData as Experience).company}</div>
                      </div>
                    )}
                    {selectedPost.type === 'project' && ((selectedPostData as Project).link || (selectedPostData as Project).github) && (
                      <div className="flex items-center gap-4 ml-auto">
                        {(selectedPostData as Project).github && (
                          <a href={(selectedPostData as Project).github} target="_blank" rel="noopener noreferrer" className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-white hover:border-indigo-500 transition-all">
                            <Github className="w-5 h-5" />
                          </a>
                        )}
                        {(selectedPostData as Project).link && (
                          <a href={(selectedPostData as Project).link} target="_blank" rel="noopener noreferrer" className="p-4 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all flex items-center gap-3 px-8 font-black uppercase tracking-[0.2em] text-[10px]">
                            <ExternalLink className="w-4 h-4" /> Live Preview
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedPost.type !== 'experience' && selectedPostData.gallery && selectedPostData.gallery.length > 0 && (
                    <div className="mb-24">
                      <h2 className="text-xs uppercase tracking-[0.4em] font-black text-neutral-600 mb-12">Gallery</h2>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedPostData.gallery.map((img, i) => (
                          <motion.div 
                            key={i} 
                            whileHover={{ scale: 1.02 }}
                            onClick={() => setViewingGallery({ images: (selectedPostData as any).gallery!, title: (selectedPostData as any).title })}
                            className="aspect-square rounded-3xl overflow-hidden border border-neutral-900 bg-neutral-900 cursor-zoom-in"
                          >
                            <img src={img} className="w-full h-full object-cover transition-all" />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="prose prose-invert max-w-none mb-24">
                    <p className="text-xl text-neutral-400 leading-relaxed uppercase whitespace-pre-wrap font-light">
                      {selectedPost.type === 'project' 
                        ? (selectedPostData as Project).description 
                        : selectedPost.type === 'blog' 
                        ? (selectedPostData as Blog).content 
                        : (selectedPostData as Experience).description}
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-4 lg:sticky lg:top-32 self-start">
                  <div className="p-8 rounded-[40px] border border-neutral-900 bg-neutral-950/50 backdrop-blur-md">
                    <h2 className="text-xs uppercase tracking-[0.4em] font-black text-neutral-600 mb-8 underline decoration-indigo-500 underline-offset-8">More from Feed</h2>
                    <div className="space-y-6">
                      {[...projects, ...blogs, ...experiences]
                        .filter(p => p.id !== selectedPost.id)
                        .sort(() => Math.random() - 0.5)
                        .slice(0, 6)
                        .map((post) => (
                          <motion.div 
                            key={post.id}
                            onClick={() => setSelectedPost({ 
                              type: (post as Blog).content ? 'blog' : (post as Experience).company ? 'experience' : 'project', 
                              id: post.id 
                            })}
                            className="flex gap-4 group cursor-pointer"
                          >
                            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 flex-shrink-0 flex items-center justify-center">
                              {('image' in post) ? (
                                <img src={(post as any).image} className="w-full h-full object-cover transition-all duration-500" />
                              ) : (
                                <Briefcase className="w-8 h-8 text-neutral-700 group-hover:text-indigo-500 transition-colors" />
                              )}
                            </div>
                            <div className="flex flex-col justify-center">
                              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-neutral-700 mb-1 group-hover:text-indigo-500 transition-colors">
                                {(post as Blog).content ? 'Blog' : (post as Experience).company ? 'Experience' : (post as Project).type}
                              </span>
                              <h4 className="text-sm font-bold uppercase tracking-tight text-neutral-400 group-hover:text-white transition-colors line-clamp-2">
                                {(post as any).title || (post as any).role}
                              </h4>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                    
                    <button 
                      onClick={() => setSelectedPost(null)}
                      className="w-full mt-12 py-5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-2xl border border-neutral-800 font-black uppercase tracking-[0.2em] text-[10px] transition-all"
                    >
                      Back to Home
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPinModalOpen && (
          <div className="fixed inset-0 z-[200]">
            <PINModal 
              onSuccess={() => {
                setIsAdminAuthenticated(true);
                sessionStorage.setItem('admin_authenticated', 'true');
                // Store persistent session expiry (2 hours)
                localStorage.setItem('admin_session_expiry', (Date.now() + 2 * 60 * 60 * 1000).toString());
                setIsPinModalOpen(false);
                setShowAdmin(true);
              }} 
              onCancel={() => setIsPinModalOpen(false)} 
            />
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingGallery && (
          <GalleryModal 
            images={viewingGallery.images} 
            title={viewingGallery.title} 
            onClose={() => setViewingGallery(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
function AdminLoginModal({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isAlerting, setIsAlerting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || attempts >= 3) return;

    setLoading(true);
    setError('');
    try {
      await loginWithEmail(email, password);
      onSuccess();
    } catch (err: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setIsAlerting(true);
      
      if (newAttempts >= 3) {
        setError('CRITICAL ERROR: SYSTEM LOCKDOWN INITIATED');
        setTimeout(() => {
          onCancel();
        }, 2000);
      } else {
        setError(`ACCESS DENIED: ${3 - newAttempts} ATTEMPTS REMAINING`);
        // Stop alerting after 2s
        setTimeout(() => setIsAlerting(false), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 1.2, rotateY: 90 }} 
      animate={{ opacity: 1, scale: 1, rotateY: 0 }} 
      transition={{ duration: 0.8, type: "spring" }}
      className={`w-full max-w-sm border-8 p-8 rounded-[40px] shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden transition-colors duration-200 ${
        isAlerting ? 'bg-red-950/40 border-red-900 shadow-[0_0_100px_rgba(239,68,68,0.4)]' : 'bg-[#111] border-[#222]'
      }`}
    >
      {/* Alert Overlay */}
      <AnimatePresence>
        {isAlerting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ repeat: Infinity, duration: 0.4 }}
            className="absolute inset-0 bg-red-600/20 z-0 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
      
      <div className="relative z-10">
        <div className="flex justify-center mb-8">
          <div className="p-4 rounded-full bg-neutral-950 border-2 border-neutral-800 shadow-inner">
            <User className={`w-8 h-8 transition-colors ${isAlerting ? 'text-red-500' : 'text-neutral-500'}`} />
          </div>
        </div>

        <h3 className="text-xl font-black uppercase tracking-[0.2em] text-white text-center mb-1">Central Access</h3>
        <p className="text-neutral-500 text-[8px] uppercase font-bold tracking-[0.3em] text-center mb-10 italic">Tier 2 Verification Required</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] uppercase font-black text-neutral-600 tracking-[0.3em] ml-2">Identity Hub (Email)</label>
            <input 
              type="email" 
              required 
              disabled={loading || attempts >= 3}
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full bg-black border-2 border-neutral-800 rounded-2xl p-4 text-sm font-mono focus:outline-none focus:border-blue-500 transition-all text-white placeholder:text-neutral-800 disabled:opacity-50" 
              placeholder="ADMIN@SECTOR.7"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] uppercase font-black text-neutral-600 tracking-[0.3em] ml-2">Security Key (Password)</label>
            <input 
              type="password" 
              required 
              disabled={loading || attempts >= 3}
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full bg-black border-2 border-neutral-800 rounded-2xl p-4 text-sm font-mono focus:outline-none focus:border-blue-500 transition-all text-white disabled:opacity-50" 
            />
          </div>
          
          {error && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`${isAlerting || attempts >= 3 ? 'text-red-400' : 'text-red-500'} text-[10px] font-black uppercase tracking-widest text-center bg-red-500/5 py-2 rounded-lg border border-red-500/20`}
            >
              {error}
            </motion.p>
          )}

          <div className="flex flex-col gap-4 pt-4">
            <button 
              type="submit" 
              disabled={loading || attempts >= 3}
              className={`group relative w-full py-5 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-50 ${
                isAlerting ? 'bg-red-600 text-white' : 'bg-neutral-100 hover:bg-white text-black'
              }`}
            >
              <span className="relative z-10">
                {attempts >= 3 ? 'SYSTEM LOCKED' : loading ? 'VERIFYING...' : 'CONFIRM ACCESS'}
              </span>
              {!isAlerting && <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </button>
            
            <button 
              type="button" 
              onClick={onCancel} 
              className="w-full py-2 text-neutral-600 font-bold uppercase tracking-widest text-[8px] hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <X className="w-3 h-3" />
              Security Exit
            </button>
          </div>
        </form>
      </div>

      {/* Industrial accents */}
      <div className="absolute top-4 left-4 w-2 h-2 bg-neutral-800 rounded-full" />
      <div className="absolute top-4 right-4 w-2 h-2 bg-neutral-800 rounded-full" />
      <div className="absolute bottom-4 left-4 w-2 h-2 bg-neutral-800 rounded-full" />
      <div className="absolute bottom-4 right-4 w-2 h-2 bg-neutral-800 rounded-full" />
    </motion.div>
  );
}

function PINModal({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {

  const [step, setStep] = useState<'pin' | 'success_alert' | 'sliding_out' | 'door_opening' | 'login'>('pin');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isRedAlert, setIsRedAlert] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch (e) {
      console.error("Audio Context failed", e);
      return null;
    }
  };

  const playClick = () => {
    const ctx = initAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  };

  const playError = () => {
    const ctx = initAudio();
    if (!ctx) return;
    
    // Create an aggressive "REJECTED" sound
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc3.type = 'sawtooth';
    
    const now = ctx.currentTime;
    
    // Low, dissonant cluster
    osc1.frequency.setValueAtTime(80, now);
    osc2.frequency.setValueAtTime(85, now);
    osc3.frequency.setValueAtTime(92, now);
    
    // Rapid downward sweep
    osc1.frequency.exponentialRampToValueAtTime(40, now + 0.4);
    osc2.frequency.exponentialRampToValueAtTime(40, now + 0.4);
    osc3.frequency.exponentialRampToValueAtTime(40, now + 0.4);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    osc1.connect(gain);
    osc2.connect(gain);
    osc3.connect(gain);
    gain.connect(ctx.destination);
    
    osc1.start();
    osc2.start();
    osc3.start();
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.4);
    osc3.stop(now + 0.4);
  };

  const playSiren = () => {
    const ctx = initAudio();
    if (!ctx) return;
    
    const now = ctx.currentTime;
    const duration = 5;
    
    // Harsher, faster siren
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, now);
    
    // Rapid pulsating sweeps
    for (let i = 0; i < duration * 2; i++) {
      osc.frequency.exponentialRampToValueAtTime(1200, now + (i * 0.5) + 0.25);
      osc.frequency.exponentialRampToValueAtTime(600, now + (i * 0.5) + 0.5);
    }
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.1, now + duration - 0.5);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(now + duration);
  };

  const playSuccess = () => {
    const ctx = initAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    // Higher pitched melodic chime
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(now + 0.5);
  };

  const handleNumberClick = (num: string) => {
    if (isLocked || step !== 'pin' || pin.length >= 4) return;
    playClick();
    setPin(prev => prev + num);
    setError('');
  };

  const handleClear = () => {
    if (isLocked || step !== 'pin') return;
    playClick();
    setPin('');
  };

  const handleEnter = () => {
    if (isLocked || step !== 'pin') return;
    
    if (pin === '2005') {
      playSuccess();
      // Step 1: Green Alert Pulse (2s)
      setStep('success_alert');
      
      // Step 2: Keypad slides out
      setTimeout(() => {
        setStep('sliding_out');
        
        // Step 3: Vault door starts opening animation
        setTimeout(() => {
          setStep('door_opening');
                        // Step 4: Login form revealed or direct access if session valid
          setTimeout(() => {
            const expiry = localStorage.getItem('admin_session_expiry');
            const isSessionValid = expiry && parseInt(expiry) > Date.now() && auth.currentUser;
            
            if (isSessionValid) {
              onSuccess();
            } else {
              setStep('login');
            }
          }, 5000);
        }, 800);
      }, 2000);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPin('');

      if (newAttempts >= 3) {
        playSiren();
        setIsRedAlert(true);
        setIsLocked(true);
        
        setTimeout(() => {
          setIsRedAlert(false);
          onCancel();
        }, 5000); 
      } else {
        playError();
        // Just flash the LEDs (which happens automatically via the attempts state)
        // No full screen red alert here
      }
    }
  };

  const KeyButton = ({ label, onClick, className = "", colorClass = "bg-[#add8e6]" }: { key?: string; label: string; onClick: () => void; className?: string; colorClass?: string }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={isLocked || step !== 'pin'}
      className={`h-16 flex items-center justify-center rounded-xl border-t-2 border-l-2 border-white/30 border-r-2 border-b-2 border-black/40 shadow-[2px_2px_5px_rgba(0,0,0,0.4)] active:shadow-inner active:translate-y-[1px] transition-all ${colorClass} ${className}`}
    >
      <span className="text-2xl font-black text-black/80">{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 overflow-hidden">
      <AnimatePresence>
        {isRedAlert && (
          <motion.div 
            key="red-alert-full-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] pointer-events-none flex items-center justify-center overflow-hidden"
          >
            {/* The flickering scary red overlay */}
            <motion.div 
              animate={{ opacity: [0.4, 0.8, 0.3, 1, 0.2] }}
              transition={{ repeat: Infinity, duration: 0.1, ease: "linear" }}
              className="absolute inset-0 bg-red-600/40 mix-blend-overlay"
            />
            <motion.div 
              animate={{ opacity: [0.1, 0.5, 0.1] }}
              transition={{ repeat: Infinity, duration: 0.05, ease: "linear" }}
              className="absolute inset-0 bg-red-900/60"
            />
            
            {/* Scanning Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none" />

            <div className="relative z-20 flex flex-col items-center gap-4">
              <motion.div
                animate={{ scale: [1, 1.4, 1], rotate: [0, -5, 5, -5, 5, 0] }}
                transition={{ repeat: Infinity, duration: 0.15 }}
              >
                <ShieldAlert className="w-56 h-56 text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,1)]" />
              </motion.div>
            </div>
          </motion.div>
        )}

        {isLocked && (
          <motion.div 
            key="locked-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-red-950/20 z-[300] pointer-events-none"
          />
        )}
        {step === 'success_alert' && (
          <motion.div 
            key="success-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 0.4 }}
            className="fixed inset-0 bg-green-500/30 z-[300] pointer-events-none mix-blend-overlay"
          />
        )}
      </AnimatePresence>

      <div className="relative w-full h-full flex items-center justify-center">
        
        {/* Step 3: Formal Login Content (Revealed after door opens) */}
        {(step === 'door_opening' || step === 'login') && (
          <motion.div
            key="login-modal-reveal"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={step === 'login' ? { opacity: 1, scale: 1 } : { opacity: 0.3, scale: 0.9 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 flex items-center justify-center z-[50]"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-500/10 blur-[100px] rounded-full pointer-events-none" />
            <AdminLoginModal onSuccess={onSuccess} onCancel={onCancel} />
          </motion.div>
        )}

        {/* Step 1: Keypad - slides away to the right */}
        <motion.div 
          animate={
            isRedAlert ? { 
              x: [0, -10, 10, -10, 10, 0],
              y: [0, 5, -5, 5, -5, 0],
              rotate: [0, -1, 1, -1, 1, 0]
            } : 
            step !== 'pin' && step !== 'success_alert' ? { 
              x: "150%", 
              opacity: 0,
              rotateY: 20,
              scale: 0.8,
            } : { x: 0, opacity: 1 }
          }
          transition={isRedAlert ? { repeat: Infinity, duration: 0.1 } : { duration: 0.8, ease: "easeInOut" }}
          className="w-full max-w-[360px] bg-[#1a1a1a] p-6 rounded-[30px] border-[12px] border-[#2a2a2a] shadow-[10px_10px_30px_rgba(0,0,0,0.8)] relative z-[100]"
        >
          {/* LED Indicators */}
          <div className="flex justify-center gap-6 mb-6">
            {[0, 1, 2].map((i) => {
              const isCorrect = step !== 'pin';
              const isFailed = attempts > i;
              return (
                <div key={`led-${i}`} className="flex flex-col items-center gap-1.5">
                  <div 
                    className={`w-4 h-4 rounded-full transition-all duration-500 border-2 border-black/20 ${
                      isCorrect ? 'bg-green-400 shadow-[0_0_15px_#4ade80,0_0_25px_#22c55e]' : 
                      isFailed ? 'bg-red-500 shadow-[0_0_15px_#ef4444,0_0_25px_#dc2626]' : 
                      'bg-neutral-800 shadow-inner'
                    }`} 
                  />
                  <div className={`text-[6px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${isCorrect ? 'text-green-500' : isFailed ? 'text-red-500' : 'text-neutral-700'}`}>
                    UNIT {i + 1}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Device screen area */}
          <div className="bg-[#101525] rounded-lg p-5 mb-6 border-b-4 border-[#222] shadow-inner relative overflow-hidden h-24 flex flex-col justify-center items-center">
            <div className={`absolute inset-0 ${step === 'success_alert' ? 'bg-green-500/10' : 'bg-gradient-to-b from-blue-900/10 to-transparent'} pointer-events-none`} />
            {isLocked ? (
              <div className="text-red-500 font-mono text-lg font-black animate-pulse uppercase tracking-tighter">System Locked</div>
            ) : step === 'success_alert' ? (
              <div className="text-green-500 font-mono text-lg font-black animate-pulse uppercase tracking-tighter">Access Granted</div>
            ) : (
              <>
                <div className="flex gap-3 mb-1">
                  {[0, 1, 2, 3].map(i => (
                    <div key={`dot-${i}`} className={`w-4 h-4 rounded-full border-2 border-blue-500/30 ${pin.length > i ? 'bg-blue-400 shadow-[0_0_10px_#60a5fa]' : 'bg-transparent'}`} />
                  ))}
                </div>
                <div className="text-blue-400/50 font-mono text-[8px] uppercase tracking-[0.2em] mt-2">Enter Access Key</div>
              </>
            )}
          </div>

          {/* Keypad Grid */}
          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <KeyButton key={num} label={num} onClick={() => handleNumberClick(num)} />
            ))}
            <KeyButton key="clear" label="CLEAR" onClick={handleClear} colorClass="bg-[#ff0000]" className="!text-[12px] font-black" />
            <KeyButton key="0" label="0" onClick={() => handleNumberClick('0')} />
            <KeyButton key="enter" label="ENTER" onClick={handleEnter} colorClass={step === 'success_alert' ? 'bg-green-400' : 'bg-[#00c851]'} className="!text-[12px] font-black" />
          </div>

          <button onClick={onCancel} className="absolute top-2 right-4 text-white/10 hover:text-white/40"><X className="w-4 h-4" /></button>
        </motion.div>

        {/* The Sliding Vault Doors */}
        <AnimatePresence>
          {(step === 'door_opening' || step === 'login') && (
            <div className="absolute inset-0 z-[200] flex pointer-events-none overflow-hidden">
              {/* Green Light Burst behind doors */}
              {step === 'door_opening' && (
                <motion.div 
                  key="light-burst"
                  initial={{ opacity: 0, scaleX: 0, scaleY: 0.1 }}
                  animate={{ 
                    opacity: [0, 1, 0.8, 0], 
                    scaleX: [0, 1, 3, 8], 
                    scaleY: [0.1, 0.5, 2, 6] 
                  }}
                  transition={{ duration: 3, times: [0, 0.2, 0.5, 1], ease: "easeOut" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-full bg-green-400 blur-[60px] z-[150] pointer-events-none will-change-transform"
                />
              )}
              {/* Left Door */}
              <motion.div 
                key="left-vault-door"
                initial={{ x: 0 }}
                animate={(step === 'door_opening' || step === 'login') ? { x: "-100%" } : { x: 0 }}
                transition={{ 
                  duration: 3, 
                  ease: [0.16, 1, 0.3, 1], // Expo Out
                  force3D: true 
                }}
                className="w-1/2 h-full bg-[#111] border-r-8 border-[#333] shadow-[inner_0_0_100px_rgba(0,0,0,1)] relative flex items-center justify-end overflow-hidden will-change-transform"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,_#222,_#111)]" />
                <div className="mr-8 z-10">
                  <div className="w-40 h-40 rounded-full border-[12px] border-[#222] shadow-[inset_0_0_40px_rgba(0,0,0,1)] relative flex items-center justify-center bg-[#0a0a0a]">
                    <motion.div 
                      animate={(step === 'door_opening' || step === 'login') ? { rotate: 720 } : {}}
                      transition={{ duration: 3, ease: [0.16, 1, 0.3, 1] }}
                      className="w-28 h-6 bg-neutral-800 rounded-full shadow-lg border-2 border-neutral-700"
                    />
                    <div className="absolute w-8 h-8 rounded-full bg-neutral-900 border-4 border-neutral-800" />
                  </div>
                </div>
              </motion.div>
              {/* Right Door */}
              <motion.div 
                key="right-vault-door"
                initial={{ x: 0 }}
                animate={(step === 'door_opening' || step === 'login') ? { x: "100%" } : { x: 0 }}
                transition={{ 
                  duration: 3, 
                  ease: [0.16, 1, 0.3, 1], // Expo Out
                  force3D: true 
                }}
                className="w-1/2 h-full bg-[#111] border-l-8 border-[#333] shadow-[inner_0_0_100px_rgba(0,0,0,1)] relative flex items-center justify-start overflow-hidden will-change-transform"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,_#222,_#111)]" />
                <div className="ml-8 z-10">
                  <div className="w-40 h-40 rounded-full border-[12px] border-[#222] shadow-[inset_0_0_40px_rgba(0,0,0,1)] relative flex items-center justify-center bg-[#0a0a0a]">
                    <motion.div 
                      animate={(step === 'door_opening' || step === 'login') ? { rotate: -720 } : {}}
                      transition={{ duration: 3, ease: [0.16, 1, 0.3, 1] }}
                      className="w-28 h-6 bg-neutral-800 rounded-full shadow-lg border-2 border-neutral-700"
                    />
                    <div className="absolute w-8 h-8 rounded-full bg-neutral-900 border-4 border-neutral-800" />
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


