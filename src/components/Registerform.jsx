import { useState } from "react"
import { Link } from "react-router-dom"
import { useNavigate } from "react-router-dom"
import authService from '../services/authService';


function RegisterForm() {
    const [name, setName] = useState(null)
    const [email, setEmail] = useState(null)
    const [password, setPassword] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)


    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault()
        const controller = new AbortController()

        try {
            setLoading(true)
            setError(null)
            await authService.register(name, email, password, controller.signal)
            navigate('/login')
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
            <h1 className="authform__title">Create your account</h1>

            <div className="authform__field">
                <label htmlFor="register-name">Username</label>
                <input id="register-name" type="text" name="name" placeholder="Enter your username" autoComplete="username" required onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="authform__field">
                <label htmlFor="register-mail">Mail</label>
                <input id="register-mail" type="email" name="mail" placeholder="Enter your mail adress" autoComplete="email" required onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="authform__field">
                <label htmlFor="register-password">Password</label>
                <input id="register-password" type="password" name="password" placeholder="Enter your password" autoComplete="new-password" required onChange={(e) => setPassword(e.target.value)} />
            </div>

            {error && <p className="authform__error" role="alert">{error}</p>}

            <button className="btn" type="submit">Register</button>
            <div className="authform__switch">
                <p>Already have an account ? </p>
                <Link to="/login">Login</Link>
            </div>
        </form>
    </div>
  )
}

export default RegisterForm