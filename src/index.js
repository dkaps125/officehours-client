import React from 'react';
import ReactDOM from 'react-dom';
import toastr from 'toastr';
//import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import $ from 'jquery';
window.jQuery = window.$ = $;
const bootstrap = require('bootstrap');

toastr.options.preventDuplicates = true;
toastr.options.positionClass = 'toast-bottom-right';
ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
