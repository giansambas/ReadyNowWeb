import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  MapPin, 
  ShieldAlert, 
  Info, 
  Menu, 
  X, 
  CloudRain, 
  AlertTriangle,
  Home,
  ChevronRight,
  Wind,
  Droplets,
  Thermometer,
  User as UserIcon,
  LogOut,
  LogIn
} from 'lucide-react';
import { BARANGAY_DATA, EVACUATION_DATA } from './constants';
import { getPreparednessGuidance } from './services/geminiService';

// --- Types ---
interface Report {
  id: number;
  user_id: number;
  username: string;
  location: string;
  disaster: string;
  description: string;
  time: string;
}

interface User {
  id: number;
  username: string;
}

interface WeatherData {
  temp: number;
  description: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

// --- Components ---

const Sidebar = ({ isOpen, toggle, activeTab, setActiveTab }: { 
  isOpen: boolean, 
  toggle: () => void, 
  activeTab: string, 
  setActiveTab: (tab: string) => void 
}) => {
  const [isDesktop, setIsDesktop] = React.useState(false);

  React.useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'selection', label: 'Select Location', icon: MapPin },
    { id: 'map', label: 'Evacuation Info', icon: ShieldAlert },
    { id: 'report', label: 'Report Disaster', icon: AlertTriangle },
    { id: 'about', label: 'About ReadyNow', icon: Info },
  ];

  if (activeTab === 'home') return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggle}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: (isOpen || isDesktop) ? 0 : -300 }}
        className="fixed top-0 left-0 h-full w-64 bg-zinc-900 text-white z-50 transition-transform duration-300 ease-in-out"
      >
        <div className="p-4 md:p-6 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold tracking-tighter text-red-700">ReadyNow</h1>
          <button onClick={toggle} className="lg:hidden text-zinc-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="mt-6 px-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); if (window.innerWidth < 1024) toggle(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-red-700/10 text-red-700 font-medium' 
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-8 left-6 right-6 p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700/50">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-2">Emergency</p>
          <p className="text-sm font-medium text-white">NDRRMC: 911</p>
          <p className="text-sm font-medium text-white">QC DRRMO: 122</p>
        </div>
      </motion.aside>
    </>
  );
};

const Header = ({ toggleSidebar, onBack, showBack, activeTab, user, onLogin, onLogout }: { 
  toggleSidebar: () => void, 
  onBack: () => void, 
  showBack: boolean, 
  activeTab: string,
  user: User | null,
  onLogin: () => void,
  onLogout: () => void
}) => (
  <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-zinc-100 px-4 md:px-6 py-3 md:py-4">
    <div className="max-w-7xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-4">
        {activeTab !== 'home' && (
          <button onClick={toggleSidebar} className="lg:hidden text-zinc-600 p-2 hover:bg-zinc-100 rounded-lg">
            <Menu size={24} />
          </button>
        )}
        {showBack && (
          <button 
            onClick={onBack}
            className="flex items-center gap-1 text-sm font-bold text-zinc-600 hover:text-red-700 transition-colors"
          >
            <ChevronRight size={18} className="rotate-180" />
            Back
          </button>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-800 rounded-full text-xs font-semibold">
          <ShieldAlert size={14} />
          QC Disaster Ready
        </div>
        
        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p className="text-xs font-bold text-zinc-900">{user.username}</p>
              <button onClick={onLogout} className="text-[10px] text-zinc-400 hover:text-red-700 font-bold uppercase tracking-wider">Logout</button>
            </div>
            <div className="h-9 w-9 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 border border-zinc-200">
              <UserIcon size={18} />
            </div>
          </div>
        ) : (
          <button 
            onClick={onLogin}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all"
          >
            <LogIn size={14} />
            Login
          </button>
        )}
      </div>
    </div>
  </header>
);

