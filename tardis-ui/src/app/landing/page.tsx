import React, { useEffect, useState } from 'react'
import { Button } from '../../components/ui/button'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false)
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 300], [0, -50])
  const y2 = useTransform(scrollY, [0, 300], [0, 50])

  useEffect(() => {
    setIsVisible(true)
    // Smooth scroll to section when clicking navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e: Event) {
        e.preventDefault()
        const target = document.querySelector(
          (e.target as HTMLAnchorElement).getAttribute('href')!
        )
        target?.scrollIntoView({
          behavior: 'smooth',
        })
      })
    })
  }, [])

  const features = [
    {
      title: 'Interactive Learning Experience',
      description: 'Immerse yourself in our cutting-edge platform featuring:',
      items: [
        'AI-powered personalized learning paths',
        'Real-time progress tracking',
        'Interactive video lessons with smart pausing',
        'Hands-on coding exercises with instant feedback',
        'Virtual lab environments for practical learning',
      ],
      icon: (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className='h-8 w-8 text-blue-600'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122'
          />
        </svg>
      ),
    },
    {
      title: 'Advanced Analytics Dashboard',
      description: 'Track your learning journey with precision:',
      items: [
        'Detailed progress visualization',
        'Skill mastery tracking',
        'Learning pattern analysis',
        'Performance predictions',
        'Personalized improvement recommendations',
      ],
      icon: (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className='h-8 w-8 text-blue-600'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
          />
        </svg>
      ),
    },
    {
      title: 'Collaborative Learning Tools',
      description: 'Learn together, grow together:',
      items: [
        'Real-time group collaboration',
        'Peer review system',
        'Discussion forums with AI moderation',
        'Team projects with version control',
        'Live coding sessions with mentors',
      ],
      icon: (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className='h-8 w-8 text-blue-600'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
          />
        </svg>
      ),
    },
    {
      title: 'AI-Powered Learning Assistant',
      description: 'Your 24/7 learning companion:',
      items: [
        'Contextual help and explanations',
        'Smart question answering',
        'Personalized study recommendations',
        'Concept clarification with examples',
        'Progress-based learning suggestions',
      ],
      icon: (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className='h-8 w-8 text-blue-600'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
          />
        </svg>
      ),
    },
    {
      title: 'Interactive Assessment System',
      description: 'Test your knowledge effectively:',
      items: [
        'Adaptive quizzes that learn from your responses',
        'Real-world project assessments',
        'Skill-based certifications',
        'Instant feedback and explanations',
        'Progress-tracking portfolios',
      ],
      icon: (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className='h-8 w-8 text-blue-600'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
          />
        </svg>
      ),
    },
    {
      title: 'Resource Library',
      description: 'Comprehensive learning materials:',
      items: [
        'Curated video content library',
        'Downloadable study materials',
        'Interactive code snippets',
        'Industry case studies',
        'Regular content updates',
      ],
      icon: (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className='h-8 w-8 text-blue-600'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
          />
        </svg>
      ),
    },
  ]

  return (
    <div className='min-h-screen relative overflow-x-hidden' style={{
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)'
    }}>
      {/* Dotted pattern background */}
      <div className='absolute inset-0' style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}></div>
      
      {/* Top announcement banner */}
      <div className='w-full py-3 text-center' style={{
        background: 'linear-gradient(90deg, #8b5cf6 0%, #a855f7 100%)'
      }}>
        <p className='text-white text-sm'>
          🚀 The AI Learning System for Students: New Knowledge Graph Features Coming Soon! <a href="#" className='underline'>Get Notified →</a>
        </p>
      </div>

      {/* Navigation */}
      <nav className='relative z-50 w-full py-4' style={{
        backgroundColor: 'transparent'
      }}>
        <div className='container mx-auto px-6'>
          <div className='flex items-center justify-between'>
            <motion.div
              className='flex items-center space-x-2'
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -20 }}
              transition={{ duration: 0.8 }}
            >
              <div className='w-10 h-10 rounded-lg bg-white flex items-center justify-center'>
                <span className='text-2xl'>🏛️</span>
              </div>
              <span className='text-2xl font-bold text-white'>TARDIS</span>
            </motion.div>
            
            <motion.div
              className='hidden items-center space-x-8 md:flex'
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -20 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className='flex items-center space-x-6'>
                <a href='#features' className='text-white hover:text-white/80 transition-colors'>Our Solutions ↓</a>
                <a href='#community' className='text-white hover:text-white/80 transition-colors'>Community ↓</a>
                <a href='#resources' className='text-white hover:text-white/80 transition-colors'>Resources ↓</a>
                <a href='#about' className='text-white hover:text-white/80 transition-colors'>About ↓</a>
                <a href='#pricing' className='text-white hover:text-white/80 transition-colors'>Pricing</a>
              </div>
              <div className='flex items-center space-x-4'>
                <Link to='/login' className='text-white hover:text-white/80 transition-colors'>Login</Link>
                <Link to='/signup'>
                  <button className='bg-white text-purple-600 px-6 py-2 rounded-full font-medium hover:bg-white/90 transition-colors'>
                    Sign up free →
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className='relative py-20'>
        <div className='container mx-auto px-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]'>
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -50 }}
              transition={{ duration: 0.8 }}
              className='relative z-10'
            >
              <h1 className='text-5xl md:text-7xl font-bold text-white mb-8 leading-tight'>
                The magic of AI to help
                <br />
                students with
                <br />
                <span className='text-white'>saving time.</span>
              </h1>
              
              <p className='text-xl text-white/90 mb-8 max-w-lg leading-relaxed'>
                The most loved, secure, and trusted AI platform for students and educators.
              </p>

              <div className='flex flex-col sm:flex-row gap-4'>
                <Link to='/signup'>
                  <button className='bg-white text-purple-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/90 transition-all duration-300 transform hover:scale-105'>
                    Students sign up free →
                  </button>
                </Link>
                <a href='#features'>
                  <button className='border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 transition-all duration-300 transform hover:scale-105'>
                    Schools learn more →
                  </button>
                </a>
              </div>
            </motion.div>

            {/* Right Content - Platform Preview */}
            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.8 }}
              animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 50, scale: isVisible ? 1 : 0.8 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className='relative'
            >
              {/* Main Dashboard Mockup */}
              <div className='relative bg-white rounded-2xl shadow-2xl overflow-hidden' style={{
                transform: 'perspective(1000px) rotateY(-5deg) rotateX(5deg)'
              }}>
                {/* Browser Bar */}
                <div className='bg-gray-200 px-4 py-3 flex items-center space-x-2'>
                  <div className='flex space-x-2'>
                    <div className='w-3 h-3 bg-red-400 rounded-full'></div>
                    <div className='w-3 h-3 bg-yellow-400 rounded-full'></div>
                    <div className='w-3 h-3 bg-green-400 rounded-full'></div>
                  </div>
                  <div className='flex-1 bg-white rounded-lg px-3 py-1 text-sm text-gray-600'>
                    tardis.ai/dashboard
                  </div>
                </div>
                
                {/* Dashboard Content */}
                <div className='p-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-[400px]'>
                  <div className='flex items-center justify-between mb-6'>
                    <h2 className='text-2xl font-bold text-gray-800'>Learning Dashboard</h2>
                    <div className='bg-purple-600 text-white px-4 py-2 rounded-lg text-sm'>
                      🧠 Knowledge Graph
                    </div>
                  </div>
                  
                  {/* Interactive Elements */}
                  <div className='grid grid-cols-2 gap-4 mb-6'>
                    <div className='bg-white rounded-lg p-4 shadow-sm'>
                      <h3 className='font-semibold text-gray-700 mb-2'>📊 Progress Analytics</h3>
                      <div className='w-full bg-gray-200 rounded-full h-2'>
                        <div className='bg-purple-600 h-2 rounded-full' style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    <div className='bg-white rounded-lg p-4 shadow-sm'>
                      <h3 className='font-semibold text-gray-700 mb-2'>🎯 AI Recommendations</h3>
                      <div className='text-sm text-gray-600'>Next: Calculus Chapter 3</div>
                    </div>
                  </div>
                  
                  <div className='bg-white rounded-lg p-4 shadow-sm'>
                    <h3 className='font-semibold text-gray-700 mb-3'>🔗 Knowledge Connections</h3>
                    <div className='flex flex-wrap gap-2'>
                      <span className='bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm'>Linear Algebra</span>
                      <span className='bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm'>Calculus</span>
                      <span className='bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm'>Statistics</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className='absolute -top-6 -left-6 bg-yellow-400 rounded-full p-3'>
                <span className='text-2xl'>⭐</span>
              </div>
              <div className='absolute -bottom-6 -right-6 bg-pink-400 rounded-full p-3'>
                <span className='text-2xl'>🎓</span>
              </div>
              <div className='absolute top-1/2 -right-8 bg-blue-400 rounded-full p-3'>
                <span className='text-2xl'>⚡</span>
              </div>
            </motion.div>
          </div>
        </div>

      </section>

      {/* Trust Section */}
      <section className='py-16 bg-white'>
        <div className='container mx-auto px-6'>
          <div className='text-center mb-12'>
            <h2 className='text-2xl font-bold text-gray-800 mb-4'>
              Trusted Partner of <span className='text-purple-600'>13,000+</span>
            </h2>
            <p className='text-xl text-gray-600'>Schools & Universities Worldwide</p>
          </div>
          
          <div className='flex flex-wrap justify-center items-center gap-8 opacity-60'>
            <div className='bg-gray-100 rounded-lg px-6 py-4 text-center'>
              <div className='text-2xl font-bold text-gray-700'>MIT</div>
              <div className='text-sm text-gray-500'>University</div>
            </div>
            <div className='bg-gray-100 rounded-lg px-6 py-4 text-center'>
              <div className='text-2xl font-bold text-gray-700'>Stanford</div>
              <div className='text-sm text-gray-500'>University</div>
            </div>
            <div className='bg-gray-100 rounded-lg px-6 py-4 text-center'>
              <div className='text-2xl font-bold text-gray-700'>Harvard</div>
              <div className='text-sm text-gray-500'>University</div>
            </div>
            <div className='bg-gray-100 rounded-lg px-6 py-4 text-center'>
              <div className='text-2xl font-bold text-gray-700'>Oxford</div>
              <div className='text-sm text-gray-500'>University</div>
            </div>
            <div className='bg-gray-100 rounded-lg px-6 py-4 text-center'>
              <div className='text-2xl font-bold text-gray-700'>Cambridge</div>
              <div className='text-sm text-gray-500'>University</div>
            </div>
          </div>
        </div>
      </section>

      {/* Love Section */}
      <section className='py-20 bg-gradient-to-r from-purple-50 to-pink-50'>
        <div className='container mx-auto px-6 text-center'>
          <h2 className='text-4xl md:text-5xl font-bold text-gray-800 mb-8'>
            AI for students loved 🖤 by over <span className='text-purple-600'>5 million</span> educators
          </h2>
        </div>
      </section>

      {/* Features Section */}
      <section id='features' className='py-32 relative bg-gradient-to-b from-transparent to-black/20'>
        <div className='container mx-auto px-6'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className='mb-20 text-center'
          >
            <span className='inline-block px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/20 text-white/80 text-sm mb-6'>
              🎯 Platform Features
            </span>
            <h2 className='mb-6 text-5xl md:text-6xl font-bold text-white'>
              Everything You Need to
              <br />
              <span className='bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'>
                Excel in Learning
              </span>
            </h2>
            <p className='mx-auto max-w-3xl text-xl text-white/70'>
              Cutting-edge AI technology meets proven educational methodologies to create the ultimate learning experience.
            </p>
          </motion.div>

          <div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
            {features.slice(0, 6).map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                }}
                viewport={{ once: true }}
                className='group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300 hover:transform hover:scale-105'
              >
                <div className='absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
                
                <motion.div
                  className='relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20'
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {feature.icon}
                </motion.div>
                
                <h3 className='relative mb-4 text-2xl font-bold text-white group-hover:text-blue-300 transition-colors duration-300'>
                  {feature.title}
                </h3>
                
                <p className='relative mb-6 text-white/70 group-hover:text-white/80 transition-colors duration-300'>
                  {feature.description}
                </p>
                
                <ul className='relative space-y-3'>
                  {feature.items.slice(0, 3).map((item, itemIndex) => (
                    <motion.li
                      key={itemIndex}
                      className='flex items-center text-white/60 group-hover:text-white/80 transition-colors duration-300'
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: (index * 0.1) + (itemIndex * 0.05) }}
                      viewport={{ once: true }}
                    >
                      <div className='mr-3 h-2 w-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full' />
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* Testimonials Section */}
      <section id='testimonials' className='py-32 relative'>
        <div className='container mx-auto px-6'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className='mb-20 text-center'
          >
            <span className='inline-block px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/20 text-white/80 text-sm mb-6'>
              💬 Success Stories
            </span>
            <h2 className='mb-6 text-5xl md:text-6xl font-bold text-white'>
              Loved by
              <br />
              <span className='bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'>
                Thousands of Learners
              </span>
            </h2>
            <p className='mx-auto max-w-3xl text-xl text-white/70'>
              Real stories from real students who transformed their careers with our platform.
            </p>
          </motion.div>

          <div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
            {[
              {
                name: 'Jane Smith',
                role: 'Software Engineer at Google',
                avatar: 'JS',
                quote: 'The AI-powered learning paths and real-time feedback transformed my learning journey. I went from basic coding knowledge to landing my dream job at Google in just 6 months!'
              },
              {
                name: 'Michael Rodriguez',
                role: 'Data Scientist at Tesla',
                avatar: 'MR',
                quote: 'The interactive projects and AI assistant helped me master complex concepts quickly. The platform\'s analytics showed me exactly where to focus my efforts.'
              },
              {
                name: 'Sarah Kim',
                role: 'Product Manager at Microsoft',
                avatar: 'SK',
                quote: 'The collaborative features and real-world projects gave me practical experience. I could learn at my own pace while getting feedback from industry experts.'
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
                whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className='floating-card glass-effect rounded-xl p-8 quantum-border perspective-card'
              >
                <div className='mb-6 flex items-center'>
                  <motion.div
                    className='mr-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-xl font-bold text-white cyber-glow'
                    whileHover={{ scale: 1.1, rotateZ: 5 }}
                  >
                    {testimonial.avatar}
                  </motion.div>
                  <div>
                    <h4 className='text-xl font-bold text-white'>
                      {testimonial.name}
                    </h4>
                    <p className='text-blue-300'>{testimonial.role}</p>
                  </div>
                </div>
                <p className='italic text-blue-100'>
                  "{testimonial.quote}"
                </p>
                <div className='mt-6 flex items-center'>
                  <div className='flex text-yellow-400'>
                    {[...Array(5)].map((_, i) => (
                      <motion.svg
                        key={i}
                        className='h-5 w-5 fill-current'
                        viewBox='0 0 20 20'
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (index * 0.1) + (i * 0.05) }}
                        viewport={{ once: true }}
                      >
                        <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                      </motion.svg>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id='about' className='py-20'>
        <div className='container mx-auto px-6'>
          <div className='flex flex-col items-center lg:flex-row'>
            <motion.div
              initial={{ opacity: 0, x: -50, rotateY: -10 }}
              whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className='mb-12 lg:mb-0 lg:w-1/2'
            >
              <div className='relative perspective-card'>
                <div className='h-96 w-full overflow-hidden rounded-2xl glass-effect cyber-glow floating-card'>
                  <div className='absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20'></div>
                  <div className='absolute inset-0 neural-grid opacity-20'></div>
                  <p className='absolute inset-0 flex items-center justify-center text-lg text-blue-100 z-10'>
                    Team of Education Experts
                  </p>
                </div>
                <div className='absolute -bottom-6 -right-6 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl'></div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className='lg:w-1/2 lg:pl-16'
            >
              <h2 className='mb-6 text-4xl font-bold text-white'>
                Revolutionizing Education Through <span className='cyber-text'>Technology</span>
              </h2>
              <p className='mb-6 leading-relaxed text-blue-100'>
                We're a team of educators, technologists, and learning experts
                passionate about transforming education. Our AI-powered platform
                combines cutting-edge technology with proven learning
                methodologies to create an engaging and effective learning
                experience.
              </p>
              <p className='mb-8 leading-relaxed text-blue-100'>
                Founded in 2020, we've helped over 50,000 learners master new
                skills and advance their careers. Our platform continuously
                evolves, incorporating the latest advancements in AI and
                educational technology to provide the best learning experience
                possible.
              </p>
              <div className='grid grid-cols-2 gap-6'>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  viewport={{ once: true }}
                  className='glass-effect rounded-lg p-4 quantum-border'
                >
                  <h4 className='mb-2 text-xl font-bold text-white'>
                    Our Mission
                  </h4>
                  <p className='text-blue-200'>
                    To make high-quality education accessible, engaging, and
                    effective for everyone.
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  viewport={{ once: true }}
                  className='glass-effect rounded-lg p-4 quantum-border'
                >
                  <h4 className='mb-2 text-xl font-bold text-white'>
                    Our Vision
                  </h4>
                  <p className='text-blue-200'>
                    To become the world's leading platform for personalized
                    online learning.
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-20 relative overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20'></div>
        <div className='container mx-auto px-6 relative z-10'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className='text-center'
          >
            <h2 className='mb-6 text-4xl font-bold text-white md:text-5xl'>
              Ready to Transform Your Learning <span className='cyber-text'>Journey</span>?
            </h2>
            <p className='mx-auto mb-8 max-w-2xl text-xl text-blue-100'>
              Join thousands of learners who are already experiencing the future
              of education. Start your journey today with our AI-powered
              learning platform.
            </p>
            <div className='flex flex-col justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0'>
              <Link to='/signup'>
                <Button className='bg-blue-600 px-8 py-3 text-lg text-white hover:bg-blue-700 cyber-glow transform transition-all duration-300 hover:scale-110'>
                  Get Started Free
                </Button>
              </Link>
              <Link to='/pricing'>
                <Button
                  variant='tertiary'
                  className='border-blue-400 px-8 py-3 text-lg text-blue-300 hover:bg-blue-600 hover:text-white quantum-border transform transition-all duration-300 hover:scale-110'
                >
                  View Pricing
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-slate-900/80 py-12 text-white border-t border-blue-500/20 glass-effect'>
        <div className='container mx-auto px-6'>
          <div className='mb-8 grid grid-cols-1 gap-12 md:grid-cols-4'>
            <div>
              <h3 className='mb-4 text-2xl font-bold cyber-text'>Ai Study Tools</h3>
              <p className='mb-4 text-blue-200'>
                Transforming the way people learn with AI-powered, interactive,
                and personalized content.
              </p>
              <div className='flex space-x-4'>
                {['facebook', 'twitter', 'linkedin'].map((social, index) => (
                  <motion.a
                    key={social}
                    href='#'
                    className='text-blue-300 transition-all duration-300 hover:text-blue-100 transform hover:scale-110'
                    whileHover={{ y: -2 }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <svg className='h-6 w-6' fill='currentColor' viewBox='0 0 24 24'>
                      <path d='M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12s4.477 10 10 10 10-4.477 10-10z' />
                    </svg>
                  </motion.a>
                ))}
              </div>
            </div>

            {[
              {
                title: 'Platform',
                links: [
                  { name: 'Features', href: '#features' },
                  { name: 'Pricing', href: '/pricing' },
                  { name: 'Enterprise', href: '#' },
                  { name: 'Security', href: '#' }
                ]
              },
              {
                title: 'Resources',
                links: [
                  { name: 'Documentation', href: '#' },
                  { name: 'API Reference', href: '#' },
                  { name: 'Blog', href: '#' },
                  { name: 'Community', href: '#' }
                ]
              },
              {
                title: 'Company',
                links: [
                  { name: 'About Us', href: '#about' },
                  { name: 'Careers', href: '#' },
                  { name: 'Contact', href: '#' },
                  { name: 'Legal', href: '#' }
                ]
              }
            ].map((section, sectionIndex) => (
              <div key={section.title}>
                <h4 className='mb-4 text-lg font-bold text-white'>{section.title}</h4>
                <ul className='space-y-2'>
                  {section.links.map((link, linkIndex) => (
                    <motion.li
                      key={link.name}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: (sectionIndex * 0.1) + (linkIndex * 0.05) }}
                      viewport={{ once: true }}
                    >
                      <a
                        href={link.href}
                        className='text-blue-300 transition-all duration-300 hover:text-blue-100 interactive-hover'
                      >
                        {link.name}
                      </a>
                    </motion.li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <motion.div
            className='border-t border-blue-500/20 pt-8 text-center text-blue-300'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p>&copy; 2024 Ai Study Tools. All rights reserved. Powered by futuristic design.</p>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
