import React from 'react'
import { useTranslation } from 'react-i18next'
import { Home, Book, Settings, LogOut, Globe } from 'lucide-react'
import { supabase } from '@/services/supabase';



const Sidebar = ({ user, onLanguageChange, currentLanguage }) => {
  const { t } = useTranslation()

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
        <span className="text-2xl font-semibold text-gray-800 dark:text-white">EdTech</span>
      </div>
      <div className="flex flex-col items-center mt-6 -mx-2">
        <img className="object-cover w-24 h-24 mx-2 rounded-full" src={user?.avatar} alt="avatar" />
        <h4 className="mx-2 mt-2 font-medium text-gray-800 dark:text-white">{user?.name}</h4>
        <p className="mx-2 mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">{user?.email}</p>
      </div>
      <nav className="mt-6">
        <a className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200" href="#">
          <Home className="w-5 h-5" />
          <span className="mx-4 font-medium">{t('dashboard')}</span>
        </a>
        <a className="flex items-center px-4 py-2 mt-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400" href="#">
          <Book className="w-5 h-5" />
          <span className="mx-4 font-medium">{t('courses')}</span>
        </a>
        <a className="flex items-center px-4 py-2 mt-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400" href="#">
          <Settings className="w-5 h-5" />
          <span className="mx-4 font-medium">{t('settings')}</span>
        </a>
        <div className="flex items-center px-4 py-2 mt-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400">
          <Globe className="w-5 h-5" />
          <select
            className="mx-4 font-medium bg-transparent"
            onChange={(e) => onLanguageChange(e.target.value)}
            value={currentLanguage}
          >
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Vietnamese">Vietnamese</option>
            <option value="Bengali">Bengali</option>
            <option value="Marathi">Marathi</option>
          </select>
        </div>
      </nav>
      <div className="flex items-center justify-center mt-auto h-16 border-t border-gray-200 dark:border-gray-700">
        <button onClick={handleLogout} className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white">
          <LogOut className="w-5 h-5" />
          <span className="mx-2 font-medium">{t('logout')}</span>
        </button>
      </div>
    </div>
  )
}

export default Sidebar

