import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ChatBot from '@/components/ChatBot'
import { MessageCircle, X } from 'lucide-react'


const PersistentChatBot = ({ topic, language }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors z-50"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-20 left-4 w-80 h-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden z-40"
          >
            <ChatBot topic={topic} language={language} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default PersistentChatBot

