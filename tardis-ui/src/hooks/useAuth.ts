
import supabase from '@/services/supabase';
import { useEffect, useState } from 'react';
const useAuthState = () => {
    const [user, setUser] = useState();
    const [oAiKey, setOaiApikey] = useState("")
    useEffect(() => {
        supabase
            .from('apikeys')
            .select('apiKeyOpenAi')
            .eq("status", true)
            .then((({ data }) => {
                setOaiApikey(data[0].apiKeyOpenAi)
            }))

    }, [])

    return { user, oAiKey }
}

export default useAuthState;
