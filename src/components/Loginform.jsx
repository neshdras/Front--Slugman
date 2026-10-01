import { useState } from "react"
import { useNavigate } from "react-router-dom"
import authService from '../services/authService';
import { Link } from "react-router-dom"
import { useAuth } from '../context/AuthContext'

function LoginForm() {
    const [email, setEmail] = useState(null)
    const [password, setPassword] = useState(null)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const [error, setError] = useState(null)
    const { saveSession } = useAuth() 

    async function handleSubmit(e) {
        e.preventDefault()
        console.log('submit')
        const controller = new AbortController()

        try {
            setLoading(true)
            setError(null)
            const data = await authService.login(email, password, controller.signal)
            console.log('réponse login :', data)
            if (!data?.token || !data?.user) {
            throw new Error('Réponse du serveur inattendue (token ou user manquant)')
            }
            saveSession(data.token, data.user)
            navigate('/map')
        } catch (err) {
            if(err.name !== 'AbortError') {
            console.error('Loading error: ', err)
            setError(err.message)
            }
        } finally {
            // Le finally s'exécute quoi qu'il arrive, après tout ce qui vient avant
            if(!controller.signal.aborted){
            setLoading(false)
            // Rediriger sur la page profile
            }
        }
    }

    if(loading) return <p>Chargement...</p>

  return (
    <>
        <form onSubmit={handleSubmit}>
            <h1>Welcome back !</h1>
            
            <label htmlFor="mail">Mail</label>
            <input type="email" name="mail" placeholder="Enter your mail adress" onChange={(e) => setEmail(e.target.value)} />

            <label htmlFor="password">Password</label>
            <input type="password" name="password" placeholder="Enter your password" onChange={(e) => setPassword(e.target.value)} />

            <button type="submit">Login</button>
            <div>
                <p>Don't have an account ? </p>
                <Link to="/register">Register</Link>
            </div>
        </form>
        <p>{error}</p>
    </>
  )
}

export default LoginForm