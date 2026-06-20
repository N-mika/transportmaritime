import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import AuthPage from './components/AuthPage.tsx'
import './styles/globals.css'
import { store } from './redux'
import { Provider, useSelector } from 'react-redux'
import { RootState } from './redux'
import { HashRouter as Router } from 'react-router-dom'
import { PersistGate } from "redux-persist/integration/react";
import { persistor } from './redux';


function Root() {
  const currentUser = useSelector((state: RootState) => state.users.currentUser);

  if (!currentUser) {
    if (window.location.hash !== "#login") {
      window.location.hash = "login";
    }
    return <AuthPage />;
  }

  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Router>
          <Root />
        </Router>
      </PersistGate>
    </Provider>
  </React.StrictMode>,
)