import { useState } from 'react';

export const useLanguage = () => {
  const [language, setLanguage] = useState('Hindi');

  return { language, setLanguage };
};

