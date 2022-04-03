import type { GetServerSideProps, NextPage } from 'next'
import { useState, FormEvent, useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import styles from '../styles/Home.module.css'
import { parseCookies } from 'nookies'

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

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  // console.log(ctx.req.cookies)
  const cookies = parseCookies(ctx)
  if (cookies['auth.token']) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false
      }
    }
  }
  return {
    props: {

    }
  }
}