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

    if(loading) return <p>Chargement...</p>

  return (
    <>
        <form onSubmit={handleSubmit}>
            <h1>Welcome back !</h1>
            
            <label htmlFor="name">Username</label>
            <input type="text" name="name" placeholder="Enter your username" onChange={(e) => setName(e.target.value)} />

            <label htmlFor="mail">Mail</label>
            <input type="email" name="mail" placeholder="Enter your mail adress" onChange={(e) => setEmail(e.target.value)} />

            <label htmlFor="password">Password</label>
            <input type="password" name="password" placeholder="Enter your password" onChange={(e) => setPassword(e.target.value)} />

            <button type="submit">Register</button>
            <div>
                <p>Already have an account ? </p>
                <Link to="/login">Login</Link>
            </div>
        </form>
        <p>{error}</p>
    </>
  )
}

export default RegisterForm