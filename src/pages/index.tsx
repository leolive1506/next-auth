import type { NextPage } from 'next'
import { useState, FormEvent, useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const { signIn } = useContext(AuthContext)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const data = {
      email,
      password
    }

    await signIn(data)
  }
  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)}/>
      <button>Salvar</button>
    </form>
  )
}

export default Home