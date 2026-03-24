import './App.css'
import RootRouter from './routes/RootRouter'
import { ThemeProvider } from './context/ThemeContext'
import { NotificationsProvider } from './context/NotificationsContext'
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <ThemeProvider>
      <NotificationsProvider>
        <div className="App">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 2800,
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-1)',
                border: '1px solid var(--border)',
              },
            }}
          />
          <RootRouter />
        </div>
      </NotificationsProvider>
    </ThemeProvider>
  )
}

export default App
