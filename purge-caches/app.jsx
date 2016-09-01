let React         = require('react');
let ReactDOM      = require('react-dom');
let $             = require('jquery');
let CacheManager  = require('./cachemanager');

// Render component
$(function() {
  ReactDOM.render(
    <CacheManager/>,
    $('#container')[0]
  );
});
