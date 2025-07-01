import React, { useEffect } from 'react'
import { Button } from '../../components/ui/button'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const LandingPage = () => {
  const navigate = useNavigate()

  useEffect(() => {
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
    <div className='min-h-screen bg-gradient-to-b from-blue-50 to-white'>
      {/* Navigation */}
      <nav className='fixed z-50 w-full bg-white/80 shadow-sm backdrop-blur-md'>
        <div className='container mx-auto px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div className='text-3xl font-bold text-blue-600'>
              Ai Study Tools
            </div>
            <div className='hidden items-center space-x-8 md:flex'>
              <a
                href='#features'
                className='text-gray-700 transition-colors hover:text-blue-600'
              >
                Features
              </a>
              <a
                href='#testimonials'
                className='text-gray-700 transition-colors hover:text-blue-600'
              >
                Testimonials
              </a>
              <a
                href='#about'
                className='text-gray-700 transition-colors hover:text-blue-600'
              >
                About Us
              </a>
              <Link to='/pricing'>
                <Button
                  variant='tertiary'
                  className='border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                >
                  Pricing
                </Button>
              </Link>
              <Link to='/login'>
                <Button className='bg-blue-600 text-white hover:bg-blue-700'>
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className='container mx-auto flex flex-col items-center px-6 pb-20 pt-32 md:flex-row'
      >
        <div className='mb-12 md:mb-0 md:w-1/2'>
          <h1 className='mb-6 text-5xl font-bold leading-tight text-gray-800 md:text-7xl'>
            Transform Your
            <span className='text-blue-600'> Learning</span>
            <br />
            Experience
          </h1>
          <p className='mb-8 text-xl leading-relaxed text-gray-600'>
            Experience the future of education with our AI-powered platform.
            Master new skills through interactive learning, real-time analytics,
            and personalized guidance.
          </p>
          <div className='flex space-x-4'>
            <Link to='/signup'>
              <Button className='bg-blue-600 px-8 py-3 text-lg text-white hover:bg-blue-700'>
                Start Learning
              </Button>
            </Link>
            <a href='#features'>
              <Button
                variant='tertiary'
                className='border-blue-600 px-8 py-3 text-lg text-blue-600 hover:bg-blue-50'
              >
                Explore Features
              </Button>
            </a>
          </div>
        </div>
        <motion.div
          className='flex justify-center md:w-1/2'
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Placeholder for hero image */}
          <div className='relative flex h-96 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 shadow-2xl'>
            <div className='absolute inset-0 bg-blue-600/5'></div>
            <p className='text-lg text-gray-500'>
              Interactive Learning Platform Preview
            </p>
          </div>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <section id='features' className='bg-white py-20'>
        <div className='container mx-auto px-6'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className='mb-20 text-center'
          >
            <h2 className='mb-6 text-4xl font-bold text-gray-800 md:text-5xl'>
              Powerful Learning Features
            </h2>
            <p className='mx-auto max-w-3xl text-xl text-gray-600'>
              Our platform combines cutting-edge technology with proven learning
              methodologies to deliver an unparalleled educational experience.
            </p>
          </motion.div>

          <div className='grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3'>
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className='rounded-xl border border-gray-100 bg-white p-8 shadow-lg transition-shadow hover:shadow-xl'
              >
                <div className='mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-blue-100'>
                  {feature.icon}
                </div>
                <h3 className='mb-4 text-2xl font-bold text-gray-800'>
                  {feature.title}
                </h3>
                <p className='mb-4 text-gray-600'>{feature.description}</p>
                <ul className='space-y-3'>
                  {feature.items.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className='flex items-center text-gray-600'
                    >
                      <svg
                        className='mr-2 h-5 w-5 text-green-500'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth='2'
                          d='M5 13l4 4L19 7'
                        ></path>
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className='bg-blue-600 py-20'>
        <div className='container mx-auto px-6'>
          <div className='grid grid-cols-1 gap-8 md:grid-cols-4'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className='text-center'
            >
              <div className='mb-2 text-5xl font-bold text-white'>50K+</div>
              <div className='text-blue-100'>Active Learners</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className='text-center'
            >
              <div className='mb-2 text-5xl font-bold text-white'>1000+</div>
              <div className='text-blue-100'>Interactive Courses</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className='text-center'
            >
              <div className='mb-2 text-5xl font-bold text-white'>95%</div>
              <div className='text-blue-100'>Completion Rate</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className='text-center'
            >
              <div className='mb-2 text-5xl font-bold text-white'>4.9/5</div>
              <div className='text-blue-100'>User Satisfaction</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id='testimonials' className='bg-gray-50 py-20'>
        <div className='container mx-auto px-6'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className='mb-16 text-center'
          >
            <h2 className='mb-6 text-4xl font-bold text-gray-800 md:text-5xl'>
              Success Stories
            </h2>
            <p className='mx-auto max-w-3xl text-xl text-gray-600'>
              Join thousands of satisfied learners who have transformed their
              careers through our platform.
            </p>
          </motion.div>

          <div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className='rounded-xl bg-white p-8 shadow-lg'
            >
              <div className='mb-6 flex items-center'>
                <div className='mr-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-xl font-bold text-white'>
                  JS
                </div>
                <div>
                  <h4 className='text-xl font-bold text-gray-800'>
                    Jane Smith
                  </h4>
                  <p className='text-blue-600'>Software Engineer at Google</p>
                </div>
              </div>
              <p className='italic text-gray-600'>
                "The AI-powered learning paths and real-time feedback
                transformed my learning journey. I went from basic coding
                knowledge to landing my dream job at Google in just 6 months!"
              </p>
              <div className='mt-6 flex items-center'>
                <div className='flex text-yellow-400'>
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className='h-5 w-5 fill-current'
                      viewBox='0 0 20 20'
                    >
                      <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                    </svg>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className='rounded-xl bg-white p-8 shadow-lg'
            >
              <div className='mb-6 flex items-center'>
                <div className='mr-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-xl font-bold text-white'>
                  MR
                </div>
                <div>
                  <h4 className='text-xl font-bold text-gray-800'>
                    Michael Rodriguez
                  </h4>
                  <p className='text-blue-600'>Data Scientist at Tesla</p>
                </div>
              </div>
              <p className='italic text-gray-600'>
                "The interactive projects and AI assistant helped me master
                complex concepts quickly. The platform's analytics showed me
                exactly where to focus my efforts."
              </p>
              <div className='mt-6 flex items-center'>
                <div className='flex text-yellow-400'>
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className='h-5 w-5 fill-current'
                      viewBox='0 0 20 20'
                    >
                      <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                    </svg>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className='rounded-xl bg-white p-8 shadow-lg'
            >
              <div className='mb-6 flex items-center'>
                <div className='mr-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-xl font-bold text-white'>
                  SK
                </div>
                <div>
                  <h4 className='text-xl font-bold text-gray-800'>Sarah Kim</h4>
                  <p className='text-blue-600'>Product Manager at Microsoft</p>
                </div>
              </div>
              <p className='italic text-gray-600'>
                "The collaborative features and real-world projects gave me
                practical experience. I could learn at my own pace while getting
                feedback from industry experts."
              </p>
              <div className='mt-6 flex items-center'>
                <div className='flex text-yellow-400'>
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className='h-5 w-5 fill-current'
                      viewBox='0 0 20 20'
                    >
                      <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                    </svg>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id='about' className='bg-white py-20'>
        <div className='container mx-auto px-6'>
          <div className='flex flex-col items-center lg:flex-row'>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className='mb-12 lg:mb-0 lg:w-1/2'
            >
              <div className='relative'>
                <div className='h-96 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 shadow-2xl'>
                  <div className='absolute inset-0 bg-blue-600/5'></div>
                  <p className='absolute inset-0 flex items-center justify-center text-lg text-gray-500'>
                    Team of Education Experts
                  </p>
                </div>
                <div className='absolute -bottom-6 -right-6 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl'></div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className='lg:w-1/2 lg:pl-16'
            >
              <h2 className='mb-6 text-4xl font-bold text-gray-800'>
                Revolutionizing Education Through Technology
              </h2>
              <p className='mb-6 leading-relaxed text-gray-600'>
                We're a team of educators, technologists, and learning experts
                passionate about transforming education. Our AI-powered platform
                combines cutting-edge technology with proven learning
                methodologies to create an engaging and effective learning
                experience.
              </p>
              <p className='mb-8 leading-relaxed text-gray-600'>
                Founded in 2020, we've helped over 50,000 learners master new
                skills and advance their careers. Our platform continuously
                evolves, incorporating the latest advancements in AI and
                educational technology to provide the best learning experience
                possible.
              </p>
              <div className='grid grid-cols-2 gap-6'>
                <div>
                  <h4 className='mb-2 text-xl font-bold text-gray-800'>
                    Our Mission
                  </h4>
                  <p className='text-gray-600'>
                    To make high-quality education accessible, engaging, and
                    effective for everyone.
                  </p>
                </div>
                <div>
                  <h4 className='mb-2 text-xl font-bold text-gray-800'>
                    Our Vision
                  </h4>
                  <p className='text-gray-600'>
                    To become the world's leading platform for personalized
                    online learning.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='bg-gradient-to-br from-blue-600 to-blue-700 py-20'>
        <div className='container mx-auto px-6'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className='text-center'
          >
            <h2 className='mb-6 text-4xl font-bold text-white md:text-5xl'>
              Ready to Transform Your Learning Journey?
            </h2>
            <p className='mx-auto mb-8 max-w-2xl text-xl text-blue-100'>
              Join thousands of learners who are already experiencing the future
              of education. Start your journey today with our AI-powered
              learning platform.
            </p>
            <div className='flex flex-col justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0'>
              <Link to='/signup'>
                <Button className='bg-white px-8 py-3 text-lg text-blue-600 hover:bg-blue-50'>
                  Get Started Free
                </Button>
              </Link>
              <Link to='/pricing'>
                <Button
                  variant='tertiary'
                  className='border-white px-8 py-3 text-lg text-white hover:bg-blue-700'
                >
                  View Pricing
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-gray-900 py-12 text-white'>
        <div className='container mx-auto px-6'>
          <div className='mb-8 grid grid-cols-1 gap-12 md:grid-cols-4'>
            <div>
              <h3 className='mb-4 text-2xl font-bold'>Ai Study Tools</h3>
              <p className='mb-4 text-gray-400'>
                Transforming the way people learn with AI-powered, interactive,
                and personalized content.
              </p>
              <div className='flex space-x-4'>
                <a
                  href='#'
                  className='text-gray-400 transition-colors hover:text-white'
                >
                  <svg
                    className='h-6 w-6'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path d='M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12s4.477 10 10 10 10-4.477 10-10z' />
                  </svg>
                </a>
                <a
                  href='#'
                  className='text-gray-400 transition-colors hover:text-white'
                >
                  <svg
                    className='h-6 w-6'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path d='M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84' />
                  </svg>
                </a>
                <a
                  href='#'
                  className='text-gray-400 transition-colors hover:text-white'
                >
                  <svg
                    className='h-6 w-6'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path d='M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.016 18.6h-2.472v-3.9c0-.918-.018-2.1-1.278-2.1-1.28 0-1.476 1.002-1.476 2.04v3.96H9.318V8.208h2.376v1.092h.033c.33-.624 1.134-1.284 2.334-1.284 2.496 0 2.955 1.644 2.955 3.78v5.804zM7.62 7.116c-.792 0-1.434-.642-1.434-1.434 0-.792.642-1.434 1.434-1.434.792 0 1.434.642 1.434 1.434 0 .792-.642 1.434-1.434 1.434zM6.384 18.6h2.472V8.208H6.384V18.6z' />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className='mb-4 text-lg font-bold'>Platform</h4>
              <ul className='space-y-2'>
                <li>
                  <a
                    href='#features'
                    className='text-gray-400 transition-colors hover:text-white'
                  >
                    Features
                  </a>
                </li>
                <li>
                  <Link
                    to='/pricing'
                    className='text-gray-400 transition-colors hover:text-white'
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <a
                    href='#'
                    className='text-gray-400 transition-colors hover:text-white'
                  >
                    Enterprise
                  </a>
                </li>
                <li>
                  <a
                    href='#'
                    className='text-gray-400 transition-colors hover:text-white'
                  >
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className='mb-4 text-lg font-bold'>Resources</h4>
              <ul className='space-y-2'>
                <li>
                  <a
                    href='#'
                    className='text-gray-400 transition-colors hover:text-white'
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href='#'
                    className='text-gray-400 transition-colors hover:text-white'
                  >
                    API Reference
                  </a>
                </li>
                <li>
                  <a
                    href='#'
                    className='text-gray-400 transition-colors hover:text-white'
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href='#'
                    className='text-gray-400 transition-colors hover:text-white'
                  >
                    Community
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className='mb-4 text-lg font-bold'>Company</h4>
              <ul className='space-y-2'>
                <li>
                  <a
                    href='#about'
                    className='text-gray-400 transition-colors hover:text-white'
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href='#'
                    className='text-gray-400 transition-colors hover:text-white'
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href='#'
                    className='text-gray-400 transition-colors hover:text-white'
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href='#'
                    className='text-gray-400 transition-colors hover:text-white'
                  >
                    Legal
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className='border-t border-gray-800 pt-8 text-center'>
            <p className='text-gray-400'>
              &copy; {new Date().getFullYear()} Ai Study Tools. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
