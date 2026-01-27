import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    const containerStyle = {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        textAlign: 'center',
        padding: '1rem'
    };

    const headingStyle = {
        fontSize: '4rem',
        marginBottom: '1rem'
    };

    const subtitleStyle = {
        marginBottom: '2rem'
    };

    const paragraphStyle = {
        marginBottom: '2rem'
    };

    return React.createElement(
        'div', { className: 'not-found-container', style: containerStyle },
        React.createElement('h1', { style: headingStyle }, '404'),
        React.createElement('h2', { style: subtitleStyle }, 'Page Not Found'),
        React.createElement('p', { style: paragraphStyle }, 'The page you are looking for does not exist.'),
        React.createElement(Link, { to: '/', className: 'btn btn-primary' }, 'Return to Dashboard')
    );
};

export default NotFound;