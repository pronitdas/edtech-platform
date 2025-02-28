import { useState } from 'react';

export const useLanguage = () => {
  const [language, setLanguage] = useState('English');

  return { language, setLanguage };
};

