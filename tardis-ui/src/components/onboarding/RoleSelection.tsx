import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Users, GraduationCap, UserCheck, ArrowRight } from 'lucide-react'

interface RoleSelectionProps {
  onRoleSelect: (role: 'student' | 'teacher') => void
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onRoleSelect }) => {
  const roles = [
    {
      id: 'student' as const,
      title: 'Student',
      subtitle: 'Learn with AI-powered tools',
      description: 'Access personalized learning content, track your progress, and get AI-powered assistance with your studies.',
      icon: GraduationCap,
      features: [
        'Personalized learning paths',
        'AI-powered study assistance',
        'Progress tracking & analytics',
        'Interactive content & quizzes',
        'Collaborative learning tools'
      ],
      color: 'from-blue-500 to-purple-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      hoverBorderColor: 'hover:border-blue-400'
    },
    {
      id: 'teacher' as const,
      title: 'Teacher',
      subtitle: 'Empower your classroom',
      description: 'Create engaging content, monitor student progress, and leverage AI tools to enhance your teaching experience.',
      icon: UserCheck,
      features: [
        'Content creation & management',
        'Student progress monitoring',
        'AI-powered teaching assistance',
        'Classroom analytics & insights',
        'Assignment & assessment tools'
      ],
      color: 'from-green-500 to-teal-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      hoverBorderColor: 'hover:border-green-400'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="pt-12 pb-8">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center mb-6"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <span className="ml-3 text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              TARDIS
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            Choose Your Learning Journey
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Select your role to get started with a personalized experience tailored to your needs
          </motion.p>
        </div>
      </div>

      {/* Role Cards */}
      <div className="max-w-6xl mx-auto px-6 pb-12">
        <div className="grid md:grid-cols-2 gap-8">
          {roles.map((role, index) => {
            const IconComponent = role.icon
            return (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                className={`relative group cursor-pointer ${role.bgColor} rounded-2xl border-2 ${role.borderColor} ${role.hoverBorderColor} transition-all duration-300 hover:shadow-xl hover:scale-105`}
                onClick={() => onRoleSelect(role.id)}
                data-testid={`role-selection-${role.id}`}
              >
                <div className="p-8">
                  {/* Icon and Title */}
                  <div className="flex items-center mb-6">
                    <div className={`flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-r ${role.color} shadow-lg`}>
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-2xl font-bold text-gray-900">{role.title}</h3>
                      <p className="text-gray-600">{role.subtitle}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    {role.description}
                  </p>

                  {/* Features */}
                  <div className="space-y-3 mb-8">
                    {role.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center">
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r ${role.color} mr-3`}>
                          <div className="h-2 w-2 rounded-full bg-white"></div>
                        </div>
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Get started as a {role.title.toLowerCase()}</span>
                    <div className={`flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-r ${role.color} group-hover:scale-110 transition-transform duration-200`}>
                      <ArrowRight className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-8">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-gray-500 text-sm"
        >
          You can always change your role later in your profile settings
        </motion.p>
      </div>
    </div>
  )
}

export default RoleSelection