const AuthModal = ({ isOpen, onClose, onAuthSuccess }: { isOpen: boolean, onClose: () => void, onAuthSuccess: (user: User) => void }) => {
  const [isLogin, setIsLogin] = React.useState(true);
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        onAuthSuccess(data);
        onClose();
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 text-zinc-400 hover:text-zinc-900">
          <X size={24} />
        </button>

        <h2 className="text-xl md:text-2xl font-bold mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        <p className="text-zinc-500 text-xs md:text-sm mb-6 md:mb-8">{isLogin ? 'Login to report disasters and help your community.' : 'Join ReadyNow to contribute to community safety.'}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-red-700 outline-none transition-all"
              placeholder="Enter username"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-red-700 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-red-700 text-xs font-bold">{error}</p>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 text-white py-4 rounded-xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="ml-2 text-red-700 font-bold hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

const Dashboard = ({ onSelectLocation, onReport }: { onSelectLocation: () => void, onReport: () => void }) => {
  const [reports, setReports] = React.useState<Report[]>([]);
  const [news, setNews] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/report', { credentials: 'include' }).then(res => res.json()).then(setReports);
    // Mock news for now as fetching from external RSS might be tricky in this env without a proxy
    setNews([
      { title: "QC DRRMO issues rainfall warning", source: "Local Government", time: "2h ago" },
      { title: "New evacuation centers opened in District 2", source: "QC News", time: "5h ago" },
      { title: "PAGASA monitors tropical depression", source: "PAGASA", time: "1d ago" },
    ]);
  }, []);

  return (
    <div className="space-y-8">
      <section className="bg-zinc-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Stay Prepared, Stay Safe.</h2>
          <p className="text-zinc-400 text-base md:text-lg mb-8">
            Get real-time evacuation information, weather updates, and AI-powered guidance for your specific location in Quezon City.
          </p>
          <div className="flex flex-wrap gap-4">
            <button onClick={onSelectLocation} className="bg-red-700 hover:bg-red-800 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2">
              <MapPin size={20} />
              Select Location
            </button>
            <button onClick={onReport} className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-all backdrop-blur-sm">
              Report Emergency
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-red-700/20 to-transparent pointer-events-none" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-zinc-100 shadow-sm h-full">
            <h3 className="text-lg md:text-xl font-bold mb-6 flex items-center gap-2">
              <CloudRain className="text-red-700" />
              Latest Disaster News
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {news.map((item, i) => (
                <div key={i} className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-red-200 hover:bg-white transition-all cursor-pointer group shadow-sm hover:shadow-md">
                  <p className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-2">{item.source}</p>
                  <h4 className="font-bold text-zinc-900 group-hover:text-red-800 transition-colors leading-tight">{item.title}</h4>
                  <p className="text-[10px] text-zinc-400 mt-3 font-medium">{item.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-8 border border-zinc-100 shadow-sm h-fit">
          <h3 className="text-lg md:text-xl font-bold mb-6 flex items-center gap-2">
            <AlertTriangle className="text-amber-500" />
            Community Reports
          </h3>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {reports.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">No community reports yet.</p>
            ) : (
              reports.map((r) => (
                <div key={r.id} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md uppercase">{r.disaster}</span>
                    <span className="text-[10px] text-zinc-400">{new Date(r.time).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm font-bold text-zinc-900 mb-1">{r.location}</p>
                  <p className="text-xs text-zinc-600 line-clamp-2 mb-2">{r.description}</p>
                  <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-100">
                    <div className="h-4 w-4 rounded-full bg-zinc-200 flex items-center justify-center">
                      <UserIcon size={10} className="text-zinc-500" />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500">{r.username || 'Anonymous'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Selection = ({ onComplete }: { onComplete: (district: string, barangay: string) => void }) => {
  const [district, setDistrict] = React.useState('');
  const [barangay, setBarangay] = React.useState('');
  const [search, setSearch] = React.useState('');

  const filteredBarangays = district 
    ? BARANGAY_DATA[district].filter(b => b.toLowerCase().includes(search.toLowerCase())).sort()
    : [];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Select Your Location</h2>
        <p className="text-zinc-500 text-sm">Choose your district and barangay to see evacuation maps.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 border border-zinc-100 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-semibold text-zinc-700 mb-2">District</label>
          <select 
            value={district}
            onChange={(e) => { setDistrict(e.target.value); setBarangay(''); }}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none transition-all"
          >
            <option value="">Choose District</option>
            {Object.keys(BARANGAY_DATA).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {district && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">Barangay</label>
            <input 
              type="text"
              placeholder="Search barangay..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none transition-all mb-4"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 custom-scrollbar">
              {filteredBarangays.map(b => (
                <button
                  key={b}
                  onClick={() => setBarangay(b)}
                  className={`px-3 py-2 rounded-lg text-sm transition-all ${
                    barangay === b 
                      ? 'bg-red-700 text-white font-medium' 
                      : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <button 
          disabled={!district || !barangay}
          onClick={() => onComplete(district, barangay)}
          className="w-full bg-zinc-900 text-white py-4 rounded-xl font-bold hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          View Evacuation Info
        </button>
      </div>
    </div>
  );
};

const MapInfo = ({ district, barangay }: { district: string, barangay: string }) => {
  const [weather, setWeather] = React.useState<WeatherData | null>(null);
  const [aiGuidance, setAiGuidance] = React.useState<string>('Generating AI guidance...');
  const [disasterType, setDisasterType] = React.useState('typhoon');
  const [selectedFacility, setSelectedFacility] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Reset selected facility when barangay changes
    setSelectedFacility(null);
  }, [barangay]);

  React.useEffect(() => {
    // Fetch Weather
    fetch("https://api.openweathermap.org/data/2.5/weather?q=Quezon City,PH&units=metric&appid=585f6af2cbff1e00738777e8c9af0136")
      .then(res => res.json())
      .then(data => {
        if (data.main) {
          setWeather({
            temp: Math.round(data.main.temp),
            description: data.weather[0].description,
            humidity: data.main.humidity,
            windSpeed: data.wind.speed,
            icon: data.weather[0].icon
          });
        }
      });
  }, []);

  React.useEffect(() => {
    if (weather) {
      const weatherStr = `${weather.temp}°C, ${weather.description}`;
      getPreparednessGuidance(disasterType, `${barangay}, ${district}`, weatherStr)
        .then(setAiGuidance);
    }
  }, [weather, disasterType, district, barangay]);

  const facilities = EVACUATION_DATA[barangay] || [];
  const mapQuery = selectedFacility 
    ? `${selectedFacility}, Barangay ${barangay}, ${district}, Quezon City, Philippines`
    : `Barangay ${barangay}, ${district}, Quezon City, Philippines`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{barangay}</h2>
          <p className="text-zinc-500 text-sm md:text-base">{district}, Quezon City</p>
          {selectedFacility && (
            <button 
              onClick={() => setSelectedFacility(null)}
              className="mt-2 text-xs font-bold text-red-700 hover:underline flex items-center gap-1"
            >
              <X size={12} />
              Reset to Barangay View
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-zinc-100 shadow-sm">
          <span className="text-xs font-bold text-zinc-400 px-2">MODE:</span>
          {['typhoon', 'earthquake', 'flood', 'fire'].map(type => (
            <button
              key={type}
              onClick={() => { setDisasterType(type); setAiGuidance('Generating AI guidance...'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                disasterType === type ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl overflow-hidden border border-zinc-100 shadow-sm h-[350px] md:h-[500px]">
            <iframe 
              key={mapQuery}
              className="w-full h-full border-none"
              src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
            />
          </div>

          <div className="bg-red-950 text-white rounded-3xl p-6 md:p-8 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
                <ShieldAlert className="text-red-400" />
                AI Preparedness Guidance
              </h3>
              <div className="prose prose-invert max-w-none text-red-100/90 text-sm leading-relaxed">
                {aiGuidance.split('\n').map((line, i) => (
                  <p key={i} className="mb-3 last:mb-0">{line}</p>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-red-700/20 rounded-full blur-3xl" />
          </div>
        </div>

        <div className="space-y-8">
          {weather && (
            <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm">
              <h3 className="text-lg font-bold mb-4">Current Weather</h3>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-4xl font-bold text-zinc-900">{weather.temp}°C</p>
                  <p className="text-zinc-500 capitalize">{weather.description}</p>
                </div>
                <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} alt="weather" className="w-16 h-16" referrerPolicy="no-referrer" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-2xl bg-zinc-50 flex items-center gap-2">
                  <Droplets size={16} className="text-red-700" />
                  <div>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">Humidity</p>
                    <p className="text-sm font-bold">{weather.humidity}%</p>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 flex items-center gap-2">
                  <Wind size={16} className="text-red-700" />
                  <div>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">Wind</p>
                    <p className="text-sm font-bold">{weather.windSpeed} m/s</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Evacuation Facilities</h3>
            <p className="text-[10px] text-zinc-400 font-bold uppercase mb-4">Click a facility to view on map</p>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {facilities.length === 0 ? (
                <p className="text-zinc-500 text-sm italic">No specific facilities listed for this barangay. Check with local LGU.</p>
              ) : (
                facilities.map((f, i) => (
                  <button 
                    key={i} 
                    onClick={() => setSelectedFacility(f)}
                    className={`w-full p-4 rounded-2xl border transition-all flex items-start gap-3 text-left ${
                      selectedFacility === f 
                        ? 'bg-red-50 border-red-200 ring-1 ring-red-200' 
                        : 'bg-zinc-50 border-zinc-100 hover:border-red-200 hover:bg-white'
                    }`}
                  >
                    <Home size={18} className={`${selectedFacility === f ? 'text-red-700' : 'text-zinc-400'} mt-0.5 shrink-0`} />
                    <div>
                      <p className={`text-sm font-bold ${selectedFacility === f ? 'text-red-900' : 'text-zinc-900'}`}>{f}</p>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1">Designated Center</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReportDisaster = ({ user, onLoginRequired }: { user: User | null, onLoginRequired: () => void }) => {
  const [location, setLocation] = React.useState('');
  const [disaster, setDisaster] = React.useState('Flood');
  const [description, setDescription] = React.useState('');
  const [status, setStatus] = React.useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onLoginRequired();
      return;
    }
    if (!location || !description) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, disaster, description }),
        credentials: 'include'
      });
      if (res.ok) {
        setStatus({ type: 'success', msg: 'Report submitted successfully. Thank you for helping the community!' });
        setLocation('');
        setDescription('');
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit');
      }
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message || 'Failed to submit report. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Report a Disaster</h2>
        <p className="text-zinc-500 text-sm">Help the community by reporting emergencies in your area.</p>
      </div>

      {!user ? (
        <div className="bg-white rounded-3xl p-8 md:p-12 border border-zinc-100 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 text-red-700 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Authentication Required</h3>
            <p className="text-zinc-500 text-sm">You must be logged in to submit a community report. This helps us maintain the integrity of our disaster data.</p>
          </div>
          <button 
            onClick={onLoginRequired}
            className="bg-zinc-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all"
          >
            Login to Report
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 border border-zinc-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 mb-6">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center border border-zinc-200">
              <UserIcon size={20} className="text-zinc-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Reporting as</p>
              <p className="text-sm font-bold text-zinc-900">{user.username}</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">Location</label>
            <input 
              type="text"
              placeholder="e.g. Batasan Hills, near the market"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">Disaster Type</label>
            <select 
              value={disaster}
              onChange={(e) => setDisaster(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none transition-all"
            >
              {['Flood', 'Fire', 'Landslide', 'Earthquake', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">Description</label>
            <textarea 
              placeholder="Describe the situation..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none transition-all resize-none"
              required
            />
          </div>

          {status && (
            <div className={`p-4 rounded-xl text-sm font-medium ${status.type === 'success' ? 'bg-red-50 text-red-800' : 'bg-red-50 text-red-800'}`}>
              {status.msg}
            </div>
          )}

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-zinc-900 text-white py-4 rounded-xl font-bold hover:bg-zinc-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      )}
    </div>
  );
};

const About = () => (
  <div className="max-w-4xl mx-auto space-y-12">
    <div className="text-center">
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">About ReadyNow</h2>
      <p className="text-zinc-500 text-base md:text-lg">An AI-powered disaster readiness support system for Quezon City.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-zinc-100 shadow-sm">
        <h3 className="text-lg md:text-xl font-bold mb-4">Project Overview</h3>
        <p className="text-zinc-600 text-sm md:text-base leading-relaxed">
          ReadyNow helps residents prepare for disasters by providing evacuation information, weather updates, and AI-driven decision-support guidance. Our mission is to improve disaster awareness and preparedness through accessible location-based information.
        </p>
      </div>
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-zinc-100 shadow-sm">
        <h3 className="text-lg md:text-xl font-bold mb-4">Our Purpose</h3>
        <p className="text-zinc-600 text-sm md:text-base leading-relaxed">
          In a city as large as Quezon City, localized information is key. ReadyNow bridges the gap between official data and resident needs, providing a centralized hub for critical safety information. We plan to add more cities but for now we only covered Quezon city since it is one of the most disaster-prone areas in the Philippines.
        </p>
      </div>
    </div>

    <div className="bg-zinc-900 rounded-3xl p-6 md:p-8 text-white">
      <h3 className="text-lg md:text-xl font-bold mb-8 text-center">Data Sources</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {[
          { name: 'PAGASA', desc: 'Weather information and forecasts.' },
          { name: 'NDRRMC', desc: 'National disaster preparedness protocols.' },
          { name: 'QC LGU', desc: 'Barangay evacuation center information.' }
        ].map((source, i) => (
          <div key={i} className="text-center">
            <div className="w-12 h-12 bg-red-700/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert size={24} />
            </div>
            <h4 className="font-bold mb-2">{source.name}</h4>
            <p className="text-zinc-400 text-sm">{source.desc}</p>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 md:p-8">
      <h3 className="text-base md:text-lg font-bold text-amber-900 mb-2">Disclaimer</h3>
      <p className="text-amber-800 text-sm leading-relaxed">
        ReadyNow is a decision-support tool only and does not replace official government emergency services. Always prioritize instructions from local authorities and emergency responders.
      </p>
    </div>
  </div>
);

const HomeLanding = ({ onStart }: { onStart: () => void }) => (
  <div className="flex flex-col">
    <main className="flex-1">
      <section className="py-12 md:py-20 px-6 max-w-7xl mx-auto text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-6xl md:text-8xl font-bold tracking-tight text-zinc-900 leading-[0.9]">
            ReadyNow<span className="text-red-700">.</span>
          </h2>
          <p className="text-lg md:text-xl lg:text-2xl text-zinc-500 max-w-2xl mx-auto mt-6">
            Your AI-powered disaster readiness assistant for Quezon City. Stay informed, stay prepared, stay safe.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex justify-center gap-4"
        >
          <button onClick={onStart} className="bg-red-700 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-red-800 shadow-lg shadow-red-700/20 transition-all">
            Enter Dashboard
          </button>
        </motion.div>

        <div className="pt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left" id="features">
          {[
            { title: 'Evacuation Info', desc: 'Real-time maps and facilities in your barangay.', icon: ShieldAlert },
            { title: 'Weather Updates', desc: 'Live weather data to help you assess risks.', icon: CloudRain },
            { title: 'AI Guidance', desc: 'Personalized safety protocols powered by Gemini.', icon: LayoutDashboard }
          ].map((feature, i) => (
            <div key={i} className="p-8 rounded-3xl bg-white border border-zinc-100 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-red-50 text-red-700 rounded-2xl flex items-center justify-center mb-6">
                <feature.icon size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-zinc-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  </div>
);

// --- Main App ---

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('home');
  const [history, setHistory] = React.useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = React.useState<{ district: string, barangay: string } | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);

  React.useEffect(() => {
    // Check if user is logged in
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      });
  }, []);

  const navigateTo = (tab: string) => {
    setHistory(prev => [...prev, activeTab]);
    setActiveTab(tab);
  };

  const goBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      setActiveTab(prev);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    navigateTo('home');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeLanding onStart={() => navigateTo('dashboard')} />;
      case 'dashboard':
        return <Dashboard onSelectLocation={() => navigateTo('selection')} onReport={() => navigateTo('report')} />;
      case 'selection':
        return <Selection onComplete={(d, b) => { setSelectedLocation({ district: d, barangay: b }); navigateTo('map'); }} />;
      case 'map':
        return selectedLocation 
          ? <MapInfo district={selectedLocation.district} barangay={selectedLocation.barangay} />
          : <Selection onComplete={(d, b) => { setSelectedLocation({ district: d, barangay: b }); navigateTo('map'); }} />;
      case 'report':
        return <ReportDisaster user={user} onLoginRequired={() => setIsAuthModalOpen(true)} />;
      case 'about':
        return <About />;
      default:
        return <Dashboard onSelectLocation={() => navigateTo('selection')} onReport={() => navigateTo('report')} />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        activeTab={activeTab} 
        setActiveTab={navigateTo} 
      />
      
      <div className={activeTab === 'home' ? "min-h-screen flex flex-col" : "lg:ml-64 min-h-screen flex flex-col"}>
        <Header 
          toggleSidebar={() => setIsSidebarOpen(true)} 
          onBack={goBack}
          showBack={history.length > 0}
          activeTab={activeTab}
          user={user}
          onLogin={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            {renderContent()}
          </motion.div>
        </main>

        <footer className="p-10 border-t border-zinc-100 bg-white">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <h4 className="text-xl font-bold tracking-tighter text-red-700">ReadyNow</h4>
              <p className="text-zinc-400 text-sm mt-1">© 2026 ReadyNow Project. All rights reserved.</p>
            </div>
            <div className="flex gap-8">
              <div className="text-center">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Emergency Hotline</p>
                <p className="text-lg font-bold text-zinc-900">911</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">QC Helpline</p>
                <p className="text-lg font-bold text-zinc-900">122</p>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onAuthSuccess={(u) => setUser(u)} 
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e4e4e7;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d4d4d8;
        }
      `}</style>
    </div>
  );
}
