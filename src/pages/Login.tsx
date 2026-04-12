// @ts-nocheck
import { supabase } from '@/lib/supabaseClient'

const GOOGLE_ICON = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjIuNTYgMTIuMjVjMC0uNzgtLjA3LTEuNTMtLjItMi4yNUgxMnY0LjI2aDUuOTJjLS4yNiAxLjM3LTEuMDQgMi41My0yLjIxIDMuMzF2Mi43N2gzLjU3YzIuMDgtMS45MiAzLjI4LTQuNzQgMy4yOC04LjA5eiIgZmlsbD0iIzQyODVGNCIvPjxwYXRoIGQ9Ik0xMiAyM2MyLjk3IDAgNS40Ni0uOTggNy4yOC0yLjY2bC0zLjU3LTIuNzdjLS45OC42Ni0yLjIzIDEuMDYtMy43MSAxLjA2LTIuODYgMC01LjI5LTEuOTMtNi4xNi00LjUzSDIuMTh2Mi44NEMzLjk5IDIwLjUzIDcuNyAyMyAxMiAyM3oiIGZpbGw9IiMzNEE4NTMiLz48cGF0aCBkPSJNNS44NCAxNC4wOWMtLjIyLS42Ni0uMzUtMS4zNi0uMzUtMi4wOXMuMTMtMS40My4zNS0yLjA5VjcuMDdIMi4xOEMxLjQzIDguNTUgMSAxMC4yMiAxIDEycy40MyAzLjQ1IDEuMTggNC45M2wyLjg1LTIuMjIuODEtLjYyeiIgZmlsbD0iI0ZCQkMwNSIvPjxwYXRoIGQ9Ik0xMiA1LjM4YzEuNjIgMCAzLjA2LjU2IDQuMjEgMS42NGwzLjE1LTMuMTVDMTcuNDUgMi4wOSAxNC45NyAxIDEyIDEgNy43IDEgMy45OSAzLjQ3IDIuMTggNy4wN2wzLjY2IDIuODRjLjg3LTIuNiAzLjMtNC41MyA2LjE2LTQuNTN6IiBmaWxsPSIjRUE0MzM1Ii8+PC9zdmc+'

const BG_IMAGE = '/assets/login-bg.png'

export default function Login() {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/',
      },
    })
    if (error) console.error('Erreur login:', error.message)
  }

  return (
    <div className="h-[100dvh] bg-[#fff8d0] relative overflow-hidden">
      {/* Photo lifestyle avec logo intégré */}
      <div className="absolute inset-0">
        <img
          src={BG_IMAGE}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      {/* Gradient bas + contenu */}
      <div className="absolute bottom-0 left-0 right-0 z-10 safe-area-bottom">
        <div
          className="h-[140px] w-full"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,248,208,0) 0%, #fff8d0 70%)',
          }}
        />
        <div className="bg-[#fff8d0] px-6 pb-8 -mt-px">
          <p className="font-sans font-medium text-base text-tx-1 text-center leading-6 mb-5">
            Connecte-toi pour suivre tes records
            <br />
            et ton planning personnalisé.
          </p>

          <button
            onClick={handleGoogleLogin}
            aria-label="Continuer avec Google"
            className="w-full bg-tx-1 text-bg-1 font-sans font-semibold text-base p-4 rounded-12 flex items-center justify-center gap-3 cursor-pointer active:opacity-80 transition-opacity"
          >
            <img src={GOOGLE_ICON} alt="" className="w-4 h-4" />
            Continuer avec Google
          </button>
        </div>
      </div>
    </div>
  )
}
