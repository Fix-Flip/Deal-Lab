import React, { useEffect } from 'react';
import {
  HashRouter as Router, Redirect, Route, Switch,
} from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Nav from '../Nav/Nav';
import Footer from '../Footer/Footer';
import ProtectedRoute from '../ProtectedRoute/ProtectedRoute';
// import AboutPage from '../AboutPage/AboutPage';
import PropertyPage from '../PropertyPage/PropertyPage';
import DefaultSettings from '../DefaultSettings/DefaultSettings';
import LandingPage from '../LandingPage/LandingPage';
import LoginPage from '../LoginPage/LoginPage';
import RegisterPage from '../RegisterPage/RegisterPage';
import Header from '../Header/Header';
import './App.css';

import { ThemeProvider } from 'styled-components';
// import { GlobalStyles } from './global';
import { theme } from './theme';
// import Menu from '../Menu/Menu';
// import Hamburger from '../Hamburger';
// import { useOnClickOutside } from '../../hooks/hooks';


function App() {

  console.log('app comp is rendering');
  const dispatch = useDispatch();
  const user = useSelector(store => store.user);

  // const [open, setOpen] = useState(false);
  // const node = useRef(); 
  // useOnClickOutside(node, () => setOpen(false));

  useEffect(() => {  
    dispatch({ type: 'FETCH_USER' });
  }, [dispatch]);


  return (

    <ThemeProvider theme={theme}>
      <>
      {/* <GlobalStyles /> */}

      {/* <div ref={node}>
        <Hamburger open={open} setOpen={setOpen} />
        <Menu open={open} setOpen={setOpen} />
      </div> */}
    <Router>
      <div>
        <Header />
        <Nav />
        <Switch>
          <Redirect exact from="/" to="/home" />

          <ProtectedRoute
            exact
            path="/property-page"
          >
            <PropertyPage userId = {user.id}/>
          </ProtectedRoute>

          <ProtectedRoute
            exact
            path="/default-settings/:id"
          >
            <DefaultSettings />
          </ProtectedRoute>

          <Route
            exact
            path="/login"
          >
            {user.id ?
              <Redirect to="/property-page" />
              :
              <LoginPage />
            }
          </Route>

          <Route
            exact
            path="/registration"
          >
            {user.id ?
              <Redirect to="/property-page" />
              :
              <RegisterPage />
            }
          </Route>

          <Route
            exact
            path="/home"
          >
            {user.id ?
              <Redirect to="/property-page" />
              :
              <LandingPage />
            }
          </Route>

          <Route>
            <h1>404</h1>
          </Route>
        </Switch>
        <Footer />
      </div>
    </Router>
    </>
    </ThemeProvider>
  );
}


export default App;