import React from 'react';
import './Loader.css';

const Loader = () => {
    return React.createElement(
        'div', { className: 'loader-container' },
        React.createElement(
            'div', { className: 'loader' }
        ),
        React.createElement(
            'p', { className: 'loader-text' },
            'Loading...'
        )
    );
};

export default Loader;