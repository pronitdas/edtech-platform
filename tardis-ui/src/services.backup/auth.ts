import supabase from "./supabase"



async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
        console.error('Sign-in error:', error.message)
        return { user: null, error }
    }
    return { data }
}
async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
        console.error('Sign-up error:', error.message)
        return { user: null, error }
    }
    return { data }
}

export { signIn, signUp }