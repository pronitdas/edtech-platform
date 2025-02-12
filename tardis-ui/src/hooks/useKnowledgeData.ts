import { useState, useEffect } from 'react';
import { getKnowledge, getKnowledgeMeta } from '@/services/edtech-content';

export const useKnowledgeData = () => {
    const [knowledge, setKnowledge] = useState([]);
    const fetchKnowledge = async () => {
        const data = await getKnowledge();
        console.log(data);
        setKnowledge(data);
    };
    useEffect(() => {
        fetchKnowledge();
    }, []);

    const fetchKnowledgeMeta = async (id) => {
        return await getKnowledgeMeta(id);
    };

    return { knowledge, fetchKnowledge, fetchKnowledgeMeta, setKnowledge };
};

