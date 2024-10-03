import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import CssBaseline from '@mui/material/CssBaseline';
// import { ThemeProvider } from '@mui/material/styles';
import store from './redux/store';
import App from './components/App/App';
// import theme from './theme';


const root = ReactDOM.createRoot(document.getElementById('react-root'));
root.render(
  // <React.StrictMode>
    <Provider  store={store}>
      <CssBaseline />
      <App />
    </Provider>
  // </React.StrictMode>
);
