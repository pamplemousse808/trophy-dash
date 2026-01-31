import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Calendar, DollarSign, Award, Plus, Filter, X, Tag, Bell, Mail } from 'lucide-react';
import logo from './assets/TrophyDash Header.jpg';
import icon from './assets/Trophy Dash Icon.png';
import EmailSignupsAdmin from './components/EmailSignupsAdmin';
// Initialize Supabase
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const TrophyDash = () => {
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('home');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('All');
  const [filterDeadline, setFilterDeadline] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    industry: '',
    deadline: '',
    prestige: 'Medium',
    price: '',
    description: '',
    website: '',
    location: '',
    available_categories: ''
  });

  const categories = ['All', 'Advertising & Marketing', 'Public Relations', 'Marketing', 'Content Marketing', 'Digital', 'Corporate Comms', 'Social Media'];
  
  const industries = ['All', 'General/Cross-Industry', 'Fintech', 'Legal/Law', 'HR/Recruitment', 'Healthcare', 'Technology/SaaS', 'Real Estate', 'Retail', 'Automotive', 'Energy', 'Financial Services', 'Education', 'Non-Profit', 'Government'];
  
  const deadlineOptions = [
    { value: 'All', label: 'All Deadlines' },
    { value: '7', label: 'Next 7 Days' },
    { value: '30', label: 'Next 30 Days' },
    { value: '90', label: 'Next 3 Months' }
  ];

  // Fetch awards from Supabase
  useEffect(() => {
    fetchAwards();
  }, []);

  const fetchAwards = async () => {
    try {
      const { data, error } = await supabase
        .from('awards')
        .select('*')
        .order('deadline', { ascending: true });
      
      if (error) throw error;
      setAwards(data || []);
    } catch (error) {
      console.error('Error fetching awards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntil = (deadline) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredAwards = useMemo(() => {
    return awards.filter(award => {
      const matchesSearch = award.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          award.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesIndustry = filterIndustry === 'All' || award.industry === filterIndustry;
      
      // Deadline filtering
      let matchesDeadline = true;
      if (filterDeadline !== 'All') {
        const days = getDaysUntil(award.deadline);
        const deadlineDays = parseInt(filterDeadline);
        matchesDeadline = days > 0 && days <= deadlineDays;
      }
      
      return matchesSearch && matchesIndustry && matchesDeadline;
    });
  }, [awards, searchTerm, filterIndustry, filterDeadline]);

  const handleSubmit = () => {
    if (!formData.name || !formData.category || !formData.industry || !formData.deadline || !formData.price || 
        !formData.description || !formData.website || !formData.location) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Create email body with all form data
    const subject = `Trophy Dash Award Submission: ${formData.name}`;
    const body = `
New Award Submission from Trophy Dash:

Award Name: ${formData.name}
Category: ${formData.category}
Industry: ${formData.industry}
Deadline: ${formData.deadline}
Entry Fee: ${formData.price}
Prestige Level: ${formData.prestige}
Location: ${formData.location}
Website: ${formData.website}

Description:
${formData.description}

Available Categories:
${formData.available_categories || 'Not specified'}
    `.trim();
    
    // Create mailto link
    const mailtoLink = `mailto:your-email@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Open email client
    window.location.href = mailtoLink;
    
    // Reset form
    setFormData({
      name: '',
      category: '',
      industry: '',
      deadline: '',
      prestige: 'Medium',
      price: '',
      description: '',
      website: '',
      location: '',
      available_categories: ''
    });
    
    alert('Opening your email client with the submission details!');
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    
    try {
      // Save email to Supabase
      const { data, error } = await supabase
        .from('email_signups')
        .insert([
          { 
            email: email.toLowerCase().trim(),
            referral_source: 'modal' // You can track where signups come from
          }
        ])
        .select();
      
      if (error) {
        // Check if it's a duplicate email error
        if (error.code === '23505') {
          alert('This email is already subscribed! 🎉');
        } else {
          console.error('Signup error:', error);
          alert('Something went wrong. Please try again.');
        }
        return;
      }
      
      // Success!
      console.log('New signup:', data);
      setEmailSubmitted(true);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setShowEmailModal(false);
        setEmail('');
        setEmailSubmitted(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong. Please try again.');
    }
  };

  const PrestigeBadge = ({ level }) => {
    const colors = {
      High: 'bg-amber-100 text-amber-800 border-amber-300',
      Medium: 'bg-blue-100 text-blue-800 border-blue-300',
      Low: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[level]}`}>
        {level} Prestige
      </span>
    );
  };

  const DeadlineBadge = ({ deadline }) => {
    const days = getDaysUntil(deadline);
    const isUrgent = days <= 7;
    const isImminent = days <= 30;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        isUrgent ? 'bg-red-100 text-red-800 border border-red-300' :
        isImminent ? 'bg-orange-100 text-orange-800 border border-orange-300' :
        'bg-green-100 text-green-800 border border-green-300'
      }`}>
        {days > 0 ? `${days} days left` : 'Closed'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Award className="mx-auto text-blue-600 animate-pulse mb-4" size={64} />
          <p className="text-gray-600 text-lg">Loading awards...</p>
        </div>
      </div>
    );
  }

  if (view === 'submit') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
              <img src={icon} alt="Trophy Dash Icon" className="h-10 w-10 object-contain" />
              <img src={logo} alt="Trophy Dash" className="h-8 object-contain" />
            </div>
            <nav className="flex gap-4">
              <button onClick={() => setView('home')} className="text-gray-600 hover:text-gray-900">Home</button>
              <button onClick={() => setView('submit')} className="text-blue-600 font-medium">Submit Award</button>
            </nav>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Submit Your Award</h2>
            <p className="text-gray-600 mb-8">List your awards programme and reach thousands of comms professionals. It's free!</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Award Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. The Drum Awards for Marketing"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select a category</option>
                    {categories.slice(1).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry *</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select an industry</option>
                    {industries.slice(1).map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Entry Deadline *</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Entry Fee *</label>
                  <input
                    type="text"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="e.g. £295"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prestige Level *</label>
                <select
                  value={formData.prestige}
                  onChange={(e) => setFormData({...formData, prestige: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="High">High - Internationally recognized</option>
                  <option value="Medium">Medium - Industry respected</option>
                  <option value="Low">Low - Regional or emerging</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Describe your awards programme, what makes it unique, and who should enter..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Available Categories</label>
                <textarea
                  value={formData.available_categories}
                  onChange={(e) => setFormData({...formData, available_categories: e.target.value})}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. Best Digital Campaign, Rising Star, Agency of the Year"
                />
                <p className="text-xs text-gray-500 mt-1">Separate multiple categories with commas</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website *</label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. thedrum.com/awards"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. London, UK or Virtual"
                />
              </div>

              <button
                onClick={handleSubmit}
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors"
              >
                Submit Award
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
              <img src={icon} alt="Trophy Dash Icon" className="h-10 w-10 object-contain" />
              <img src={logo} alt="Trophy Dash" className="h-8 object-contain" />
            </div>
            <nav className="flex gap-4">
              <button onClick={() => setView('home')} className="text-gray-600 hover:text-gray-900">Home</button>
              <button onClick={() => setView('submit')} className="text-gray-600 hover:text-gray-900">Submit Award</button>
              <button onClick={() => setView('admin')} className="text-blue-600 font-medium">Admin</button>
            </nav>
          </div>
        </header>
        <EmailSignupsAdmin />
      </div>
    );
  }

  // Main home view - single page with everything
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Email Signup Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 relative">
            <button
              onClick={() => setShowEmailModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
            
            {!emailSubmitted ? (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="text-blue-600" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Never Miss a Deadline</h3>
                  <p className="text-gray-600">Get weekly updates on upcoming award deadlines straight to your inbox.</p>
                </div>
                
                <form onSubmit={handleEmailSignup} className="space-y-4">
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Subscribe to Weekly Digest
                  </button>
                  <p className="text-xs text-gray-500 text-center">Free forever. Unsubscribe anytime.</p>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">You're subscribed! 🎉</h3>
                <p className="text-gray-600">Check your inbox for confirmation.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={icon} alt="Trophy Dash Icon" className="h-10 w-10 object-contain" />
            <img src={logo} alt="Trophy Dash" className="h-8 object-contain" />
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('submit')} 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={18} />
              Submit Award
            </button>
            {/* Subtle admin access - triple click the icon to access */}
            <div 
              onClick={(e) => {
                if (e.detail === 3) { // Triple click
                  setView('admin');
                }
              }}
              className="cursor-default"
              title="Admin access"
            >
              <Award className="text-gray-300 hover:text-gray-400" size={20} />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
             Every industry award in one place.
             <br />
             <span className="text-blue-600">Let's go get famous!</span>
              </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The searchable resource for comms and marketing professionals. Find awards, track deadlines, and never miss an entry again.
          </p>
        </div>
      </div>

      {/* Email Signup Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Mail className="text-blue-200" size={24} />
              <div>
                <h3 className="text-white font-semibold">Get Weekly Deadline Alerts</h3>
                <p className="text-blue-100 text-sm">Never miss an entry deadline again</p>
              </div>
            </div>
            <button
              onClick={() => setShowEmailModal(true)}
              className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              <Bell size={18} />
              Subscribe Free
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search awards by name or keyword..."
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Filter size={18} />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                <select
                  value={filterIndustry}
                  onChange={(e) => setFilterIndustry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  {industries.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
                <select
                  value={filterDeadline}
                  onChange={(e) => setFilterDeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  {deadlineOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 flex justify-end">
                <button
                  onClick={() => {
                    setFilterIndustry('All');
                    setFilterDeadline('All');
                    setSearchTerm('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
                >
                  <X size={16} />
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 text-gray-600">
          Showing {filteredAwards.length} award{filteredAwards.length !== 1 ? 's' : ''}
        </div>

        {/* Awards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAwards.map(award => (
            <div key={award.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <DeadlineBadge deadline={award.deadline} />
                <PrestigeBadge level={award.prestige} />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">{award.name}</h3>
              {award.industry && (
                <div className="text-xs text-blue-600 font-medium mb-2 flex items-center gap-1">
                  <Tag size={12} />
                  {award.industry}
                </div>
              )}
              <p className="text-sm text-gray-600 mb-4">{award.description}</p>
              <div className="space-y-2 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  Deadline: {new Date(award.deadline).toLocaleDateString('en-GB')}
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <DollarSign size={16} />
                  Entry fee: {award.price}
                </div>
              </div>
              {award.available_categories && (
                <div className="pt-4 border-t border-gray-100 mb-4">
                  <div className="text-xs font-medium text-gray-700 mb-2">Available Categories:</div>
                  <div className="text-xs text-gray-600 line-clamp-2">
                    {award.available_categories}
                  </div>
                </div>
              )}
              <div className="pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500 mb-2">
                  <strong>Location:</strong> {award.location}
                </div>
                {award.website && (
                  <a
                    href={`https://${award.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Visit website →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredAwards.length === 0 && (
          <div className="text-center py-16">
            <Award className="mx-auto text-gray-300 mb-4" size={64} />
            <p className="text-gray-500 text-lg">No awards found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* CTA Footer */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 mt-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold mb-4">Run an Awards Programme?</h3>
          <p className="text-xl mb-8 text-blue-100">Get your awards in front of thousands of comms professionals. It's free to list.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => setView('submit')}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors"
            >
              Submit Your Award →
            </button>
            <button 
              onClick={() => setShowEmailModal(true)}
              className="bg-blue-700 text-white border-2 border-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-800 transition-colors"
            >
              Get Weekly Updates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrophyDash;