import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { 
  BookOpen, 
  Brain, 
  Users, 
  Zap, 
  Target, 
  Library,
  Star,
  ArrowRight,
  Play,
  CheckCircle,
  Globe,
  TrendingUp
} from 'lucide-react'

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false)
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 300], [0, -50])
  const y2 = useTransform(scrollY, [0, 300], [0, 50])

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const features = [
    {
      title: 'Interactive Learning Experience',
      description: 'Immerse yourself in our cutting-edge platform featuring AI-powered personalized learning paths, real-time progress tracking, and hands-on exercises.',
      icon: <Brain className="h-8 w-8" />,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Advanced Analytics Dashboard',
      description: 'Track your learning journey with detailed progress visualization, skill mastery tracking, and performance predictions.',
      icon: <TrendingUp className="h-8 w-8" />,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Collaborative Learning Tools',
      description: 'Learn together with real-time group collaboration, peer review systems, and live coding sessions with mentors.',
      icon: <Users className="h-8 w-8" />,
      gradient: 'from-green-500 to-teal-500',
    },
    {
      title: 'AI-Powered Learning Assistant',
      description: 'Your 24/7 learning companion with contextual help, smart question answering, and personalized study recommendations.',
      icon: <Zap className="h-8 w-8" />,
      gradient: 'from-orange-500 to-red-500',
    },
    {
      title: 'Interactive Assessment System',
      description: 'Test your knowledge with adaptive quizzes, real-world project assessments, and instant feedback.',
      icon: <Target className="h-8 w-8" />,
      gradient: 'from-indigo-500 to-purple-500',
    },
    {
      title: 'Comprehensive Resource Library',
      description: 'Access curated video content, downloadable materials, interactive code snippets, and regular content updates.',
      icon: <Library className="h-8 w-8" />,
      gradient: 'from-emerald-500 to-blue-500',
    },
  ]

  const testimonials = [
    {
      name: 'Jane Smith',
      role: 'Software Engineer at Google',
      avatar: 'JS',
      quote: 'The AI-powered learning paths and real-time feedback transformed my learning journey. I went from basic coding knowledge to landing my dream job at Google in just 6 months!',
      rating: 5
    },
    {
      name: 'Michael Rodriguez',
      role: 'Data Scientist at Tesla',
      avatar: 'MR', 
      quote: 'The interactive projects and AI assistant helped me master complex concepts quickly. The platform\'s analytics showed me exactly where to focus my efforts.',
      rating: 5
    },
    {
      name: 'Sarah Kim',
      role: 'Product Manager at Microsoft',
      avatar: 'SK',
      quote: 'The collaborative features and real-world projects gave me practical experience. I could learn at my own pace while getting feedback from industry experts.',
      rating: 5
    }
  ]

  const stats = [
    { number: '50K+', label: 'Active Learners' },
    { number: '95%', label: 'Success Rate' },
    { number: '200+', label: 'Courses Available' },
    { number: '24/7', label: 'AI Support' },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="relative z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -20 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-foreground">TARDIS</span>
            </motion.div>
            
            <motion.div
              className="hidden items-center space-x-8 md:flex"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -20 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="flex items-center space-x-6">
                <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
                <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Reviews</a>
                <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">About</a>
                <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              </div>
              <div className="flex items-center space-x-4">
                <Link to="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button>Sign up free <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -50 }}
              transition={{ duration: 0.8 }}
              className="relative z-10"
            >
              <div className="mb-6">
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                  <Zap className="mr-2 h-4 w-4" />
                  AI-Powered Learning Platform
                </span>
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
                Transform Your
                <br />
                Learning with
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  AI Magic
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-lg leading-relaxed">
                The most loved, secure, and trusted AI platform for students and educators. Experience personalized learning that adapts to your pace.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link to="/signup">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start Learning Free <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-2xl font-bold text-foreground">{stat.number}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Content - Platform Preview */}
            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.8 }}
              animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 50, scale: isVisible ? 1 : 0.8 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl border bg-card p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Learning Dashboard</h3>
                  <div className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-3 py-1 text-sm text-white">
                    AI Powered
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="rounded-lg bg-muted p-4">
                    <h4 className="font-medium text-foreground mb-2">Progress</h4>
                    <div className="w-full bg-background rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full w-3/4"></div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">75% Complete</div>
                  </div>
                  <div className="rounded-lg bg-muted p-4">
                    <h4 className="font-medium text-foreground mb-2">Next Up</h4>
                    <div className="text-sm text-muted-foreground">Calculus Chapter 3</div>
                  </div>
                </div>
                
                <div className="rounded-lg bg-muted p-4">
                  <h4 className="font-medium text-foreground mb-3">Knowledge Graph</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs dark:bg-blue-900/30 dark:text-blue-300">Linear Algebra</span>
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs dark:bg-green-900/30 dark:text-green-300">Calculus</span>
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs dark:bg-purple-900/30 dark:text-purple-300">Statistics</span>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -left-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 p-3">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -bottom-4 -right-4 rounded-full bg-gradient-to-r from-pink-400 to-red-500 p-3">
                <Target className="h-6 w-6 text-white" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 border-y bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Trusted by <span className="text-blue-600">13,000+</span> institutions worldwide
            </h2>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {['MIT', 'Stanford', 'Harvard', 'Oxford', 'Cambridge'].map((uni, index) => (
              <motion.div
                key={uni}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 0.6, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="rounded-lg border bg-background px-6 py-4 text-center"
              >
                <div className="text-xl font-bold text-foreground">{uni}</div>
                <div className="text-sm text-muted-foreground">University</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 mb-6">
              <Target className="mr-2 h-4 w-4" />
              Platform Features
            </span>
            <h2 className="mb-6 text-4xl md:text-5xl font-bold text-foreground">
              Everything You Need to
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Excel in Learning
              </span>
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
              Cutting-edge AI technology meets proven educational methodologies to create the ultimate learning experience.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                }}
                viewport={{ once: true }}
                className="group relative rounded-2xl border bg-card p-8 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r ${feature.gradient} text-white`}>
                  {feature.icon}
                </div>
                
                <h3 className="mb-4 text-xl font-bold text-foreground">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300 mb-6">
              <Users className="mr-2 h-4 w-4" />
              Success Stories
            </span>
            <h2 className="mb-6 text-4xl md:text-5xl font-bold text-foreground">
              Loved by
              <br />
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Thousands of Learners
              </span>
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
              Real stories from real students who transformed their careers with our platform.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="rounded-xl border bg-card p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center">
                  <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-sm font-bold text-white">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <p className="mb-4 text-muted-foreground">
                  "{testimonial.quote}"
                </p>
                <div className="flex">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-12 text-center text-white"
          >
            <h2 className="mb-6 text-4xl font-bold md:text-5xl">
              Ready to Transform Your Learning Journey?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-xl opacity-90">
              Join thousands of learners who are already experiencing the future of education. Start your journey today.
            </p>
            <div className="flex flex-col justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Link to="/signup">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-blue-600">
                View Pricing
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-foreground">TARDIS</span>
              </div>
              <p className="mb-4 text-muted-foreground">
                Transforming the way people learn with AI-powered, interactive, and personalized content.
              </p>
              <div className="flex space-x-4">
                <Globe className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
              </div>
            </div>

            {[
              {
                title: 'Platform',
                links: ['Features', 'Pricing', 'Enterprise', 'Security']
              },
              {
                title: 'Resources', 
                links: ['Documentation', 'API Reference', 'Blog', 'Community']
              },
              {
                title: 'Company',
                links: ['About Us', 'Careers', 'Contact', 'Legal']
              }
            ].map((section, index) => (
              <div key={section.title}>
                <h4 className="mb-4 font-semibold text-foreground">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 TARDIS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage