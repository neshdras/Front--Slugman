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
        const controller = new AbortController()

        try {
            setLoading(true)
            setError(null)
            const data = await authService.login(email, password, controller.signal)
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

    if(loading) return <p className="splash">Chargement...</p>

  return (
    <div className="authbox">
        <p className="logo" aria-hidden="true">SlugMan</p>
        <form className="authform" onSubmit={handleSubmit}>
            <h1 className="authform__title">Welcome back !</h1>

            <div className="authform__field">
                <label htmlFor="login-mail">Mail</label>
                <input id="login-mail" type="email" name="mail" placeholder="Enter your mail adress" autoComplete="email" required onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="authform__field">
                <label htmlFor="login-password">Password</label>
                <input id="login-password" type="password" name="password" placeholder="Enter your password" autoComplete="current-password" required onChange={(e) => setPassword(e.target.value)} />
            </div>

            {error && <p className="authform__error" role="alert">{error}</p>}

            <button className="btn" type="submit">Login</button>
            <div className="authform__switch">
                <p>Don't have an account ? </p>
                <Link to="/register">Register</Link>
            </div>
        </form>
    </div>
  )
}

export default LoginForm